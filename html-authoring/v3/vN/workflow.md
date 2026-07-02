# math-design 子链路（html-authoring 内置）

> **仅当 html-authoring 判定为数学场景时启用。** 非数学学科**禁止**读取本目录任何文件，**禁止**在 HTML 中写入 `html-authoring:math-design` 注释。

## 文件导航

| 文件 | 用途 | 何时读取 |
|---|---|---|
| **workflow.md**（本文件） | 数学视觉工作流 + 布局/字号 | 数学场景**首先读取** |
| [color-palettes-a.md](color-palettes-a.md) | A-色彩01~11 活力高饱和 | Phase 3 选定 A 编号后，**仅读该编号段落** |
| [color-palettes-b.md](color-palettes-b.md) | B-色彩01~20 智性低饱和 | Phase 3 选定 B 编号后，**仅读该编号段落** |
| [visual-impact.md](visual-impact.md) | 图示视觉强化协议 | Phase 4 编写演示区前 |

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
```

## 一、视觉硬性要求 (Visual Identity)

- 可视区域参考比例：16:7，优先一屏展示所有交互
- 内容超屏时：Step Navigation 或 Card Tab 切换；允许 Stage 区局部滚动
- 演示图示必须通过色彩填充保持视觉冲击力（遵循 visual-impact.md）
- 按钮统一高度：**80px**
- 页面采用 safe area 安全高度设计
- grid 仅用于模块，不用于锁死整体高度
- 禁止标题前 Emoji；具体元素用 SVG 绘制，配色符合选定色板

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
- **SVG viewBox**：原点居中 (`viewBox="-W/2 -H/2 W H"`)，方便绕中心绘制
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
