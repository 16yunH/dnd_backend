# D&D AI 跑团平台 · 项目规划

> 本文件是整个项目（后端 `dnd_backend` + 前端 `dnd-char-creator`）的总体规划与执行路线图。
> 对 Codex 已交付的代码作了逐项评估，并给出每一阶段需要新增 / 改动 / 推翻的内容。
> 一切以本规划为准；与 Codex 现状冲突时，按本规划执行。

---

## 0. 术语与角色

- **Player**：登录的玩家，可创建/管理角色卡、加入房间。
- **DM（AI）**：系统扮演的主持人，负责剧情推演；由 LLM 驱动，规则检定由后端完成。
- **Room / Campaign**：一次跑团会话，多人共享状态与聊天流。
- **Rules Data**：标准化的 5e 规则数据（职业、种族、技能、武器、护甲等，已整理为 JSON/JS 模块）。
- **Rulebook Corpus**：规则书/战役书的散文文本（Markdown），供 RAG 检索。

---

## 1. idea.md 核心目标回顾

1. **智能建卡**：自然语言 + AI + 规则校验生成标准角色卡。
2. **AI DM**：AI 叙事 + 后端骰子判定，严格遵循 5e 规则框架。
3. **成本控制**：低价 API / 本地模型 + 逻辑剥离 + 上下文压缩 + RAG。
4. **结构化存储**：属性走 JSON / JSONB；规则散文走 Markdown；向量存储用于检索。
5. **架构建议**：PostgreSQL + pgvector 一库多用（关系 / JSONB / 向量 / 聊天档）。
6. **分工**：前端做建卡 UI + 游戏 UI（含地图）；后端做存储、规则分发、AI 调度。

---

## 2. 对 Codex 现状的总体评估

### 2.1 已实现（可保留）

| 模块 | 评价 |
| --- | --- |
| TS + Express 5 + Socket.IO + Zod 项目骨架 | 目录分层合理：`routes / services / lib / middleware / realtime`，保留。 |
| `GET /v1/rules/bootstrap` 规则下发 | 简单直接，符合「前端启动时一次拉全量基础规则」的思路，保留。 |
| 角色卡 CRUD + 派生属性 (`computeDerivedStats`) | HP/AC/熟练加值/法术 DC/被动察觉公式都算对了，保留，后续扩展子职业/专长/变体。 |
| 骰子由后端生成（`rollD20`） | 正确执行了 idea.md「逻辑剥离」的要求，保留骰子层。 |
| 房间生命周期（`waiting → playing`）与 Socket.IO 广播 | 基础房间 + 准备 + 开局 + 消息流，可复用。 |
| Guest 登录 | 开发阶段够用，先保留。 |

### 2.2 做得不够 / 需要重做

| 问题 | 严重程度 | 处理方式 |
| --- | --- | --- |
| **没有数据库**，只写 `storage/dev-db.json` 整文件读写 | 高 | 第 2 阶段切换到 PostgreSQL + Prisma（或 Drizzle）。JSON 文件仅保留作为本地 dev fallback。 |
| **没有 AI DM**，`submitAction` 里全是硬编码中文叙事 | 极高 | 核心缺口，必须补完。引入「`LLMClient` 抽象 + 可插拔 Provider（DeepSeek / GLM-4-Flash / Gemini Flash / 本地 Ollama）」。 |
| **没有 RAG / 向量检索** | 高 | 新增 `rag` 模块 + `pgvector`。在 `submitAction` 前按玩家动作拉 Top-k 规则片段注入 prompt。 |
| **没有规则书语料库 pipeline** | 高 | 新增 `tools/ingest/*`：chm → html → md → 切片 → embedding → pgvector。 |
| **无上下文压缩 / 会话摘要** | 高 | 新增 `services/memoryService.ts`：小模型周期性摘要 + 滑窗 + 摘要注入。 |
| **Session 存内存**，重启即失效 | 中 | 改为 DB 存 `sessions` 表或用 JWT，并提供 refresh。 |
| **技能判定靠中文关键词匹配** | 中 | 改为「AI 先决定是否需要检定 + 哪项技能 + DC」→ 后端骰子 → AI 续写。走 Function Calling / 结构化输出。 |
| **DM 回复只有成功/失败二分** | 中 | 同上，由 AI 根据 roll/dc/角色上下文续写。 |
| **房间内没有战斗回合 / HP 追踪 / 初始值顺序** | 中 | 阶段 3 加入战斗子状态机 (`exploration / combat`)。 |
| **缺地图 / 位置信息** | 中 | 阶段 3 增加 `grid` 状态字段 + 前端网格地图。 |
| **RoomService 类膨胀** | 低 | 拆为 `roomLobbyService` / `roomNarrativeService` / `roomCombatService`。 |
| **没有测试** | 中 | 引入 Vitest + supertest，对核心路由与 `computeDerivedStats` 写用例。 |
| **没有日志 / 限流 / 可观测** | 低 | 加 `pino` + 基础 rate-limit；Sentry 可后置。 |
| **派生属性忽略子职业 / 属性加值上限 / 专长 / ASI** | 低 | 在阶段 2 规则深化里补。 |
| **Zod v4 + Express v5 + TypeScript v6 组合都是 bleeding edge** | 低 | 记录风险；如遇兼容问题降到 Zod v3 / TS 5.x。 |

### 2.3 结论

Codex 搭出了一个**"多人房间 + 角色卡 + 伪 DM"的 MVP 骨架**，骨架是合格的，但**idea.md 真正的三根支柱（DB 持久化 / AI 叙事 / RAG 规则检索）几乎都是零**。我们保留骨架，按下面的路线图往里补血。

---

## 3. 目标架构

```
┌────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                       │
│  - CharacterCreator / RoomLobby / GameRoom(+Map)               │
└──────────────▲─────────────────────────────────▲───────────────┘
               │ REST (/v1/**)                    │ Socket.IO
               │                                  │
┌──────────────┴──────────────────────────────────┴───────────────┐
│  Backend (Node + Express 5 + TS)                                │
│  ├─ routes        REST 层（auth / rules / characters / rooms / ai) │
│  ├─ services      业务层                                          │
│  │    ├─ authService        用户 / 会话                           │
│  │    ├─ characterService   建卡 + 派生                           │
│  │    ├─ rulesDataService   结构化规则 JSON                       │
│  │    ├─ ragService         向量检索                              │
│  │    ├─ llmService         Provider 抽象 + Function Calling      │
│  │    ├─ memoryService      摘要 / 上下文裁剪                     │
│  │    ├─ narrativeService   AI DM 编排                            │
│  │    └─ combatService      战斗状态机                            │
│  ├─ realtime      Socket.IO Hub                                  │
│  ├─ lib           dice / derivedStats / http                     │
│  └─ db            Prisma schema + migrations                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼──────────────────────────┐
        ▼                    ▼                          ▼
┌────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ PostgreSQL     │ │ pgvector (同库)    │ │ LLM Providers        │
│ users/rooms/   │ │ rule_chunks        │ │ DeepSeek / GLM /    │
│ characters     │ │ (embedding, meta)  │ │ Gemini Flash / Ollama│
│ room_messages  │ │                    │ │                    │
│ summaries      │ │                    │ │                    │
└────────────────┘ └────────────────────┘ └────────────────────┘
```

### 3.1 LLM Provider 抽象

```ts
interface LLMClient {
  complete(req: {
    system: string;
    messages: ChatMessage[];
    tools?: ToolSchema[];
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<LLMResponse>;
}
```
- 统一入口，按环境变量切换 `LLM_PROVIDER=deepseek|zhipu|gemini|ollama`。
- 所有 DM 调用必须支持 **Function Calling / JSON 输出**，以便后端接住：
  - `require_skill_check(skill, dc, advantage?)`
  - `apply_damage(targetId, amount, type)`
  - `advance_scene(sceneId)`
  - `update_character_state(...)`

### 3.2 数据模型（Prisma 草案）

```prisma
model User         { id, nickname, passwordHash?, createdAt }
model Session      { token, userId, expiresAt }
model Character    { id, ownerId, basic(Json), baseStats(Json), derived(Json), proficiencies(Json), equipment(Json), spells(Text), specialAttrs(Text) }
model Room         { id, hostId, state, config(Json), roomVersion, createdAt, updatedAt }
model RoomPlayer   { id, roomId, userId, characterId, isReady, joinedAt }
model RoomMessage  { id, roomId, seq, role, senderUserId?, content, meta(Json), createdAt }
model RoomSummary  { id, roomId, upToSeq, summary, createdAt }       // 上下文压缩
model RuleChunk    { id, source, section, content, tokens, embedding(Vector), createdAt }
```

---

## 4. 分阶段路线图

里程碑按 **2-3 周一个阶段**粒度切分；每个阶段结束都应能独立 demo。

### 阶段 1 · 地基巩固（1 周）⭐️ 正在进行

目标：让现有 MVP 能稳定跑、能测、能上 CI、能公开评审。

- [x] `dnd_backend` 接入 GitHub <https://github.com/16yunH/dnd_backend>。
- [ ] 加 `README.md`（开发/构建/启动说明、接口清单、前端接入方式）。
- [ ] `.env.example` 扩展：`LLM_PROVIDER / *_API_KEY / DATABASE_URL / EMBEDDING_MODEL` 占位。
- [ ] 引入 Vitest + supertest，对 `computeDerivedStats`、`POST /v1/auth/guest-login`、`POST /v1/rooms` happy path 写用例。
- [ ] GitHub Actions：`npm ci → npm run check → npm test`。
- [ ] 接入 `pino` 日志 + 全局错误兜底统一 `{code,message,details}` 形状。
- [ ] 修小坑：`package.json` 的依赖版本（TS 6 / Zod 4 / Express 5）做一次 compat 验证，有坑就回退。

**验收**：PR 合并到 main 触发 CI 绿；本地 `npm run dev` + 前端 `npm run dev` 能联通走完"登录→建卡→建房→进房→开局→发消息"全链路。

### 阶段 2 · 持久化与认证（1-2 周）

目标：JSON 存储下线，换成 Postgres；会话可靠。

- [ ] 新增 `docker-compose.yml`（postgres + pgvector 镜像 `pgvector/pgvector:pg16`）。
- [ ] 引入 Prisma，按 §3.2 设计迁移。`storage/dev-db.json` 仅保留作为数据回填脚本输入。
- [ ] 重写 `JsonStore` → `DbStore`（同签名），让 `services/*` 不受影响。
- [ ] 真实用户系统：保留 guest 登录；同时加账号/密码（argon2）+ JWT（短）+ refresh。
- [ ] Session 表替代内存 Map。
- [ ] 写 seed 脚本：把 `data/*.js` 规则元数据灌入 `rule_chunks`（先作为原文，不含 embedding，留给阶段 4）。

**验收**：删除 `storage/dev-db.json` 后服务仍可运行；前端无感切换。

### 阶段 3 · 战斗与地图（2 周）

目标：跑团核心玩法——检定 + 战斗 + 位置——要能跑通。

- [ ] `RoomState` 扩展 `exploration | combat | ended`。
- [ ] `combatService`：initiative 顺序、回合指针、HP/临时 HP、状态 (`conditions[]`)、简单攻击判定。
- [ ] 地图：`RoomRecord.grid = { width,height,tokens:[{id,x,y,kind,characterId?}] }`，通过 `room:grid` 事件推送；前端在 `GameRoom` 里画 Canvas/SVG 网格。
- [ ] 骰子服务独立：`lib/dice.ts` 支持 `"2d6+3"`、优势/劣势、暴击判定；所有路径走它。
- [ ] 把 `RoomService` 按职责拆分。

**验收**：前端能看到战斗轮次指示、HP 条、可在地图上点一个怪/玩家标记移动，后端能校验距离并写入事件。

### 阶段 4 · AI 与 RAG（2-3 周）⭐️ 项目真正的"差异点"

目标：接通 AI DM，接通规则检索，成本可控。

- [ ] `services/llmService.ts`：Provider 抽象 + DeepSeek / GLM-4-Flash / Gemini Flash / Ollama 四个实现。统一 `complete()` 和 `complete({jsonMode:true})`。
- [ ] `services/ragService.ts`：
  - embedding：优先 `bge-m3` 本地（Ollama）或 `text-embedding-3-small`（价格便宜）。
  - 查询：对玩家动作 + 近 N 条对话生成查询向量，取 Top-k。
- [ ] `tools/ingest/`：
  - `chm → html`（`hh.exe -decompile` 或 `libmspack`）；
  - `html → md`（`markdownify` / `turndown`）；
  - 按 H2/H3 + 段落长度切片；
  - 生成 embedding 入库。
- [ ] `narrativeService`：把 `submitAction` 里硬编码的 DM 段落换成：
  1. 查 RAG → 拼 system prompt（含规则片段 + 角色摘要 + 最近消息 + 摘要）。
  2. 调 LLM 以 Function Calling 返回 `{narration, requiredChecks?[], stateUpdates?[]}`。
  3. 对 `requiredChecks` 本地骰子 + 应用 `stateUpdates` + 把结果反喂 LLM 做一次续写（可选）。
  4. 追加到消息流 + Socket 广播。
- [ ] `memoryService`：每 N 条或窗口过大触发一次摘要 → 存 `RoomSummary`；后续 prompt 用摘要替代早期历史。
- [ ] AI 建卡：新路由 `POST /v1/characters/ai-draft`：自然语言 → LLM 输出结构化草案 → 后端用 Zod 校验 + 规则合法性检查 → 前端二次确认。

**验收**：同一段玩家输入，在空规则库与载入 PHB 之后，DM 的回答有可观差异；开 1 场 30 轮游戏，成本控制在每场 0.1 USD 以内（用 Flash 级模型时）。

### 阶段 5 · 扩展战役与资产（滚动进行）

- 战役包：`CampaignPack = { id, name, md, grids, npcs, encounters }`，支持热加载。
- 静态资源（图片/地图/头像）接对象存储（先本地 `/static`，后置 S3/OSS）。
- DM 可调面板：让真人 DM override AI 建议（hybrid 模式）。
- 审计 / 观测：每次 LLM 调用写一条 `llm_calls` 日志（provider/tokens/latency/cost）。

### 阶段 6 · 上线化

- Dockerfile（多阶段）+ `docker-compose.prod.yml`；一台轻量云主机 + Postgres 即可跑。
- 简单域名 + Caddy/Nginx 反代 + HTTPS。
- 备份脚本：`pg_dump` 每日。

---

## 5. 立即下一步（给开发者的 Action List）

> 排序 = 优先级；每条都是可独立合并的 PR 规模。

1. **写 README（backend）**：启动步骤、接口、与前端约定。
2. **添加 Vitest + supertest + GitHub Actions CI**。
3. **拆出 `lib/dice.ts`** 并把 `rollD20` / keyword 匹配下线为调用它的过渡实现（为阶段 4 的 AI-drive check 让路）。
4. **搭 docker-compose（postgres + pgvector）**，加 Prisma schema；把 `JsonStore` 抽象成接口，`DbStore` 做实现。
5. **LLMClient 接口 + DeepSeek 实现**（先让 `narrativeService` 能在小 demo 里返回 AI 文字）。
6. **RAG ingest 脚本骨架**（先用 Markdown 手动喂一两个小章节，走通 embedding + 查询）。
7. **AI 建卡接口 `/v1/characters/ai-draft`**（最小实现：LLM → JSON → Zod → 回传）。

---

## 6. 风险与待决策

| 主题 | 待决 |
| --- | --- |
| **模型选型** | 默认 DeepSeek（成本极低、中文好、支持 JSON mode），Gemini Flash 作备用。待你确认。 |
| **Embedding 选型** | 开发期 `bge-m3` 本地 Ollama；线上 `text-embedding-3-small`？需确认是否使用 OpenAI 账号。 |
| **鉴权策略** | 是否保留 guest 登录？是否接第三方（GitHub OAuth）？ |
| **规则书来源合法性** | 自有 5e 翻译？中文社区整理版？注意版权边界，仅限个人/演示使用。 |
| **前端仓库** | 现 `dnd-char-creator` 属于另一 GitHub 账号（IvoryTowerforx），是否迁到同 org 下方便 CI？ |
| **依赖版本过新** | Zod 4 / Express 5 / TS 6 / @types/node 25，如果跑出稀奇古怪的问题，第一反应是回退。 |

---

## 7. 与 Codex 产出物的对照（速查）

| 文件 | 保留 | 需改动 | 备注 |
| --- | --- | --- | --- |
| `src/app.ts` | ✅ | - | - |
| `src/config/env.ts` | ✅ | 🔄 扩展环境变量 | 加 LLM / DB / embedding 配置 |
| `src/services/jsonStore.ts` | ⚠️ 仅 dev | 🔄 抽象成接口 | 阶段 2 被 `DbStore` 替换 |
| `src/services/authService.ts` | ✅ | 🔄 | 会话入库 + 真实账号 |
| `src/services/rulesData.ts` | ✅ | - | 静态规则展示够用 |
| `src/services/roomService.ts` | ⚠️ | 🔄 拆分 | 阶段 3 拆 combat / narrative |
| `src/routes/*` | ✅ | 🔄 小改 | 增加 AI 相关端点 |
| `src/realtime/socketHub.ts` | ✅ | 🔄 新增事件 | `room:grid` / `room:combat` |
| `src/lib/derivedStats.ts` | ✅ | 🔄 扩展 | 子职业 / ASI / 专长 |
| `data/*.js` | ✅ | - | 作为规则事实源，后期迁入 DB seed |

---

## 8. 目录终态预览

```
dnd_backend/
├── data/                      # 结构化规则事实源（JS 模块）
├── prisma/                    # schema + migrations
├── tools/
│   ├── ingest/                # chm→html→md→chunk→embed 工具链
│   └── scripts/               # seed / backfill
├── src/
│   ├── config/
│   ├── db/                    # prisma client + repo helpers
│   ├── routes/                # REST
│   ├── services/
│   │   ├── authService.ts
│   │   ├── characterService.ts
│   │   ├── rulesDataService.ts
│   │   ├── ragService.ts
│   │   ├── llmService.ts
│   │   ├── memoryService.ts
│   │   ├── narrativeService.ts
│   │   └── combatService.ts
│   ├── lib/                   # dice / derivedStats / http / prompt
│   ├── middleware/
│   ├── realtime/
│   └── types/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── PLAN.md                    # ← 本文件
├── README.md
└── idea.md
```

---

*最后更新：2026-04-23 · 规划版本 v1.0*
