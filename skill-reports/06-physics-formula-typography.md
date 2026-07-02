# 06 · physics-formula-typography 深度研读报告

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/physics-formula-typography/`（5 文件，约 52K）
> 性质判定：**真实生产级 skill**，横切（cross-cutting）型——专治物理互动 HTML 的「公式与物理量排版」单一卡点。
> 研读方式：完整 Read `v1/SKILL.md`、`SKILL_v1_CDN.md`、`code-patterns.md`、`self-check-schema.json`、`CHANGELOG.md`。

---

## 0. 文件清单

| 文件 | 角色 |
|---|---|
| `v1/SKILL.md` / `SKILL_v1_CDN.md` | 主文档（两份相同），九条铁律 + 六阶段工作流 + 补丁矩阵 + 反模式速查 |
| `v1/code-patterns.md` | MathJax3 引入、动态 helper（`setFormula`/`setPhysicsValue`/`setDensityValue`/`setMixedMathText`/`typesetMath`）、SVG/Canvas 模板、源码扫描函数 |
| `v1/self-check-schema.json` | JSON-Schema (draft-07)，10 项 check 的自检报告契约 |
| `v1/CHANGELOG.md` | 1.0.0 → 1.4.0 版本记录 |

版本号：**1.4.0 | 2026-06-09**（frontmatter description + 主文档第 8 行 + schema example 一致）。

---

## 1. 设计思路

### 1.1 问题定位：卡点不是"有没有公式"，而是"公式没被统一排版"
SKILL §一列出四类真实病象（第 14-20 行）：
1. `vm`/`vM`/`v0` 被当普通文本或两字母连写，而非 `v_{m}`/`v_{M}`/`v_{0}`；
2. 物理量/单位/角标混用纯文本、Unicode 上下标、`<sub>/<sup>`、Canvas `fillText`；
3. **初始能渲染，但点"开始"/拖滑块/分步/动画帧更新后又冒出裸字母裸单位**（动态回退）；
4. 源码混 `$...$`、Unicode `²/₀/×/·`、手写 HTML 角标，MathJax3 不稳定。

它把"教研文字规范"翻译成可执行流水线：**物理语义盘点 → MathJax3 代码约束 → 动态更新约束 → 交互后自检 → 不过即补丁**。

### 1.2 最克制的设计决策：反"过度约束"
本 skill 反复强调它**不是**"把页面上所有英文字母都公式化"的通用字体技能（§一第 23 行）。铁律 2 给出明确的**边界优先级**：

> 教学语义 > 物理语义 > 视觉/UI 文案 > 源码标识符。**只有前两类需要 MathJax；后两类保持普通文本。**

白名单进 MathJax（公式/物理量字母/带角标量/单位读数/动态读数），黑名单保持普通文本（按钮文案"开始/Reset"、选项编号 A/B/C/D、技术缩写 AI/HTML/CSS/SVG、配色名 B-12、CSS class/DOM id/JS 变量名）。这条"克制"约束是后期迭代补的（见 §2），说明早期版本曾经因"全覆盖"把 UI 文案也包进公式，反伤可读性与生成稳定性。

### 1.3 字体语义学落到 LaTeX 细节
- 铁律 3：**物理量斜体（数学默认），单位正体 `\mathrm{...}`，数字与单位间 `\,`**。如 `\(2.5\,\mathrm{m/s}\)`、`\(10\,\mathrm{\mu F}\)`。
- 铁律 4：**自然语言变量语义归一表**（`vm→v_{m}`、`vM→v_{M}`、`v0→v_{0}`、`pm/pM/Px`、`rho→\rho`、`uF→\mathrm{\mu F}`、`V1/V2/V3`），多字符文字角标用 `\text{}`/`\mathrm{}`（`v_{\text{初}}`、`E_{\mathrm{k}}`）。
- 铁律 7：**Canvas/SVG 不画公式**——`ctx.fillText('vM')`、`<text>vM</text>` 一律失败；公式标签走 HTML overlay，SVG 内必须标公式时用 `<foreignObject>` 放 HTML 再对父节点 `typesetPromise`。

### 1.4 硬技术锚点
- 铁律 1：**只用指定自托管 CDN** `https://metis-online.fbcontent.cn/metis-misc/blER0Bn7vsa2JER9IEssf8.js`，且 `window.MathJax` 配置（`inlineMath:[['\\(','\\)']]`、`displayMath:[['\\[','\\]']]`）必须写在 CDN 脚本**之前**。禁 `$...$` 默认配置、禁混用多个 MathJax CDN。
- 铁律 6：**任何动态 DOM 更新后必须 `await MathJax.typesetPromise([container])`**；推荐统一走 helper，禁裸 `innerHTML='vm...'`。

---

## 2. 迭代路线（CHANGELOG 五连发，全在同一天）

`CHANGELOG.md` 记录 1.0.0→1.4.0 **五个版本全部标注 2026-06-09**——典型的"上线当天被真实案例连续打补丁"的密集迭代：

| 版本 | 变更要点（字段级） | 暴露的真实卡点 |
|---|---|---|
| **1.0.0** | 从「飞象周报物理公式/字体卡点」蒸馏；定下 MathJax3 CDN、语义角标归一、动态重渲染、Canvas/SVG 处理、结构化自检 | 基础规范成形 |
| **1.1.0** | 明确**作用域边界**：只接管物理/数学语义可见内容；新增 `non_overconstraint` 自检项 + 源码扫描 helper | 早期"全覆盖"误伤 UI 文案/选项编号/英文缩写 |
| **1.2.0** | 新增**动态测量标签** `V1/V2/V3`、`读取 V₁` 规则；澄清步骤字母 A/B/C/D 保持普通文本而相邻测量变量要 MathJax；新增 `setMixedMathText()` | 中英混排动态提示里的 Unicode 下标回退 |
| **1.3.0** | 新增**密度读数**规则（`g/cm^3`/`kg/m^3` 滑块/标签/结果徽标）；新增 `setDensityValue()` 避免 `1.50 g/cm³` 裸文本 | 密度类实验（排水法等）的滑块/徽标裸单位 |
| **1.4.0** | 收窄到**静态图例/量程端点**：`1.2 g/cm³`、`8.0 g/cm³` 也要 MathJax 渲染 | 静态图例端点漏网 |

> **迭代规律**：每个补丁都是"某一类真实坏产物 → 收窄/扩展一条具体规则 + 配套一个 helper + 增一项自检"。这是"案例驱动 + 自检契约同步演进"的范本——规范、代码工具、验收 schema **三者捆绑升级**，不留口径漂移。

`self-check-schema.json` 的 `checks.required` 已含全部 10 项（`mathjax_cdn`/`delimiter_policy`/`visible_symbol_coverage`/`quantity_unit_font`/`semantic_subscripts`/`unicode_or_html_subscripts`/`dynamic_typeset`/`canvas_svg_labels`/`interaction_smoke`/`non_overconstraint`），与铁律一一对应，说明 schema 已随 1.4.0 收敛完整。

---

## 3. 功能边界

**纳入**：生成或修复初/高中物理互动课件、教学动画、公式演示、实验模拟 HTML，尤其画面出现物理量字母/单位/公式/速度·动量·密度·电学量/动态读数/Canvas·SVG 标注时。两种模式（schema `mode` 枚举）：`fresh_generate`（从需求新建）与 `fix_existing`（修旧 HTML）。

**排除**：普通 UI 文案、选项编号、英文缩写、CSS/JS 标识符——明令不得 MathJax 化（铁律 2 + `non_overconstraint`）。

**修旧约束（铁律 8）**：只修公式/变量/单位写法及相关动态更新逻辑，**保留原布局/颜色/交互/资源 URL/按钮结构**，不顺手重写整页、不改教学内容、不加无关动画。

**交付契约（铁律 9 + §八）**：输出 `formula_typography_self_check`，任一核心项失败不得交付，进补丁循环（最多 2 次，Phase 6）；无法全修则 `status=degraded`，列出仍失败位置，**不得声称"已解决"**。

**与邻居 skill 的关系**：
- **与 html-authoring/courseware-generator 正交叠加**：本 skill 不管配色布局，只管公式排版；在物理单页/多页产物上与视觉 skill 共同生效。
- **CDN 同源**：用的是飞象自托管 metis-online MathJax3，与课件体系 MathJax 修复链路同源（呼应飞象课件 MathJax 公式修复主题）。
- **被 test-html 验收**：test-html 模板 3（LaTeX 渲染）正是本 skill 的下游检查口——验 `mjx-container` 数量、`mjx-merror` 错误、**零尺寸公式（offsetParent 排除 display:none）**。两者形成"生成规范 + 自动化验收"闭环。
- **口径差异（重要对比）**：`paper-generation` 的 `create_question_sheet` 用**单美元 `$...$`** 包公式（双美元会换行）；本 skill **严禁 `$...$`**，只用 `\(...\)`/`\[...\]`。说明飞象内部"出题文档渲染管线"与"互动 HTML MathJax 管线"是两套不同的公式分隔符约定，跨 skill 复用公式文本时需转换。

---

## 4. 工程启发（对 ClassIn 互动内容生成项目）

1. **横切关注点要独立成 skill**：公式排版不绑死在"物理课件生成"里，而是抽成可叠加的横切 skill。ClassIn 应把"公式排版、无障碍、配色、可达性"等横切规范**与品类生成 skill 解耦**，按产物特征叠加，避免每个品类 skill 重复抄一遍。

2. **"动态回退"是互动内容的头号隐患**：本 skill 最深刻的洞察是——初始渲染对、交互后回退裂开。ClassIn 的互动产物（滑块/动画/分步）必须把"**每个动态更新点都重渲染/重校验**"作为硬约束，并提供统一 helper（`setFormula`/`setPhysicsValue`）收口，禁止散落的 `innerHTML=` 拼接。

3. **规范 + 工具 + 自检三件套捆绑演进**：铁律 ↔ helper ↔ schema check 一一对应。ClassIn 每条规范都应配套（a）一个让模型"照着写就对"的代码模板，（b）一项可机检的自检字段。只写规范不给工具/不给校验，等于不写。

4. **可执行的反模式速查表**：§七把"反模式→后果→正确做法"做成表（如 `ctx.fillText('vM')`→Canvas 字体不规范→HTML overlay）。ClassIn 应沉淀同样的**反模式库**，每条来自线上真实坏产物，直接喂给模型当负样本。

5. **"克制边界"必须显式且可机检**：`non_overconstraint` + `scanNonOverconstraint()`（扫 `\(A\)`、`\(Start\)` 误包）是防止"规范过度生效反伤体验"的关键。ClassIn 任何"必须做 X"的规范都要配一条"不要把 X 用到 Y 上"的反向边界，并写成扫描函数。

6. **降级要诚实**：`status=degraded` + 列出无法修复证据 + 禁止假称已解决。ClassIn 的交付契约应内建**诚实降级态**，让自动化系统能区分"真通过"与"尽力了但有残留"，而不是非黑即白地谎报成功。

7. **自托管关键 CDN + 配置前置**：固定一个飞象域 MathJax3 并要求配置写在加载前。ClassIn 在 ClassIn 域内运行时，第三方渲染库（MathJax/KaTeX/动画库）应**自托管 + 锁版本 + 配置前置**，杜绝外网 CDN 抖动导致的渲染不稳定。
