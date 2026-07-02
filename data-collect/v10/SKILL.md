---
name: data-collect
description: 当用户提出需要“数据回收/数据看板”等功能时，调用本 skill。用于在页面/课件内容已基本打磨完成后，将纯前端交互资源升级为带后端数据存取的收集页和报告页；不用于仅需本地交互、静态展示、单人体验，或用户尚未确认需要数据回收的场景。
---

# 数据收集应用生成
生成（改造为）带后端数据存取的交互式 HTML。框架只负责数据存取，业务逻辑由前端代码实现。
- 改造原有的课件页html（收集页），将数据发送到指定地址
- 新生成数据看板页html（报告页），从指定地址获取数据
- 实现收集页和报告页的双向数据绑定

## 何时触发

当用户用户意图涉及以下任一场景：
- 需要**收集**多人提交的数据（问卷、报名、签到、投票）
- 需要**答题/测验**并记录成绩
- 需要**统计/汇总**多人数据并展示报告
- 需要**互评/排行榜**等跨用户数据共享
- 需要**多人参与的游戏**并保存状态

**不触发**：纯前端动画/演示、单人本地游戏、无需持久化的静态展示。

## 数据模型

| 概念 | 谁管 | 说明 |
|---|---|---|
| **instanceId** | `create_instance` 返回 | 一次数据收集活动的数据空间标识，所有参与者共享同一个 instanceId |
| **docId** | SDK 自动生成 | 单条记录主键，每次 `save` 都会生成全新 UUID（不持久化、不可作身份标识） |
| **collection** | 你（AI）定义 | 集合名，小写英文，类似表名 |
| **data** | 你（AI）定义 | 任意 JSON 业务数据，参与者身份信息（昵称、学号等）也存这里 |

约定：

- 每次 `sdk.save()` 都会**新增一条记录**（docId 总是新 UUID，不会覆盖任何历史数据）
- 同一参与者多次提交 = 多条记录；如需"同人最新一条"语义，请在 `data` 里自带稳定身份字段（昵称/学号/手机号等），由报告页用 `query` 自行去重
- 固定内容（题目、选项、规则）写死在 HTML 里
- 只有"参与者产生的动态数据"通过 SDK 存取

## 工作流程

```
理解需求 → ask_user                确认是否打磨完成，追问收集指标
         → 结构风险判断              先判断是否命中「高风险页面结构的特殊分支」
         → create_instance          拿到 instanceId
         → create_file 生成 HTML × N   收集页/报告页（URL 参数读 instanceId）
         → 联通性自检                输出字段对照表，全 ✓ 才能继续
                                  （任一 ✗ → edit_file 修复，注意拿最新 resourceId → 重做自检）
         → publish_resource × N       逐个发布每个最终交付页（用最新 resourceId）
         → bind_resources            用最新 resourceId 一次性注册资源角色
         → 向用户展示带 ?instanceId=xxx 的访问链接
```

## 工具调用顺序

```
1. ask_user（仅第一次确认，不要重复调用）
     → 多选题：明确“是否需要收集学生身份信息”，提供选项：姓名、学号、班级、匿名等
     → 多选题：明确“数据结构”，确认用户所需要的所有数据指标
     → 多选题：明确“是否需要数据导出功能”，并确认用户需要的导出格式：csv、xls、json

2. create_instance()
     → 返回 { instanceId: "inst_xxx" }

3. create_file 生成 HTML_1（收集页）（`role=collect`）：身份收集 + 业务交互 + 提交反馈，给参与者使用
     → 内部从 URL 参数读 instanceId，使用 new MuskCollect(instanceId) 读写
     → 生成前必须先完成结构风险判断；命中高风险结构时，按「高风险页面结构的特殊分支」生成单页收集应用
     → 在 observation 里**记下返回的 resourceId**，后续 publish/bind 都要用它
4. create_file 生成 HTML_2（报告页，可选）（`role=report`）：数据统计 + 明细列表 + 刷新按钮，给发起者使用
     → 同上

5. 联通性自检（必须执行，详见下文「联通性自检」章节）
     → 列出收集页表单写入的数据项
     → 列出报告页展示读取的数据项
     → 输出对照表，对比一致性
     → 任一行 ✗：调用 `edit_file` 修复后重做自检
           修复完成后必须把"当前最新版的 resourceId"刷新到记忆里，
           后面 publish / bind 用的都必须是这个最新值，否则用户拿到的是改前的旧版。
     → 全部 ✓：进入下一步

6. publish_resource（逐个发布每个最终交付页）
     → 对**每一个**最终需要交付给用户的页面单独调用一次 publish_resource(resourceId=最新值)
     → ⚠️ 绝对禁止把 `publish_resource` 和 `create_file` / `edit_file` 放在**同一轮** tool_calls 里并行调用：
           同轮并行时 publish 跑得早，根本拿不到本轮 create/edit 即将返回的 resourceId。
           正确做法是 create/edit 完成、自检通过后，**单独起一轮**调用 publish_resource。
     → 多个 publish_resource 之间没有依赖，可以放在同一轮里并行
     → 只有 publish 过的 resource 才是"用户可见"的成品；bind_resources **不能**替代 publish

7. bind_resources(
     instanceId,
     resources = [
       {"resourceId": 收集页最新 resourceId, "role": "collect", "name": "填写页"},
       {"resourceId": 报告页最新 resourceId, "role": "report",  "name": "报告页"}
     ]
   )
     → resourceId 必须是**已经 publish 过**、**最新一次** create/edit 返回的那个

8. 向用户展示访问链接（使用 instanceId）
```

## 联通性自检（create_file/edit_file 完成后、publish_resource 之前必做）

为防止"参与者填了数据但看板不更新"的常见 bug（根因是收集页与报告页的数据通道不一致），所有 `create_file` / `edit_file` 完成后，必须按以下格式输出**数据通道一致性对照表**，全部 ✓ 才能进入 `publish_resource` → `bind_resources`。

> 自检是对**当前最新代码**的静态对比，不依赖 instance 绑定；先在脑里把两端集合名 / 字段名对齐再发布，避免把已经发布给用户的成品再回炉。

### 数据字段一致性

对比"收集页表单写入的字段"与"报告页展示用到的字段"：

| 字段（业务含义） | 收集页是否写入 | 报告页是否展示 | 是否一致 |
|---|---|---|---|
| 姓名 | ✓ | ✓ | ✓ |
| 分数 | ✓ | ✓ | ✓ |
| 年龄 | ✗ | ✓ | ✗ |  ← 不一致示例

### 处理规则

- **任一行 ✗** → 调用 `edit_file` 修复（让两端的集合 / 字段对齐），修复后**重新输出对照表**，直至全 ✓
  - ⚠️ `edit_file` 每次返回**新的 resourceId**，修复完成后必须在记忆里把"当前最新版的 resourceId"更新掉
- **全部 ✓** → 才能进入 `publish_resource` → `bind_resources` → 发送访问链接

【硬约束】未输出此对照表 / 表格仍有 ✗ 时直接进入 `publish_resource` 或发送链接 = 违反 skill 规则。

## HTML 中的 instanceId 处理

**不要硬编码 instanceId，也不要自己写读取逻辑**。SDK 已经内置了 `MuskCollect.getInstanceId()`，会按"当前 URL → `window.__MUSK_INSTANCE_ID__` → `<meta name="musk-instance-id">` → 顶层窗口 URL"的顺序自动解析，覆盖各种 iframe / 直链打开场景。

读写数据时直接 `new MuskCollect()` 即可，构造器内部已经会调用 `getInstanceId()`：

```javascript
var sdk = new MuskCollect();
sdk.query('submissions').then(function (list) { render(list); });
```

只在需要"先判断有没有 instanceId 再决定页面渲染"的极少数场景，才单独调用静态方法：

```javascript
if (MuskCollect.getInstanceId()) {
  var sdk = new MuskCollect();
  sdk.query('submissions').then(function (list) { render(list); });
} else {
  // 极少数页面被直接打开而未带参的兜底场景
  render([]);
}
```

**严格边界**：

- 有 `instanceId` 时只展示后端返回的数据，即使为空也只显示"暂无数据"或数值 0
- **不要在 HTML 里硬编码假数据**：始终展示参与者真实数据，没有数据时显示空状态

## MuskCollect SDK

SDK 地址（必须引用，不能编造）：

```html
<script src="https://www.feixianglaoshi.com/musk-collect/musk-collect.js?v=1.3.0"></script>
```

初始化：直接 `var sdk = new MuskCollect()`。SDK 内部会按以下顺序自动解析 instanceId，HTML 里**不需要手写读取逻辑**：
需要显式控制时也可手动传：`new MuskCollect('inst_xxx')`。

| 方法 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `new MuskCollect(instanceId?)` | `instanceId`: String（可选） | `MuskCollect` 实例 | 创建 SDK 实例。不传时自动从环境解析，仍无值才抛错 |
| `MuskCollect.getInstanceId()` | 无 | `String \| null` | 按上述四档优先级读取当前 instanceId，用于在 SDK 之外单独取值 |
| `sdk.save(collection, data)` | `collection`: String, `data`: Object | `Promise<Boolean>` | 新增一条记录，每次都生成新 docId（不会覆盖任何历史记录） |
| `sdk.query(collection)` | `collection`: String | `Promise<Array<CollectData>>` | 查询该集合下所有参与者的全部记录 |

> ⚠️ **没有"获取当前用户数据"的方法**：docId 每次提交都是新的，不可作身份标识。要展示"我的数据"，请在 `data` 里自带稳定身份字段（昵称/学号/手机号等），由收集页本地暂存或在报告页 `query` 后自行筛选。

**CollectData 结构：**

```json
{
  "collection": "submissions",
  "docId": "inst_xxx-a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "data": { ... }, 
  "createdAt": 1713350400000,
  "updatedAt": 1713350400000
}
```
> data数据中不能包含base64相关的任何超大字符串的信息

> ⚠️ **`createdAt` / `updatedAt` 是字符串类型的毫秒时间戳**，格式化时必须先用 `Number()` 转换，否则 `new Date("1713350400000")` 会返回 Invalid Date，展示在页面上的时间应该是yyyy-MM-dd HH:mm:ss格式：
> ```javascript
> // 正确
> var date = new Date(Number(item.createdAt));
> // 错误
> var date = new Date(item.createdAt); // Invalid Date
> `

## 核心规则

1. **docId 由 SDK 每次 `save` 自动生成全新 UUID**，不能用作"同一参与者"的标识；参与者身份信息（昵称、学号等）必须存 `data`
2. **身份表单文案贴合场景**，禁止出现技术术语
3. **报告视图展示身份从 `data` 取**，不展示 docId
4. **instanceId 不硬编码在 HTML 中**，由 `new MuskCollect()` / `MuskCollect.getInstanceId()` 自动解析
5. **不在 HTML 里硬编码假数据**：始终展示参与者真实数据，没有数据时显示空状态
6. **生成收集页前必须先判断原始 HTML 是否命中「高风险页面结构的特殊分支」**；命中时必须走该分支，不能直接原地改造
7. **联通性自检对照表必须在 `publish_resource` 之前输出**（见上文「联通性自检」章节）：全部 ✓ 才能进入 `publish_resource` → `bind_resources` → 发链接；任一行 ✗ 必须先用 `edit_file` 修复后重做自检
8. **`edit_file` 每次返回新的 resourceId**（旧 resource 作为历史保留）：自检失败修复后，后续 `publish_resource` / `bind_resources` **必须**使用 `edit_file` 这一轮 observation 返回的**最新** resourceId，绝不能沿用最初 `create_file` 的旧 id
9. **`publish_resource` 是用户可见性的唯一入口**：`bind_resources` 只负责"页面 ↔ instance 数据回传通道"，**不能**让用户在前端看到成品卡片。所有最终交付页（收集页、报告页等）都必须各自调用一次 `publish_resource`，未 publish 的 resource 的 internal_url 绝不贴给用户
10. **`publish_resource` 绝不能与 `create_file` / `edit_file` 同轮 tool_calls 并行调用**：tool_calls 并行执行，publish 跑得早就拿不到本轮 create/edit 即将返回的 resourceId。必须 create/edit 那一轮完成、observation 里看到 resourceId 之后，**下一轮**再单独发 `publish_resource`
11. **生成完成后，必须向用户输出访问链接，每个链接必须带上 `instanceId`**；前置条件：所有最终交付 resource 都已 `publish_resource` 且已 `bind_resources`


## 页面生成

推荐按角色生成**独立的多个 HTML**，各自承担不同职责：

- **收集页**（`role=collect`）：身份收集 + 业务交互 + 提交反馈，给参与者使用
- **报告页**（`role=report`）：数据统计 + 明细列表 + 刷新按钮，给发起者使用

所有页面使用同一个 `instanceId` 共享数据。生成 + 自检通过后，先逐个 `publish_resource`（让用户能在前端看到成品卡片），再 `bind_resources` 一次性注册资源角色（建立数据回传通道）。

### 高风险页面结构的特殊分支

**生成收集页前必须先做此判断。** 当原始 HTML 存在可能导致数据状态隔离或丢失的结构时，禁止直接原地改造，应先重构为单页收集应用，再生成报告页。典型特征包括：

- 多个独立页面/片段运行上下文：如 `<template class="page-data">`、`<template class="page-shared">`、多 iframe、`srcdoc`、嵌套 iframe、动态插入页面片段等
- 依赖父子窗口通信或页面状态协议：如 `postMessage`、`saveState`、`restoreState`
- 身份信息、答题状态、提交逻辑分散在多个 iframe/页面/组件上下文里，翻页或切换后可能重新初始化

**只要命中上述特征之一，就默认走本分支。** 除非用户明确要求保留原结构，否则不要继续沿用原页面的多上下文/父子通信方案。

1. 识别原始 HTML 中真正需要回收数据的互动内容（答题、投票、填空、拖拽、闯关、表单等），无互动的讲解/封面/过渡页只提炼必要背景，不完整搬运。
2. **将互动内容重构为普通单页 HTML 收集页**：只保留一个身份入口、一个全局业务状态、一个连续交互流程**；不要输出 `page-data` / `page-shared` / 多 iframe 结构。
3. 收集页必须提交**完整结果对象**；如需多次提交，数据里必须包含稳定身份字段或本次作答标识，报告页自行去重/分组。
4. 报告页只按收集页实际写入的 collection 和字段读取展示，并通过「联通性自检」确认一致。

## 对话结束

**前置条件**：所有最终交付 resource 都已 `publish_resource`、且已 `bind_resources`、且「联通性自检」全 ✓。满足后才能向用户输出访问链接，**每个链接带上 `instanceId`**：

```
访问链接：
- [填写页]：HTML链接?instanceId=inst_xxx
  用途：发给参与者填写，支持手机/平板/电脑。
- [报告页]：HTML链接?instanceId=inst_xxx
  用途：发起者查看汇总数据，数据实时更新。
```

> 链接里使用的 HTML 地址必须来自**最新一次** `create_file` / `edit_file` 返回的、并且已经 `publish_resource` 过的 resource；绝不要把未 publish 的 internal_url 贴给用户。
