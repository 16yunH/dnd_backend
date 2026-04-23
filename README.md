# dnd_backend

D&D 5e AI 跑团平台的后端服务。REST + Socket.IO，TypeScript。

项目愿景与整体规划见 [idea.md](./idea.md) 与 [PLAN.md](./PLAN.md)。

配套前端：[dnd-char-creator](https://github.com/IvoryTowerforx/dnd-char-creator)

---

## 快速开始

```bash
# 1. 安装依赖（Node 20+）
npm install

# 2. 复制 env 模板
cp .env.example .env

# 3. 开发模式（tsx watch）
npm run dev

# 4. 另开一个窗口跑前端
cd ../dnd-char-creator && npm install && npm run dev
```

默认后端监听 `4100`，前端 Vite 默认 `5173`。

## 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | tsx watch，热重载 |
| `npm run check` | 仅做类型检查 (`tsc --noEmit`) |
| `npm test` | Vitest 跑单测 + supertest 集成测试 |
| `npm run build` | 编译到 `dist/` |
| `npm start` | 启动已编译产物 |

## 项目结构

```
src/
├── app.ts              // express app 装配（可注入 store 做测试）
├── index.ts            // 启动入口 + socket hub 接入
├── config/env.ts       // 环境变量解析
├── routes/             // REST（auth / rules / characters / rooms / health）
├── services/           // 业务层（auth / roomService / rulesData / jsonStore）
├── realtime/           // Socket.IO hub
├── lib/                // dice / derivedStats / logger / httpError
├── middleware/         // auth / errorHandler / requestLogger
└── types/              // 领域类型
data/                   // 结构化 5e 规则事实源（JS 模块）
storage/                // dev JSON 数据库（.gitignore 排除）
tests/                  // Vitest
```

## 环境变量

见 [.env.example](./.env.example)。核心：

- `PORT` / `NODE_ENV` / `LOG_LEVEL`
- `CORS_ORIGINS` — 逗号分隔的前端来源
- `DATABASE_URL` — 阶段 2 接入 Postgres 后使用
- `LLM_PROVIDER / LLM_MODEL / LLM_API_KEY / LLM_BASE_URL` — 阶段 4
- `EMBEDDING_PROVIDER / EMBEDDING_MODEL / ...` — 阶段 4

## API（当前版本）

所有非认证接口返回 JSON；错误响应统一形状：`{ code, message, details? }`。

### Health

- `GET /healthz` → `{ status, now }`

### Auth (`/v1/auth`)

- `POST /guest-login` `{ nickname }` → `{ userId, nickname, accessToken, expiresAt }`
- `GET /me` _(Bearer)_ → 当前用户信息

### Rules (`/v1/rules`)

- `GET /bootstrap` → 全量建卡基础数据（stats/skills/races/classes/subclasses/backgrounds/armours/weapons/pointBuy）

### Characters (`/v1/characters`) _(Bearer)_

- `GET /` → 当前用户的角色列表
- `POST /` 建卡，自动计算派生属性
- `PATCH /:characterId` 局部更新
- `DELETE /:characterId`

派生属性由 `src/lib/derivedStats.ts` 计算：`profBonus / initiative / ac / hp / spellDC / passivePerception / finalStats / modifiers`。

### Rooms (`/v1/rooms`) _(Bearer)_

- `POST /` 建房 `{ maxPlayers, isPrivate, password, expansion, campaign }`
- `GET /:roomId`
- `POST /:roomId/join` `{ password? }`
- `POST /:roomId/leave`
- `POST /:roomId/ready` `{ isReady, characterId?, expectedRoomVersion? }`
- `POST /:roomId/start` _(房主)_
- `GET /:roomId/messages?afterSeq=&limit=`
- `POST /:roomId/actions` 玩家动作；后端做 d20 判定 + 目前 DM 回复为占位文本（阶段 4 将接 LLM）

### Socket.IO

连接时通过 `auth.token` 或 `Authorization: Bearer ...` 鉴权。

- 客户端 → 服务端：
  - `room:join { roomId }`
  - `room:leave { roomId }`
- 服务端 → 客户端：
  - `room:snapshot { room }`
  - `room:messages { roomId, roomVersion, messages[] }`
  - `room:error { message }`

## LLM 与 AI DM

- 抽象接口：[`src/services/llm/types.ts`](src/services/llm/types.ts)
- OpenAI 兼容适配器（DeepSeek / Zhipu GLM / 本地 vLLM 等）：[`src/services/llm/openaiCompatible.ts`](src/services/llm/openaiCompatible.ts)
- 无 API key 时自动回退：[`src/services/llm/echoClient.ts`](src/services/llm/echoClient.ts)
- 工厂：[`src/services/llm/index.ts`](src/services/llm/index.ts)，按 `LLM_PROVIDER` 选择实现
- 编排：[`src/services/narrativeService.ts`](src/services/narrativeService.ts) 把玩家输入 → LLM → 规则检定 → 续写串成一次 DM 回合
  - **骰子一定由后端掷**，LLM 通过 tool call (`require_skill_check`) 声明需要检定；工具响应带着骰子结果回喂给 LLM 生成续写
  - 角色熟练项 + 属性调整值自动叠加
  - 空 API key 时走 EchoLLMClient，保证所有测试 / CI / 无网络环境可跑

示例：在 `.env` 里写 `LLM_PROVIDER=deepseek` 和 `LLM_API_KEY=sk-...`，启动后端，前端发送一条玩家动作，DM 回复就会接真实模型。

## 数据库（阶段 2 预备）

- `docker-compose.yml` 启动 `pgvector/pgvector:pg16`
- `prisma/schema.prisma` 预定义全部表 + 向量列，见文件注释
- `src/services/store.ts` 是所有业务服务共享的 `Store` 抽象；当前由 `JsonStore`（带串行化 mutex 的 JSON 文件）实现，切到 Prisma 时只需替换具体类

```bash
# 启动 Postgres + pgvector
docker compose up -d

# 生成 Prisma client（先 npm i prisma @prisma/client）
# npx prisma migrate dev --name init
```

> 当前代码不强依赖 Prisma；真正接入时新增 `PrismaStore implements Store` 即可。

## 骰子 (`src/lib/dice.ts`)

- `roll("2d6+3")` — 按标准表达式
- `rollD20Check({ bonus, dc, advantage })` — 支持优势/劣势，记录大成功/大失败
- 所有随机使用 `node:crypto.randomInt`，避免 `Math.random()` 的偏差

## 路线图

详见 [PLAN.md](./PLAN.md)。当前进度：

- ✅ 阶段 1 · 地基巩固：Vitest + CI + pino 日志 + dice lib + 统一错误体
- ✅ 阶段 2 · 持久化（准备层）：`Store` 抽象 + `JsonStore` 带互斥 + docker-compose + Prisma schema
- ✅ 阶段 4a · LLM 抽象：Provider 可插拔 + NarrativeService（工具调用 + 服务端骰子）
- ⏭ 阶段 3 · 战斗 / 地图
- ⏭ 阶段 4b · RAG ingest + pgvector 查询

## 许可

ISC
