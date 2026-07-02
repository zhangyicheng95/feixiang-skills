# courseware-generator 深度分析

> 研读对象：`飞象Skills/courseware-generator/`（v1–v18 共 18 个版本目录 + `SKILL_v18_CDN.md`，每版含 `SKILL.md` + 两份子文档）。
> 这是飞象「互动课件」的**主编排 skill**，也是整批资料里最重要的一个。下面按用户要求的四个维度展开，所有判断尽量挂上文件级、字段级证据。

---

## 0. 先看清它的物理结构

每个版本目录由 1+2 个文件构成，是典型的「**导航文件 + 渐进式披露子文档**」三件套：

| 文件 | 角色 | 体量（v18） |
|------|------|------|
| `SKILL.md` | 总览 / 流程编排 / 控制流（被 system 首先加载） | 152 行 |
| `outline-guidance.md` | Phase 1 子流程：教研大纲生成（"教什么"） | 548 行 |
| `html-guide.md` | Phase 4 子流程：HTML 课件生成（"怎么写"） | 939 行 |

`SKILL_v18_CDN.md` 与 `v18/SKILL.md` **逐字节相同**（已 diff 验证），说明线上 CDN 实际投放的就是 v18。两份子文档不出现在 `SKILL.md` 的 frontmatter 里，而是通过正文表格里的 Markdown 链接 `[outline-guidance.md](outline-guidance.md)` 引用 —— 这是关键的加载机制（见 `00-Agent-Harness架构设计.md`）。

---

## 1. 设计思路

### 1.1 它解决的真实问题

把"老师一句话需求（如《少年闰土》六年级）"转化为一个**浏览器双击即用、单文件、带演示模式与互动状态记忆的 HTML 课件**。难点不在"写 HTML"，而在于：

1. **教学专业性**——课件内容必须经得起课标、教材、学情推敲，不能是 LLM 自由发挥的"看起来像课件"。
2. **生成可控性**——多页（15–22 页）、含游戏级互动的 HTML 文件极大，一次性生成会爆 token、易溢出、改一页就全文重写。
3. **运行时解耦**——课件的"壳"（缩略图、翻页、演示模式、焦点管理）是平台能力，不能让 LLM 每次重写。

### 1.2 核心设计理念（贯穿 18 版不变的"宪法")

**理念 A：内容与表现彻底分离 —— "壳框架驱动"。**
AI 只写每页 `<template class="page-data">` 内的教学内容，所有壳功能由一个云端 JS 提供：

```51:51:courseware-generator/v1/style-guide.md
<script src="https://musk-test.fbcontent.cn/pub-musk-ai-studio/user/upload/admin/NBhSGcztvPnQBj9cbEdkBe.js"></script>
```

`html-guide.md` 第八节明确列出壳框架包办的 17 项能力（scale 适配、键盘/滚轮翻页、焦点管理、saveState/restoreState、自动注入 base CSS、把 `<template>` 包装成完整文档等），并反复用「禁止手写壳代码」「禁止读取壳 JS」封死 AI 的越界冲动。这本质是**把不稳定的 LLM 输出约束在一个极小的、可验证的接口面（`<template>` 片段）上**。

**理念 B：教什么 / 用什么 / 怎么写 三段分离。**
- `outline-guidance.md` 决定「教什么」（大纲）；
- Phase 3 决定「用什么」（图片/音频/题目素材）；
- `html-guide.md` 决定「怎么写」（HTML）。
`SKILL.md` 使用说明里明确这种分工（v18 §使用说明 2–4 条）。

**理念 C：专业大纲先行 + 用户确认闭环 + 大纲驱动生成。**
v18 §核心原则四条同时存在：先用教研流程产出大纲 → `ask_user` 强制确认 → HTML 严格按大纲生成、不得偏离。即"先对齐意图、再大力生成"。

### 1.3 关键抽象

| 抽象 | 含义 | 证据 |
|------|------|------|
| `<template class="page-data" data-id data-name>` | 一页课件 = 一个 template；`data-id` 决定顺序、`data-name` 进缩略图 | v18 html-guide §3.2 |
| `<template class="page-shared">` | 全页共享外部资源（Tailwind/字体/图标），壳注入每页 iframe `<head>` | v18 html-guide §3.4 |
| `<!-- CW_PAGES -->` 注入标记 | 18 字符固定锚点，分批 `edit_file` 往其前插页 | v18 html-guide §9.2 |
| 强互动页 vs 普通页 | 装箱分批的基本单元；强互动页独占批次 | v18 html-guide §8.2 / §9.3 |
| saveState / restoreState | 页面↔壳的状态协议（postMessage），支撑往回翻页恢复 | v18 html-guide §6 |
| `create_lesson_design` | 大纲交付物（Word），Phase 1 的终点、Phase 2 的入口条件 | v18 SKILL §Phase 2 |
| SOP + expertId + expertTask | 大纲生成的专家推理三元组 | v18 outline §consult_courseware_design_expert |

---

## 2. 迭代路线（v1 → v18 还原）

> 重要前提：版本号**不完全等于时间线**。`v5` 明显是一次回滚/旁支（它退回到 v1/v2 的两文件架构），其余基本单调演进。下表只取每个"首次出现"的拐点。

### 2.1 架构级拐点

**① v1–v2：双文件单智能体（"多页课件"）。**
结构是 `content-guide.md` + `style-guide.md`，一个 agent 一条龙：`continue_ask` 确认参数（带**倒计时自动确认**）→ 检索 → 规划大纲 → 分批生成**片段文件** → **最后一次性 write 组装**。此时：
- 大纲**不需要用户确认**（v1 content-guide §3.3 末："规划完成后直接进入步骤 4 生成，无需等待用户确认大纲"）；
- 分批策略是"每批写独立 `pages-batchN.html` 片段文件，验收后一次性组装"，并明文禁止 `str_replace/multi_edit` 往大文件里插（v1 content-guide §5.1）。

**② v3：决定性重构 —— 升级为 5-Phase 流水线（最重要的一次迭代）。**
`content-guide/style-guide` 被 `outline-guidance/html-guide` 取代，工作流变为：

```28:49:courseware-generator/v18/SKILL.md
Phase 1: 大纲生成 ... → create_lesson_design
Phase 2: 大纲确认与修改（ask_user 循环）
Phase 3: 素材准备（generate_image/generate_voice/search_*）
Phase 4: HTML 课件生成（骨架 → 分批 → 注入）
Phase 5: 验收与交付
```

带来的质变：
- 大纲生成从"简单规划"升级为**专业教研 SOP**（课标研读→教材梳理→学情分析→目标拟定→逐页设计），并引入 `insert_courseware_design_sop` / `consult_courseware_design_expert` 的专家分支推理。
- 新增 **Phase 2 用户确认闭环**（HITL）：大纲必须经用户确认才进入制作。
- 新增 **Phase 3 素材准备**：图片/音频先拿 URL，**严禁 base64**（v18 SKILL §3.2.2）。
- 组装方式从"片段文件 + 一次性组装"演进为"**骨架 + `<!-- CW_PAGES -->` 增量注入**"。

**③ v5：回滚旁支。** 退回双文件结构（与 v2 内容一致），可判定为一次实验性回退或并行快照，主线在 v6 即恢复 5-Phase。

### 2.2 大纲层（outline-guidance.md）演进

- **v9→v10：信息确认从 8 项升到 9 项**，并把"自由文本提问"升级为**结构化表单**。新增 `班级学情`、`册次`、`课件页数范围`，且全部字段改 `SINGLE_CHOICE/MULTIPLE_CHOICE`、统一 `allowCustomAnswer=true`，附带完整 `formFields` JSON 范例。还引入两个产品化巧思：**教学重点预生成至少 3 条供选**、**页数三档区间预估（默认中间档）**（v10 outline §信息确认机制；v18 §①–⑤）。
- **v13→v14：检索工具瘦身。** 删掉 `search_teaching_reference`（教参）、`search_lesson_plan`（素养教案）、`search_teaching_guidance`（物理教学指导）三个专项搜索，搜索能力收敛到课标/教材/web/知识点 4 个 —— 专业度上移给 `consult_courseware_design_expert` 内部承担。
- **v15→v16：工具调用协议升级。** 章节标题从「可用操作类型概览/各操作输出格式」改为「可用工具概览/各工具调用说明」，调用语法从**文本协议** `call: continue_ask {json}` 全面切换为**标准 function-calling（tool_calls）**（grep 验证：v15 `call:`=7、v16 `call:`=0/`tool_call`=8）。命名也从名词在前 `curriculum_standard_search` 演化为动词在前 `search_curriculum_standards`。
- **v16→v17：`continue_ask` → `ask_user`**（outline 层）。

### 2.3 HTML 层（html-guide.md）演进

- **v3==v6==v9**（799 行，三套快照同文）。
- **v9→v12：宿主工具名标准化。** `picture_gen→generate_image`、`voice_gen→generate_voice`、`multi_edit→edit_file`、`create→create_file`；并强化"已确认具体页数"用于页数校验。
- **v12→v13：新增第七节「数据收集 SDK 接入规范」**（+140 行，799→939）。这是与 `data-collect` skill 的耦合点：壳框架在每页 srcdoc 自动注入 `MuskCollect` 类，AI `new MuskCollect()`，并引入 `window.__CW_MODE__` 缩略图守卫、`window.parent.sessionStorage` 跨页身份共享。
- **v14→v15：壳框架 JS 从测试环境切到生产环境**（强证据，标志 v15 = 上线版）：

```text
- musk-test.fbcontent.cn/.../kwExcQVjxHxZti5fwD9vVS.js   (v14 测试)
+ musk-online.fbcontent.cn/.../m6azhRVhvHd74GnTkrMdA7.js  (v15 生产)
```

- **v15==v16==v17==v18**（html-guide 趋稳）。

### 2.4 一个值得记下的"维护现实"

同一个工具改名并**不是在所有文件里原子完成**的：`ask_user/generate_image` 在 `SKILL.md` 里 v11 就生效，在 `html-guide.md` 里 v12 才改，在 `outline-guidance.md` 里要到 v16–v17 才统一。三层文档的术语在好几个版本里是**不一致并存**的。对我们自建 harness 是个警示：多文件 skill 的术语一致性需要工具化校验，否则极易漂移。

### 2.5 命名/品牌演进

v11→v12：产品对外称谓从「多页课件」统一为「**互动课件**」，并在 SKILL.md 顶部加了强约束：

```8:8:courseware-generator/v18/SKILL.md
> **称谓约束（重要）**：本功能对外统一称为「**互动课件**」...禁止使用「多页课件」「多页 PPT 课件」等旧称谓...
```

---

## 3. 功能边界

### 3.1 能做什么

- 端到端生成 15–22 页（用户可调）的互动 HTML 课件，单文件交付，浏览器直开。
- 学科专家分支覆盖：小学/初中的语文、数学、英语、物理（按人教/非人教细分），共 13 个 `expertId`（v18 outline §insert_courseware_design_sop 表）。
- 支持**附件驱动**：老师上传教案图片/文档，多模态提取为 `teacher_material`，并以"附件=第一权威来源"原则反向约束生成（v18 outline §附件优先规则 + §大纲输出 1. 附件回测）。
- 强互动页可产出"游戏级"交互（拖拽、Canvas/SVG、闯关、连线、anime.js 弹性动画 + Web Audio API 音效），并要求 JS ≥ 100 行（v18 html-guide §8.4）。
- 可选接入数据收集（练习/答题类课件），让教师看作答报告。

### 3.2 明确不做什么（边界由 frontmatter description 与正文双重声明）

- frontmatter：**不适用于**"教学动画、教学游戏、单页动画、精美排版等非互动课件场景"（v18 SKILL frontmatter）。
- 交互能力封顶在**前端静态页面**：禁止设计需要摄像头、文件上传、多人实时联网的交互（v18 outline §注意事项 7）。
- 交互禁用方向键 ↑↓←→ 与空格键（被壳框架占用于翻页）——这是从 v1 就有的硬约束（v1 content-guide §3.3 交互设计行）。
- 禁止 `100vh`、禁止对 html/body 设 `overflow:hidden`、禁止 `alert/confirm/prompt`（会强退全屏）（v18 html-guide §十二禁止清单）。

### 3.3 关键约束与假设

- **大纲驱动**：HTML 必须严格对应已确认大纲的逐页设计表格，"不得偏离、遗漏或自行添加"（v18 html-guide §9.6）。
- **页数刚性**：逐页设计每行严格一页，页码必须单整数，禁止合并页码（如 2-3），总行数=总页数（v18 outline §注意事项 9）。
- **工具隔离（强制最高优先级）**：Phase 1 期间只能用 outline 列出的专用工具，禁止用宿主通用工具，直到 `create_lesson_design` 后才交还宿主（v18 outline §工具隔离规则）。
- **串行执行**：大纲阶段"每轮仅一次工具调用"，显式覆盖宿主的"并行调用"规则（v18 outline §每轮仅发起一次工具调用）。
- **内容预算**：960×540 画布有非常精细的**字数/元素上限表**（v18 html-guide §4.5–4.9，如单栏满宽 ≤400 字、选择题选项 ≤4 个每项 ≤35 字、引用框扣减 ≈100 字），防溢出靠"先算预算再写"。

---

## 4. 工程启发（针对 ClassIn「AI 助教升级：互动内容生成 + 数据闭环」）

### 4.1 可直接借鉴

1. **"壳框架 + `<template>` 片段"是降低 LLM 生成方差的最佳实践。** 把所有"运行时基础设施"（翻页、缩放、状态持久化、数据 SDK）沉到一个云端 JS，LLM 只产出受约束的内容片段。ClassIn 若做互动内容生成，应同样定义一个**稳定的内容契约 + 平台壳**，而不是让模型每次生成整页应用。
2. **5-Phase 流水线 + 强制 HITL 确认点。** "先生成可读的大纲、`ask_user` 确认、再大力生成 HTML"显著降低返工。AI 助教生成互动题/课件时，应在"结构方案"层就插入一次低成本确认，而非生成完再让老师推翻。
3. **骨架 + 锚点增量注入（`<!-- CW_PAGES -->`）+ resourceId 链式追踪。** 这是处理"大文件分批生成"的成熟范式：固定短锚点保证 `edit_file` 匹配稳定，强互动页独占批次拿满 token 预算。直接可用于 ClassIn 的大型互动资源生成。
4. **内容预算表（字数/元素上限）+ 多状态校验。** 把"画布会不会溢出"从玄学变成可计算的预算扣减，并要求校验所有 UI 状态（初始态/展开态/完成态）。这是把"视觉质量"工程化的样板。
5. **强互动页的"交互剧本"前置产出（五维度：元素/过程反馈/结果反馈/完成态/技术标注）。** 先写剧本再写代码，避免模型把游戏化交互简化成表单。可移植为 AI 助教生成互动题时的"交互规格先行"。
6. **附件=第一权威来源 + 回测机制。** 老师上传教案时严格忠实呈现、生成后逐条回测覆盖度。ClassIn 助教接入老师已有备课/课件时，这套"忠实优先 + 回测"原则能避免"AI 重新备课"的反感。
7. **产品化的信息确认表单**：预填 9 项 + `allowCustomAnswer` + 教学重点预生成 3 条 + 页数三档默认中间档。这是"让提问显得懂教学、又不打断流程"的范本。

### 4.2 要警惕的坑

1. **多文件术语漂移。** 同一工具在三层文档里改名跨了好几个版本不同步（§2.4）。ClassIn 若也走"SKILL.md + 多子文档"，必须有 lint/CI 校验工具名、字段名一致性。
2. **版本目录 ≠ 时间线。** v5 是回滚旁支。自建时建议用 CHANGELOG + 语义化版本，别只靠目录号，否则后人无法还原"为什么这么改"。这批资料**恰恰缺少 CHANGELOG**，迭代意图只能靠 diff 反推——这是它的弱点，我们不要重蹈。
3. **强 prompt 约束 ≠ 强保证。** 大量"禁止/必须/⚠️"是 prompt 层软约束，真正的硬保证（如 base CSS 注入、`</template>` 转义、缩略图守卫）都落在**壳框架代码**里。启发：凡是"必须遵守"的规则，能下沉到运行时代码强校验的就别只写在 prompt 里。
4. **专家 SOP 是黑盒外部依赖。** `insert_courseware_design_sop`/`consult_courseware_design_expert` 的真正智能在服务端 SOP 与专家模型里，skill 文件只是调用约定。ClassIn 复刻"教研专业度"时，真正的护城河在这套学科 SOP/expertId 路由的服务端资产，而非 prompt 本身。
5. **CDN 快照可能滞后。** `data-collect` 的 CDN 还停在 v1，而 courseware 已是 v18（§架构文档详述）。发布管线要保证"线上投放版本"可观测、可对齐。

---

## 附：courseware-generator 关键事实速查

- 主编排：`SKILL.md`（5 Phase）；子流程：`outline-guidance.md`（Phase 1）、`html-guide.md`（Phase 4）。
- 编排的其它 skill / 能力：Phase 4 显式「读取 **interaction-design** 技能」取动画/缓动参考并写入 `page-shared`（v18 SKILL §Phase 4.2）；第七节耦合 **data-collect** 的 `MuskCollect` SDK。
- 生产壳 JS：`musk-online.fbcontent.cn/.../m6azhRVhvHd74GnTkrMdA7.js`（v15 起）。
- 线上版本：CDN = v18。
