#!/usr/bin/env bash
set -euo pipefail

OS_NAME="$(uname -s)"
case "$OS_NAME" in
  Darwin|Linux) ;;
  *)
    echo "Unsupported OS: $OS_NAME" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OPS_DIR="$APP_ROOT/ops/single-node"
RUNTIME_DIR="$APP_ROOT/.runtime/single-node"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"
ENV_FILE="$OPS_DIR/app.env"
ENV_EXAMPLE_FILE="$OPS_DIR/app.env.example"

now() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  printf '[%s] %s\n' "$(now)" "$*"
}

fail() {
  printf '[%s] ERROR: %s\n' "$(now)" "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少命令: $1"
}

check_requirements() {
  require_cmd node
  require_cmd npm
}

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$PID_DIR"
}

ensure_env_file() {
  if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
    fail "未找到示例配置文件: $ENV_EXAMPLE_FILE"
  fi

  if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    log "已生成本地配置: $ENV_FILE"
    log "请按机器实际情况检查 LLM_CLI_COMMAND / LLM_CLI_ARGS 后再执行 deploy"
  fi
}

load_env() {
  if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
  fi
}

pid_file() {
  case "$1" in
    static) echo "$PID_DIR/static-server.pid" ;;
    bridge) echo "$PID_DIR/ai-bridge.pid" ;;
    *) fail "未知服务: $1" ;;
  esac
}

log_file() {
  case "$1" in
    static) echo "$LOG_DIR/static-server.log" ;;
    bridge) echo "$LOG_DIR/ai-bridge.log" ;;
    *) fail "未知服务: $1" ;;
  esac
}

read_pid() {
  local file
  file="$(pid_file "$1")"
  if [ -f "$file" ]; then
    cat "$file"
  fi
}

is_running_pid() {
  local pid="${1:-}"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

cleanup_stale_pid() {
  local service="$1"
  local file pid
  file="$(pid_file "$service")"
  pid="$(read_pid "$service")"

  if [ -n "$pid" ] && ! is_running_pid "$pid"; then
    rm -f "$file"
  fi
}

start_bridge() {
  cleanup_stale_pid bridge
  local pidfile logfile pid
  pidfile="$(pid_file bridge)"
  logfile="$(log_file bridge)"
  pid="$(read_pid bridge)"

  if is_running_pid "$pid"; then
    log "AI Bridge 已在运行 (pid=$pid)"
    return
  fi

  log "启动 AI Bridge"
  (
    cd "$APP_ROOT"
    export NODE_ENV="${NODE_ENV:-production}"
    export AI_BRIDGE_HOST="${AI_BRIDGE_HOST:-127.0.0.1}"
    export AI_BRIDGE_PORT="${AI_BRIDGE_PORT:-8787}"
    export LLM_CLI_COMMAND="${LLM_CLI_COMMAND:-gemini-internal}"
    export LLM_CLI_ARGS="${LLM_CLI_ARGS:--o text}"
    export LLM_CLI_MODE="${LLM_CLI_MODE:-arg}"
    export LLM_CLI_TEMPLATE="${LLM_CLI_TEMPLATE:-}"
    export LLM_CLI_PROMPT_FLAG="${LLM_CLI_PROMPT_FLAG:--p}"
    export LLM_CLI_TIMEOUT_MS="${LLM_CLI_TIMEOUT_MS:-120000}"
    nohup node server/ai-bridge.js >>"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )

  sleep 1
  pid="$(read_pid bridge)"
  is_running_pid "$pid" || fail "AI Bridge 启动失败，请查看日志: $logfile"
  log "AI Bridge 已启动 (pid=$pid)"
}

start_static() {
  cleanup_stale_pid static
  local pidfile logfile pid proxy_target
  pidfile="$(pid_file static)"
  logfile="$(log_file static)"
  pid="$(read_pid static)"

  if is_running_pid "$pid"; then
    log "静态站点已在运行 (pid=$pid)"
    return
  fi

  proxy_target="${AI_PROXY_TARGET:-http://127.0.0.1:${AI_BRIDGE_PORT:-8787}}"

  log "启动静态站点"
  (
    cd "$APP_ROOT"
    export NODE_ENV="${NODE_ENV:-production}"
    export STATIC_HOST="${STATIC_HOST:-0.0.0.0}"
    export STATIC_PORT="${STATIC_PORT:-4173}"
    export STATIC_DIST_DIR="${STATIC_DIST_DIR:-dist}"
    export AI_PROXY_TARGET="$proxy_target"
    export AI_BRIDGE_PORT="${AI_BRIDGE_PORT:-8787}"
    nohup node server/static-server.js >>"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )

  sleep 1
  pid="$(read_pid static)"
  is_running_pid "$pid" || fail "静态站点启动失败，请查看日志: $logfile"
  log "静态站点已启动 (pid=$pid)"
}

stop_service() {
  local service="$1"
  local pidfile pid
  pidfile="$(pid_file "$service")"
  pid="$(read_pid "$service")"

  if [ -z "$pid" ]; then
    log "$service 未运行"
    return
  fi

  if is_running_pid "$pid"; then
    log "停止 $service (pid=$pid)"
    kill "$pid" 2>/dev/null || true

    for _ in 1 2 3 4 5 6 7 8 9 10; do
      if ! is_running_pid "$pid"; then
        break
      fi
      sleep 1
    done

    if is_running_pid "$pid"; then
      log "$service 未及时退出，执行强制停止"
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi

  rm -f "$pidfile"
  log "$service 已停止"
}

status_all() {
  load_env
  cleanup_stale_pid bridge
  cleanup_stale_pid static

  local bridge_pid static_pid
  bridge_pid="$(read_pid bridge)"
  static_pid="$(read_pid static)"

  echo "OS                : $OS_NAME"
  echo "App root          : $APP_ROOT"
  echo "Env file          : $ENV_FILE"
  echo "Static server     : ${STATIC_HOST:-0.0.0.0}:${STATIC_PORT:-4173} $(if is_running_pid "$static_pid"; then echo "(running pid=$static_pid)"; else echo "(stopped)"; fi)"
  echo "AI Bridge         : ${AI_BRIDGE_HOST:-127.0.0.1}:${AI_BRIDGE_PORT:-8787} $(if is_running_pid "$bridge_pid"; then echo "(running pid=$bridge_pid)"; else echo "(stopped)"; fi)"
  echo "AI Proxy target   : ${AI_PROXY_TARGET:-http://127.0.0.1:${AI_BRIDGE_PORT:-8787}}"
  echo "Logs              : $LOG_DIR"
}

install_dependencies() {
  if [ -f "$APP_ROOT/package-lock.json" ]; then
    log "安装依赖: npm ci"
    (cd "$APP_ROOT" && npm ci)
  else
    log "安装依赖: npm install"
    (cd "$APP_ROOT" && npm install)
  fi
}

build_app() {
  log "构建前端产物"
  (cd "$APP_ROOT" && npm run build)
}

bootstrap() {
  check_requirements
  ensure_dirs
  ensure_env_file
  log "单机部署目录已准备完成"
}

start_all() {
  check_requirements
  ensure_dirs
  ensure_env_file
  load_env
  start_bridge
  start_static
  status_all
}

stop_all() {
  stop_service static
  stop_service bridge
}

restart_all() {
  stop_all
  start_all
}

deploy_all() {
  bootstrap
  load_env
  install_dependencies
  build_app
  restart_all
  log "单机部署完成"
}

show_logs() {
  local service="${1:-all}"
  case "$service" in
    all)
      echo "===== static-server.log ====="
      [ -f "$(log_file static)" ] && tail -n 80 "$(log_file static)" || echo "(empty)"
      echo
      echo "===== ai-bridge.log ====="
      [ -f "$(log_file bridge)" ] && tail -n 80 "$(log_file bridge)" || echo "(empty)"
      ;;
    static|bridge)
      [ -f "$(log_file "$service")" ] && tail -n 120 "$(log_file "$service")" || echo "(empty)"
      ;;
    *)
      fail "未知日志服务: $service"
      ;;
  esac
}

print_help() {
  cat <<EOF
Billions English 单机部署脚本（macOS / Linux）

用法:
  bash ops/single-node/manage.sh bootstrap   # 生成 app.env 与运行目录
  bash ops/single-node/manage.sh deploy      # 安装依赖、构建并重启服务
  bash ops/single-node/manage.sh start       # 启动静态站点 + AI Bridge
  bash ops/single-node/manage.sh stop        # 停止全部服务
  bash ops/single-node/manage.sh restart     # 重启全部服务
  bash ops/single-node/manage.sh status      # 查看服务状态
  bash ops/single-node/manage.sh logs        # 查看最近日志
  bash ops/single-node/manage.sh logs bridge # 查看 AI Bridge 日志

说明:
  - 该脚本只覆盖当前仓库的单机部署（前端静态站点 + AI Bridge）
  - 默认通过静态站点将 /api/ai 同源代理到本机 AI Bridge
  - 后续如果接入 Go 后端，可在此脚本中追加第三个服务进程
EOF
}

COMMAND="${1:-help}"
case "$COMMAND" in
  bootstrap) bootstrap ;;
  deploy) deploy_all ;;
  start) start_all ;;
  stop) stop_all ;;
  restart) restart_all ;;
  status) status_all ;;
  logs) show_logs "${2:-all}" ;;
  help|--help|-h) print_help ;;
  *)
    print_help
    exit 1
    ;;
esac
