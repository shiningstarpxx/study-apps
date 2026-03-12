# Billions English 架构拆分与前后端分离准备方案

> **关联文档**
> 1. [`design-evolution-review.md`](./design-evolution-review.md) — 项目历史回顾与问题总账（建议先读，建立上下文）
> 2. 本文 — 全面技术方案（架构分层 + Go 后端 + PostgreSQL 表设计 + 迁移路线）
> 3. [`single-node-deployment.md`](./single-node-deployment.md) — 当前阶段的单机部署与运维

## 一、文档目标

这份方案不是只讨论“代码怎么整理”，而是要同时解决两件事：

- **现在**：把当前前端单体中耦合过深的功能拆开，降低页面复杂度与维护成本
- **未来**：为前后端分离、云端同步、AI 评分、移动端长期演进预留稳定边界

本方案遵循两个前提：

- **内容资产第一性**：对这类影视英语学习项目，完整、高质量、可持续扩展的《亿万》台词与标注资产，先于一切技术优化
- **先做仓内分层，再做运行时分离**：在内容底座明确后，再把前端内部职责边界理顺，并逐步把本地实现替换为 HTTP / 后端实现

---

## 二、现状诊断

当前系统已经具备完整学习闭环，但核心问题也很集中：

### 2.1 领域逻辑散落在页面中

典型例子：

- `QuizPage.jsx` 同时负责组卷、答题状态、提交评分、错题入库、错题复习、结果分析 UI
- `LearnPage.jsx` 同时负责场景导航、完成打点、词汇 SRS 更新、学习位置保存
- `SocraticPage.jsx` 同时负责会话状态、Bridge 通信、历史恢复、任务标记
- `Dashboard.jsx` 在模块顶层直接执行 `updateStreak()`，副作用进入了渲染入口
- `Sidebar.jsx` 依赖 `setInterval` 轮询 `localStorage` 状态，而不是消费统一状态源

这导致页面同时承担 **展示层 + 业务编排层 + 数据访问层**。

### 2.2 `storage.js` 已经承担了“伪后端”职责

`src/utils/storage.js` 当前同时管理：

- 学习进度
- 词汇 SRS
- 错题本 SRS
- 测验历史
- 每日任务
- 连续学习
- Socratic 历史
- 用户设置
- 统计聚合

这说明它已经不只是工具函数，而是事实上的**本地仓储层 + 领域服务层 + 统计聚合层**。如果继续往里面加功能，后续迁移会越来越重。

### 2.3 数据源与调用方式没有抽象层

当前大多数页面直接：

- 读 `episodes.js`
- 调 `storage.js`
- 调 `quizGenerator.js`
- 调 `ai.js`

这意味着当前 UI 直接依赖了本地实现细节。将来一旦改为后端 API，替换成本会非常高，因为页面自身知道太多实现细节。

### 2.4 当前系统已经隐含“前后端分离需求”

从现有能力看，未来几乎必然需要服务端化的模块有：

- 用户登录与跨设备同步
- 测验历史与错题同步
- 学习推荐与画像
- AI 批改与评分
- 内容管理后台
- 音频、资源、离线缓存管理

因此当前的拆分方案必须让这些能力在以后可以**平滑从 local adapter 切到 remote adapter**。

---

## 三、拆分原则

### 3.1 页面只负责展示与交互，不直接编排复杂业务

页面组件的职责应当收缩为：

- 读取 hook 暴露的状态
- 响应用户输入
- 渲染 UI

页面不再直接串联多个存储函数，也不再直接知道数据来自 `localStorage` 还是 HTTP。

### 3.2 领域逻辑进入 use case / service 层

所有关键动作都要收敛成明确用例，例如：

- `completeScene()`
- `startQuizSession()`
- `submitQuizSession()`
- `startWrongAnswerReview()`
- `rateReviewItem()`
- `startSocraticSession()`
- `sendSocraticTurn()`

这样才能把“一个动作需要更新多个状态”的逻辑从页面里抽出去。

### 3.3 数据访问必须经过 repository / gateway

前端不直接依赖 `localStorage` 或静态 JS 数据，而是依赖接口抽象：

- `catalogRepository`
- `progressRepository`
- `reviewRepository`
- `quizRepository`
- `wrongAnswerRepository`
- `socraticRepository`
- `settingsRepository`
- `aiTutorGateway`

本地原型阶段先用 local adapter；未来前后端分离时只替换 adapter，不改页面和核心用例。

### 3.4 用“领域事件”承接跨模块副作用

像“提交测验”这种动作会同时影响：

- quiz history
- wrong answers
- daily plan
- XP
- stats

这类逻辑不应散落在页面里，建议通过明确事件或统一用例承接：

- `SceneCompleted`
- `QuizSubmitted`
- `WrongAnswerRecorded`
- `ReviewRated`
- `SocraticSessionCompleted`

即使初期不引入真正事件总线，也要先把这些动作收敛成集中编排点。

### 3.5 先分层，不急着微服务

将来做前后端分离时，建议优先走**模块化单体 + 明确 API 边界**，不要一开始就拆微服务。

---

## 四、目标架构（前端）

建议把前端调整为 4 层结构：

1. **`app` 层**：应用启动、路由、全局 providers、布局壳
2. **`modules` 层**：按业务领域拆分功能模块
3. **`shared` 层**：通用 UI、工具、基础设施、配置、类型
4. **`adapters` / `infrastructure` 层**：本地存储、HTTP 客户端、AI Bridge 客户端、内容数据适配器

### 4.1 建议目录结构

```text
src/
  app/
    router/
    providers/
    layout/
    bootstrap/
  modules/
    catalog/
      model/
      repositories/
      hooks/
      services/
    learning/
      model/
      hooks/
      services/
      components/
      pages/
    review/
      model/
      hooks/
      services/
      pages/
    quiz/
      model/
      hooks/
      services/
      components/
      pages/
    socratic/
      model/
      hooks/
      services/
      components/
      pages/
    stats/
      hooks/
      services/
      pages/
    settings/
      hooks/
      services/
      pages/
  shared/
    ui/
    lib/
      date/
      storage/
      http/
      validation/
      errors/
    config/
    constants/
  infrastructure/
    storage/
      local/
    content/
      local/
    ai/
      bridge/
```

### 4.2 页面保留，但变成薄容器

例如：

- `src/pages/QuizPage.jsx` 最终迁到 `src/modules/quiz/pages/QuizPage.jsx`
- 页面内部只消费 `useQuizSession()` / `useWrongAnswerReview()`
- 页面不直接 import `storage.js` / `quizGenerator.js`

---

## 五、模块拆分方案（按领域）

### 5.1 `catalog` 模块：课程内容与查询

**职责**：

- episode / scene / keyword 查询
- 标签、难度、剧集目录
- 内容 schema 校验
- 内容来源标记（`original` / `curated` / `inspired`）
- transcript 分段、标注和发布前校验

**当前来源**：

- `src/data/episodes.js`
- `src/data/seasonOneExpansion.js`

**未来方向**：

- 当前：本地静态数据 adapter
- 后续：`GET /api/catalog/...` 远端内容接口

### 5.2 `learning` 模块：台词学习流程

**职责**：

- 当前学习位置
- 场景完成
- 关键词学习打点
- 导航策略（顺序 / 随机 / 推荐）

**当前问题**：

- `LearnPage.jsx` 直接更新进度、任务、SRS

**目标拆分**：

- `useLearningSession()`：页面状态与交互状态
- `completeScene()`：完成场景用例
- `learningProgressRepository`：学习位置和完成记录

### 5.3 `review` 模块：词汇 SRS 复习

**职责**：

- 到期复习项查询
- 复习评分
- SRS 间隔更新

**当前问题**：

- `ReviewPage.jsx` 直接读写 SRS 与 daily task

**目标拆分**：

- `useReviewSession()`
- `getDueReviewItems()`
- `rateReviewItem()`
- `reviewRepository`

### 5.4 `quiz` 模块：组卷、答题、评分、错题本

**职责**：

- 题型定义
- 组卷
- 评分
- 错题本
- 薄弱点分析
- 错题复习 quiz

**当前问题**：

- `QuizPage.jsx` 过重
- `quizGenerator.js` 同时承担题型常量、生成、评分、错题复习生成
- wrong answer 逻辑与 quiz history 紧耦合

**目标拆分**：

- `questionTypes.js`
- `generateQuiz.js`
- `gradeQuiz.js`
- `generateWrongAnswerQuiz.js`
- `useQuizSession()`
- `submitQuizSession()`
- `wrongAnswerRepository`
- `quizRepository`

### 5.5 `socratic` 模块：会话状态机与 AI Tutor 网关

**职责**：

- phase / stage / progression
- 会话状态
- AI 消息发送
- 历史记录
- 会话完成事件

**当前问题**：

- `socratic.js` 已经有状态推进辅助函数，但 `SocraticPage.jsx` 运行链路仍然主要按固定轮次推进
- 页面既处理聊天 UI，又处理会话状态机、历史恢复、Bridge 调用

**目标拆分**：

- `createSocraticSession()`
- `advanceSocraticPhase()`
- `sendSocraticTurn()`
- `socraticRepository`
- `aiTutorGateway`
- `useSocraticSession()`

### 5.6 `stats` 模块：聚合展示而不是原始写入

**职责**：

- Dashboard / Stats 聚合查询
- 学习趋势
- 任务完成率
- 错题与薄弱点可视化

**当前问题**：

- `getStatistics()` 混在 `storage.js`
- Dashboard 和 Stats 页面自己再做二次聚合

**目标拆分**：

- `statsService`
- `dashboardService`
- 页面仅消费聚合结果

### 5.7 `settings` 模块：本地偏好 + 远端账户设置的统一入口

**职责**：

- 学习偏好
- Bridge 设置
- 未来账户级设置同步

**目标拆分**：

- `settingsRepository`
- `bridgeSettingsRepository`
- 后续可合并成用户设置接口

---

## 六、现有文件到新结构的映射

### 6.1 第一批必须拆分的文件

| 当前文件 | 问题 | 目标位置 |
|---|---|---|
| `src/utils/storage.js` | 职责过载 | 拆到 `modules/*/repositories` + `shared/lib/storage` |
| `src/utils/quizGenerator.js` | 组卷、评分、错题复习耦合 | 拆到 `modules/quiz/services/*` |
| `src/utils/socratic.js` | 状态机与模板混在一起 | 拆到 `modules/socratic/model` + `services` |
| `src/utils/ai.js` | Bridge 配置与 tutor prompt 耦合 | 拆到 `infrastructure/ai/bridge` + `modules/socratic/services` |
| `src/pages/QuizPage.jsx` | 页面过重 | `modules/quiz/pages/QuizPage.jsx` + hooks/components |
| `src/pages/LearnPage.jsx` | 页面过重 | `modules/learning/pages/LearnPage.jsx` + hooks/components |
| `src/pages/SocraticPage.jsx` | 页面过重 | `modules/socratic/pages/SocraticPage.jsx` + hooks/components |

### 6.2 建议拆分后的 `storage.js` 去向

原 `storage.js` 可拆成：

- `shared/lib/storage/localStorageAdapter.js`
- `shared/lib/date/dateUtils.js`
- `modules/learning/repositories/localProgressRepository.js`
- `modules/review/repositories/localReviewRepository.js`
- `modules/quiz/repositories/localQuizHistoryRepository.js`
- `modules/quiz/repositories/localWrongAnswerRepository.js`
- `modules/settings/repositories/localSettingsRepository.js`
- `modules/socratic/repositories/localSocraticRepository.js`
- `modules/stats/services/statsAggregator.js`

---

## 七、为前后端分离预留的接口抽象

### 7.1 Repository 接口先于后端存在

先在前端定义接口，再分别提供 local / remote 实现。例如：

- `progressRepository.getProgress()`
- `progressRepository.saveProgress(progress)`
- `quizRepository.saveQuizResult(result)`
- `wrongAnswerRepository.getDueWrongAnswers()`
- `wrongAnswerRepository.saveWrongAnswers(items)`
- `settingsRepository.getSettings()`
- `catalogRepository.getAllScenes()`

页面和 use case 只依赖 repository，不依赖 `localStorage`。

### 7.2 DTO 与 Domain Model 分离

未来后端返回的数据结构不应直接进入页面。建议建立两层对象：

- **DTO**：接口返回结构
- **Domain Model**：前端实际消费结构

这样即使后端字段名变化、分页结构变化，也只影响 mapper，不影响业务页面。

### 7.3 本地适配器与远端适配器并存

建议每个 repository 至少准备两套实现位：

- `local*Repository.js`
- `remote*Repository.js`

当前默认使用 local；以后通过 provider 或 config 切到 remote。

---

## 八、未来后端边界建议

建议未来后端优先做成**模块化单体 API 服务**，不要直接上微服务。

### 8.1 建议的后端模块

- `auth`：登录、账号、设备同步
- `catalog`：剧集、场景、关键词、标签、内容版本
- `learning`：学习进度、已学场景、学习位置
- `review`：词汇 SRS、到期复习项
- `quiz`：组卷、提交、测验历史、错题本、薄弱点分析
- `socratic`：会话状态、消息记录、AI tutor orchestration
- `stats`：学习统计、趋势、周报
- `ai`：评分、批改、Tutor、Prompt 组装

### 8.2 建议的 API 边界

#### 内容与学习

- `GET /api/catalog/episodes`
- `GET /api/catalog/scenes/:sceneId`
- `GET /api/learning/progress`
- `PUT /api/learning/progress`
- `POST /api/learning/scenes/:sceneId/complete`

#### 复习与测验

- `GET /api/review/due`
- `POST /api/review/ratings`
- `POST /api/quizzes/generate`
- `POST /api/quizzes/submit`
- `GET /api/quizzes/history`
- `GET /api/wrong-answers/due`
- `POST /api/wrong-answers/review`

#### Socratic 与 AI

- `POST /api/socratic/sessions`
- `POST /api/socratic/sessions/:sessionId/messages`
- `GET /api/socratic/sessions/:sessionId`
- `POST /api/ai/grade-translation`
- `POST /api/ai/grade-open-answer`

#### 设置与统计

- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/stats/overview`
- `GET /api/stats/weaknesses`

### 8.3 AI Bridge 的长期定位

当前 `server/ai-bridge.js` 更适合：

- 本地开发
- 内部试验
- CLI 模型联调

但如果要支持移动端正式分发或多端登录，Bridge 不应继续作为唯一生产形态。建议未来将其降级为：

- **开发态 adapter**：本地 CLI → HTTP
- **生产态 adapter**：远端 AI 服务或统一模型网关

### 8.4 后端技术路线：直接使用 Go 实现

如果后端从现在开始正式立项，我赞成**直接用 Go 落地**，原因不是“Go 很快”这么简单，而是它和当前这个产品的后端需求天然匹配：

- **高并发但业务模型清晰**：学习、测验、SRS、错题本、Socratic、统计都属于典型 API 服务能力
- **I/O 密集型明显**：数据库读写、AI 网关调用、缓存、对象存储、异步任务都适合 Go
- **适合模块化单体**：当前业务还没有大到必须微服务，但已经足够需要严格包边界
- **部署简单**：单二进制、容器化轻量、对后续移动端 / Web / 管理后台统一 API 非常友好
- **生态足够成熟**：`chi` / `gin`、`pgx`、`sqlc`、`goose` / `atlas`、`testcontainers-go` 都很成熟

### 8.5 推荐的 Go 后端实现方式

建议采用 **模块化单体（Modular Monolith）+ Clean-ish 分层 + 显式 SQL**。

#### 推荐技术栈

- **Web 框架**：`chi` 或 `gin`
  - 如果更重视轻量和标准库风格，选 `chi`
  - 如果更重视现成中间件和上手效率，选 `gin`
- **数据库驱动**：PostgreSQL 场景优先 `pgx`
- **SQL 访问层**：优先 `sqlc`
- **迁移工具**：`goose` 或 `atlas`
- **配置管理**：环境变量 + `cleanenv` / `viper`
- **日志**：`slog` / `zap`
- **任务调度**：初期可用进程内 cron；后续可升级为异步 job worker
- **测试**：`testing` + `testcontainers-go`

#### 为什么推荐 `sqlc` 而不是重 ORM

这个项目的数据模型会越来越偏“学习记录 + 统计 + 调度 + AI 批改结果”，有几个特点：

- 查询会越来越复杂
- 需要精确控制索引与 SQL
- 统计和聚合查询会越来越多
- SRS、错题、薄弱点、排行榜都依赖结构化查询

因此更推荐：

- **Schema 在 migration 中定义**
- **查询在 SQL 文件中定义**
- **Go 代码通过 `sqlc` 生成 typed query methods**

这样比重 ORM 更可控，也更适合长期维护。

### 8.6 推荐的 Go 目录结构

```text
backend/
  cmd/
    api/
      main.go
  internal/
    platform/
      config/
      db/
      http/
      logger/
      auth/
      time/
      errors/
    modules/
      auth/
        domain/
        repository/
        service/
        transport/
      catalog/
        domain/
        repository/
        service/
        transport/
      learning/
        domain/
        repository/
        service/
        transport/
      review/
        domain/
        repository/
        service/
        transport/
      quiz/
        domain/
        repository/
        service/
        transport/
      socratic/
        domain/
        repository/
        service/
        transport/
      stats/
        domain/
        repository/
        service/
        transport/
      ai/
        gateway/
        service/
  migrations/
  sql/
    queries/
  pkg/
    dto/
```

#### 分层职责建议

- **transport**：HTTP handler、request/response DTO、参数校验
- **service**：业务用例编排，例如 `SubmitQuiz`, `CompleteScene`, `SendSocraticTurn`
- **repository**：数据库访问接口
- **domain**：核心实体、规则、值对象、领域常量
- **platform**：数据库、日志、时间、鉴权、配置等基础设施

### 8.7 存储层实现策略：直接上数据库，不再以 `localStorage` 为中心

我同意你的判断：如果是为未来产品化做准备，存储层就不该继续围绕浏览器本地存储设计，而应该**直接围绕数据库设计**。

建议路线是：

- **前端保留 local adapter** 只用于当前原型平稳过渡
- **后端从一开始就按 DB-first 设计**
- 前端未来通过 remote repository 接后端 API
- 所有“学习状态 / 测验 / 错题 / SRS / 会话 / 统计”都落到数据库

#### 存储层分层建议

- **事务边界层**：service/use case 决定哪些操作必须同事务提交
- **repository 层**：按领域组织读写
- **query 层**：复杂统计、榜单、薄弱点、复习队列使用专门 query object
- **event/outbox 层（后续）**：用于周报、通知、推荐等异步能力

#### 哪些动作建议走事务

以下动作建议天然是单事务：

- `CompleteScene`
  - 写学习进度
  - 写已学 scene
  - 写词汇 SRS 初始化 / 更新
  - 更新当天任务
- `SubmitQuiz`
  - 写 quiz session
  - 写 quiz answers
  - 写错题记录
  - 更新错题 SRS
  - 更新 XP / 统计
- `SendSocraticTurn`
  - 写 session message
  - 更新 phase/stage 状态
  - 如完成则更新任务与学习记录

#### 8.7.1 推荐的 repository 与表映射

| Repository | 主要负责表 | 说明 |
|---|---|---|
| `UserRepository` | `users`, `user_identities`, `user_devices` | 用户与登录身份 |
| `SettingsRepository` | `user_settings` | 用户偏好设置 |
| `CatalogRepository` | `episodes`, `scenes`, `keywords`, `scene_keywords`, `scene_grammar_points`, `tags`, `scene_tags` | 内容主数据 |
| `LearningRepository` | `user_learning_progress`, `user_completed_scenes`, `user_daily_plans`, `user_daily_plan_tasks`, `user_streaks` | 学习进度与日计划 |
| `ReviewRepository` | `user_keyword_srs`, `user_keyword_review_logs` | 词汇复习 SRS |
| `QuizRepository` | `quiz_sessions`, `quiz_questions`, `quiz_answers` | 测验 session 与答题快照 |
| `WrongAnswerRepository` | `user_wrong_answers`, `user_wrong_answer_reviews` | 错题本与错题复习记录 |
| `SocraticRepository` | `socratic_sessions`, `socratic_messages` | Socratic 会话与消息 |
| `AIEvaluationRepository` | `ai_evaluations` | AI 批改和评分结果 |
| `StatsQueryRepository` | 读多张聚合表 | 仅读聚合查询，不建议承担写入 |

#### 8.7.2 推荐的存储层实现边界

建议在 Go 后端中把 repository 分成三类：

1. **Entity Repository**：面向单表或单聚合根的基本 CRUD / upsert
2. **Use-case Repository**：专门服务某个复杂业务动作的复合读写
3. **Query Repository**：只做统计查询、列表查询、报表查询

例如：

- `SubmitQuizService` 不直接拼 SQL，而是依赖：
  - `QuizRepository`
  - `WrongAnswerRepository`
  - `LearningRepository`
  - `TxManager`
- `StatsService` 不直接复用写仓储，而是依赖：
  - `StatsQueryRepository`
  - `CatalogRepository`

这样能避免“一个 repository 管所有东西”的新一轮耦合。

#### 8.7.3 推荐的事务管理接口

在 Go 里建议显式定义事务管理器，例如：

```go
type TxManager interface {
    WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}
```

然后在 service 层使用：

- `CompleteSceneService.WithinTx(...)`
- `SubmitQuizService.WithinTx(...)`
- `SendSocraticTurnService.WithinTx(...)`

这样前端将来看到的是统一 API 行为，后端内部也能保证状态一致性。

### 8.8 数据库选型：PostgreSQL vs MySQL 详尽对比

这两者都能做这个项目，但如果目标是**学习产品 + AI 评分 + 错题分析 + 多用户增长**，我更推荐 **PostgreSQL**。

#### 先给结论

- **如果追求“最稳妥的业务关系型数据库 + 足够复杂的数据查询能力 + 更好的 JSON/分析支持”**：选 **PostgreSQL**
- **如果团队强依赖 MySQL 经验、运维体系已经完全围绕 MySQL、并且短期业务查询非常传统**：MySQL 也能做
- **对当前项目的中长期形态**：我建议默认选 **PostgreSQL**

#### 对比维度 1：结构化业务数据表达能力

- **PostgreSQL 优势**：
  - `JSONB` 很成熟，适合保存 AI 评分明细、rubric 结果、prompt metadata、会话扩展字段
  - `ARRAY`、`ENUM`、`CHECK`、部分索引、表达式索引能力强
  - 更适合“强关系 + 半结构化扩展字段”混合场景
- **MySQL 优势**：
  - 常规表结构没问题
  - JSON 也可用，但整体灵活性和查询体验通常不如 PostgreSQL

#### 对比维度 2：复杂查询与统计分析

- **PostgreSQL**：
  - CTE、window function、复杂聚合、全文检索、物化视图思路更舒服
  - 更适合做薄弱点分析、学习趋势、排行榜、推荐特征查询
- **MySQL**：
  - 日常 OLTP 没问题
  - 做复杂统计时也能写，但整体表达力和可维护性通常弱一些

#### 对比维度 3：索引与约束能力

- **PostgreSQL**：
  - 支持部分索引（很适合 `deleted_at is null`、`mastered = false` 这类场景）
  - 表达式索引、GIN/GIST 索引都更强
  - `CHECK` 约束更适合保障业务字段质量
- **MySQL**：
  - 常规 B-Tree 索引足够
  - 但在复杂约束表达能力上没 PostgreSQL 舒服

#### 对比维度 4：SRS / 错题 / AI 会话这类场景的适配度

这个项目里有很多“关系型主数据 + 调度状态 + 扩展 metadata”混合场景，例如：

- 错题本：强关系 + SRS 字段 + 解释信息
- Socratic session：强关系 + 消息流 + 状态快照
- AI 批改：强关系 + rubric JSON + 原始模型返回
- 推荐系统：需要统计与画像字段

**PostgreSQL 更适合这种模式**，因为你不需要把所有扩展字段都拆成超多小表，也不必为了灵活性牺牲查询质量。

#### 对比维度 5：Go 生态集成

- **PostgreSQL**：`pgx` + `sqlc` 组合非常强
- **MySQL**：`go-sql-driver/mysql` + `sqlc` 也能用
- 如果 Go 后端明确要走 typed SQL 路线，PostgreSQL 的开发体验通常更好

#### 对比维度 6：运维与团队普适性

- **MySQL**：
  - 国内团队普及度更高
  - DBA 资源通常更多
  - 很多公司默认栈就是 MySQL
- **PostgreSQL**：
  - 近几年在中后台、SaaS、AI 应用里采用越来越多
  - 一旦团队接受 SQL 风格，长期收益很高

#### 对比维度 7：未来能力扩展

未来如果要增加：

- 全文检索（场景、台词、关键词、错题）
- AI 评分明细检索
- 用户学习画像统计
- 推荐特征提取
- 更复杂的聚合报表

PostgreSQL 会更从容。

#### 选型建议表

| 维度 | PostgreSQL | MySQL | 对本项目意义 |
|---|---|---|---|
| 关系型主业务 | 强 | 强 | 两者都够 |
| JSON 扩展字段 | 更强 | 可用 | PG 更适合 AI/评分元数据 |
| 复杂统计查询 | 更强 | 中等偏强 | PG 更适合弱点分析/推荐 |
| 索引与约束 | 更强 | 常规足够 | PG 更利于业务约束 |
| Go typed SQL 体验 | 更强 | 良好 | PG 略优 |
| 团队普及度 | 中高 | 更高 | MySQL 有传统优势 |
| 长期演进空间 | 更强 | 良好 | PG 更适合产品化中长期演进 |

#### 最终推荐

**推荐数据库：PostgreSQL**。

原因可以概括为一句话：

> 这个项目不是一个纯 CRUD 系统，而是一个“学习轨迹 + 评分 + 调度 + 分析 + AI metadata”混合系统，PostgreSQL 更适合作为长期主库。

### 8.9 支持多用户能力的完整核心表设计

下面给的是**逻辑完整、可直接落库的核心表设计**。设计目标包括：

- 支持多用户
- 支持未来登录系统
- 支持多设备同步
- 支持学习进度、SRS、错题本、测验、Socratic、统计
- 支持内容版本演进
- 支持 AI 批改扩展

#### 设计原则

- 所有用户侧业务表都带 `user_id`
- 内容主数据与用户行为数据分离
- 需要幂等的位置增加唯一键
- 需要长期演进的字段预留 `metadata jsonb`
- 默认使用 `bigserial` / `uuid` 二选一；如果追求外部接口安全，推荐主对外 ID 用 `uuid`
- 所有表统一带：`created_at`、`updated_at`，按需增加 `deleted_at`

### 8.10 表分组总览

#### A. 账户与身份

- `users`
- `user_identities`
- `user_devices`
- `user_settings`

#### B. 内容主数据

- `episodes`
- `scenes`
- `keywords`
- `scene_keywords`
- `scene_grammar_points`
- `tags`
- `scene_tags`

#### C. 学习进度与任务

- `user_learning_progress`
- `user_completed_scenes`
- `user_daily_plans`
- `user_daily_plan_tasks`
- `user_streaks`

#### D. 词汇复习（SRS）

- `user_keyword_srs`
- `user_keyword_review_logs`

#### E. 测验与错题本

- `quiz_sessions`
- `quiz_questions`
- `quiz_answers`
- `user_wrong_answers`
- `user_wrong_answer_reviews`

#### F. Socratic / AI

- `socratic_sessions`
- `socratic_messages`
- `ai_evaluations`

#### G. 统计与异步扩展（可后加）

- `user_stat_snapshots`
- `outbox_events`

### 8.11 核心表设计详表

#### 1. `users`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | 用户主键 |
| `email` | `citext` / `varchar(255)` | UNIQUE, NULLABLE | 邮箱登录 |
| `phone` | `varchar(32)` | UNIQUE, NULLABLE | 手机号登录 |
| `nickname` | `varchar(64)` | NOT NULL | 昵称 |
| `avatar_url` | `text` |  | 头像 |
| `status` | `varchar(20)` | NOT NULL | `active` / `blocked` / `pending` |
| `timezone` | `varchar(64)` | NOT NULL | 时区 |
| `preferred_language` | `varchar(16)` | NOT NULL | 语言偏好 |
| `last_login_at` | `timestamptz` |  | 最近登录 |
| `created_at` | `timestamptz` | NOT NULL | 创建时间 |
| `updated_at` | `timestamptz` | NOT NULL | 更新时间 |

索引建议：

- `unique(email)`
- `unique(phone)`
- `index(status)`

#### 2. `user_identities`

用于支持多登录方式（邮箱、微信、Apple、Google、匿名升级账号）。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK -> users.id | |
| `provider` | `varchar(32)` | NOT NULL | `email` / `wechat` / `apple` / `google` |
| `provider_user_id` | `varchar(128)` | NOT NULL | 三方平台用户 ID |
| `provider_email` | `varchar(255)` |  | |
| `created_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(provider, provider_user_id)`

#### 3. `user_devices`

支持多设备登录、推送、同步冲突分析。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `device_type` | `varchar(20)` | NOT NULL | `web` / `ios` / `android` |
| `device_name` | `varchar(128)` |  | |
| `app_version` | `varchar(32)` |  | |
| `last_seen_at` | `timestamptz` |  | |
| `created_at` | `timestamptz` | NOT NULL | |

#### 4. `user_settings`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK | 一用户一条 |
| `daily_goal_minutes` | `int` | NOT NULL | 每日学习目标 |
| `show_translation` | `boolean` | NOT NULL | 默认显示翻译 |
| `auto_play_audio` | `boolean` | NOT NULL | 自动播放音频 |
| `theme` | `varchar(20)` | NOT NULL | 主题 |
| `font_size` | `varchar(20)` | NOT NULL | 字体 |
| `notifications_enabled` | `boolean` | NOT NULL | 通知开关 |
| `metadata` | `jsonb` |  | 扩展设置 |
| `updated_at` | `timestamptz` | NOT NULL | |

#### 5. `episodes`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `code` | `varchar(32)` | UNIQUE | 如 `S01E01` |
| `season_no` | `int` | NOT NULL | |
| `episode_no` | `int` | NOT NULL | |
| `title` | `varchar(128)` | NOT NULL | 英文标题 |
| `title_cn` | `varchar(128)` | NOT NULL | 中文标题 |
| `content_status` | `varchar(20)` | NOT NULL | `detailed` / `expanded` |
| `teaching_goal` | `text` |  | |
| `learning_focus` | `jsonb` |  | 学习重点数组，如 `["压力表达", "交易判断"]` |
| `metadata` | `jsonb` |  | |
| `published_at` | `timestamptz` |  | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(season_no, episode_no)`

#### 6. `scenes`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `episode_id` | `uuid` | FK -> episodes.id | |
| `scene_code` | `varchar(64)` | UNIQUE | 如 `S01E01-001` |
| `seq_no` | `int` | NOT NULL | 集内顺序 |
| `character_name` | `varchar(128)` | NOT NULL | |
| `character_name_cn` | `varchar(128)` | NOT NULL | |
| `context_en` | `text` |  | 场景英文说明 |
| `context_cn` | `text` |  | 场景中文说明 |
| `dialogue_en` | `text` | NOT NULL | 英文台词 |
| `dialogue_cn` | `text` | NOT NULL | 中文翻译 |
| `difficulty` | `smallint` | NOT NULL | 1-5 |
| `source_type` | `varchar(20)` | NOT NULL | `original` / `inspired` / `adapted` |
| `audio_asset_id` | `uuid` | NULLABLE | 未来关联音频 |
| `audio_start` | `numeric(8,3)` | NULLABLE | 音频起始时间戳（秒） |
| `audio_end` | `numeric(8,3)` | NULLABLE | 音频结束时间戳（秒） |
| `content_version` | `int` | NOT NULL | 内容版本 |
| `metadata` | `jsonb` |  | 预留扩展 |
| `published_at` | `timestamptz` |  | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

索引建议：

- `index(episode_id, seq_no)`
- `index(difficulty)`
- `gin(to_tsvector('simple', dialogue_en))`（PostgreSQL）

#### 7. `keywords`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `lemma` | `varchar(128)` | NOT NULL | 词条 |
| `meaning_cn` | `text` | NOT NULL | 中文义项 |
| `part_of_speech` | `varchar(32)` |  | 词性 |
| `example_en` | `text` |  | 例句 |
| `metadata` | `jsonb` |  | 扩展词汇信息 |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

索引建议：

- `index(lemma)`
- 如需严格去重，可 `unique(lower(lemma), part_of_speech)`

#### 8. `scene_keywords`

多对多关联，同时保留“该词在这个 scene 里的语义”。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `scene_id` | `uuid` | FK | |
| `keyword_id` | `uuid` | FK | |
| `surface_form` | `varchar(128)` |  | 在句中出现的形式 |
| `meaning_cn_in_scene` | `text` |  | 语境义 |
| `example_en_in_scene` | `text` |  | 语境例句 |
| `position_start` | `int` |  | 可选 |
| `position_end` | `int` |  | 可选 |
| `created_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(scene_id, keyword_id)`

#### 9. `scene_grammar_points`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `scene_id` | `uuid` | FK | |
| `grammar_title` | `varchar(255)` | NOT NULL | 语法点标题 |
| `grammar_explanation` | `text` | NOT NULL | 说明 |
| `grammar_example` | `text` |  | 例句 |
| `created_at` | `timestamptz` | NOT NULL | |

#### 10. `tags` 与 `scene_tags`

`tags`：标签主表；`scene_tags`：多对多关联。

推荐：

- `tags(id, code, label_cn, icon, created_at)`
- `scene_tags(scene_id, tag_id)`，唯一键 `unique(scene_id, tag_id)`

#### 11. `user_learning_progress`

这是“当前学习位置 + 聚合进度”的用户级主表。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK | |
| `current_episode_id` | `uuid` | FK | 当前所在集 |
| `current_scene_id` | `uuid` | FK | 当前场景 |
| `total_study_minutes` | `int` | NOT NULL | 总学习时长 |
| `words_learned_count` | `int` | NOT NULL | 学过单词数 |
| `completed_scene_count` | `int` | NOT NULL | 已完成场景数 |
| `level` | `int` | NOT NULL | 等级 |
| `xp` | `int` | NOT NULL | 经验值 |
| `last_study_on` | `date` |  | 最近学习日期 |
| `updated_at` | `timestamptz` | NOT NULL | |

#### 12. `user_completed_scenes`

一条 scene 完成就是一条记录。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `scene_id` | `uuid` | FK | |
| `completed_at` | `timestamptz` | NOT NULL | |
| `source` | `varchar(32)` | NOT NULL | `learn` / `review` / `recommended` |

唯一约束：

- `unique(user_id, scene_id)`

#### 13. `user_daily_plans`

按用户、按天记录每日计划主表。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `plan_date` | `date` | NOT NULL | |
| `total_xp` | `int` | NOT NULL | |
| `status` | `varchar(20)` | NOT NULL | `active` / `completed` |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(user_id, plan_date)`

#### 14. `user_daily_plan_tasks`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `daily_plan_id` | `uuid` | FK | |
| `task_type` | `varchar(32)` | NOT NULL | `learn` / `review` / `quiz` / `socratic` |
| `label` | `varchar(64)` | NOT NULL | |
| `target_count` | `int` | NOT NULL | |
| `completed_count` | `int` | NOT NULL | |
| `icon` | `varchar(16)` |  | |
| `sort_order` | `smallint` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(daily_plan_id, task_type)`

#### 15. `user_streaks`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK | |
| `current_streak_days` | `int` | NOT NULL | |
| `longest_streak_days` | `int` | NOT NULL | |
| `last_study_on` | `date` |  | |
| `updated_at` | `timestamptz` | NOT NULL | |

如果未来需要完整日历热力图，还可追加（推荐作为核心表，因为 Dashboard 日历热力图已在消费 streak.history）：

- `user_study_activity_days(user_id uuid, activity_date date, learned_minutes int NOT NULL DEFAULT 0, activity_score smallint NOT NULL DEFAULT 0, PRIMARY KEY(user_id, activity_date))`

#### 16. `user_keyword_srs`

这是词汇复习的核心调度表。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `keyword_id` | `uuid` | FK | |
| `ease_factor` | `numeric(4,2)` | NOT NULL | SM-2 参数 |
| `interval_days` | `int` | NOT NULL | 下次间隔 |
| `repetitions` | `int` | NOT NULL | 连续复习次数 |
| `next_review_on` | `date` | NOT NULL | 下次复习日期 |
| `last_review_on` | `date` |  | 最近复习 |
| `mastery_level` | `smallint` | NOT NULL | 内部掌握度 |
| `status` | `varchar(20)` | NOT NULL | `learning` / `reviewing` / `mastered` |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(user_id, keyword_id)`

索引建议：

- `index(user_id, next_review_on)`
- `index(user_id, status)`

#### 17. `user_keyword_review_logs`

记录每次复习评分。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_keyword_srs_id` | `uuid` | FK | |
| `quality` | `smallint` | NOT NULL | 0-5 |
| `reviewed_at` | `timestamptz` | NOT NULL | |
| `interval_days_after` | `int` | NOT NULL | |
| `ease_factor_after` | `numeric(4,2)` | NOT NULL | |
| `metadata` | `jsonb` |  | |

#### 18. `quiz_sessions`

一次 quiz 就是一条 session。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `session_type` | `varchar(20)` | NOT NULL | `normal` / `wrong_answer_review` |
| `episode_id` | `uuid` | NULLABLE FK | |
| `difficulty_limit` | `smallint` |  | |
| `question_count` | `int` | NOT NULL | |
| `score` | `int` | NOT NULL | 百分制 |
| `total_score` | `int` | NOT NULL | |
| `max_score` | `int` | NOT NULL | |
| `grade_letter` | `varchar(8)` |  | |
| `started_at` | `timestamptz` | NOT NULL | |
| `submitted_at` | `timestamptz` |  | |
| `metadata` | `jsonb` |  | 生成配置、客户端信息等 |

索引建议：

- `index(user_id, submitted_at desc)`
- `index(user_id, session_type)`

#### 19. `quiz_questions`

保存题面快照，避免内容变更影响历史回放。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `quiz_session_id` | `uuid` | FK | |
| `seq_no` | `int` | NOT NULL | 题号 |
| `question_type` | `varchar(32)` | NOT NULL | |
| `scene_id` | `uuid` | NULLABLE FK | 来源 scene |
| `prompt_en` | `text` |  | |
| `prompt_cn` | `text` |  | |
| `context_en` | `text` |  | |
| `context_cn` | `text` |  | |
| `correct_answer_text` | `text` |  | |
| `reference_answer_text` | `text` |  | 开放题参考答案 |
| `options_json` | `jsonb` |  | 选择题选项 |
| `explanation_json` | `jsonb` |  | 解析与题目元数据 |
| `points` | `int` | NOT NULL | |
| `wrong_answer_ref_id` | `uuid` | NULLABLE | 如果来自错题复习 |
| `created_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(quiz_session_id, seq_no)`

#### 20. `quiz_answers`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `quiz_question_id` | `uuid` | FK | |
| `answer_text` | `text` |  | |
| `answer_json` | `jsonb` |  | 配对题、复合题 |
| `is_correct` | `boolean` | NOT NULL | |
| `partial_credit` | `numeric(5,2)` | NOT NULL | |
| `earned_points` | `int` | NOT NULL | |
| `feedback_json` | `jsonb` |  | 逐题反馈、改进建议 |
| `created_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(quiz_question_id)`

#### 21. `user_wrong_answers`

这是错题本主表，按“用户 + 错题唯一键”去重。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `question_fingerprint` | `varchar(128)` | NOT NULL | 题目标识，例如 `sceneId + type` |
| `question_type` | `varchar(32)` | NOT NULL | |
| `scene_id` | `uuid` | NULLABLE FK | |
| `latest_question_snapshot_json` | `jsonb` | NOT NULL | 最近一次题面快照 |
| `latest_user_answer_text` | `text` |  | |
| `latest_correct_answer_text` | `text` |  | |
| `wrong_count` | `int` | NOT NULL | 错误次数 |
| `ease_factor` | `numeric(4,2)` | NOT NULL | |
| `interval_days` | `int` | NOT NULL | |
| `repetitions` | `int` | NOT NULL | |
| `next_review_on` | `date` | NOT NULL | |
| `last_review_on` | `date` |  | |
| `first_wrong_at` | `timestamptz` | NOT NULL | |
| `last_wrong_at` | `timestamptz` | NOT NULL | |
| `mastered` | `boolean` | NOT NULL | |
| `status` | `varchar(20)` | NOT NULL | `active` / `mastered` / `archived` |
| `metadata` | `jsonb` |  | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(user_id, question_fingerprint)`

索引建议：

- `index(user_id, next_review_on)`
- `index(user_id, mastered)`
- `index(user_id, question_type)`

#### 22. `user_wrong_answer_reviews`

记录每次错题复习行为。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `wrong_answer_id` | `uuid` | FK | |
| `quiz_session_id` | `uuid` | NULLABLE FK | 来源复习 session |
| `result` | `varchar(20)` | NOT NULL | `correct` / `wrong` / `partial` |
| `quality` | `smallint` | NOT NULL | 0-5 |
| `reviewed_at` | `timestamptz` | NOT NULL | |
| `snapshot_json` | `jsonb` |  | |

#### 23. `socratic_sessions`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `scene_id` | `uuid` | FK | |
| `status` | `varchar(20)` | NOT NULL | `active` / `completed` / `abandoned` |
| `current_phase` | `varchar(32)` |  | |
| `current_stage` | `varchar(32)` |  | |
| `phase_turn_count` | `int` | NOT NULL | |
| `phase_config_json` | `jsonb` |  | 创建时的 phase 配置快照 |
| `guardrails_json` | `jsonb` |  | 本次 session 使用的 guardrails |
| `session_summary_json` | `jsonb` |  | 学习收获摘要 |
| `started_at` | `timestamptz` | NOT NULL | |
| `completed_at` | `timestamptz` |  | |
| `updated_at` | `timestamptz` | NOT NULL | |

索引建议：

- `index(user_id, started_at desc)`
- `index(user_id, status)`

#### 24. `socratic_messages`

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `session_id` | `uuid` | FK | |
| `seq_no` | `int` | NOT NULL | |
| `role` | `varchar(16)` | NOT NULL | `system` / `user` / `assistant` |
| `content_text` | `text` | NOT NULL | |
| `phase` | `varchar(32)` |  | |
| `stage` | `varchar(32)` |  | |
| `quality_score` | `smallint` |  | |
| `metadata` | `jsonb` |  | 模型、token、耗时等 |
| `created_at` | `timestamptz` | NOT NULL | |

唯一约束：

- `unique(session_id, seq_no)`

#### 25. `ai_evaluations`

统一记录 AI 批改、开放题评分、翻译评分等结果，避免未来类型越多越散。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `source_type` | `varchar(32)` | NOT NULL | `quiz_answer` / `socratic_message` / `writing` |
| `source_id` | `uuid` | NOT NULL | 对应来源 |
| `evaluation_type` | `varchar(32)` | NOT NULL | `translation_grade` / `open_answer_grade` / `fluency_review` |
| `score` | `numeric(5,2)` |  | |
| `rubric_json` | `jsonb` |  | rubric 细项 |
| `feedback_text` | `text` |  | |
| `model_name` | `varchar(64)` |  | |
| `raw_response_json` | `jsonb` |  | 原始返回 |
| `created_at` | `timestamptz` | NOT NULL | |

索引建议：

- `index(user_id, source_type, source_id)`
- `index(evaluation_type, created_at)`

#### 26. `user_stat_snapshots`（可选）

如果后续统计查询压力变高，可以做日级快照：

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK | |
| `snapshot_date` | `date` | NOT NULL | |
| `completed_scenes` | `int` | NOT NULL | |
| `learned_keywords` | `int` | NOT NULL | |
| `avg_quiz_score` | `numeric(5,2)` | NOT NULL | |
| `due_reviews` | `int` | NOT NULL | |
| `active_wrong_answers` | `int` | NOT NULL | |
| `metadata` | `jsonb` |  | |

唯一约束：

- `unique(user_id, snapshot_date)`

#### 27. `outbox_events`（推荐预留）

用于异步通知、推荐刷新、统计计算、行为流水下游处理。

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `event_type` | `varchar(64)` | NOT NULL | |
| `aggregate_type` | `varchar(64)` | NOT NULL | |
| `aggregate_id` | `uuid` | NOT NULL | |
| `payload_json` | `jsonb` | NOT NULL | |
| `status` | `varchar(20)` | NOT NULL | `pending` / `published` / `failed` |
| `created_at` | `timestamptz` | NOT NULL | |
| `published_at` | `timestamptz` |  | |

### 8.12 多用户支持的关键约束

如果要从现在就为多用户做好准备，至少要保证以下约束：

1. **所有用户行为表都必须带 `user_id`**
2. **所有“每用户唯一”的记录都必须建唯一键**
   - 例如 `unique(user_id, scene_id)`
   - `unique(user_id, keyword_id)`
   - `unique(user_id, question_fingerprint)`
3. **所有跨设备同步的“当前状态表”都要有 `updated_at`**
4. **所有历史流水表都要保留不可变记录**
   - quiz answer log
   - review log
   - wrong answer review log
   - socratic messages
5. **所有题目内容都应保留快照，而不是只依赖当前 scene 数据**
6. **时区必须从用户维度处理**，不要再使用前端本地时区假定

### 8.13 推荐索引策略

#### 高频索引

- `user_id + next_review_on`
- `user_id + submitted_at`
- `user_id + status`
- `episode_id + seq_no`
- `user_id + plan_date`

#### PostgreSQL 可选高级索引

- 错题活跃集合：部分索引 `where mastered = false`
- 场景全文检索：`to_tsvector(dialogue_en)` GIN 索引
- JSONB 元数据检索：GIN on `metadata`

### 8.14 未来可拆但现在不必先拆的边界

即使未来业务变大，我也建议先保持一个 Go 模块化单体，把边界设计清楚，再考虑是否拆服务。当前最有可能以后独立出来的只有：

- `ai`：模型调用与批改
- `stats`：重聚合查询 / 报表
- `catalog`：内容管理后台

但在当前阶段，**先统一数据库、统一鉴权、统一事务边界** 比“先拆服务”重要得多。

### 8.15 这一版后端方案的总推荐

如果要把这套产品做成中长期可持续演进的版本，我的建议是：

- **语言**：Go
- **服务形态**：模块化单体 API
- **数据库**：PostgreSQL
- **数据访问层**：`sqlc` + 显式 SQL
- **迁移工具**：`goose` 或 `atlas`
- **前端接入方式**：repository 接口 + remote adapter
- **演进策略**：先本地兼容，后远端替换

可以把它概括成一句实施口号：

> **前端先抽象 repository，后端用 Go + PostgreSQL 接管真实状态，最终把 local prototype 平滑切成 multi-user product。**

---

关于当前阶段的单机部署与运维脚本，见 `docs/single-node-deployment.md`。

## 九、推荐的状态管理策略

### 9.1 当前阶段：继续用 React 原生能力，但收敛状态边界

为了降低改造成本，第一阶段不必强上复杂状态库。建议：

- 页面内局部交互状态：`useState`
- 会话型复杂状态：`useReducer`
- 领域状态封装：自定义 hooks
- 共享基础设施：repository + service

### 9.2 当引入后端后：区分 client state 与 server state

前后端分离后，建议引入 server-state 管理工具（如 TanStack Query），将状态分成两类：

- **client state**：当前题号、展开卡片、输入框内容、UI tab
- **server state**：progress、quiz history、wrong answers、stats、catalog、socratic session

这会大幅降低“页面自己决定何时重新拉数据”的复杂度。

---

## 十、推荐的渐进迁移路线

### Content Phase A：先补内容资产基线

目标：先回答“我们到底缺多少内容，哪些内容最值钱”。

- 统计当前 episode / scene / character / tag 覆盖率
- 区分 `original` / `curated` / `inspired` 内容来源
- 列出《亿万》高价值场景补齐清单（核心人物、经典表达、可复训片段）
- 定义最小发布标准：台词、翻译、speaker、context、关键词、语法点、来源、质量状态

### Content Phase B：把内容生产做成流水线

目标：让补内容不再主要依赖手工改 JS 文件。

- 建立内容 schema 和内容校验脚本
- 建立“采集 → 清洗 → 分段 → 对齐 → 标注 → 校验 → 发布”流程
- 为 `catalog` 模块补充内容版本、内容状态和来源管理能力
- 为题目生成器增加内容可用性 smoke test

### Phase 0：先立边界，不改行为

目标：不改变现有功能，只抽接口。

- 统一 localStorage key 注册表：将 `WRONG_ANSWERS_KEY` 并入 `STORAGE_KEYS`，将 `AI_BRIDGE_STORAGE_KEY` 从 `ai.js` 迁入
- 建立 `shared/lib/date/dateUtils.js`
- 建立 `shared/lib/storage/localStorageAdapter.js`
- 把 `toISOString().split('T')[0]` 收敛成统一日期函数
- 定义 repository 接口
- 定义 `catalogRepository` 的 local 版本

### Phase 1：拆 `storage.js`

目标：把“伪后端”拆散。

- 先拆出 progress / settings / review / wrongAnswers / socratic / stats
- 页面改为依赖 repository / service
- 删除页面对 `localStorage` 的直接认知

### Phase 2：拆 `QuizPage.jsx`

目标：把最复杂的页面先减重。

建议拆成：

- `useQuizSession()`
- `QuizConfigPanel`
- `QuizQuestionCard`
- `QuizResultSummary`
- `QuizResultBreakdown`
- `WrongAnswerReviewEntry`

同时把用例收口成：

- `startQuizSession()`
- `submitQuizSession()`
- `startWrongAnswerReview()`

### Phase 3：拆 `SocraticPage.jsx`

目标：把状态机真正落到运行时链路。

- 引入 `useSocraticSession()`
- 用 `advanceSocraticPhase()` 替代固定轮次推进
- 把 AI 通信收口到 `aiTutorGateway`
- 让 session 完成、历史保存、任务结算都走统一用例

### Phase 4：拆 `LearnPage.jsx` 与 Dashboard/Stats 聚合

目标：把学习流程与聚合查询分开。

- 学习动作进入 `learning service`
- 统计逻辑进入 `stats service`
- 侧边栏 / Dashboard 不再靠 `setInterval` 轮询状态

### Phase 5：引入 remote adapter

目标：开始真正准备前后端分离。

- 为 repository 增加 remote 实现
- 建立 `httpClient`
- 用配置切换 local / remote data source
- 挑选一个垂直切片先试：建议从 `settings` 或 `progress` 开始

---

## 十一、第一阶段落地清单（建议按这个顺序做）

### 11.0 真正的第一批：先补内容主线

1. 盘点《亿万》当前内容覆盖率与缺口
2. 建立内容来源标记（`original` / `curated` / `inspired`）
3. 明确“高价值 episode / scene”补齐优先级
4. 建立内容最小发布标准与校验清单

### 11.1 第二批一定要做：为内容扩展铺基础设施

1. 统一 localStorage key 注册表（含 `WRONG_ANSWERS_KEY` 和 `AI_BRIDGE_SETTINGS`）
2. 抽 `dateUtils`
3. 抽 `localStorageAdapter`
4. 拆 `storage.js`
5. 建 repository 接口
6. 拆 `QuizPage.jsx`

### 11.2 第二批紧接着做

1. 拆 `SocraticPage.jsx`
2. 让 `socratic.js` 的 phase 决策真正接入页面流程
3. 拆 Dashboard / Stats 聚合逻辑
4. 去掉 `Sidebar.jsx` 的轮询式同步

### 11.3 第三批为前后端分离做准备

1. 引入 `httpClient`
2. 引入 DTO mapper
3. 建 `remoteProgressRepository` / `remoteSettingsRepository`
4. 明确登录后用户数据模型
5. 搭建 Go API skeleton
6. 落 PostgreSQL 基础 migration
7. 完成 `settings` / `progress` 两个垂直切片联调

---

## 十二、这套方案的收益

### 短期收益

- 页面更薄，更容易改 UI
- 复杂逻辑更容易单测
- 新功能不必继续往 `storage.js` 和大页面里硬塞
- 错题系统、Socratic、统计更容易继续演进

### 中期收益

- 可以逐步引入 API，而不是一次性推倒重来
- 本地原型和远端服务可以并存
- 更适合移动端、云同步、推荐系统接入

### 长期收益

- 支持前后端团队并行开发
- 支持内容后台、AI 评分、账户系统等产品化能力
- 降低未来重构成本

---

## 十三、方案审查与补充修正（2026-03-12）

对方案进行了一轮与实际代码的交叉审查，发现以下需要修正和补充的问题。

### 13.1 表设计中遗漏的实际数据字段

以下字段在当前代码中已经存在，但方案表设计中缺失或不够精确：

| 表 | 遗漏字段 | 实际来源 | 建议处理 |
|---|---|---|---|
| `scenes` | `source_type` | `seasonOneExpansion.js` 所有 scene 都有 `sourceType: 'inspired'` | 增加 `source_type varchar(20)` 显式列（`original` / `inspired` / `adapted`），对内容版权管理至关重要 |
| `scenes` | `audio_start` / `audio_end` | `episodes.js` 中 `S01E01-001` 已有 `audioStart: 0, audioEnd: 4.5` | 增加 `audio_start numeric(8,3)` 和 `audio_end numeric(8,3)` nullable 列，为音频功能预留 |
| `episodes` | `learning_focus` | 所有 episode 都有 `learningFocus: ['压力表达', '交易判断']` 数组 | 增加 `learning_focus jsonb` 或 `text[]` 列 |
| `quiz_questions` | `direction` | 翻译题有 `direction: 'en2cn' / 'cn2en'` | 放入 `explanation_json` 并约定 schema，或增加 `direction varchar(8)` |
| `quiz_questions` | 评分关键词 | 翻译题有 `keywords` 列表用于规则评分 | 放入 `explanation_json.scoring_keywords` |
| `socratic_sessions` | `phase_config_json` | `createSocraticSession()` 返回完整 phases 配置（3 phase，每个有 type/stages/idealTurns/maxTurns/qualityThreshold） | 增加 `phase_config_json jsonb`，保存创建时的 phase 配置快照 |
| `socratic_sessions` | `guardrails_json` | `createSocraticSession()` 返回 `guardrails` 数组（4 条规则） | 增加 `guardrails_json jsonb`，支持不同用户/难度等级使用不同会话规则 |

### 13.2 localStorage key 注册不完整

当前系统共有 **9 个** localStorage key，但 `STORAGE_KEYS` 只注册了 7 个：

| Key | 当前位置 | 是否在 STORAGE_KEYS 中 |
|---|---|---|
| `billions_english_progress` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_srs` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_quiz_history` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_daily_plan` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_streak` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_socratic_history` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_study_mode` | `storage.js` STORAGE_KEYS | ✅ |
| `billions_english_wrong_answers` | `storage.js` 独立常量 | ❌ 游离在 STORAGE_KEYS 体系外 |
| `AI_BRIDGE_SETTINGS` | `ai.js` 独立常量 | ❌ 完全绕过 storage.js |

**修正**：Phase 0 的落地清单中增加"统一 key 注册"任务：
- 将 `WRONG_ANSWERS_KEY` 并入 `STORAGE_KEYS`
- 将 `AI_BRIDGE_STORAGE_KEY` 从 `ai.js` 迁入统一管理
- 建立完整的 key → 领域 → repository 映射表

### 13.3 grammar 数据迁移需要解析规则

实际数据中 `grammar.point` 字段同时包含标题和解释（用 ` - ` 连接）：

```
"What's the point of + doing something - 用于质问做某事的意义"
```

但方案 `scene_grammar_points` 表拆成了 `grammar_title` 和 `grammar_explanation`。数据迁移时需要显式的解析规则来拆分这两个字段。

### 13.4 SENTENCE_ORDER 题型状态需要清理

`QUIZ_TYPES` 中定义了 `SENTENCE_ORDER: 'sentence_order'`，但 `generators` 对象中完全没有对应的生成函数。建议在 Phase 2 拆 QuizPage 时明确：**要么补全生成逻辑，要么从 QUIZ_TYPES 中移除**，避免影响题型覆盖率统计和错题本分类。

### 13.5 daily_plan task ID 与 type 不一致

实际代码中 `createDailyPlan()` 使用 `id: 'new_scenes'` 但 `task_type` 用 `'learn'`。方案表的 `unique(daily_plan_id, task_type)` 约束是正确的，但前端代码按 `id` 而非 `type` 匹配任务。迁移时需要处理 `id='new_scenes'` → `task_type='learn'` 的映射。

### 13.6 streak history 应该是核心表而非可选表

当前 `getStreak()` 返回的 `history` 是最近 30 天日期数组，Dashboard 日历热力图已经在消费这个数据。方案中 `user_study_activity_days` 标注为"可选"，但实际上应该列为核心表：

```
user_study_activity_days(
  user_id uuid,
  activity_date date,
  learned_minutes int NOT NULL DEFAULT 0,
  activity_score smallint NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, activity_date)
)
```

### 13.7 运维补充

- `manage.sh` 日志全部 `>>` 追加，没有轮转机制。建议在 `single-node-deployment.md` 中补充 `logrotate` 配置建议。
- 方案应明确：Go 后端上线后，`/api/*` → Go API、`/api/ai/*` → AI Bridge 的路由切换策略需要在统一配置中管理，避免 `vite.config.js` 和 `static-server.js` 中多处 hardcode。

### 13.8 文档衔接建议

三份文档的阅读顺序建议：

1. `design-evolution-review.md` → 历史回顾，建立上下文
2. `architecture-refactor-plan.md` → 全面技术方案
3. `single-node-deployment.md` → 当前阶段的部署落地

---

## 十四、修正后的推荐结论

如果只选一个方向开始，**优先补《亿万》内容资产，而不是先继续加技术复杂度**。

原因是：

- 这类项目的产品价值首先由内容完整度决定
- 测验、复习、Socratic、推荐、统计最终都在消费内容资产
- 如果台词库不全，技术层做得再漂亮，也只是放大一个不完整的课程底座

在此基础上，再推进 `storage.js`、`QuizPage.jsx` 和 repository 拆分，技术投入才会真正产生复利。

也就是说，修正后的主线应该是：

**内容补齐与分级 → 内容 schema 与内容流水线 → key 注册统一 → 存储抽象化 → Quiz 模块化 → Socratic 状态机化 → remote adapter 预接入 → Go API + PostgreSQL 接管真实状态**
