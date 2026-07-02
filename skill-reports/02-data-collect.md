# data-collect 深度分析

> 研读对象：`飞象Skills/data-collect/`（v1–v13 共 13 个版本，每版仅一个 `SKILL.md`；外加 `SKILL_v1_CDN.md`）。
> 这是一个**单文件 skill**（无子文档），把"纯前端 HTML"升级为"带后端存取的收集页 + 报告页"。它与 `courseware-generator` 共享同一个 `MuskCollect` SDK，是飞象「数据闭环」的承载者。

---

## 1. 设计思路

### 1.1 它解决的真实问题

让 AI 生成的交互页面能**跨用户、跨设备地持久化数据**：一个发起者建活动，多名参与者提交，发起者看汇总报告。典型场景（frontmatter 列举）：问卷、报名、签到、投票、答题测验、互评打分、排行榜、多人游戏。

### 1.2 核心设计理念

**理念 A：框架只管"数据存取"，业务逻辑全在前端。**
开篇第一句就是边界声明：

```7:8:data-collect/v13/SKILL.md
生成（改造为）带后端数据存取的交互式 HTML。框架只负责数据存取，业务逻辑由前端代码实现。
```

SDK 仅提供 `save / query / delete` 三个动词，其余（题目、统计口径、UI）都由生成的 HTML 自己实现。

**理念 B：极简数据模型四件套。** `instanceId`（活动数据空间）/ `docId`（记录主键）/ `collection`（表名）/ `data`（任意 JSON 业务数据）。身份信息（昵称/学号）也塞进 `data`，**不**用系统字段（v13 §数据模型 + §核心规则 1）。

**理念 C：约定优于配置，把易错点写死成规则。**
- `instanceId` 由 SDK 自动从 URL/meta/顶层窗口四档解析，**禁止硬编码、禁止自写读取逻辑**（v13 §HTML 中的 instanceId 处理）。
- 固定内容写死 HTML，只有"参与者产生的动态数据"走 SDK。
- 不在 HTML 硬编码假数据。

**理念 D（v13 定型）：定位为"打磨完成后的升级步骤"，而非从零生成。**
description 从 v1 的"生成多人参与的 HTML"改为：

```3:3:data-collect/v13/SKILL.md
description: 当用户提出需要"数据回收/数据看板"等功能时，调用本 skill。用于在页面/课件内容已基本打磨完成后，将纯前端交互资源升级为带后端数据存取的收集页和报告页...
```

这把它从"独立生成器"重定位成"**接在 courseware-generator 之后的数据闭环模块**"。

### 1.3 关键抽象

| 抽象 | 含义 |
|------|------|
| 收集页 `role=collect` / 报告页 `role=report` | 按角色拆成独立 HTML，同 `instanceId` 共享数据 |
| `MuskCollect` SDK | `new MuskCollect()` 自动解析 instanceId；`save/query/delete` |
| `create_instance` → `create_file` → `publish_resource` → `bind_resources` | 工具调用四步链 |
| **联通性自检对照表** | 收集页写入字段 ⇄ 报告页读取字段的一致性静态校验 |
| **高风险页面结构特殊分支** | 命中多上下文结构（template/iframe/srcdoc/postMessage）时先重构为单页 |
| resourceId 链式追踪 | `edit_file` 每次返回新 resourceId，必须用最新值 publish/bind |

---

## 2. 迭代路线（v1 → v13 还原）

> 用跨版本 grep（SDK 版本 / mockSeeds / publish_resource / 联通性自检 / delete / 高风险 / ask_user）还原，证据见下表趋势：

| 版本 | SDK | mockSeeds | publish_resource | 联通性自检 | delete | 高风险分支 | 提问工具 |
|------|-----|-----------|------------------|-----------|--------|-----------|---------|
| v1–v2 | 1.2.0 | ✅ | — | — | — | — | continue_ask |
| v3–v4 | 1.2.0 | ✅ | — | — | — | — | **ask_user** |
| v5 | **1.3.0** | ✅ | — | — | — | — | ask_user |
| v6–v7 | 1.3.0 | **移除** | — | **✅新增** | — | — | ask_user |
| v8 | 1.3.0 | — | — | 强化 | — | — | ask_user |
| v9 | 1.3.0 | — | — | ✅ | — | **✅新增** | ask_user |
| v10 | 1.3.0 | — | **✅新增** | ✅ | — | ✅ | ask_user |
| v11–v12 | **1.4.0** | — | ✅ | ✅ | **✅新增** | ✅ | ask_user |
| v13 | 1.4.0 | — | ✅ | ✅ | 强化 | ✅ | ask_user |

### 2.1 关键拐点解读

**① v2→v3：`continue_ask` → `ask_user`，并把确认升级为结构化多选。**
v13 的提问固定三道多选题：是否收集身份信息（姓名/学号/班级/匿名）、数据结构（所有指标）、是否需要导出（csv/xls/json）（v13 §工具调用顺序 1）。

**② v5：SDK 1.2.0→1.3.0，并埋下数据语义大改的伏笔。**
v5 起删掉了"覆盖更新"的措辞（grep：v1–v4 有 `覆盖更新`=2，v5 起=0）。

**③ docId 语义彻底反转（v1 vs v13，最重要的一次行为变更）。**
- v1：`docId` SDK 自动管理，**同设备始终一致**，`save` 是**覆盖更新**（v1 §数据模型："同一 (instanceId, collection, docId) 再次 save 是覆盖更新，不是新增"）。
- v13：`docId` **每次 save 都生成全新 UUID，append-only，永不覆盖**；要"同人最新一条"必须自己在 `data` 里放稳定身份字段、报告页 `query` 后去重（v13 §数据模型 + §MuskCollect SDK 注释）。

这是从"键值覆盖模型"转向"事件流/日志模型"的根本转变——更适合"答题留痕、多次提交、可审计"，但把去重责任推给了前端。

**④ v5→v6：移除 mockSeeds，新增「联通性自检」。**
v1–v5 靠 `bind_resources` 的 `mockSeeds` 注入 3–5 条演示数据让空报告页"看起来有数据"。v6 起彻底删掉这套，改为"始终展示真实数据，空则显示空状态"，同时引入**联通性自检对照表**——专治"参与者填了但看板不更新"的字段不一致 bug（v13 §联通性自检，并升级为【硬约束】：未输出对照表/仍有✗就 publish = 违反 skill 规则）。设计取向从"演示友好"转向"真实可靠 + 静态可验证"。

**⑤ v9：新增「高风险页面结构特殊分支」——与 courseware-generator 的耦合显式化。**
当输入 HTML 含 `<template class="page-data">`、`page-shared`、多 iframe、`srcdoc`、`postMessage/saveState/restoreState` 时（**正是 courseware-generator 的产物特征**），禁止原地改造，必须先重构为**单页收集应用**再生成报告页（v13 §高风险页面结构的特殊分支）。这说明团队踩过"把多页互动课件直接改造成收集页导致状态隔离/数据丢失"的坑。

**⑥ v10：新增 `publish_resource`（18 处），明确"可见性"与"数据通道"分离。**
- `publish_resource` = 用户可见性的**唯一入口**；
- `bind_resources` = 只建立"页面↔instance 数据回传通道"，**不能**替代 publish（v13 §核心规则 11）。
- 并立硬规则：`publish_resource` 绝不能与 `create_file/edit_file` 同轮并行（并行时 publish 拿不到本轮新 resourceId）（v13 §核心规则 12 / §工具调用顺序 6）。

**⑦ v11：SDK 1.4.0，新增 `sdk.delete` + 报告页逐行删除按钮。**
要求用 `query` 返回的 `item.docId` 删除，禁止用 `item.id`，删除失败必须提示失败、不得吞异常（v13 §MuskCollect SDK 注释 + §核心规则 4）。

**⑧ v13：补充易错点。** `createdAt/updatedAt` 是**字符串毫秒时间戳**，必须 `new Date(Number(item.createdAt))` 否则 Invalid Date；`data` 不得含 base64 超大字符串；答题类默认**不即时批改**（只记录选择，提交后才出分，且要主动移除被改造页里原有的单题反馈逻辑）（v13 §核心规则 8、§MuskCollect SDK 注释）。

### 2.2 一个发布管线的瑕疵

`SKILL_v1_CDN.md` 与 `v1/SKILL.md` 逐字节相同（已 diff 验证），即 **data-collect 线上 CDN 投放的还是 v1**，而本地已迭代到 v13。对比 courseware-generator 的 CDN 已是 v18，说明两个 skill 的发布节奏不同步、data-collect 线上严重滞后（或该 CDN 文件只是早期归档）。

---

## 3. 功能边界

### 3.1 能做什么

- 把纯前端交互页升级为"收集页 + 报告页"双端，跨用户共享数据；或对已有 HTML（含上传的互动页）做数据回收改造。
- 三动词数据操作：`save`（追加）、`query`（取全量）、`delete`（硬删单条）。
- 报告页：统计 + 明细 + 刷新 + 逐行删除；可选数据导出（csv/xls/json）。
- 自动处理 instanceId 多场景解析（直链/iframe/嵌套）。

### 3.2 明确不做什么

- frontmatter：**不用于**仅需本地交互、静态展示、单人体验，或"用户尚未确认需要数据回收"的场景（v13 frontmatter）。
- 不提供"获取当前用户数据"的方法（docId 不再是身份）——"我的数据"得靠前端自带身份字段筛选（v13 §SDK 注释）。
- 不在前端硬编码假数据；不在 `data` 里塞 base64。
- 答题默认不即时批改（除非用户明确要求）。

### 3.3 关键约束与假设

- **resourceId 链式追踪**是贯穿全流程的硬约束：`edit_file` 每次产生新文件，publish/bind/发链接都必须用**最新** resourceId，否则用户拿到改前旧版（v13 §核心规则 10）。
- **顺序硬约束**：`create_instance` → `create_file ×N` → 联通性自检全✓ → `publish_resource`（单独起一轮、逐个）→ `bind_resources`（一次性）→ 发带 `?instanceId=` 的链接。
- **自检前置**：联通性自检对照表必须在 publish 之前输出且全✓（【硬约束】）。

---

## 4. 工程启发（针对 ClassIn「AI 助教升级：互动内容生成 + 数据闭环」）

### 4.1 可直接借鉴

1. **极简数据契约 = 闭环的地基。** `instanceId / collection / docId / data` 四件套 + `save/query/delete` 三动词，足以支撑问卷/答题/排行榜/签到全场景。ClassIn 的"数据闭环"应先定义这样一个**最小且稳定的存储契约**，把业务复杂度留在前端/报告层。
2. **"内容生成"与"数据回收"解耦为两个 skill、串行衔接。** courseware-generator 先产内容、data-collect 再升级数据——职责单一、可独立演进。ClassIn 的助教互动内容生成 + 数据看板，建议同样拆成"生成"与"回收"两层，而非一个巨型 prompt。
3. **联通性自检对照表**是低成本高收益的质量护栏：用一张"写入字段 ⇄ 读取字段"对照表，在发布前静态消除"填了看板不更新"这一类最高频 bug。强烈建议移植为 ClassIn 数据应用的**发布前置校验**。
4. **可见性（publish）与数据通道（bind）分离**的概念清晰，避免"以为发布了其实只建了通道"。任何"生成→发布"的平台都该显式区分这两件事。
5. **高风险结构分支**：当数据回收要套在"多 iframe/多上下文"的复杂页上时，先重构成单页再回收。这是处理"状态隔离导致数据丢失"的实战经验，ClassIn 若让助教改造老师上传的复杂 HTML，必踩同样的坑。
6. **把易错点固化成规则**：时间戳 `Number()` 转换、`delete` 用 `docId` 不用 `id`、删除失败不吞异常、答题默认不即时批改——这些都是从线上 bug 反推出的"防御性规则"，值得作为 ClassIn 互动题/数据页的默认规约。

### 4.2 要警惕的坑

1. **append-only 模型把去重责任甩给前端。** v13 的 `save` 永不覆盖，"同人最新一条"需前端自带身份字段 + 报告页自行去重。若 ClassIn 选这种事件流模型，要在产品层想清楚去重/统计口径，否则报告会重复计数。
2. **发布管线滞后风险真实存在**：data-collect 的 CDN 停在 v1（§2.2）。自建闭环时要让"线上实际投放版本"可观测、可灰度、可回滚，避免本地 v13、线上 v1 的割裂。
3. **大量靠 prompt 维持的顺序约束很脆弱**（publish 不能与 create 同轮、必须用最新 resourceId、自检必须全✓）。这些"必须串行/必须最新"的规则一旦模型不遵守就静默出错（用户拿到旧版/0 数据）。ClassIn 应尽量把这类约束**下沉到工具/编排层强制**（如 publish 自动取最新 resourceId、自检不过禁止 publish），而不是只写在 SKILL.md 里指望模型自律。
4. **身份信息存 `data` 是 PII 入库点。** 昵称/学号/班级直接进业务数据，ClassIn 涉及未成年人数据，需在存储契约层补合规（最小采集、匿名选项、留存期限、导出权限）——飞象这里只在文案层提了"匿名"选项，合规深度不足，不可照搬。
