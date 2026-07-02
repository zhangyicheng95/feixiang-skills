# math-design 子链路（html-authoring 内置）

> **仅当 html-authoring 判定为数学场景时启用。** 非数学学科**禁止**读取本目录任何文件，**禁止**在 HTML 中写入 `html-authoring:math-design` 注释。

## 文件导航

| 文件 | 用途 | 何时读取 |
|---|---|---|
| **workflow.md**（本文件） | 数学视觉工作流 + 布局/字号 | 数学场景**首先读取** |
| [color-palettes-a.md](color-palettes-a.md) | A-色彩01~11 活力高饱和 | Phase 3 选定 A 编号后，**仅读该编号段落** |
| [color-palettes-b.md](color-palettes-b.md) | B-色彩01~20 智性低饱和 | Phase 3 选定 B 编号后，**仅读该编号段落** |
| [visual-impact.md](visual-impact.md) | 图示视觉强化协议 | Phase 4 编写演示区前 |
| [manipulatives.md](manipulatives.md) | 标准数学教具样式：二维坐标轴等 | 页面包含平面直角坐标系/x-y 坐标轴/函数图像时，编写演示区前 |
| [grid-templates.md](grid-templates.md) | SVG/Canvas 网格、点阵、Three.js 地面网格模板 | 页面包含坐标网格/方格纸/点阵纸/几何画布/读点/拖拽吸附/3D 地面网格时，编写演示区前 |

## 色彩选用工作流（Color Selection）

```
Phase 1 ┃ 场景确认（已由 html-authoring 路由判定为数学）
Phase 2 ┃ 学段判定 → 选择 pool
  - 小学 1-6 年级 / 低段算术几何 → pool A（11 套）
  - 初中 7-9 / 高中 10-12 / 代数·函数·三角·数列 → pool B（20 套）
  - 年级未明示：按知识点难度推断；仍不确定 → 默认 pool B

Phase 3 ┃ 机械抽选 1 套（⚠️ 禁止主观挑选、禁止照搬示例编号、禁止跳号）

  **抽选池（完整覆盖，排序无关）：**
  - pool A → A-01 ~ A-11（11 套）
  - pool B → B-01 ~ B-20（20 套）
  - 所有编号同权参与抽选；A-01 居首、B-12 居中**仅是索引**，与命中概率无关
  - 严禁基于「示例用过 X」「A-01 / B-12 太常见」「某编号看着稳妥」等理由跳号

  **Step 1 — 提取 keyword**
  - keyword = 用户 prompt 中最核心的数学知识点词（如「勾股定理」「鸡兔同笼」「圆锥」）
  - 取最短能描述本课的词；无明显知识点 → prompt 前 4 字

  **Step 2 — 查 [knowledge-palette-map] 表（优先级 1，必查）**

  下表为 30 个常见知识点的预算定 palette。**Agent 必须先按 keyword 在表中精确匹配；命中即采用，禁止主观换号。** 表覆盖 A pool 8+ 套、B pool 13+ 套，已分散，A-01/B-12 与其它编号同权。

  | keyword | pool | palette_id | keyword | pool | palette_id |
  |---|---|---|---|---|---|
  | 鸡兔同笼 | A | A-06 | 勾股定理 | B | B-04 |
  | 表内乘法 | A | A-03 | 一次函数 | B | B-09 |
  | 圆的周长 | A | A-08 | 二次函数 | B | B-14 |
  | 长方体 | A | A-04 | 方程组 | B | B-07 |
  | 平行四边形 | A | A-09 | 等差数列 | B | B-11 |
  | 平均数 | A | A-02 | 阴影面积 | B | B-15 |
  | 植树问题 | A | A-07 | 数轴 | B | B-20 |
  | 相遇问题 | A | A-10 | 一元一次方程 | B | B-03 |
  | 圆锥 | A | A-05 | 因式分解 | B | B-17 |
  | 面动成体 | A | A-11 | 圆周角 | B | B-05 |
  | 概率（小学） | A | A-06 | 概率（初高中） | B | B-18 |
  | 单位进率 | A | A-04 | 绝对值 | B | B-12 |
  | 分数加减 | A | A-09 | 全等三角形 | B | B-06 |
  | 时分秒 | A | A-02 | 立体几何 | B | B-10 |
  | 平移旋转 | A | A-05 | 三角函数 | B | B-13 |
  | 表面积展开图 | A | A-01 | 数列求和 | B | B-08 |

  - **精确匹配命中即用**，禁止替换
  - 同义词归一：「长方体表面积」→「长方体」；「相遇」→「相遇问题」；不必拘泥完整原句

  **Step 3 — 算式兜底（仅当 Step 2 未命中时使用）**

  ```
  c1 = ord(keyword 第 1 字符)
  c2 = ord(keyword 末字符)
  hash = c1 × 7 + c2 × 5 + len(prompt)
  pool=A → palette_id = A-{(hash mod 11) + 1:02d}
  pool=B → palette_id = B-{(hash mod 20) + 1:02d}
  ```

  - 不会算 Unicode codepoint 时：选**与 keyword 最接近**的表中条目使用其 palette；严禁直接选 A-01 / B-12 / 任何"安全"编号

  **Step 4 — 声明输出（Phase 4 前必写）**

  必须在推理中显式输出**完整 4 项**，缺一即失败：
  ```
  抽选 ┃ keyword=<词>  pool=<A|B>  source=<table|hash>  palette_id=<X-XX>
  ```

  HTML 首行注释中的 palette **必须与本声明一致**。

  **修改已有 HTML 时**：保留原 palette_id，不重新抽选（除非用户明确要求换配色）。

Phase 4 ┃ 按需读取（禁止全量加载 31 套）
  - **必须使用 `call_skill` 返回的 `<skill-files>` 表中 CDN URL 原样 `read_url`**，禁止自行拼接路径
  - 附件路径可能为 `.../math-design/workflow.md` 或 `.../vN/workflow.md`（以 skill-files 表为准）
  - pool=A → 读取 color-palettes-a.md 中对应编号段落；pool=B → color-palettes-b.md
  - read visual-impact.md
  - 若页面绘制平面直角坐标系、x/y 坐标轴、函数图像或坐标平面中的点/线/图形 → read manipulatives.md，并使用其中的标准二维坐标轴组件
  - 若用户原文明确要求方格线、网格线、坐标网格、坐标纸、方格纸、点阵纸、几何画布、单位正方形拼图、拖拽吸附、借助方格/点阵读点，或页面是数学 3D 地面网格场景 → read grid-templates.md，并按本文件 §1.1 选择 SVG/Canvas/Three.js 分支
  - 用户只说“点坐标 / 读坐标 / 展示点位置 / 在坐标系中标点”不触发 grid-templates.md；这类默认只读 manipulatives.md 并保持无背景方格
  - 将选定色板的 hex **映射**为 CSS 变量：`--primary` `--secondary` `--accent` `--background` `--foreground`

Phase 5 ┃ 交付硬约束（**缺一即失败，禁止 terminate**）
  ① **palette 注释（最高优先级）**
     - `create_file` / `edit_file` 后，HTML **第一行**（`<!DOCTYPE html>` 之前）必须是：
       `<!-- html-authoring:math-design palette=<id> layout=<L1|L2|L3> -->`
     - 替换为 Phase 3 实际 palette_id 和 §2.2 实际 layout
     - 禁止写在 `<head>` 内代替首行；禁止省略
     - **未写入 → 必须 `edit_file` 补首行，然后才允许 terminate**
  ② 字号/按钮：H1=40px / font-weight:700 !important；按钮高 80px；按钮字号 28px
  ③ palette_id 与 Phase 3 输出一致（查表命中→精确匹配；hash 兜底→与算式结果一致）
  ④ Stage 主演示容器中心与 Stage 几何中心可视化对齐（§2.3）
  ⑤ 布局变体已落实并匹配算式（§2.2）：Agent 推理已声明 layout_hash 数字
  ⑥ **无下拉条**：HTML 中**不包含** `#controls` / `.controls` 的 `overflow-y:auto|scroll` 或 `overflow:auto|scroll`；`<body>` 只允许 `overflow:hidden`；唯一允许的滚动容器是 `#stage` 且仅在内容真超出时
  ⑦ Controls 控件块数 ≤ 5（L2/L3）或横向块 ≤ 6（L1），超量必须用 Tabs/Accordion 内部折叠
  ⑧ 标准坐标轴：只要页面绘制二维坐标轴，必须使用 manipulatives.md 的 `.standard-axis` 根 SVG；x/y 字母必须与轴线同属一个 SVG，放大/缩小时只缩放根 SVG 或外层 wrapper
  ⑨ 数学网格/点阵/单位方块拼图：只要用户明确需要借助网格/点阵读数、定位、对齐、吸附、坐标纸、几何画布，或要求“一个正方形对应一个格子/正方形拼成图形/周长面积数格子”，必须使用 grid-templates.md 的对应分支；CSS `background-image` / `linear-gradient` 只能作非测量装饰，不能与图形坐标分离
  ⑩ 数学 3D：3D 几何/体积/空间关系场景禁止页面平面 CSS 网格背景；必须在 3D 场景内放置标准地面网格对象
```

## 一、视觉硬性要求 (Visual Identity)

- 可视区域参考比例：16:7，优先一屏展示所有交互
- 内容超屏时：Step Navigation 或 Card Tab 切换；允许 Stage 区局部滚动
- 演示图示必须通过色彩填充保持视觉冲击力（遵循 visual-impact.md）
- 平面直角坐标系、x/y 坐标轴、函数图像坐标轴必须遵循 manipulatives.md 的标准二维坐标轴组件；标准轴色 `#251F20` 是本链路的固定教具色，不受 palette 替换
- 坐标网格/方格纸/点阵纸/几何画布/单位正方形拼图/3D 地面网格必须遵循 grid-templates.md；色板中的 CSS 背景网格只提供装饰色彩参数，不能替代数学图层
- 按钮统一高度：**80px**
- 页面采用 safe area 安全高度设计
- grid 仅用于模块，不用于锁死整体高度
- 禁止标题前 Emoji；具体元素用 SVG 绘制，配色符合选定色板

### 1.1 数学网格、点阵与 3D 地面网格分流

**只在数学场景需要空间参照时使用本节。** 先从用户原文声明 `grid_intent`，再写代码：

- `grid_intent=default_no_grid`：用户只说“平面直角坐标系 / 坐标系 / 坐标轴 / 坐标平面 / 点坐标 / 读坐标 / 函数图像 / 展示交点 / 图表轴线”等，没有明确要求方格、网格、参考线或方格纸。默认只画轴线、短刻度、刻度/轴标签、曲线/点/柱形/数据标签和必要语义辅助线，不画 Stage/SVG/Canvas 全幅背景方格，也不提供“显示/隐藏网格”入口。
- `grid_intent=explicit_coordinate_grid`：用户明确要求“方格线 / 网格线 / 坐标网格 / 坐标纸 / 方格纸 / 带网格坐标系 / 方便学生读点”等，并且对象是平面直角坐标系、函数图或坐标纸。必须生成横竖方向都有的 SVG/Canvas 网格层，且坐标轴、刻度、点、线、曲线共用同一 `origin/unit/scale`。
- `grid_intent=explicit_chart_reference`：统计图/图表中用户明确要求“参考线 / 辅助线 / 方便读数”，但没有要求坐标纸/坐标网格。可按读数需要绘制单向或双向参考线，但不得把统计图误做成完整坐标纸。
- `grid_intent=explicit_plane_grid_or_dot`：平面几何、拖拽几何、图形变换、方格纸、点阵纸、几何画布需要读点、定位、对齐或吸附。必须使用 grid-templates.md 的 SVG/Canvas 方格/点阵；所有点、顶点、线段、图形和吸附逻辑共用同一 `origin/unit/scale`。
- `grid_intent=explicit_unit_square_tiling`：小学面积/周长/数格子场景中，用户要求“一个正方形对应一个格子 / 正方形拼成图形 / 图形嵌入网格 / 四边贴合网格线”。只约束该拼图演示区：用唯一 `CELL` 和 `cells: [[col,row], ...]` 表达所有固定图形、随机图形和周长边；不把这个规则扩展到普通几何图、坐标轴或页面其它布局。
- `grid_intent=three_d_ground_grid`：数学 3D 几何、立体图形、体积/表面积、空间关系演示。页面背景保持纯色或色板背景，不使用 CSS 平面网格；3D 场景内必须放置标准地面网格对象，作为地面/底面参照。

**关键纪律：**

- “平面直角坐标系/坐标轴/函数图像”本身不是方格意图；默认无背景方格。修复默认方格失败时，删除网格和相关切换入口，保留轴线、短刻度、标签和数据图形，禁止通过加深网格颜色让默认方格通过。
- “点坐标/读坐标/展示点的位置/实时显示三点坐标”仍属于 `default_no_grid`；只有用户原文明确说“带方格线/坐标网格/坐标纸/方格纸/方便学生读点/借助方格读点”才进入显式方格分支。
- `default_no_grid` 分支禁止在源码/DOM 中出现 `grid-layer`、`.grid-line`、`renderGrid()`、`drawGrid()`、`createGrid*()`、`toggleGrid()`、`gridVisible` 或全幅横竖线循环。即使误读了 `grid-templates.md`，也不能生成网格层。
- 显式要求方格/点阵/参考线时不能过度删除；必须真实生成、肉眼可见，并与坐标轴/比例尺/拖拽吸附同源。平面坐标纸的原点必须是网格交点，x 轴落在一条水平网格线上，y 轴落在一条垂直网格线上，容差 ≤ 0.5px。
- 单位正方形拼图分支必须避免“第 1、2 个图形手写像素、第 3、4 个碰巧对齐”的多套几何。所有图形统一走 `SHAPES[].cells` 或等价数据；背景格、黄色方块、周长红线、拖拽吸附共享同一 `CELL`。允许 Canvas、SVG 或 CSS Grid 实现，但不能出现背景格距和方块尺寸各写一套的双轨绘制。
- CSS `background-image`、成对 `linear-gradient`、`repeating-linear-gradient`、CSS `background-size` 只能作为非测量性轻量视觉底纹。凡用户需要“读点、对齐、方格纸、坐标网格、几何画布、拖拽吸附”，必须升级为 SVG/Canvas 图层。
- SVG/Canvas 中使用 `grid-layer`、`axis-layer`、`data-layer`、`label-layer` 的分层顺序；网格/点阵在最下层，坐标轴和图形在上层，标签不被遮挡。
- 统计直方图、柱状图、折线图默认保留清晰坐标轴、刻度、分箱/数据标签和柱形/折线；本规则只限制默认全幅背景网格，不限制图表轴线本身。
- 色板里的“背景网格”只提供颜色、线宽、间距参考；当网格具有数学含义时，必须把这些参数转为 grid-templates.md 的 SVG/Canvas/Three.js 参数。
- `test_html` 必须按 `grid_intent` 分支写断言：默认无方格时断言没有 `grid-layer/.grid-line/renderGrid/drawGrid` 且轴线/数据存在；显式坐标方格时断言横竖网格均存在、可见、轴线落在网格线上；单位正方形拼图时断言所有方块边界与格线集合重合（误差 ≤1px）、所有图形使用同一 `CELL/cells` 数据、周长红线只来自外轮廓；数学 3D 时不能只检查 canvas，必须断言 `window.__math3d.hasGroundGrid === true`、`window.__math3d.ground`、`window.__math3d.grid`、`grid.material.opacity >= 0.55`、`ground.material.opacity <= 0.25`、`grid.position.y > ground.position.y`、`controls.enablePan === false`、`controls.maxPolarAngle < Math.PI / 2`、`Math.abs(camera.aspect - renderer/container 宽高比) <= 0.02`，且页面/renderer 没有 CSS 平面网格背景。
- `test_html` 最后一次结果必须通过后才能发布。若测试代码本身写错、选择器定位不到 iframe/srcdoc 内的真实页面、或出现 timeout，先修正测试或 HTML 并重跑；禁止带着最后一次失败的 `test_html` 调用 `publish_resource`。

## 二、布局硬性约束 (Visual & Layout Constraints)

### 2.1 基础公式
- **一屏优先级**：不产生全局滚动条为最高目标
- **基础公式**：Container(flex) = Header(fixed) + Body(flex-grow:1) + Controls(flex-shrink:0)
  - **Body** 至少包含 Stage（演示区）；Controls 的位置由「布局变体」决定
- **弹性字号保护**：H1 基准 **40px**（禁止 42px）；必要时 `clamp(30px, 5vh, 40px)`

### 2.2 布局变体（**三向必选 1 种，禁止默认底栏**）

| 变体 | 结构 | Controls 位置 | 适用场景 |
|---|---|---|---|
| **L1 底栏** | Header → Stage → Controls(bottom) | 底部 | 步骤导航、按钮 ≥3、以「上一步/下一步/重置」为主 |
| **L2 左栏** | Header → [Controls(left) ‖ Stage] | 左侧 | 滑块/参数调节为主、几何探索、左侧选择列表 |
| **L3 右栏** | Header → [Stage ‖ Controls(right)] | 右侧 | 演示主导、辅助参数面板、信息说明类 |

**选择算法（机械，必须在推理中输出 layout_hash 数字）：**
```
c1 = ord(keyword 第 1 字符)
layout_hash = (c1 + len(prompt)) mod 3
layout = ["L1底栏", "L2左栏", "L3右栏"][layout_hash]
```

**层级例外（极少使用，必须显式声明理由）：**
- 仅当算式命中 L1 但实际控件含 ≥ 3 个滑块/数值输入 → 在 L2 / L3 之间二选一（按 `(c1+1) mod 2` → 0=L2 / 1=L3）
- 其它情形**一律按算式**，禁止"为简洁/安全/熟悉"改为 L1

**Controls 尺寸约束：**
- L1：高度 ≤ 140px（按钮 80px + 上下 20px 边距 + 必要标签），横向 flex
- L2 / L3：宽度 ≤ 28% 视口宽，按钮高 **80px**，纵向 flex
- 三种变体均保留：按钮 80px、按钮字号 28px、按钮上方 20px 安全边距

**Controls 内容硬约束（**关键，防止下拉条**）：**
- **禁止** `#controls` / `.controls` 设置 `overflow-y: auto`、`overflow-y: scroll`、`overflow: auto` 或 `overflow: scroll`（一旦出现 → terminate 失败）
- L2 / L3 单栏控件数 **≤ 5 块**（一个滑块组、一个按钮组、一个公式卡、一个数值显示 = 4 块）
- 控件多 → 用 Tabs / Accordion 内部折叠；**不允许**靠滚动条解决
- 全局 `<body>` 仅允许 `overflow: hidden`；唯一允许内部滚动的容器是 `#stage`（也仅在内容真超出时）

### 2.3 Stage 居中硬约束（**所有变体通用**）

- **Stage 容器**必须设置：
  ```css
  #stage {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  ```
- **主演示元素**（SVG / Canvas / 几何容器 / 三维场景）必须：
  - 使用 `margin: auto` 或 flex 居中，**禁止**仅靠 `position:absolute; left:0; top:0`
  - 包围盒中心 = Stage 几何中心；坐标系/数轴的原点或对称轴必须对齐 Stage 中心
  - 容器 `max-width: 90%; max-height: 90%`，避免贴边
  - 尺寸按 Stage 实际可用区域约束（`getBoundingClientRect()` 或 CSS `max-width/max-height/aspect-ratio`），禁止只用 `overflow:hidden` 裁掉超出内容来假装适配
- 二维坐标轴必须作为单个 `.standard-axis` SVG 整体居中；x/y 字母不得脱离坐标轴单独定位
- **SVG viewBox**：普通 SVG 优先原点居中 (`viewBox="-W/2 -H/2 W H"`)，方便绕中心绘制；标准二维坐标轴必须按 manipulatives.md 固定为 `viewBox="0 0 308.0001 308.0001"`，不得改成中心原点 viewBox
- terminate 前自检：左右留白偏差 ≤ 15%、上下留白偏差 ≤ 15%

### 2.4 三向布局 CSS 骨架（**Agent 应直接套用**，避免落回 L1）

**L2 左栏（Controls 在左，Stage 在右）：**
```html
<main style="flex:1; display:flex; flex-direction:row; gap:20px; padding:20px;">
  <aside id="controls" style="width:26%; min-width:240px; display:flex; flex-direction:column; gap:16px;">
    <!-- 控件块 ≤ 5 个；禁止 overflow-y:auto -->
  </aside>
  <section id="stage" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
    <!-- 演示主体居中渲染 -->
  </section>
</main>
```

**L3 右栏（Stage 在左，Controls 在右）：**
```html
<main style="flex:1; display:flex; flex-direction:row; gap:20px; padding:20px;">
  <section id="stage" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;"></section>
  <aside id="controls" style="width:26%; min-width:240px; display:flex; flex-direction:column; gap:16px;"></aside>
</main>
```

**L1 底栏（Stage 上、Controls 下）：**
```html
<main style="flex:1; display:flex; flex-direction:column; gap:20px; padding:20px;">
  <section id="stage" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;"></section>
  <aside id="controls" style="height:120px; display:flex; flex-direction:row; align-items:center; gap:16px;"></aside>
</main>
```

**禁止**在以上任何 `aside#controls` 上加 `overflow-y:auto`；超量控件用 Tabs/Accordion 替代。

## 三、字号系统（Typography）

- H1 = **40px** / font-weight: 700 !important（禁止 42px 或其他值）
- H2 = 30px / font-weight: 600
- H3 = 28px / font-weight: 500
- Body = 28px / font-weight: 500
- Caption ≥ 22px / font-weight: 300
- 按钮字号 = 28px / font-weight: 500

## 四、与 html-authoring 通用规范的衔接

数学场景下，以下 html-authoring 通用规则**仍适用**：内容组织模式、交互粒度、事件绑定、媒体白名单、MathJax 3、技术约束、terminate 前需求落实度自检。

以下 html-authoring 通用规则**被本链路覆盖，禁止同时执行**：
- 「参考配色方案（5 个）」—— 数学必须用本目录 31 套色板
- 「根据学科选：数学-橙紫」—— 已由 pool A/B 替代
- 通用排版「标题为正文 1.5–2 倍」—— 改用第三节固定 px 字号
