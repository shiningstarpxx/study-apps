# Billions English 单机部署说明（macOS / Linux）

## 一、适用范围

这份文档针对当前仓库的**单机部署**场景，目标是在一台 macOS 或 Linux 机器上完成：

- 前端静态站点发布
- AI Bridge 启动
- 浏览器通过同源 `/api/ai` 访问 AI 能力

这套方案**不涉及云部署**、负载均衡、容器编排、数据库托管；后续如果要上云，我们再在此基础上继续扩展。

---

## 二、当前单机部署架构

单机模式下，当前仓库运行 2 个进程：

1. **静态站点进程**：`server/static-server.js`
   - 对外提供前端页面
   - 提供 `/health`
   - 把 `/api/ai/*` 同源代理到本机 AI Bridge
2. **AI Bridge 进程**：`server/ai-bridge.js`
   - 只建议绑定到 `127.0.0.1`
   - 负责调用本机大模型 CLI，例如 `gemini-internal`

也就是说，浏览器只需要访问静态站点端口；AI Bridge 不必直接暴露公网。

---

## 三、目录与脚本

新增目录：

```text
ops/single-node/
  app.env.example
  manage.sh
```

关键命令：

- `bash ops/single-node/manage.sh bootstrap`
- `bash ops/single-node/manage.sh deploy`
- `bash ops/single-node/manage.sh start`
- `bash ops/single-node/manage.sh stop`
- `bash ops/single-node/manage.sh restart`
- `bash ops/single-node/manage.sh status`
- `bash ops/single-node/manage.sh logs`

也可以通过 `npm` 调用：

- `npm run ops:single-node -- status`
- `npm run ops:deploy`

---

## 四、部署前要求

目标机器需要具备：

- **Node.js**：建议 20+
- **npm**：与 Node 对应版本
- **本机可用的大模型 CLI**：如 `gemini-internal`

可先检查：

```bash
node -v
npm -v
which gemini-internal
```

---

## 五、首次部署

### 5.1 初始化配置

```bash
bash ops/single-node/manage.sh bootstrap
```

这会：

- 创建 `ops/single-node/app.env`
- 创建运行目录 `.runtime/single-node/`

然后编辑：`ops/single-node/app.env`

至少确认以下字段：

```bash
STATIC_HOST=0.0.0.0
STATIC_PORT=4173
AI_BRIDGE_HOST=127.0.0.1
AI_BRIDGE_PORT=8787
AI_PROXY_TARGET=http://127.0.0.1:8787
LLM_CLI_COMMAND=gemini-internal
LLM_CLI_ARGS=-o text
LLM_CLI_MODE=arg
LLM_CLI_PROMPT_FLAG=-p
```

### 5.2 一键部署

```bash
bash ops/single-node/manage.sh deploy
```

这会依次执行：

1. 安装依赖（`npm ci` / `npm install`）
2. 构建前端（`npm run build`）
3. 启动 AI Bridge
4. 启动静态站点
5. 输出状态信息

---

## 六、日常运维命令

### 查看状态

```bash
bash ops/single-node/manage.sh status
```

### 查看日志

```bash
bash ops/single-node/manage.sh logs
bash ops/single-node/manage.sh logs static
bash ops/single-node/manage.sh logs bridge
```

### 重启服务

```bash
bash ops/single-node/manage.sh restart
```

### 停止服务

```bash
bash ops/single-node/manage.sh stop
```

---

## 七、健康检查

### 静态站点

```bash
curl http://127.0.0.1:4173/health
```

### AI 代理链路

```bash
curl http://127.0.0.1:4173/api/ai/health
```

如果代理链路正常，说明：

- 静态站点已启动
- `/api/ai` 代理已生效
- 本机 AI Bridge 可达

---

## 八、macOS 与 Linux 的适配说明

这套脚本尽量使用 **通用 bash + Node.js** 实现，避免依赖特定发行版工具：

- 支持 `Darwin`（macOS）
- 支持 `Linux`
- 不依赖 `systemd`
- 不依赖 `pm2`
- 不依赖 Docker

因此它非常适合：

- 本地开发机
- 测试机
- 内网单机演示机
- 小范围试运行机器

如果未来需要更强的进程守护能力，可以再升级到：

- Linux：`systemd`
- macOS：`launchd`
- 或统一切到容器 / 云原生方案

---

## 九、当前方案的边界

当前单机脚本管理的是：

- `dist` 前端静态产物
- 本地 AI Bridge

它**还没有覆盖**：

- Go 后端 API
- PostgreSQL
- Redis / 队列
- 对象存储
- HTTPS 证书
- 域名与反向代理

所以这套脚本是一个**当前阶段可执行的单机运维基线**，而不是最终生产方案。

---

## 十、后续如何平滑演进到 Go 后端

等 Go 后端落地后，这套单机部署脚本可以继续沿用，只需要增加第三个受管进程：

1. `static-server`
2. `ai-bridge`
3. `go-api`

届时前端路由建议变成：

- `/` → 前端静态资源
- `/api/*` → Go API
- `/api/ai/*` → Go API 或 AI 网关再转发

也就是说，今天先把**单机静态站点 + Bridge** 跑稳，未来再把 **Go + PostgreSQL** 接进去，不会推倒重来。
