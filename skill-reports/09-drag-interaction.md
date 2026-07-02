# 09 · drag-interaction（拖拽交互）深度分析

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/drag-interaction/`
> 文件：`SKILL_v1_CDN.md`（= `v1/SKILL.md`，197 行）、`v1/drop-match.md`（489 行，= `v1/templates/drop-match.md` 逐字相同）、`v1/drop-into-container.md`（253 行，= `v1/templates/drop-into-container.md`）、`v1/templates/free-drag.md`（111 行）、`v1/templates/sortable-list.md`（143 行）。
> 性质：飞象老师生产级 skill，定位为"把拖拽交互写对、写不崩"的工程规约，而非答题/数据协议规范。

---

## 1. 设计思路

### 1.1 核心定位：把拖拽当成"高危工程"，用硬约束 + 模板复制压踩坑率

这个 skill 不是"教你怎么拖"，而是一套**防御性工程规约**。SKILL.md 开篇就是「硬约束（违反任一即评测失败）」四条（`SKILL.md` L8–13）：

1. 写任何拖拽代码段前**先 read 对应模板**，禁止凭记忆写；
2. 模板里标 🔒 的代码段**原样复制**，禁改名、禁内联；
3. 最终回复必须附**必检对照表**（逐条标行号 / 不适用 / 降级）；
4. 任何"简化等价"路径必须**显式声明**。

这是典型的"LLM 不可信，用流程把它锁死"的设计哲学——把人类工程师踩过的坑固化成可机检的清单，而不是寄望模型自己写对。

### 1.2 四模板路由 + STOP 反问，先分流再生成

`SKILL.md` 用「模板路由」表（L39–54）把所有拖拽需求收敛到 4 个模板：

| 代号 | 模板 | 实现方式 | 场景 |
|---|---|---|---|
| A | `free-drag.md` | 手写 Pointer Events | 自由拖到任意坐标（力的合成、几何顶点） |
| B | `sortable-list.md` | Sortable.js | 同类条目排序（步骤/时间线） |
| **C-1** | `drop-into-container.md` | Sortable.js `group` | **拖到 DOM 容器分类**（90% 配对场景） |
| C-2 | `drop-match.md` | 手写 Pointer Events + `elementFromPoint` | 坐标点 / 异形 zone（拼图槽位、数轴、圆盘、SVG 连线） |

核心判定一句话（L48–52）：**"drop 目标是不是一个明确的 DOM 容器？"** 是 → C-1（30 行库方案）；否 → C-2（~150 行手写 + 17 项必检）。不确定时**默认推 C-1**。

「STOP」表（L15–24）是前置的反问触发器：drop-match 但目标是 DOM 容器→强制走 C-1；惯性/捏合/旋转→换 `interact.js`；无障碍/键盘→改"两步点击"；跨 iframe→改"点 A 标记→点 B 完成"；改/修复现有 HTML→走「修改/修复工作流」而非重写。

### 1.3 "库优先"是贯穿全文的价值观

SKILL.md 反复强调：能用 Sortable.js 就别手写。理由量化得很清楚——C-1 让 agent 的遵循成本从 **17 项必检降到 3 项**（`SKILL.md` L86–88：C-1 的必检 #1-#11、#13-#17 全部由库代劳，agent 只关注 #3 三件套、#12 Sortable 三件套、#13 边界）。手写 C-2 才是"硬 case 专用"，并在模板顶部用 🚨 警告"误走本模板的代价：~150 行 + 17 项必检 + 11 反模式"（`drop-match.md` L12）。

---

## 2. 迭代路线（从坑里长出来的规约）

这个 skill 没有独立 CHANGELOG，但**必检清单与反模式表本身就是迭代史**——几乎每条都对应一次线上事故。从文本里能反推出的演进：

- **早期只有 A/B/C 三模板**：C 是手写 drop-match。后来发现"90% 的配对/分类场景其实 drop 目标就是 DOM 容器"，于是**新增 C-1（drop-into-container，Sortable group）**，把老的手写 C 降级为 C-2，并在 STOP 表第 1 条强制容器型分类走 C-1（`SKILL.md` L19）。代号里 "C-1（新增）"的措辞（L58）佐证这是后插入的。
- **必检 #14–#17 是后期补的"血泪条款"**，每条都点名了具体 badcase：
  - #14 异步回调先抓局部引用——FLIP/回弹回调在 `activeEl=null` 之后执行导致 `null.style` 抛错（`SKILL.md` L81）。
  - #16 `onPointerDown` 残留状态守卫——"一次异常 = 用户必须刷新页面"（L83）。
  - #17 ≥5 元素禁 FLIP 异步弹回——**实测点名"飞象老师餐盘分类游戏（6 张食物卡 + anime.js 弹回）"**触发 `parent.insertBefore` NotFoundError → 全局卡死（`drop-match.md` L336）。
- **反模式表里两条 iOS 锁死坑**直接写明"实测飞象老师餐盘分类游戏踩中"（`SKILL.md` L106 浮起 class 永久 `pointer-events:none` 导致 capture 失效全屏锁死）、以及 `setPointerCapture` 必须在 `appendChild(body)` 之后（L107，implicit release）。

可见迭代驱动力 = **真实课件线上崩溃**，而非功能扩展。skill 的进化方向是"把每个崩溃现场固化成一条可 grep 的必检 + 反模式"。

---

## 3. 功能边界

### 3.1 覆盖

- PC 鼠标 + 移动端触摸双端，统一走 **Pointer Events 单一入口**（禁 `mousedown`+`touchstart` 双绑，禁 HTML5 `draggable`）。
- 四类交互：自由摆放、列表排序、容器分类、坐标点/异形配对（含连线、圆形/SVG 异形 drop 判定）。
- drop 命中按形状分方法（`drop-match.md` L227–283）：矩形 `elementFromPoint`、圆形 `Math.hypot(dx,dy)<r`、异形 `isPointInFill`/`isPointInPath`/ray casting。
- PPT 子页（`ppt_html` iframe）特殊性：子页 `<body>` 也要 `touch-action:none`（`SKILL.md` L128–132）。

### 3.2 明确不覆盖（STOP 即停）

惯性/捏合/双指缩放/旋转（→`interact.js`）、无障碍/键盘可达/读屏（→两步点击）、跨 iframe/跨页 PPT 拖拽（→点击两步交互）。这些都在 STOP 表 + 「拓展场景的库选型」表（L120–126）里给了替代方案。

### 3.3 关键工程边界（必检里最硬的几条）

- `touch-action`：A/C-2 用 `none`，B/C-1 让库代劳，**body 上绝不写 `touch-action:none`**（会让页面无法滚动，`SKILL.md` L62）。
- 所有 `pointer*` 事件**委托到 `document`** 而非元素自身（必检 #15）——因为浮起后元素被 `appendChild` 到 body、且 `setPointerCapture` 在 iOS/部分 Chrome 偶发失效，document 委托是"底线兜底"（`drop-match.md` L400–416 给了"首选路径 / 兜底路径"双保险图示）。
- `pointer-events:none` 三处禁区（必检 #13）：拖拽元素祖先链、drop zone 自身、浮起 class 永久使用。

---

## 4. 工程启发（对 ClassIn 互动内容生成 + 数据回收）

### 4.1 直接可移植的"防崩规约"工程化

飞象把"踩坑→必检条款→生成后自检对照表"这条链路做得极其工业化。**对 ClassIn 互动内容生成**最值得抄的不是拖拽代码，而是这套**机制**：

- 把每个线上事故固化成一条**可 grep 的必检项**（如 `grep setPointerCapture` 确认前一行是 `appendChild`，`SKILL.md` L164）。
- 生成物必须**自带对照表**作为"我跑过自检"的对外证明（L174–196），漏写对照表 = 评测失败。这套"自证清白"模式可直接用于 ClassIn 互动件的质量门禁。
- "库优先 + 量化遵循成本"（17 项→3 项）的决策框架，能帮 ClassIn 在"自研组件 vs 引第三方库"时做同样的取舍。

### 4.2 ★ 数据采集判断：这是"作答数据断流"的典型源头

**结论：drag-interaction 当前形态对"结构化采集作答数据"极不友好，几乎是飞象"作答数据断流"分析的活体标本。** 证据：

1. **作答结果只落在 DOM/局部变量，从不向外发射。** C-1 命中成功只在 `onAdd` 里 `score++` + 加 `.locked` class（`drop-into-container.md` L119–128）；命中失败在 `put` 返回 false（库自动弹回，L101–108）。C-2 命中只是 `zone.classList.add('matched')` + `removeAttribute('data-drag')`（`drop-match.md` L146–154）。**全程没有 `postMessage` / `dispatchEvent` / 任何上报。** 全 skill 文本 grep 不到 `postMessage`、`window.parent`、`report`、作答事件协议。
2. **"配对成功即锁定"是用 DOM 副作用表达的，不是用数据状态。** 判定通关靠 `checkAllMatched()` 数 `.drop-zone.matched` 的数量（`drop-match.md` L459–467）——**进度/对错是 DOM 派生量，没有一份可序列化的 answer 状态对象**。一旦"可反悔重做"，skill 还专门警告要回退 zone 状态否则 `checkAllMatched` 会误判通关（L455），说明状态机本身是脆的、隐式的。
3. **输出约定明确"单文件 HTML、CDN 外链"**（`SKILL.md` L111–118），生成物是孤立沙盒页面，没有与壳框架的数据通道约定。

**对 ClassIn 数据闭环的启发（关键）：**

- **必须在模板层补一层"作答事件协议"**。建议在 C-1 的 `onAdd`/`onEnd`、C-2 的命中/未命中分支、A 的 `endDrag`、B 的 `onEnd` 这些**既有回调钩子**上，统一注入一个结构化上报：`{ itemId, targetId, correct, attemptNo, timestamp, finalState }`，通过 `postMessage` 发给壳。这些钩子已经存在且语义清晰，是天然的埋点位——飞象只是没把它们接出来。
- **把"隐式 DOM 状态"升级为"显式 answer 状态对象"**。`checkAllMatched` 不应数 class，而应维护一份 `answers[]`，既供判分也供上报，从根上消除"DOM 改了但状态没改"的断流。
- **沿用飞象的"对照表自检"思想做数据契约门禁**：生成互动件时强制附一张"数据上报对照表"（每个作答动作→是否发了事件→字段是否齐全），漏报即评测失败。这正是 drag-interaction 治拖拽 bug 的同款手法，迁移到治"数据断流"。
- **C-1（Sortable）比 C-2（手写）更适合做数据回收基座**：库统一管理 drop 生命周期，埋点只需挂 `onAdd`/`onRemove`/`onEnd` 三个回调，比手写 C-2 在 pointerup 分支里散插上报更稳、更难漏。ClassIn 若要标准化采集，应优先推容器型方案。

> 一句话：drag-interaction 把"交互怎么不崩"做到了生产级，但"作答数据怎么流出去"是一片空白——这正是 ClassIn 数据回收项目要补的那一层。
