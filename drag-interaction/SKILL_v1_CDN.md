---
name: drag-interaction
description: 在 HTML/课件中**实现、改造或修复**拖拽类交互（自由拖动、列表排序、拼图、连线、配对）时加载。提供 STOP 反问触发器、模板路由、必检清单、反模式表、修改/修复工作流与可复制模板，覆盖 PC 鼠标 + 移动端触摸双端。命中关键词：**新建/改造**"拖拽 / 拖动 / 排序 / 拼图 / 连线 / 配对 / drag / sortable / 移动元素 / 物体拖动 / 把 X 拖到 Y / 给现有页面加拖拽"；**修复/调试**"拖不动 / 拖了没反应 / 拖拽失效 / 拖拽不好使 / iOS/手机上拖不动 / 拖了元素就飞了 / 一拖就选中文字 / drag 不生效"。不适用于纯展示页面。
---

# drag-interaction

## 硬约束（违反任一即评测失败）

1. 写任何拖拽相关代码段（pointerdown / move / up / cancel / drop 判定 / 错误分支）前，**先 read 对应模板文件**，不要凭记忆/直觉写
2. 模板里标 🔒 的代码段**原样复制**，禁止简化、改名、内联到自己的函数；标 🔧 的可按业务改
3. 最终回复必须**附必检对照表**（见末尾「自检」节），逐条注明"实现在第 X 行" / "本场景不适用" / "降级为方案 Y"
4. 任何走"简化等价"的路径必须**显式声明**（写在代码注释 + 对照表里），不声明 = 反模式

## STOP（命中任一项立即反问/告知，不要硬上）

| 触发条件 | 必做动作 |
|---|---|
| **drop-match 场景但 drop 目标是明确 DOM 容器**（分类盘、归类筐、词性框等） | **强制走 `drop-into-container.md`（Sortable.js）**，禁止走手写 `drop-match.md`——后者 17 项必检 + 11 反模式的踩坑率远超库方案 |
| 需求含「惯性 / 捏合 / 双指缩放 / 旋转」 | 告知本 skill 不覆盖，推荐 `interact.js`，等用户确认后再决定继续/换库 |
| 需求含「无障碍 / 键盘可达 / 读屏 / a11y / 视障」 | 告知本 skill 不支持，建议改用"两步点击"备选交互（用两次普通 click 替代一次拖拽） |
| 需求含「跨 iframe / 跨页 PPT 拖拽」 | 告知 iframe 不支持拖拽穿透，改成"点击 A 标记 → 点击 B 完成"两步交互 |
| 用户要"改/调整/优化/修复"现有 HTML，或反馈"拖不动/拖拽不好使"等 bug | 走「修改/修复场景工作流」章节，**禁止**凭想象重写整页 |
| 修复场景：现有 HTML 是手写 drop-match 且场景属于"容器型分类" | 建议彻底改写成 Sortable.js 方案（30 行替代 150 行），而不是在反模式堆里继续打补丁 |

## 修改/修复场景工作流（STOP 第 4 条触发；新建场景直接跳到「模板路由」）

1. 确认目标 HTML 的 `resourceId`（用户未提供 → 反问"是哪个文件"，不要凭对话上下文猜）
2. `read_file` 拿到完整 HTML 内容
3. 按下列三步扫描，输出"诊断报告"：
   - 「反模式」表逐条扫描，列出踩了哪些
   - 「必检清单」按 [A] [B] [C] [全部] 标注对照（先识别属于哪个模板场景），列出缺了哪些
   - 全文 grep `pointer-events: none`，对每个命中位置画出"祖先链"，确认拖拽元素不在任何 `none` 链路下（必检 #13）
4. 用 `edit_file` 增量修复，**只动诊断报告里列出来的代码段**——禁止顺手改样式 / 重命名 / 重写整页
5. 修复后按「自检」走一遍

> 修复场景**不走模板路由**：已有 HTML 通常已经选了交互形式，不要让用户重新选模板。

## 模板路由（按需求关键词匹配，**只读一个**；仅用于新建场景）

| 需求关键词 | 判断信号 | 加载模板 |
|---|---|---|
| 自由拖动 / 力的合成 / 几何顶点 / 自由摆放 | 没有"目标区"，拖到任意坐标即可 | `templates/free-drag.md`（手写 Pointer Events） |
| 排序 / 步骤排序 / 时间线 / 按顺序拖 | 同类条目只改顺序，不增减 | `templates/sortable-list.md`（Sortable.js） |
| **分类 / 归类 / 词性匹配 / 拖到分类筐 / 拖到分类盘** | drop 目标是**几个明确的 DOM 容器**，命中规则可表达为"属性相等" | **`templates/drop-into-container.md`（Sortable.js group，90% drop-match 场景走这个）** |
| 拼图槽位 / 数轴刻度 / 连线 / 异形 zone（圆盘/SVG 形状） | drop 目标是**坐标点或非矩形区域**，无法用 DOM 容器表示 | `templates/drop-match.md`（手写 Pointer Events + elementFromPoint） |

> **核心判定**："drop 目标是不是一个明确的 DOM 容器？"
> - 是 → C-1（Sortable.js，30 行）
> - 否（坐标点/异形）→ C-2（手写，~150 行 + 17 项必检）
>
> 不确定时**默认推 C-1**，让用户确认场景再切换。

复合需求才读两个；都不匹配 → 见末尾「拓展场景的库选型」。

## 必检清单（行尾 `[A,C-2]` 等标注适用模板，是唯一真源）

> **模板代号说明**：A = free-drag（手写）；B = sortable-list（Sortable）；**C-1 = drop-into-container（Sortable group，新增）**；C-2 = drop-match（手写，坐标点/异形 zone）
> **C-1 走 Sortable.js**：必检 #1-#11、#13-#17 全部由库代劳，agent 只需关注 #12（Sortable 三件套）+ #13 边界检查

1. ✅ Pointer Events 单一入口（`pointerdown / pointermove / pointerup / pointercancel`），禁止 `mousedown` + `touchstart` 双绑 `[A, C-2]`
2. ✅ 拖拽容器 `touch-action`：A/C-2 用 `none`，B/C-1 让库代劳（**body 上不写 `touch-action: none`**，会让页面无法滚动） `[全部]`
3. ✅ 三件套：`user-select: none` + `-webkit-user-select: none` + `-webkit-touch-callout: none` `[全部]`
4. ✅ `pointerdown` 后调用 `el.setPointerCapture(e.pointerId)`——但 **C-2 严格顺序：先 `document.body.appendChild(el)` → 再 `setPointerCapture`**（顺序反了会触发 implicit release）。`setPointerCapture` 是「锦上添花」，**必检 #15 的 document 委托才是底线兜底**——不要让 capture 成为事件路由的唯一依赖 `[A, C-2]`
5. ✅ 坐标用 `e.clientX/Y - container.getBoundingClientRect().left/top`，禁用 `e.offsetX/Y` `[A, C-2]`
6. ✅ `pointerdown` 时记录 `offsetX/Y = clientX - element rect.left`，移动时减掉，避免元素瞬移到鼠标位置 `[A, C-2]`
7. ✅ 边界 clamp：`Math.max(0, Math.min(max, x))` `[A]`
8. ✅ drop 命中按目标形状选方法 `[C-2]`：
   - **矩形** drop zone（默认）→ `document.elementFromPoint(x, y).closest('.drop-zone')`
   - **圆形** drop zone（如 `border-radius: 50%` 的盘子、按钮）→ 几何距离：`Math.hypot(x - cx, y - cy) < r`
   - **多边形 / 异形** → SVG `path.isPointInFill()` / Canvas `ctx.isPointInPath()` / 自定义 ray casting
   - 禁止用 elementFromPoint 套圆形/异形元素：返回的是元素的**矩形 bounding box**，圆外四角会被判中
9. ✅ 当用 `elementFromPoint` 判定时，调用前临时把拖拽元素加 `pointer-events: none`，否则永远捞到自己（圆形/异形几何判定无需此步） `[C-2，仅 elementFromPoint 路径]`
10. ✅ 拖拽元素浮起时改 `position: fixed` 挂到 `document.body` `[C-2]`
11. ✅ 监听 `pointercancel` 做完整清理（释放 capture、复位 DOM、清 inline style）。模板 A 可与 `pointerup` 共用清理函数；C-2 应独立监听并走"直接复位"路径（不跑 FLIP 动画） `[A, C-2]`
12. ✅ Sortable.js 必须配「三件套」：`delay: 100-200` + `delayOnTouchOnly: true` + `touchStartThreshold: 5`，否则移动端 100% 误触发 `[B, C-1]`
13. ✅ `pointer-events: none` 的边界（除必检 #9 拖拽中临时使用外）`[全部]`：
    - **拖拽元素及其所有祖先**不得带 `pointer-events: none`——CSS spec 规定 `pointer-events: none` 让元素**及其后代**都不接收事件，**除非后代显式声明成 `auto` 等非 none 值**（默认值 `auto` 不算"显式"）。常见踩雷：装饰性容器（`.bank` / `.overlay` / `.guide-mask`）为了"不阻挡下层点击"加了 `pointer-events: none`，把里面装的拖拽元素一起失活 → "完全拖不动"
    - **drop zone 自身**（`.drop-zone` / `.slot` / `.plate` 等命中目标）也不得带 `pointer-events: none`——`elementFromPoint` 的 hit-test 会跳过 `pointer-events: none` 的元素，drop 命中永远捞不到 zone → "拖不进槽位 / 放在格子上没反应"
    - **浮起 class**（`.floating` / `.dragging`）不得**永久**带 `pointer-events: none`（含 #4 提到的 capture 失效坑）—— C-2 只在调 elementFromPoint 时用 inline 临时切换；C-1 走 Sortable 不涉及此问题
14. ✅ **异步回调（rAF / setTimeout / anime.complete）必须先抓局部引用** `[C-2]`：FLIP / 回弹动画的回调常在 `activeEl = null` 之后才执行，直接引用闭包 `activeEl` 会拿到 null → `null.style.xxx` 抛错被 catch 吞掉 → 视觉上元素卡在松手位 / 散落页面。在进入任何异步代码前必须 `const el = activeEl; const parent = originalParent; const next = originalNext;`，回调内只用 `el / parent / next`
15. ✅ **所有 `pointer*` 委托到 `document` 而非绑在元素上** `[A, C-2]`：`document.addEventListener('pointerdown' / 'pointermove' / 'pointerup' / 'pointercancel', ...)`。原因：① 拖拽元素被 `appendChild` 到 body 后，绑在原容器上的监听就丢了；② capture 偶发失效时，document 上的冒泡监听是唯一兜底；③ 新增/重生成可拖元素时不用重新绑监听
16. ✅ **`onPointerDown` 必须有"残留状态强制清理"守卫** `[A, C-2]`：开头判断 `if (draggedEl) forceResetActive()`——上一次拖拽如果异常未结束（pointerup/cancel 都没派发，工程上罕见但实测会触发），自动把残留浮起元素归位再开始新一次拖拽。不加守卫的代价：一次异常 = 用户必须刷新页面
17. ✅ **页面 ≥ 5 个待拖元素时，错误分支必须走「降级方案」** `[C-2]`：禁止用 `anime.js` / FLIP 等 ≥ 300ms 异步弹回。多元素并存 + 异步弹回 = 一次回调抛错全局卡死（详见 `templates/drop-match.md`「错误分支降级方案」节）。降级判断式同时满足以下任一即强制降级：① 待拖元素 ≥ 5；② 用户操作可能在弹回中连续拖另一张；③ 没有完整的 `try/catch` 兜底

> 模板 B 的 1, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17 由库代劳，agent 只需关注 #2 (`pan-y`)、#3 (三件套)、#12 (Sortable 三件套)
> **C-1（drop-into-container）的 1-11, 13-17 都由库代劳**，agent 只需关注 #3 (三件套)、#12 (Sortable 三件套)、#13 (祖先链 + zone 边界，CSS 自检即可)
> 这意味着：**C-1 场景 agent 的遵循成本从 17 项降到 3 项**——这是为什么 SKILL.md 强烈推荐容器型 drop-match 走 C-1

## 反模式（看到就 refactor，所有模板共用）

| 反模式 | 后果 | 正确做法 |
|---|---|---|
| `mousedown` + `touchstart` 双绑 | 触发顺序混乱、preventDefault 冲突 | `pointerdown` 单一入口 |
| `<div draggable="true">` + HTML5 drag API | iOS Safari 不支持触摸；ghost image 不可控 | Pointer Events 自己实现 / 用 Sortable.js |
| `el.style.left = e.offsetX + 'px'` | `offsetX` 在不同浏览器/target 含义不同 | `clientX - container rect.left` |
| `if (x > zone.x && x < zone.x + zone.w)` 套**矩形** drop zone | drop-zone 嵌套 / 父级 `transform` / 页面缩放时全错 | `elementFromPoint(x, y).closest('.drop-zone')`（圆形/异形 zone 用几何判定不算反模式，详见必检 #8）|
| **≥ 3 个**同类可拖元素各自 `addEventListener` | 写法冗长、新增元素要重绑、状态难集中 | 事件委托到容器，`e.target.closest('[data-drag]')` 识别 |
| 漏写 `pointercancel` | 来电中断后元素卡在拖拽态 | 监听 `pointercancel` 做完整清理（细则见必检 #11） |
| 拖拽元素留在原父级浮起 | 父级 `overflow: hidden` 裁切；父级 `transform` 坐标系全乱 | `position: fixed` 挂到 `document.body` |
| 漏写 `setPointerCapture` | 快速移动指针离开元素，move 丢事件 | `pointerdown` 立刻 `setPointerCapture(e.pointerId)` |
| 拖拽元素的**祖先**带 `pointer-events: none`（装饰容器 / 占位 bank / 蒙层） | pointerdown 直接穿透拖拽元素 → `e.target.closest('[data-drag]')` 永远 null → "完全拖不动" | 给拖拽元素加 `pointer-events: auto` 显式回收，或删掉祖先的 none（细则见必检 #13） |
| 错误分支一行 `el.style.position = 'static'; el.style.transform = 'none'` 归位 | 不还 originalParent（如果 fixed 时挪到 body 了）/ 不清宽高 inline → DOM 节点错位、布局塌缩；无动画体验生硬 | 错误分支必须二选一：① 原样复制模板 C 的 FLIP 段；② 显式降级为 `originalParent.insertBefore(el, originalNext) + resetFloatStyles(el)` 两行（无动画也合规，但要写注释声明） |
| `requestAnimationFrame` / `setTimeout` / `anime.complete` 回调里直接引用闭包 `activeEl` / `draggedEl` 等全局拖拽变量 | 回调触发时这些变量已被同步置 null（pointerup 末尾的 `activeEl = null`） → `null.style.xxx` 抛错被 catch 吞掉 → "FLIP 不弹回 / 拖错卡死 / 元素散落" | 进入异步前先 `const el = activeEl; const parent = originalParent; const next = originalNext;`，回调内只用 `el / parent / next`（细则见必检 #14） |
| drop zone CSS 写了 `pointer-events: none`（常见动机："让点击穿透到下层"） | `elementFromPoint` hit-test 跳过 zone → drop 判定永远不命中 → "拖到格子上没反应" | drop zone 必须保持默认 `pointer-events: auto`；如果确实要点击穿透，把拖拽元素的 z-index 调高于 zone 而不是关 zone 的 pointer-events（细则见必检 #13） |
| **浮起 class 上写 `pointer-events: none` 永久关**（`.floating { pointer-events: none }` / `.dragging { pointer-events: none }`） | iOS Safari / 部分 Chrome 版本对 `pointer-events: none` 元素的 `setPointerCapture` 行为未定义 → 快速拖动时 capture 偶发失效 → `pointerup` / `pointercancel` 都派发不出来 → cleanup 永不执行 → **全屏交互锁死，必须刷新页面**。实测飞象老师餐盘分类游戏踩中 | 浮起 class 不带 `pointer-events`；仅在 `elementFromPoint` 调用前用 inline style 临时切换：`el.style.pointerEvents = 'none'; const hit = elementFromPoint(...); el.style.pointerEvents = '';` |
| `setPointerCapture` 写在 `appendChild(document.body, el)` 之前 | 部分浏览器把"元素从原父级移除"识别为 implicit release pointer capture → 后续 `pointermove / pointerup` 全丢失 → "拖不动 + 卡死" | 严格顺序：① 设浮起 inline style → ② `document.body.appendChild(el)` → ③ `el.setPointerCapture(e.pointerId)` |
| 把 `pointermove / pointerup / pointercancel` 用 `el.addEventListener` **直接绑在拖拽元素自己上** | capture 偶发失效后，手指已离开元素 → 事件派发不到元素 → cleanup 永远不执行 → 一次失效就全局锁死 | 全部 `document.addEventListener('pointer...', ...)` 委托。pointer 事件天然冒泡到 document，**capture 是锦上添花，document 委托才是底线兜底** |
| `onWrong` / 错误分支用 `anime.js` / FLIP 等 ≥ 300ms 异步弹回，且页面 ≥ 5 个待拖元素 | 弹回期间全局拖拽变量被新一次拖拽覆盖；任一异步回调抛错（如 `parent.insertBefore` 命中 NotFoundError） → `floating` class 和 inline style 永远清不掉 → 那张卡永远浮起卡死 → 后续无法再拖 | ≥ 5 元素并存时**默认走降级方案**：错误分支同步直接归位 + CSS animation 抖动反馈（详见 `templates/drop-match.md` 「错误分支降级方案」节） |

## 输出约定

- 通过 `create_file` 工具交付，**禁止**把 HTML 源码贴在回复里
- 文件名以 `.html` 结尾
- HTML 完整可独立运行：`<!DOCTYPE html>` + `<head>` 含 `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- 拖拽 CSS 放 `<head>`，JS 放 `<body>` 末尾或 `DOMContentLoaded` 内
- 外部库统一用 CDN URL（系统自动转存为内部加速地址），禁止 base64 内联资源
- 修改已有 HTML：先 `read_file`，再 `edit_file` 增量改，禁止整页重写

## 拓展场景的库选型（命中上方 STOP 第 1/2 条时跳到这里查方案）

| 需求 | 推荐方案 |
|---|---|
| 触摸手势（捏合、旋转、长按） | Hammer.js（白名单内） |
| 自由拖拽 + 缩放 + 旋转 + 惯性 | interact.js |
| 跨列表拖拽（A 列表 → B 列表） | Sortable.js 的 `group` 配置 或 模板 C |

## PPT 子页（ppt_html iframe）特殊性

- 子页 `<body>` 同样需要 `touch-action: none`（壳框架默认开滚动手势，不覆盖移动端拖不动）
- 整页主体就是拖拽实验时优先用单页 HTML；ppt_html 子页只适合"页面里的一个拖拽小组件"
- 跨 iframe 拖拽见 STOP 表第 3 条

## 自检 + 对照报告（生成完成前必做；硬约束 #3）

**自检清单**（先自己 grep 一遍）：

- [ ] STOP 表逐条核过，未命中或已按要求反问/告知
- [ ] 已选定 1 个模板并读了对应 `templates/*.md`
- [ ] drop-match 场景已正确分流：drop 目标是 DOM 容器 → C-1（Sortable）；坐标点/异形 → C-2（手写）
- [ ] 「必检清单」按所选模板的 `[A]` `[B]` `[C-1]` `[C-2]` 标注对照（不在标注里的条款跳过）
- [ ] 「反模式」表**一条都没出现**在生成代码里

**C-1（Sortable group）专属 grep**：

- [ ] `Sortable.create` / `new Sortable` 出现 ≥ 2 次（源容器 + 目标容器 each）
- [ ] 源容器 group 配置：`pull: true, put: false`
- [ ] 目标容器 group 配置：`pull: false, put: (to, from, el) => 判定函数`
- [ ] 三件套：`delay: 100-200` + `delayOnTouchOnly: true` + `touchStartThreshold: 5`
- [ ] body 三件套 user-select / webkit-user-select / webkit-touch-callout
- [ ] body **没有** `touch-action: none`（C-1 不需要，会让页面无法滚动）
- [ ] 命中成功反馈在 `onAdd`，失败反馈在 `put` 内（自动弹回 + shake 视觉）
- [ ] 没有任何手写 pointerdown/move/up 干扰 Sortable

**C-2（手写 drop-match）专属 grep**：

- [ ] grep 生成的 HTML，关键字段都在：
  - `touch-action: none`（body）
  - `setPointerCapture`
  - `pointercancel`
  - `document.addEventListener.*pointer`（≥ 3 处委托）—— 必检 #15
- [ ] grep `pointer-events: none`，对每个命中位置确认：① 不在 `[data-drag]` 元素的祖先链；② 不在任何 drop zone 自身上；③ **不在浮起 class（`.floating` / `.dragging`）上永久使用**
- [ ] grep `requestAnimationFrame` / `setTimeout` / `\.complete`，异步回调里**禁止**直接出现 `activeEl` / `draggedEl`；必须用局部 `const el / parent / next` 中转（必检 #14）
- [ ] grep `setPointerCapture`，确认其所在函数中**前一行**是 `document.body.appendChild`（必检 #4 顺序）
- [ ] grep `pointerdown` 处理函数开头有 `if (draggedEl)` / `if (activeEl)` 形式的状态守卫（必检 #16）
- [ ] 待拖元素 ≥ 5 时，错误分支**不含** `anime(` / `requestAnimationFrame.*\.left` 等异步弹回，已走「直接归位」降级（必检 #17）

**A / B 模板专属**：参考各自 templates/*.md 末尾的「自检要点」

**通用**：

- [ ] 「输出约定」6 条全部满足

**对照报告**（必须附在最终回复里，是「我跑过自检」的对外证明）：

```
| 必检 # | 状态 | 实现位置 / 说明 |
|---|---|---|
| #1 Pointer Events 单一入口 | ✅ | L120-140，pointerdown/move/up/cancel 共用 endDrag |
| #2 touch-action | ✅ | L45 body { touch-action: none } |
| #4 setPointerCapture（顺序） | ✅ | L155 在 L154 `body.appendChild(el)` 之后调用 |
| ... | | |
| #11 pointercancel 独立监听 | ⚠️ 降级 | 本场景无 FLIP，cancel 与 up 共用直接复位（代码注释已声明） |
| #13 pointer-events 边界 | ✅ | grep `pointer-events: none` 全文 2 处：`.icon` 子元素 / inline 临时切换；无浮起 class 永久关 |
| #14 异步前抓局部引用 | ✅ | L182-185 `const el = activeEl; const parent = ...`；rAF/setTimeout 内只用 el |
| #15 document 委托 | ✅ | L100-103 四个 `document.addEventListener('pointer...', ...)` |
| #16 onPointerDown 状态守卫 | ✅ | L130 `if (draggedEl) forceResetActive()` |
| #17 ≥5 元素禁 FLIP | ⚠️ 降级 | 本页 6 张待拖卡片，错误分支已走同步直接归位 + CSS shake；代码注释已声明 |
```

- `✅` = 必须给**行号或函数名**（撒谎读 HTML 一眼穿帮）
- `❌` = 漏了 → 必须**重写**再交付，禁止以"漏了"状态提交
- `⚠️ 降级` = 显式降级（代码注释 + 表格**两处**都要写）
- `—` = 本场景不适用（要说明为什么，例：B 模板 #4 由 Sortable.js 代劳）

漏写对照表 = 视为没跑自检 = 评测失败。
