---
name: data-collect
description: 当用户提出需要“数据回收、数据看板、查看数据”等功能需求时，调用本 skill。用于在页面/课件内容已基本打磨完成后，将纯前端交互资源升级为带后端数据存取的收集页和报告页；不用于仅需本地交互、静态展示、单人体验，或用户尚未确认需要数据回收的场景。
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
| **docId** | SDK 自动管理 | 参与者唯一 ID（同设备始终一致），作为单条记录主键 |
| **collection** | 你（AI）定义 | 集合名，小写英文，类似表名 |
| **data** | 你（AI）定义 | 任意 JSON 业务数据，参与者身份信息（昵称、学号等）也存这里 |

约定：

- 同一 `(instanceId, collection, docId)` 再次 save 是新增，**保留每一条数据记录，不要覆盖**
- 固定内容（题目、选项、规则）写死在 HTML 里
- 只有"参与者产生的动态数据"通过 SDK 存取

## 工作流程

```
理解需求 → ask_user            确认是否打磨完成，追问收集指标
         → create_instance         拿到 instanceId
         → create_file 生成 HTML × N    收集页/报告页（URL 参数读 instanceId）
         → bind_resources          注册资源角色
         → 联通性自检              输出字段对照表，全 ✓ 才能继续
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
4. create_file 生成 HTML_2（报告页，可选）（`role=report`）：数据统计 + 明细列表 + 刷新按钮，给发起者使用
     → 同上

5. bind_resources(
     instanceId,
     resources = [
       {"resourceId": xxx, "role": "collect", "name": "填写页"},
       {"resourceId": yyy, "role": "report",  "name": "报告页"}
     ]
   )

6. 向用户展示访问链接（使用 instanceId）
```

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
<script src="https://www.feixianglaoshi.biz/musk-collect/musk-collect.js?v=1.3.0"></script>
```

初始化：直接 `var sdk = new MuskCollect()`。SDK 内部会按以下顺序自动解析 instanceId，HTML 里**不需要手写读取逻辑**：
需要显式控制时也可手动传：`new MuskCollect('inst_xxx')`。

| 方法 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `new MuskCollect(instanceId?)` | `instanceId`: String（可选） | `MuskCollect` 实例 | 创建 SDK 实例。不传时自动从环境解析，仍无值才抛错 |
| `MuskCollect.getInstanceId()` | 无 | `String \| null` | 按上述四档优先级读取当前 instanceId，用于在 SDK 之外单独取值 |
| `sdk.save(collection, data)` | `collection`: String, `data`: Object | `Promise<Boolean>` | 存储数据，相同 docId 会覆盖更新 |
| `sdk.get(collection)` | `collection`: String | `Promise<CollectData>` | 获取当前用户在该集合下的数据 |
| `sdk.query(collection)` | `collection`: String | `Promise<Array<CollectData>>` | 查询该集合下所有参与者的数据 |

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

1. **docId 由 SDK 自动管理**，参与者身份信息（昵称、学号等）存 `data`
2. **身份表单文案贴合场景**，禁止出现技术术语
3. **报告视图展示身份从 `data` 取**，不展示 docId
4. **instanceId 不硬编码在 HTML 中**，由 `new MuskCollect()` / `MuskCollect.getInstanceId()` 自动解析
5. **不在 HTML 里硬编码假数据**：始终展示参与者真实数据，没有数据时显示空状态
6. **发送链接前必须输出"联通性自检对照表"**（见上文「联通性自检」章节），全部 ✓ 才能发链接；任一行 ✗ 必须先用 `edit_file` 修复后重做自检
7. **生成完成后，必须向用户输出访问链接，每个链接带上 `instanceId`**


## 页面生成

推荐按角色生成**独立的多个 HTML**，各自承担不同职责：

- **收集页**（`role=collect`）：身份收集 + 业务交互 + 提交反馈，给参与者使用
- **报告页**（`role=report`）：数据统计 + 明细列表 + 刷新按钮，给发起者使用

所有页面使用同一个 `instanceId` 共享数据。生成完毕后调用 `bind_resources` 一次性注册资源角色。

如果场景简单（如签到），也可合并为单 HTML，通过 URL 参数 `?view=report` 切换视图。

## 对话结束

**生成完成后，必须向用户输出访问链接，每个链接带上 `instanceId`**：

```
访问链接：
- [填写页]：HTML链接?instanceId=inst_xxx
  用途：发给参与者填写，支持手机/平板/电脑。
- [报告页]：HTML链接?instanceId=inst_xxx
  用途：发起者查看汇总数据，数据实时更新。
```
