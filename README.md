# dnd_backend

D&D 5e AI 跑团平台后端，提供 REST API + Socket.IO 实时通信。集成 LLM 驱动的 AI DM、AI 建卡、战斗系统、地图网格和 RAG 规则检索，开箱即用，默认无需数据库。

配套前端：[dnd-char-creator](https://github.com/16yunH/dnd-char-creator)

---

## 功能特性

- **AI DM** — LLM 驱动的地下城主，自动叙事、通过 tool call 请求技能检定，骰子由后端掷出，保证公平
- **AI 建卡** — 自然语言描述角色，LLM 自动生成结构化角色草案并校验规则
- **战斗系统** — 先攻掷骰排序、回合推进、伤害/治疗/临时HP、状态条件管理
- **地图网格** — 可初始化网格地图，添加/移动/删除 Token（PC/NPC/物体）
- **RAG 规则检索** — 将 5e 规则文档向量化，DM 回合自动检索相关规则片段
- **对话记忆** — 自动对长对话做摘要压缩，保持 DM 上下文连贯
- **实时通信** — Socket.IO 推送房间快照、消息、战斗更新、网格更新
- **可插拔存储** — 默认 JsonStore（JSON 文件），可选 PrismaStore（PostgreSQL）
- **多 LLM 后端** — 支持 DeepSeek / 智谱 GLM / Ollama / 任意 OpenAI 兼容 API

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 运行时 | Node.js 22+ |
| 语言 | TypeScript |
| Web 框架 | Express 5 |
| 实时通信 | Socket.IO |
| 校验 | Zod |
| 日志 | Pino + pino-pretty |
| 数据库（可选） | PostgreSQL + pgvector / Prisma ORM |
| 测试 | Vitest + supertest |

## 前置要求

- **Node.js** 22+（推荐 22 LTS）
- **npm** 10+
- （可选）**PostgreSQL** + **Docker** — 使用 PrismaStore 持久化存储
- （可选）**Ollama** — 本地运行 LLM / Embedding 模型

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/16yunH/dnd_backend.git
cd dnd_backend

# 2. 安装依赖
npm install

# 3. 复制环境变量模板
cp .env.example .env

# 4. 启动开发服务器
npm run dev
```

启动后后端监听 `http://localhost:4100`。

> **说明**：默认使用 JsonStore（JSON 文件存储），无需数据库即可运行。AI 功能（DM 叙事、AI 建卡）需要配置 LLM API Key，否则会回退到 Echo 模式（原样返回输入）。

## 环境变量配置

在项目根目录创建 `.env` 文件（可从 `.env.example` 复制），所有变量说明如下：

| 变量 | 说明 | 默认值 | 必填 |
| --- | --- | --- | --- |
| `PORT` | 服务监听端口 | `4100` | 否 |
| `NODE_ENV` | 运行环境：`development` / `production` / `test` | `development` | 否 |
| `LOG_LEVEL` | 日志级别：`trace` / `debug` / `info` / `warn` / `error` | `info` | 否 |
| `CORS_ORIGINS` | 允许的前端来源，逗号分隔；开发环境可用 `*` | `http://localhost:5173,http://127.0.0.1:5173` | 否 |
| `DATABASE_URL` | PostgreSQL 连接串；设置后启用 PrismaStore | 空（使用 JsonStore） | 否 |
| `LLM_PROVIDER` | LLM 提供商：`deepseek` / `zhipu` / `ollama` | `zhipu` | 否 |
| `LLM_MODEL` | LLM 模型名称；留空则使用提供商默认模型 | 空 | 否 |
| `LLM_API_KEY` | LLM API Key；Ollama 可不填 | 空 | 使用云端 LLM 时必填 |
| `LLM_BASE_URL` | LLM API 基础 URL；留空则使用提供商默认地址 | 空 | 否 |
| `EMBEDDING_PROVIDER` | Embedding 提供商：`ollama` / `openai` / `deepseek` / `zhipu` | `ollama` | 否 |
| `EMBEDDING_MODEL` | Embedding 模型名称；留空则使用提供商默认模型 | 空 | 否 |
| `EMBEDDING_API_KEY` | Embedding API Key；Ollama 可不填 | 空 | 使用云端 Embedding 时必填 |
| `EMBEDDING_BASE_URL` | Embedding API 基础 URL；留空则使用提供商默认地址 | 空 | 否 |
| `RAG_DUMP_PATH` | RAG 向量索引 JSON 文件路径；设置后启动时自动加载 | 空 | 否 |

## AI 功能配置

后端通过 `LLM_PROVIDER` 和 `LLM_API_KEY` 选择 LLM 实现。所有提供商均使用 OpenAI 兼容协议适配。

### 智谱 GLM 配置示例

```env
LLM_PROVIDER=zhipu
LLM_MODEL=glm-4-flash
LLM_API_KEY=your-zhipu-api-key
```

默认 Base URL：`https://open.bigmodel.cn/api/paas/v4`

### DeepSeek 配置示例

```env
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
LLM_API_KEY=your-deepseek-api-key
```

默认 Base URL：`https://api.deepseek.com/v1`

### Ollama 本地配置示例

```env
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:7b-instruct
```

默认 Base URL：`http://127.0.0.1:11434/v1`。Ollama 无需 API Key，后端会自动填充占位值。

使用前需先拉取模型：

```bash
ollama pull qwen2.5:7b-instruct
```

### 无 API Key 时的回退行为

- **LLM**：当 `LLM_API_KEY` 为空且 `LLM_PROVIDER` 不是 `ollama` 时，自动回退到 `EchoLLMClient`，DM 叙事将原样返回玩家输入，不调用任何外部 API
- **Embedding**：当 `EMBEDDING_API_KEY` 为空且提供商需要 Key 时，自动回退到 `EchoEmbeddingClient`，返回零向量
- **AI 建卡**：LLM 不可用时，`POST /v1/characters/ai-draft` 返回 `501 LLM 服务未配置`

回退机制保证所有测试、CI 和无网络环境均可正常运行。

## RAG 规则检索配置

### rules-corpus/ 目录

项目内置了 D&D 5e 规则文档（Markdown 格式），位于 `rules-corpus/` 目录：

```
rules-corpus/
├── ability-scores.md
├── backgrounds.md
├── checks.md
├── classes.md
├── combat.md
├── conditions.md
├── equipment.md
├── exploration.md
├── races.md
├── rest-and-recovery.md
├── skills.md
├── spellcasting.md
└── subclasses.md
```

### 运行 Ingest

Ingest 脚本会读取 Markdown 文件、分块、调用 Embedding API 生成向量，最终输出 JSON 索引文件：

```bash
# 使用默认配置（Ollama bge-m3）
npx tsx tools/ingest/ingest.ts ./rules-corpus

# 指定输出路径
npx tsx tools/ingest/ingest.ts ./rules-corpus ./storage/rag-dump.json
```

运行前确保 `.env` 中 `EMBEDDING_PROVIDER` 和 `EMBEDDING_API_KEY` 已正确配置。

### 启用 RAG 检索

Ingest 完成后，在 `.env` 中设置索引文件路径：

```env
RAG_DUMP_PATH=./storage/rag-dump.json
```

启动后端时会自动加载索引，DM 每次回复前会检索相关规则片段作为上下文。

### 支持的 Embedding Provider

| Provider | 默认模型 | 维度 | 需要 API Key |
| --- | --- | --- | --- |
| `ollama` | `bge-m3` | 1024 | 否 |
| `openai` | `text-embedding-3-small` | 1536 | 是 |
| `deepseek` | `deepseek-embedding` | 1024 | 是 |
| `zhipu` | `embedding-3` | 1024 | 是 |

> **注意**：RAG 索引的 Embedding 维度必须与运行时配置一致。如果更换了 Embedding Provider，需要重新运行 Ingest。

## 数据库配置（可选）

默认使用 JsonStore（JSON 文件存储，数据保存在 `storage/` 目录），适合开发和轻量使用。如需生产级持久化，可切换到 PrismaStore（PostgreSQL）。

### Docker 启动 PostgreSQL

```bash
docker compose up -d
```

这会启动一个 `pgvector/pgvector:pg16` 容器，端口 `5432`，用户/密码/数据库均为 `dnd`。

### 配置 DATABASE_URL

```env
DATABASE_URL=postgresql://dnd:dnd@localhost:5432/dnd?schema=public
```

### Prisma 迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev --name init
```

设置 `DATABASE_URL` 后，后端启动时会自动使用 PrismaStore；如果 PrismaStore 初始化失败，会回退到 JsonStore。

## 开发脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发模式，tsx watch 热重载 |
| `npm run check` | 仅类型检查（`tsc --noEmit`） |
| `npm test` | 运行测试（Vitest 单测 + supertest 集成测试） |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run build` | 编译 TypeScript 到 `dist/` |
| `npm start` | 启动已编译产物 |

## 项目结构

```
dnd_backend/
├── src/
│   ├── app.ts                    # Express 应用装配（可注入 store 做测试）
│   ├── index.ts                  # 启动入口 + Socket.IO Hub 接入
│   ├── config/
│   │   └── env.ts                # 环境变量解析
│   ├── routes/
│   │   ├── auth.ts               # 认证路由
│   │   ├── characters.ts         # 角色路由（含 AI 建卡）
│   │   ├── health.ts             # 健康检查路由
│   │   ├── rooms.ts              # 房间路由（含战斗、地图）
│   │   └── rules.ts              # 规则数据路由
│   ├── services/
│   │   ├── authService.ts        # 认证服务
│   │   ├── characterDraftService.ts  # AI 建卡服务
│   │   ├── combatService.ts      # 战斗系统服务
│   │   ├── memoryService.ts      # 对话记忆/摘要服务
│   │   ├── narrativeService.ts   # AI DM 叙事编排服务
│   │   ├── roomLobbyService.ts   # 房间大厅服务
│   │   ├── roomNarrativeService.ts   # 房间叙事服务
│   │   ├── roomService.ts        # 房间管理服务
│   │   ├── rulesData.ts          # 5e 规则数据服务
│   │   ├── jsonStore.ts          # JSON 文件存储实现
│   │   ├── prismaStore.ts        # Prisma/PostgreSQL 存储实现
│   │   ├── store.ts              # Store 抽象接口
│   │   ├── llm/
│   │   │   ├── types.ts          # LLM 客户端接口定义
│   │   │   ├── index.ts          # LLM 工厂（按 Provider 创建客户端）
│   │   │   ├── openaiCompatible.ts   # OpenAI 兼容协议适配器
│   │   │   └── echoClient.ts     # Echo 回退客户端
│   │   ├── embedding/
│   │   │   ├── types.ts          # Embedding 客户端接口定义
│   │   │   ├── index.ts          # Embedding 工厂
│   │   │   ├── httpEmbedding.ts  # HTTP Embedding 适配器
│   │   │   └── echoEmbedding.ts  # Echo 回退客户端
│   │   └── rag/
│   │       ├── types.ts          # RAG 类型定义
│   │       ├── ragService.ts     # RAG 检索服务
│   │       └── inMemoryVectorStore.ts  # 内存向量存储
│   ├── realtime/
│   │   └── socketHub.ts          # Socket.IO Hub
│   ├── lib/
│   │   ├── dice.ts               # 骰子库（crypto 安全随机）
│   │   ├── derivedStats.ts       # 派生属性计算
│   │   ├── httpError.ts          # 统一 HTTP 错误
│   │   └── logger.ts             # Pino 日志封装
│   ├── middleware/
│   │   ├── auth.ts               # Bearer Token 认证中间件
│   │   ├── errorHandler.ts       # 统一错误处理
│   │   └── requestLogger.ts      # 请求日志中间件
│   ├── db/
│   │   └── prismaClient.ts       # Prisma Client 初始化
│   └── types/
│       ├── domain.ts             # 领域类型定义
│       ├── data-modules.d.ts     # 数据模块类型
│       ├── express.d.ts          # Express 扩展类型
│       └── prisma.d.ts           # Prisma Client 类型声明
├── generated/                    # Prisma 生成代码（.gitignore 排除）
├── data/                         # 结构化 5e 规则事实源（JS 模块）
├── rules-corpus/                 # RAG 规则文档（Markdown）
├── tools/
│   └── ingest/                   # RAG Ingest 工具
│       ├── ingest.ts             # Ingest 主脚本
│       ├── chunker.ts            # Markdown 分块器
│       └── generateCorpus.mjs    # 语料生成脚本
├── prisma/
│   └── schema.prisma             # Prisma 数据库 Schema
├── tests/                        # 测试文件
├── storage/                      # 运行时数据（.gitignore 排除）
├── docker-compose.yml            # PostgreSQL + pgvector
├── .env.example                  # 环境变量模板
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## API 文档

所有非认证接口返回 JSON；错误响应统一形状：`{ code, message, details? }`。

### Health

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| GET | `/healthz` | 健康检查，返回 `{ status, now }` | 否 |

### Auth (`/v1/auth`)

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| POST | `/v1/auth/guest-login` | 游客登录，Body: `{ nickname }` → `{ userId, nickname, accessToken, expiresAt }` | 否 |
| GET | `/v1/auth/me` | 获取当前用户信息 → `{ userId, nickname, createdAt }` | Bearer |

### Rules (`/v1/rules`)

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| GET | `/v1/rules/bootstrap` | 全量建卡基础数据（stats/skills/races/classes/subclasses/backgrounds/armours/weapons/pointBuy） | 否 |

### Characters (`/v1/characters`)

所有接口需要 Bearer Token 认证。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/characters/ai-draft` | AI 建卡，Body: `{ prompt }` → `{ draft, validation }` |
| GET | `/v1/characters` | 当前用户的角色列表 → `{ items }` |
| POST | `/v1/characters` | 创建角色，自动计算派生属性 |
| PATCH | `/v1/characters/:characterId` | 局部更新角色 |
| DELETE | `/v1/characters/:characterId` | 删除角色 → `{ deleted: true }` |

**AI 建卡请求示例**：

```json
{
  "prompt": "我想创建一个精灵法师，擅长火焰魔法，出身贵族"
}
```

**AI 建卡响应示例**：

```json
{
  "draft": {
    "basic": { "name": "...", "race": "elf", "charClass": "wizard", "background": "noble", "level": 1 },
    "baseStats": { "str": 8, "dex": 14, "con": 12, "int": 17, "wis": 13, "cha": 10 },
    "proficiencies": { "skills": { "arcana": true, "history": true } },
    "equipment": { "armor": "none", "shield": false, "weapons": "匕首" },
    "spells": "火焰箭、法师之手",
    "specialAttrs": ""
  },
  "validation": { "valid": true, "issues": [] }
}
```

### Rooms (`/v1/rooms`)

所有接口需要 Bearer Token 认证。

#### 房间管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/rooms` | 创建房间，Body: `{ maxPlayers, isPrivate, password, expansion, campaign }` |
| GET | `/v1/rooms/:roomId` | 获取房间信息 |
| POST | `/v1/rooms/:roomId/join` | 加入房间，Body: `{ password? }` |
| POST | `/v1/rooms/:roomId/leave` | 离开房间 |
| POST | `/v1/rooms/:roomId/ready` | 准备/取消准备，Body: `{ isReady, characterId?, expectedRoomVersion? }` |
| POST | `/v1/rooms/:roomId/start` | 房主开始游戏，Body: `{ expectedRoomVersion? }` |
| GET | `/v1/rooms/:roomId/messages` | 获取消息历史，Query: `afterSeq`, `limit` |
| POST | `/v1/rooms/:roomId/actions` | 提交玩家动作，Body: `{ content }`，后端做 d20 判定 + DM 回复 |

#### 地图网格

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/rooms/:roomId/grid/init` | 初始化网格，Body: `{ width, height }`（5-100） |
| POST | `/v1/rooms/:roomId/grid/token` | 添加 Token，Body: `{ kind: "pc"|"npc"|"object", x, y, characterId?, label?, color? }` |
| POST | `/v1/rooms/:roomId/grid/move` | 移动 Token，Body: `{ tokenId, x, y }` |
| DELETE | `/v1/rooms/:roomId/grid/token/:tokenId` | 删除 Token |

#### 战斗系统

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/rooms/:roomId/combat/start` | 发起战斗（仅房主），Body: `{ participants: [{ name, type, characterId?, dexModifier?, maxHp, ac }] }` |
| POST | `/v1/rooms/:roomId/combat/next-turn` | 推进到下一回合（房主或当前回合玩家） |
| POST | `/v1/rooms/:roomId/combat/damage` | 造成伤害，Body: `{ combatantId, amount, type? }` |
| POST | `/v1/rooms/:roomId/combat/heal` | 治疗，Body: `{ combatantId, amount }` |
| POST | `/v1/rooms/:roomId/combat/temp-hp` | 添加临时 HP，Body: `{ combatantId, amount }` |
| POST | `/v1/rooms/:roomId/combat/condition` | 添加状态条件，Body: `{ combatantId, condition }` |
| DELETE | `/v1/rooms/:roomId/combat/condition` | 移除状态条件，Body: `{ combatantId, condition }` |
| POST | `/v1/rooms/:roomId/combat/end` | 结束战斗（仅房主） |

**发起战斗请求示例**：

```json
{
  "participants": [
    { "name": "阿拉贡", "type": "pc", "characterId": "...", "dexModifier": 2, "maxHp": 45, "ac": 16 },
    { "name": "哥布林", "type": "npc", "maxHp": 7, "ac": 12 }
  ]
}
```

### Socket.IO 事件

连接时通过 `auth.token` 或 `Authorization: Bearer ...` 鉴权。

#### 客户端 → 服务端

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `room:join` | `{ roomId }` | 加入房间实时通道（需先通过 REST 加入房间） |
| `room:leave` | `{ roomId }` | 离开房间实时通道 |

#### 服务端 → 客户端

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `room:snapshot` | `{ room }` | 房间完整快照（加入时推送） |
| `room:messages` | `{ roomId, roomVersion, messages[] }` | 新消息推送 |
| `room:combat` | `{ roomId, roomVersion, combat }` | 战斗状态更新（开始/下一回合/伤害/治疗/条件变更/结束） |
| `room:grid` | `{ roomId, grid }` | 网格地图更新（初始化/Token 变更/移动） |
| `room:error` | `{ message }` | 错误通知 |

## 测试

```bash
# 运行全部测试
npm test

# 监听模式
npm run test:watch
```

测试使用 Vitest + supertest，不依赖外部 LLM API（回退到 Echo 客户端），可在任何环境运行。

## 配套前端

前端项目：[dnd-char-creator](https://github.com/16yunH/dnd-char-creator)

```bash
git clone https://github.com/16yunH/dnd-char-creator.git
cd dnd-char-creator
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，后端默认 `http://localhost:4100`，CORS 已预配置。

## 许可

ISC
