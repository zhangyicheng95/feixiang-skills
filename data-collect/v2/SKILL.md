---
name: data-collect
description: 当用户需要生成 **多人参与、数据持久化** 的交互式 HTML 时使用。典型场景：收集信息、答题测验、投票、签到、问卷调查、互评打分、多人游戏、排行榜、统计报告。不适用于：纯前端演示、无需保存数据的静态页面。
---

# 数据收集应用生成

生成带后端数据存取的交互式 HTML。框架只负责数据存取，业务逻辑由前端代码实现。

## 何时触发

用户意图涉及以下任一场景：

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

- 同一 `(instanceId, collection, docId)` 再次 save 是覆盖更新，不是新增
- 固定内容（题目、选项、规则）写死在 HTML 里
- 只有"参与者产生的动态数据"通过 SDK 存取

## 工作流程

```
理解需求 → 追问收集指标（不清楚时用 continue_ask）
         → create_instance         拿到 instanceId
         → create_file 生成 HTML × N    收集页/报告页（URL 参数读 instanceId）
         → bind_resources          带上 mockSeeds 演示数据
         → 向用户展示带 ?instanceId=xxx 的访问链接
```

## 工具调用顺序

```
1. create_instance()
     → 返回 { instanceId: "inst_xxx" }

2. create_file 生成 HTML_1（收集页）
     → 内部从 URL 参数读 instanceId，使用 new MuskCollect(instanceId) 读写
3. create_file 生成 HTML_2（报告页，可选）
     → 同上

4. bind_resources(
     instanceId,
     resources = [
       {"resourceId": xxx, "role": "collect", "name": "填写页"},
       {"resourceId": yyy, "role": "report",  "name": "报告页"}
     ],
     mockSeeds = [
       {
         "collection": "submissions",
         "records": [
           {"docId": "seed_1", "data": {"name": "张三", "score": 85}},
           {"docId": "seed_2", "data": {"name": "李四", "score": 92}},
           {"docId": "seed_3", "data": {"name": "王五", "score": 78}}
         ]
       }
     ]
   )

5. 向用户展示访问链接（使用 instanceId）
```

## mockSeeds 是什么

`bind_resources` 里的 `mockSeeds` 是一份**演示数据**。用途：让用户在还没有真实参与者填写时，也能看到页面有数据的完整效果（比如填表数、平均分这种统计数字、报告页的图表样例）。

什么时候必须提供：

- **首次绑定**：必须提供
- **改了 HTML 里 save/query 用到的字段结构**：必须重新提供，让演示数据和新结构对齐

什么时候可以省略：

- 仅调整样式、文案、布局，没改字段结构 → 不传或传空串即可，后端会复用上次提供的演示数据

要求：

- 编 3~5 条贴合业务场景的示例记录
- `docId` 用 `seed_1` / `seed_2` / `seed_3` 这种稳定主键，便于二次绑定时正确覆盖

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
- **不要在 HTML 里硬编码假数据**：演示效果由 `mockSeeds` 在后端预置完成，前端代码不维护

## MuskCollect SDK

SDK 地址（必须引用，不能编造）：

```html
<script src="https://www.feixianglaoshi.com/musk-collect/musk-collect.js?v=1.2.0"></script>
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

## 核心规则

1. **docId 由 SDK 自动管理**，参与者身份信息（昵称、学号等）存 `data`
2. **身份表单文案贴合场景**，禁止出现技术术语
3. **报告视图展示身份从 `data` 取**，不展示 docId
4. **instanceId 不硬编码在 HTML 中**，由 `new MuskCollect()` / `MuskCollect.getInstanceId()` 自动解析
5. **不在 HTML 里硬编码 mock 数据**：演示数据由 `bind_resources` 的 `mockSeeds` 预置
6. **bind_resources 时必须给 mockSeeds 编 3~5 条贴合场景的演示记录**
7. **改样式不需要重传 mockSeeds**，改字段结构必须重传

## 页面生成

推荐按角色生成**独立的多个 HTML**，各自承担不同职责：

- **收集页**（`role=collect`）：身份收集 + 业务交互 + 提交反馈，给参与者使用
- **报告页**（`role=report`）：数据统计 + 明细列表 + 刷新按钮，给发起者使用

所有页面使用同一个 `instanceId` 共享数据。生成完毕后调用 `bind_resources` 一次性写入资源信息和演示数据。

如果场景简单（如签到），也可合并为单 HTML，通过 URL 参数 `?view=report` 切换视图。

## 对话结束

生成完成后，向用户展示访问链接，每个链接带上 `instanceId`：

```
访问链接：
- [填写页]：HTML链接?instanceId=inst_xxx
  用途：发给参与者填写，支持手机/平板/电脑。
- [报告页]：HTML链接?instanceId=inst_xxx
  用途：发起者查看汇总数据，数据实时更新。
```
