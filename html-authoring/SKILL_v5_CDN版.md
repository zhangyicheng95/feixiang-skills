---
name: html-authoring
description: 生成或修改单页教学交互 HTML（动画、单页课件、教学海报、教学网页、可打印练习册/字帖）时使用，覆盖视觉设计决策与技术实现规范（配色布局、动画选型、浏览器兼容、媒体资源）。K12 数学单页 HTML 内置 math-design 子链路（31 套 A/B 色板、H1=40px、按钮 80px）；数学场景走 math-design，非数学场景禁止读 math-design 子文件。不适用于多页 PPT 课件、纯知识问答、不涉及 HTML 的场景。
---

# html-authoring

> 本文是「决策与纪律」主干。完整示例 / 典型错误案例见 `references/examples-and-pitfalls.md`；
> 3D 踩坑 / CDN 细节 / CSS 前缀 / 动画库 API 坑 / 图片边界 / 参考配色 5 方案 / 媒体白名单详单见 `references/tech-details.md`；
> 数学场景的色板与布局见 `math-design/`。**本地附件（references/）用 `read_file` 相对路径读；math-design 子文件用 `<skill-files>` 表的 CDN `read_url`**——都按需读取，不要凭记忆默写。数学网格/点阵/3D 地面网格见 `math-design/grid-templates.md`。

## 适用场景

- 创建交互式教学动画 / 单页 HTML / 基于 HTML 的图片·视频·海报·课件
- 创建可打印教学材料（A4 练习册 / 字帖 / 习题册 / 试卷）
- 修改已有 HTML（改配色 / 交互 / 内容 / 布局）

**不适用**：纯知识讲解·问答（不涉及 HTML 生成）；多页 PPT 式课件（由 `courseware-*` 处理）。

## 学科路由（**工作流第 0 步，最先判定，禁止跳过**）

判定顺序（命中即停）：

1. **非数学学科前缀（最高优先级）**：prompt 含「语文/物理/化学/生物/地理/政治/道法/历史/英语/…」+ 非数学知识点 → **通用链路**；即使同时出现"教学动画/互动课件"也**不走** math-design。
2. **数学知识点**：勾股定理/一次函数/鸡兔同笼/方程/概率/面积周长/单位进率/数轴/分数加减… → **math-design 子链路**。
3. **歧义**（只有"教学动画/单页 HTML"、无学科无数学知识点）→ **默认通用**，不要 read math-design。

| 路由 | 读哪些 | 配色 | 禁止 |
|---|---|---|---|
| **数学 → math-design** | **必读** `math-design/workflow.md` → 色板子文件 → `visual-impact.md`；涉及坐标系/坐标轴/函数图像再读 `manipulatives.md`；用户明确要求方格纸/点阵纸/几何画布/坐标网格/单位正方形拼图/借助方格读点/3D 地面网格时再读 `grid-templates.md`（用 `<skill-files>` 表 CDN URL 原样 `read_url`，禁自拼路径） | 31 套 A/B 色板；H1=40px；按钮 80px；首行 palette 注释；数学网格必须同源对齐 | 禁"参考配色方案"；禁 math-design 外的配色决策；禁用 CSS 背景伪装可读数网格 |
| **非数学 → 通用** | **仅本 SKILL.md +（按需）references** | 「参考配色 5 方案」(见 references/tech-details) + 5 个 CSS 变量 | 禁 read `math-design/`；禁写 `html-authoring:math-design` 注释；禁 H1=40px/按钮 80px 数学规格 |

> ⚠️ `<skill-files>` 表里出现 math-design 路径 ≠ 已读取；非数学场景**不得**因表中存在该路径而去读。
> ⚠️ **单独出现不构成数学路由**（须配学科或数学知识点）：教学动画 / 互动课件 / 互动设计 / 习题配置 / 呈现形式 / 闯关游戏。

## math-design 子文件（仅数学场景，CDN URL 以 `<skill-files>` 表为准）

`workflow.md`(工作流+字号布局) · `color-palettes-a.md`(小学 A-01~11) · `color-palettes-b.md`(初高中 B-01~20) · `visual-impact.md`(演示区多色) · `manipulatives.md`(标准坐标轴/教具) · `grid-templates.md`(SVG/Canvas 网格、点阵、单位正方形拼图、Three.js 地面网格)

## 工作流程

1. **理解需求 + 学科路由 + 抽取验收要点**（第 0 步）。需求模糊时按教学经验选最合理默认继续，**禁止 `ask_user`**；并在最终回复里声明假设。**同时从用户原文逐条挑出"可机检硬要求"**（数量/页数/配色/字号/音频/格式/数据回收 URL/学段红线/必含元素；游戏类含核心玩法闭环）——这就是产物的**验收要点**，生成时落到 `<head>` 的 spec 注释（见「验收要点 spec」）。
2. **核心机制契约**（可玩 / 有核心功能类产物：动手前先声明最小可玩闭环——见下方「核心机制契约」节）。
3. **设计决策**（配色 / 布局 / 排版 / 动画 / 交互粒度 / 内容组织——见下）。
4. **准备素材**：图片 `generate_image`、音频 `generate_voice`/Web Audio；媒体 URL 必须真实获取、仅飞象域（见「关键技术硬约束」）。
5. **生成 / 修改 HTML**：首次 `create_file`，修改先 `read_file` 再 `edit_file`（保原配色令牌·布局骨架·控件集合，只改要求处，禁借机重写）。数学场景首行写 `<!-- html-authoring:math-design palette=<id> layout=<L1|L2|L3> -->`；非数学首行 `<!DOCTYPE html>`（若含 math-design 注释则 `edit_file` 删除）。**在 `<head>` 写 spec 注释（所有产物，见「验收要点 spec」）**。
6. **交付前自检**（terminate 前最后一步）：过「核心机制契约·交付自检」+「质量标准」清单，全勾才 `terminate`。收尾必须是成功的 `create_file`/`edit_file` + `terminate`，禁纯文字结束。
7. **回复用户**：功能说明(1-2 句) + 操作方式；修改场景列"改了什么+效果变化"；不贴源码/不输出下载链接/不讲技术实现。

## 核心机制契约（反"空壳"总纲）

产物若是**游戏 / 答题 / 模拟器 / 互动演示 / 计算器**等有核心可玩或可用闭环的类型，**动手写代码前先声明该产物的「最小可玩闭环」**，当作"做完"的硬标准（Definition-of-Done），而不是留给测试去发现。**只做外壳（有 UI、无核心闭环）= 失败交付。**

**品类核心闭环（必须由构造保证存在）：**

| 品类 | 最小可玩闭环 |
|---|---|
| 计算 / 数字游戏（如 24 点） | 选数字 → **选运算符 +−×÷** → 组合 → 判定（如 =24） → 对/错反馈 → 换题/重置 |
| 拖拽配对 / 分类归位 | 可拖（DOM 真变化）→ 命中判定 / 错位回弹 → **提交·检查按钮** → 对错反馈 → 重置；禁"放下就算"的隐式交互 |
| 答题闯关 / 选择判断 | 出题 → 作答 → 判分 → 反馈（含正确答案对照）→ 下一题 / 重做（含"查看正确答案"入口，至少二选一） |
| 模拟器 / 实时动画 | **开始 / 暂停 / 重置** 三按钮 + 实时状态显示；禁页面加载即 `animation:infinite` 的裸 CSS 循环 |

**何时触发（信号词，否则品类判不准）**：模拟器规则——「模拟/仿真、实时/动态、**抽取/计数/试验/统计实验**、运动/轨迹/粒子」；答题规则——「拖拽到/吸附、匹配/配对/连线、分类/归类/归位、挑战/答题/测验/闯关、检查答案/判分」。**两套并存而非替代**：计数挑战 / 抽取游戏类既要模拟器侧 开始/暂停/重置（管进程），又要答题侧 提交/检查/重置（管判分），不可只做一套。

**接线（反"空按钮"）**：每个可视 `<button>`/`[role=button]`/`.btn`/可点卡片都要有 onclick 或 addEventListener，点下去**必有可观测变化**（DOM 改变/计数/弹窗/console 任一）；批量元素用事件委托。

**交付前自检（反"能 demo 就交付"）**：从用户原文逐条核对——
- **UI 承诺 ≡ 功能实现**：提示文字说的每个操作（拖拽/点击/输入）都真能做到；做不到就改文字，不留"嘴说拖拽手做滑块"的不一致。
- **入口 ≠ 功能**：每个"下一步/开始学习/查看详情"按钮点击后有真实模式切换/新流程，而非仅重置。
- **量词 = 件数**：用户说 N 个/M 类，产物就出现对应数量，不为"简洁"减项。
- **流程闭环**：用户描述的 A→B→C 多步流程三段都做。
- **具体 > 抽象**：真实景物（山河/角色/建筑）用真实素材或详细 SVG，禁用单色几何形代替。

**硬约束**：① 上述类型未显式声明核心闭环契约 → **不得 `create_file`**；② 契约每环节都要由代码真实实现（如 24 点必须有可点击的 +−×÷ 并参与计算）；③ 契约项未全部落地 → **不得 `terminate`**。

**spec 产出**：核心玩法闭环作为 spec 的 `core-loop` 字段——并入下方「验收要点 spec」统一产出（所有产物通用，不止游戏）。

## 验收要点 spec（**所有产物必做，不止游戏**）

**凡用户给了"可机检硬要求"，就在 `<head>` 写一行 spec 注释**——它是第 1 步抽取的验收要点的机读形式，供 test-html 读回逐条机检。
**不要因为"这不是游戏/没有核心玩法"就跳过**：PPT 课件、读书笔记、试卷讲评、听算系统同样有可机检要求（配色/页数/字号/音频/数据回收/格式…），都要写 spec。

```
<!-- spec: requirements=数量/页数/字号/学段等逐条; forbid=<禁止项>; require=<必含项,如 audio,POST-to-URL,28px>; count=<份数>; core-loop=<仅游戏类:最小可玩闭环> -->
```
- 放 `<head>` 内（不占首行，避开首行注释规则）；字段按本次实际需求填，无则省。
- 大则外置为资源、注释只写 `<!-- spec-ref: resourceId=<id> -->`；任务级要点同时写入 `task_write` 的 `spec` 字段（跨轮抗压缩）。
- **示例**（试卷讲评类）：`<!-- spec: requirements=40分钟,突出重难点,突出易错点; require=逐题讲解,答案对照; count=1 -->`
- **示例**（投票器类）：`<!-- spec: require=多选,1/2/3分,POST-to-https://quickform.cn/api/e1spsmp8db,实时结果; forbid=无数据回收 -->`

## 内容组织模式（决定 HTML 骨架，先于布局）

不要把大块内容摊平成单屏滚动长列表（单页 HTML 最常见质量问题）。

| 内容规模 | 骨架 |
|---|---|
| 单一主题、单屏可容纳 | 单页直接展示 |
| **并列多主题**（练习/答案、课时1/2、不同模式） | **Tabs**：按钮 `data-page` 切 `.active`；`.page{display:none}`+`.page.active{display:block}`；激活态 `border-bottom:2px solid var(--primary)` |
| **多个同类条目**（10+ 练习题/词表/步骤） | **Accordion**：原生 `<details><summary>` + "展开/收起全部"按钮 |
| 既长又有并列主题 | Tabs + Accordion 组合 |

判断信号词：「练习题/列表/清单>5」「练习+答案」「课时1/2」「梳理 N 个(N≥10)」→ 必用 Tabs 或 Accordion。

## 交互粒度保留（反扁平化）

用户提到的**每个具体数值/分类/模式/选项**都要有**专属控件**，不为"简洁"合并：

| 需求表达 | 必须生成 | 禁止 |
|---|---|---|
| "+1/-1/+5/+10 快捷加减" | 每值一个独立按钮 | 一个通用步进器替代全部 |
| "不同方案/模式/难度" | `<select>` 或一组 radio | 只给一个默认、不给选择器 |
| "可调参数(角度/速度/数量)" | `<input type=range/number>` | 硬编码固定参数 |
| "重置/重新开始" | 独立"重置"按钮 | 混入其他操作 |
| 多课时/多场景 | Tab/Accordion 分开 | 只做第 1 个 |

口诀：用户用"可以 A 也可以 B 还可以 C"的枚举句式 → A/B/C 是三个控件，不是一个控件的三个值。

## 设计决策细则

- **配色**：数学场景按 `math-design/workflow.md` Phase 2-4 **机械抽选** 1 套 A/B 色板（查表优先；未命中走算式 `hash = ord(keyword[0])×7 + ord(keyword[-1])×5 + len(prompt)`、`palette_id = X-{(hash mod N)+1:02d}`；布局变体 `layout = (ord(keyword[0]) + len(prompt)) mod 3` → L1 底栏/L2 左栏/L3 右栏；推理中显式输出 `keyword/pool/source/palette_id` + layout 数字，禁未声明算式直接落 L1）；非数学场景按学科选基调（科学-蓝绿 / 语文-暖色 / 物理化学-沉稳），输出 `primary/secondary/accent/background/foreground` 5 个 CSS 变量，禁整页硬编码颜色。参考配色 5 方案见 `references/tech-details.md`。
- **排版**：数学 H1=40px/H2=30px/Body=28px/按钮 80px（禁 42px）；非数学最多 2 个字体家族、标题为正文 1.5-2 倍、行高 1.4-1.6。
- **布局**：左右（控制器+展示区）或上下（说明+演示）；数学优先 math-design 一屏（Header+Stage+Controls，Stage flex 居中，`#controls` 禁滚动）。
- **动画**：服务教学不炫技，优先 CSS `transform`/`opacity`，0.3-0.8s，60fps。库选型表与各库 API 坑（Anime.js easing 白名单 / GSAP `ease` / p5/Three.js）见 `references/tech-details.md`。
- **可打印材料**（A4/练习册/字帖/试卷）：`<section class="page">×N`，`@page{size:A4;margin:15mm}`、`.page{page-break-after:always}`、`@media print` 隐藏按钮；每页必须真实内容、禁占位符。
- **教学 narrative 保留**：用户要「教案/备课/完整课时/学习目标/重难点/知识点讲解/分步说明」时，产物除交互动画外**须同时保留教学说明段落**（顶部学习目标+知识点简介 / 中部交互演示 / 底部分步讲解或思考题）；禁简化为"只留动画、删文字说明"。
- **数学网格纪律**：坐标轴/坐标系默认无背景方格；“点坐标/读坐标/展示点位置”不等于要求网格，禁止生成 `grid-layer/.grid-line/renderGrid()`。用户明确要求方格线/坐标网格/方格纸/点阵纸/几何画布/借助方格读点/吸附时，必须按 `math-design/grid-templates.md` 生成 SVG/Canvas `grid-layer`，与点、线、轴、刻度共用同一套 `origin/unit/scale`。用户要求“一个正方形对应一个格子 / 正方形拼成图形 / 图形嵌入网格 / 周长面积数格子”时，只约束该图形区域进入单位正方形拼图分支：统一 `CELL` 与 `cells` 数据，不要求整页其它区域照此实现。CSS `background-image`/`linear-gradient` 网格只允许作非测量装饰，不能承担读数、定位或吸附。数学 3D 几何禁页面平面 CSS 网格背景，必须使用肉眼可见、可测试的 3D 场景地面网格对象；3D 分支必须暴露 `window.__math3d.ground/grid`，网格透明度、地面透明度和 OrbitControls 约束必须通过 `grid-templates.md` 的硬阈值。

## 关键技术硬约束（细节见 `references/tech-details.md`）

- **媒体**：严禁 base64（小 SVG data URI 除外）；图片/音频 URL 必须真实获取、**仅飞象域白名单**（`generate_image`/`generate_voice` 返回、飞象素材库、`read_file` 读到的 URL）；**严禁编造文件名/路径**（`*_placeholder.png` 等）；不需要真实媒体时用 SVG/Emoji/CSS。
- **自包含**：禁 `{{placeholder}}`/`${data.xxx}`/`<!-- TODO -->`；所有数据以字面量写进 HTML/JS。
- **JS 字符串**：含中文用模板字符串或转义，禁裸引号嵌套（防 SyntaxError）。
- **公式**：MathJax 3，行内 `\(...\)` 块级 `\[...\]`，**严禁** `$...$`/`$$...$$`；所有用户可见数学符号都要包裹；CDN 用 System Prompt 白名单 URL 放 `<head>`。
- **外部库**：常用库（Tailwind/Anime.js/GSAP/p5/Three.js+OrbitControls/MathJax）用 System Prompt「外部库 CDN 白名单」给的 URL，禁改公共源；未列库才用 cdnjs/jsdelivr；**禁引入幻觉库/路径**。
- **CSS 兼容**：现代特性加 `-webkit-`（backdrop-filter/appearance/background-clip:text/transform/transition/user-select）；目标 Chrome ≥ 63；卡片默认不加投影。
- **图片完整可见**（反半截裁切）、**3D 贴图铁律**（禁外站 texture URL）：见 `references/tech-details.md`。

## 质量标准（terminate 前必检）

**验收要点 spec（硬门，所有产物）**：□ `<head>` 有 spec 注释，且**覆盖用户每条可机检硬要求**（数量/页数/配色/字号/音频/格式/数据回收/学段…）——**缺 spec 或漏要点 → 不得 terminate，补齐再交付**。（少数纯文稿类确无可机检要求可省，但需在推理里说明"无硬要求"。）

**核心机制（可玩/有核心功能类）**：□ 已声明最小可玩闭环且逐环节由代码实现（如 24 点 +−×÷ 可点击并参与计算，非只画数字）□ spec 含 `core-loop` 字段 + `task_write.spec` □ 不是只做外壳。

**内容/交互**：□ ≥3 并列主题用 Tabs □ 6+ 同类条目用 Accordion □ 未摊平成长滚动页 □ 用户枚举的每个数值/分类/模式都有独立控件 □ 模拟器有开始/暂停/重置 □ 答题/拖拽有提交+反馈+重置。

**自包含/事件**：□ 每个按钮都有 handler 且点击有可观测变化 □ 无 `{{}}`/`${data.x}`/TODO □ 无非飞象域媒体 URL、无编造文件名 □ 修改场景以成功 edit_file/create_file 收尾 □ 本轮未 `ask_user`。

**需求落实**：□ UI 承诺≡功能 □ 入口=功能 □ 量词=件数 □ 流程 A→B→C 三段都做 □ 具体景物未被几何形替代。

**视觉/通用**：□ 数学场景：已读 math-design 子文件 + 首行 palette 注释 + 推理声明 keyword/pool/source/palette_id + Stage flex 居中 + `#controls` 无滚动 □ 坐标/方格纸/点阵纸/几何画布/单位正方形拼图/3D 地面网格场景已按 `grid-templates.md` 选择合适分支，未用 CSS 背景伪装可读数网格 □ 单位正方形拼图：所有图形共用 `CELL` 和 `cells` 数据，方块边界与网格线误差 ≤1px，周长红线由外轮廓计算而不是给每格单独描边 □ 数学 3D：`window.__math3d.ground/grid` 存在、`GridHelper` 可见、`grid.material.opacity >= 0.55`、`ground.material.opacity <= 0.25`、`controls.enablePan === false`、`controls.maxPolarAngle < Math.PI/2`、`camera.aspect` 与 renderer/container 宽高比误差 ≤0.02，且最后一次 `test_html` 通过后才发布 □ 非数学：未 read math-design + 首行 `<!DOCTYPE html>` 无 math-design 注释 + ≥3 CSS 变量 □ ≥1 个过渡/`:hover` □ 有主体的图主体完整可见 □ 公式全用 `\(...\)`/`\[...\]` 无 `$` □ 现代 CSS 加 `-webkit-` □ 对比度 WCAG AA □ 兼容移动/PC 触摸与鼠标。

---

> 完整示例（数学查表/算式 + 非数学多轮）、典型错误案例（空壳/CORS/空按钮/缺判分/误写注释/裁图）见 `references/examples-and-pitfalls.md`。
> 3D 选型踩坑 / CDN 注入 / CSS 前缀清单 / 动画库 API 坑 / 图片边界规则 / 参考配色 5 方案 / 媒体白名单详单见 `references/tech-details.md`。
