---
name: physics-formula-typography
description: 物理课件公式与物理量排版规范技能。生成或修复初中/高中物理互动课件、教学动画、公式演示、实验模拟 HTML 时启用，尤其是画面中出现物理量字母、单位、公式、速度/动量/密度/电学量、动态读数、Canvas/SVG 标注时。硬约束：使用指定 MathJax3 CDN；有物理语义的可见公式/物理量/单位进入 MathJax；物理量斜体，单位正体；vm/vM/v0 等自然写法必须语义归一为 v_{m}/v_{M}/v_{0}；禁止 $...$、Unicode 上下标、<sub>/<sup>、Canvas fillText 公式；动态 DOM 更新后必须 MathJax.typesetPromise。边界：不要把普通 UI 文案、选项编号、英文缩写、CSS/JS 标识符强行 MathJax 化。输出前必须按 self-check-schema.json 自检。
---

# 物理课件公式与字体规范技能

> 版本 1.4.0 | 2026-06-09
> 上游：老师输入、上传的物理 HTML/课件、历史坏产物
> 下游：符合 MathJax3 渲染和物理排版规范的 HTML + `formula_typography_self_check`

## 一、本技能解决什么问题

物理互动课件常见卡点不是“有没有公式”，而是画面中公式与物理量字母没有被统一排版：

1. `vm`、`vM`、`v0` 等被当作普通文本或两个字母连写，而不是 `v_{m}`、`v_{M}`、`v_{0}`。
2. 物理量、单位、角标混用纯文本、Unicode 上下标、`<sub>/<sup>`、Canvas `fillText`，导致字体不规范。
3. 初始页面公式能渲染，但点击“开始”、拖动滑块、分步讲解、动画帧更新后又出现裸字母或裸单位。
4. 源码混用 `$...$`、Unicode `²/₀/×/·`、手写 HTML 角标，MathJax3 不稳定或无法统一渲染。

本技能把教研文字规范转成可执行工作流：**物理语义盘点 -> MathJax3 代码约束 -> 动态更新约束 -> 交互后自检 -> 不过即补丁修复**。

同时，本技能不是“把页面上所有英文字母都公式化”的通用字体技能。它只接管有明确物理/数学语义的内容，避免过度约束影响 UI 可读性和生成稳定性。

## 二、文件导航

| 文件 | 用途 | 何时读取 |
|---|---|---|
| `SKILL.md` | 总原则、工作流、验收标准 | 首先读取 |
| `code-patterns.md` | MathJax3 配置、动态更新 helper、DOM/SVG/Canvas 模板 | 写 HTML 或修复 HTML 时 |
| `self-check-schema.json` | 输出前自检报告结构 | 交付前必须对齐 |
| `CHANGELOG.md` | 版本变更记录 | 追溯时读取 |

后台运行时如果系统提供 `<skill-files>` 表，必须使用表里的实际 CDN URL 读取这些文件，禁止自行拼接子目录路径。

## 三、九条铁律

### 铁律 1：只使用指定 MathJax3 CDN

HTML 必须加载以下 CDN，且 `window.MathJax` 配置必须写在 CDN 脚本之前：

```html
<script>
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true
  },
  startup: { typeset: true }
};
</script>
<script src="https://metis-online.fbcontent.cn/metis-misc/blER0Bn7vsa2JER9IEssf8.js"></script>
```

禁止换成 `$...$` 默认配置，禁止混用多个 MathJax CDN。

### 铁律 2：物理语义内容进入 MathJax，不要过度约束普通文本

凡画面可见且有物理/数学语义的以下内容都必须写成 `\(...\)` 或 `\[...\]`：

- 公式、等式、比例式、单位换算式
- 单个物理量字母：`m`、`M`、`v`、`a`、`F`、`p`、`P`、`C`、`Q`、`U`、`I`、`R`、`\rho`、`\mu`
- 带角标物理量：`v_m`、`v_M`、`v_0`、`p_x`、`E_k`
- 单位和含单位读数：`m/s`、`kg/m^3`、`N`、`J`、`F`、`\mu F`、`pF`
- 动态出现的读数、标签、提示条、滑块数值、动画帧标注

中文说明可以是正文，但句中出现的变量、单位、算式必须单独包入 MathJax。

不要为了“全覆盖”把以下内容强行 MathJax 化：

- 按钮和导航文案：`开始`、`暂停`、`Reset`、`Start`
- 选择题选项编号：`A`、`B`、`C`、`D`
- 普通英文缩写或产品/技术词：`AI`、`HTML`、`CSS`、`SVG`、`Canvas`
- 配色、布局、组件名称：`B-12`、`card A`、`panel`
- CSS class、DOM id、JS 变量名等源码标识符
- 没有物理语义的普通英文单词或字母

边界判断优先级：**教学语义 > 物理语义 > 视觉/UI 文案 > 源码标识符**。只有前两类需要 MathJax；后两类保持普通文本。

### 铁律 3：物理量斜体，单位正体

物理量字母用 LaTeX 数学默认斜体：

```html
速度 \(v\)，质量 \(m\)，槽质量 \(M\)，电荷量 \(Q\)
```

单位必须用正体 `\mathrm{...}`，数字与单位之间用 `\,`：

```html
\(2.5\,\mathrm{m/s}\)
\(1.0\,\mathrm{kg/m^3}\)
\(1.50\,\mathrm{g/cm^3}\)
\(10\,\mathrm{\mu F}\)
\(3\,\mathrm{N}\)
```

禁止把单位写成裸文本 `m/s`、`kg/m³`、`μF`；禁止让单位字母跟物理量一样斜体。
密度类读数卡片、滑块当前值、结果徽标、刻度端点、图例说明也必须按单位规则处理，例如 `1.50 g/cm³`、`1.2 g/cm³`、`8.0 g/cm³` 必须写成 `\(1.50\,\mathrm{g/cm^3}\)`、`\(1.2\,\mathrm{g/cm^3}\)`、`\(8.0\,\mathrm{g/cm^3}\)`；`1000 kg/m³` 必须写成 `\(1000\,\mathrm{kg/m^3}\)`。

### 铁律 4：自然语言变量必须语义归一

老师常写的连写变量必须先转成物理语义，再进 MathJax：

| 老师/旧 HTML 可能写法 | 正确写法 | 含义 |
|---|---|---|
| `vm` | `\(v_{m}\)` | 小球速度或质量为 `m` 的物体速度 |
| `vM` | `\(v_{M}\)` | 槽/大物体速度 |
| `v0` / `v₀` | `\(v_{0}\)` | 初速度 |
| `pm` | `\(p_{m}\)` | 小球动量 |
| `pM` | `\(p_{M}\)` | 槽/大物体动量 |
| `Px` / `P_x` | `\(P_{x}\)` | 水平方向总动量 |
| `rho` / `ρ` | `\(\rho\)` | 密度 |
| `uF` / `μF` | `\(\mathrm{\mu F}\)` | 微法，单位 |
| `V1` / `V₂` / `V₃` | `\(V_{1}\)` / `\(V_{2}\)` / `\(V_{3}\)` | 实验读数或体积测量值 |

多字符文字角标用 `\text{}` 或 `\mathrm{}`，例如 `\(v_{\text{初}}\)`、`\(E_{\mathrm{k}}\)`。
步骤编号 `A/B/C/D` 保持普通文本；但同一句里的测量变量仍要 MathJax 化，例如 `步骤 A：测量 \(V_{1}\)`。

### 铁律 5：禁止 Unicode 数学替代品和 HTML 角标

以下写法一律失败：

- Unicode 上下标：`v₀`、`m²`、`kg/m³`
- 动态提示或按钮文案里的 Unicode 读数：`读取 V₁`、`测量 V₂`
- Unicode 运算符替代：`×`、`÷`、`≤`、`≥`、`·`
- HTML 角标：`v<sub>m</sub>`、`m/s<sup>2</sup>`
- 纯文本公式：`m·v0 = m·vm + M·vM`

统一改为：

```html
\(v_{0}\)
\(V_{1}\)
\(\mathrm{m^2}\)
\(\mathrm{kg/m^3}\)
\(\times\)
\(m v_{0}=m v_{m}+M v_{M}\)
```

### 铁律 6：动态更新必须重渲染

凡 `innerHTML` / `textContent` / 模板字符串 / 滑块 / 动画帧 / 点击步骤更新了公式或单位，必须在更新后执行：

```js
await MathJax.typesetPromise([container]);
```

推荐使用 `code-patterns.md` 中的 `setFormula()`、`setPhysicsValue()`、`typesetMath()`。禁止动画开始后出现 `vm`、`vM`、`m/s` 等裸文本。
若动态文案是混合文本（如 `读取 V₁`、`步骤 B：测量 V2`），不要用 `innerText/textContent` 写 Unicode 下标；改用 `innerHTML = '读取 \\(V_{1}\\)'` 或 helper，然后对该节点 `typesetPromise`。步骤编号 `A/B/C` 仍保持普通文本。
若动态文案是数值 + 密度单位（如滑块标签 `1.50 g/cm³`、结果卡片 `0.92 kg/m³`），也必须用 `setPhysicsValue()` 或 `setFormula()`，不得用普通文本拼接 Unicode `³`。
静态密度刻度或图例也一样：不要写 `<span>1.2 g/cm³</span>`；要写 `<span>\(1.2\,\mathrm{g/cm^3}\)</span>`。

### 铁律 7：Canvas/SVG 不直接画公式

Canvas `ctx.fillText('vM')`、SVG `<text>vM</text>` 无法由 MathJax 排版，禁止用于公式、变量、单位。

正确做法：

- 物理对象、轨迹、箭头可以画在 Canvas/SVG。
- 公式标签放到 HTML overlay。
- SVG 内必须标公式时，使用 `<foreignObject>` 放 HTML `\(v_{M}\)`，然后对父节点 `typesetPromise`。

### 铁律 8：修复旧 HTML 时只修本卡点

老师要求“修公式/修物理量字母/修单位字体”时：

- 保留原 HTML 的布局、颜色、交互、资源 URL、按钮结构。
- 只替换公式/变量/单位的写法和相关动态更新逻辑。
- 不顺手重写整页、不改教学内容、不新增无关动画。

### 铁律 9：交付前必须自检

输出前必须生成 `formula_typography_self_check`，至少包含：

- MathJax CDN 是否正确
- 是否存在 `$...$`
- 是否存在 Unicode 上下标/`<sub>/<sup>`
- 是否所有可见物理量和单位已 MathJax 化
- 点击/播放/滑块/步骤切换后是否仍无裸公式
- Canvas/SVG 中是否仍有公式文本
- 是否没有把普通 UI 文案、选项编号、英文缩写过度 MathJax 化

任一核心项失败，不得交付；进入补丁循环。

## 四、六阶段工作流

```
Phase 1 | 输入分诊
  - fresh_generate: 从老师需求生成新的物理 HTML
  - fix_existing: 修复老师上传/历史生成的 HTML
  - 识别学段、物理主题、重点物理量、动态交互点

Phase 2 | 公式盘点
  - 列出所有可见公式、变量、单位、动态读数
  - 把老师自然写法归一：vm -> v_{m}, vM -> v_{M}, v0 -> v_{0}
  - 排除普通 UI 文案、选项编号、英文缩写、源码标识符，避免过度约束
  - 标记 Canvas/SVG/JS 动态字符串里的公式风险

Phase 3 | HTML/JS 实现
  - 按 code-patterns.md 加载 MathJax3
  - 静态文本全部用 \(...\) 或 \[...\]
  - 动态读数使用 setFormula/setPhysicsValue
  - Canvas/SVG 公式改为 HTML overlay 或 foreignObject

Phase 4 | 交互 smoke
  - 初始页面等待 MathJax 完成
  - 点击开始/播放/下一步
  - 拖动主要滑块
  - 切换标签/步骤
  - 每次变化后检查画面没有裸 vm/vM/v0/m/s/kg/m3

Phase 5 | Self-Check
  - 按 self-check-schema.json 逐项输出
  - 检查 non_overconstraint：普通 UI 和非物理英文是否仍保持普通文本
  - 任一失败 -> Phase 6

Phase 6 | 补丁循环（最多 2 次）
  - 按失败维度精确修补
  - 不大改布局和交互
  - 重跑 Phase 4-5
  - 仍失败则 status=degraded，列出无法自动修复的证据
```

## 五、典型正确写法

```html
<p>小球速度 \(v_{m}\)：<span id="vm-value">\(0.00\,\mathrm{m/s}\)</span></p>
<p>半圆槽速度 \(v_{M}\)：<span id="vM-value">\(0.00\,\mathrm{m/s}\)</span></p>
<div class="formula">\[m v_{m} + M v_{M}=0\]</div>
```

```js
await setFormula(document.getElementById('vm-value'), `${vm.toFixed(2)}\\,\\mathrm{m/s}`);
await setFormula(document.getElementById('vM-value'), `${vM.toFixed(2)}\\,\\mathrm{m/s}`);
```

## 六、补丁矩阵

| 失败项 | 立即修复 |
|---|---|
| `mathjax_cdn` | 移除其他 MathJax 脚本；在指定 CDN 前写 `window.MathJax` 配置 |
| `delimiter_policy` | 全局替换 `$...$` 为 `\(...\)` 或 `\[...\]` |
| `quantity_unit_font` | 变量用数学默认斜体；单位改 `\mathrm{...}` |
| `semantic_subscripts` | `vm/vM/v0/pm/pM/Px/V1/V2/V3` 统一改为 `v_{m}/v_{M}/v_{0}/p_{m}/p_{M}/P_{x}/V_{1}/V_{2}/V_{3}` |
| `unicode_or_html_subscripts` | Unicode 上下标、`<sub>/<sup>` 全部改 LaTeX `_` / `^` |
| `dynamic_typeset` | 为每个动态更新点接入 `setFormula` 或更新后 `MathJax.typesetPromise([el])` |
| `canvas_svg_labels` | Canvas/SVG 文本公式迁移到 HTML overlay 或 SVG foreignObject |
| `interaction_smoke` | 找出点击/播放/滑块后出现的裸符号，回到对应 JS 更新函数修补 |
| `non_overconstraint` | 若 `A/B/C/D`、`Start/Reset`、`AI/HTML/CSS` 等被包成公式，改回普通文本；只保留物理语义内容 MathJax |

## 七、反模式速查

| 反模式 | 后果 | 正确做法 |
|---|---|---|
| `小球速度 vm: 0.00 m/s` | `vm` 和单位裸露 | `小球速度 \(v_{m}\)：\(0.00\,\mathrm{m/s}\)` |
| `m·v₀ = m·vm + M·vM` | Unicode + 裸连写 | `\(m v_{0}=m v_{m}+M v_{M}\)` |
| `<sub>m</sub>` | 字体不统一，MathJax 不接管 | `_{m}` |
| `ctx.fillText('vM', x, y)` | Canvas 字体不规范 | HTML overlay: `<span>\(v_{M}\)</span>` |
| 动态 `el.textContent = value + ' m/s'` | 动画后裸单位 | `setFormula(el, value + '\\,\\mathrm{m/s}')` |
| 写完公式不重渲染 | 页面留下源码 `\(v\)` | `await MathJax.typesetPromise([container])` |
| 把选项 `A/B/C/D` 或 `HTML/CSS` 包成 MathJax | 过度约束，UI 可读性变差 | 选项编号和技术缩写保持普通文本 |
| 动态提示 `tip.innerText = "读取 V₁"` | 运行后出现 Unicode 下标，MathJax 不接管 | `tip.innerHTML = '读取 \\(V_{1}\\)'` 后 `typesetMath(tip)` |
| 动态读数 `label.textContent = value + ' g/cm³'` | 密度单位裸露，且含 Unicode 上标 | `setPhysicsValue(label, value, 'g/cm^3')` |
| 图例端点 `<span>8.0 g/cm³</span>` | 静态密度单位裸露 | `<span>\(8.0\,\mathrm{g/cm^3}\)</span>` |

## 八、输出要求

交付时输出：

```json
{
  "final_html_url": "<生成或修复后的 HTML URL>",
  "formula_typography_self_check": {
    "version": "1.4.0",
    "passed": true,
    "status": "passed"
  }
}
```

若无法全部修复，必须把 `status` 置为 `degraded`，列出仍失败的 HTML 位置和原因，不得声称“已解决”。
