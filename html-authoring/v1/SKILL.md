---
name: html-authoring
description: 生成或修改单页教学交互 HTML（动画、单页课件、教学海报、教学网页、可打印练习册/字帖）时使用，覆盖视觉设计决策与技术实现规范（配色布局、动画选型、浏览器兼容、媒体资源）。不适用于多页 PPT 课件、纯知识问答、不涉及 HTML 的场景。
---

# html-authoring

## 适用场景

- 用户要求创建交互式教学动画、单页 HTML 页面、基于 HTML 的图片/视频/海报/课件
- 用户要求创建可打印教学材料（A4 练习册、字帖、习题册、试卷等多页打印场景）
- 用户要求修改已有 HTML 文件（改配色、改交互、改内容、改布局）
- 需要为教学场景做视觉设计决策（选配色、定布局、选动画效果）

**不适用于：**
- 纯知识讲解、教学问答等不涉及 HTML 生成的场景
- 多页 PPT 式课件（由 `courseware-*` 相关技能处理）

## 前置条件

需要以下工具可用，以运行时实际工具清单为准：
- **检索类**：`search_papers`、`search_web`、`search_knowledge`、`read_url`
- **媒体生成类**：`generate_image`、`generate_voice`、`edit_image`
- **文件操作类**：`create_file`、`read_file`、`edit_file`
- **流程控制类**：`terminate`

## 工作流程

### 1. 理解需求与视觉定位
- 确认学科、学段、核心知识点（决定视觉基调：小学数学偏活泼，高中物理偏严谨）
- 需求模糊时按教学经验选最合理默认继续，**禁止 `ask_user`**；在最终回复里以"默认按 X 处理，如需调整请告知"声明假设

### 2. 设计决策（未明确指定时由 Agent 决定）
按下列顺序确定：
- **产物形态分流**（**最先决策**）：
  - 交互/动画类（单页 HTML）→ 走"内容组织模式"决定骨架
  - 可打印材料类（A4 练习册/字帖/试卷，关键词："打印""A4""练习册""字帖""习题册""试卷""N 页"）→ 走"多页打印骨架"
  - 模拟器/实时动画类（关键词见"模拟器 / 实时动画场景控制 UI"章节）→ **必须保留 开始/暂停/重置 三个控制按钮**，禁止退化为纯 CSS 循环
- **内容组织模式**（**先于布局决定**，见"内容组织模式"章节）：
  - 短内容（单屏可容纳）→ 单页滚动
  - 中等内容（3-5 个并列主区块，如"练习/答案""不同课时""不同场景"）→ **标签页切换（Tabs）**
  - 长内容（6+ 区块、或含大量列表）→ **标签页 + 折叠面板（Accordion）组合**
  - 禁止直接把大量内容摊平成一条滚动长页
- **配色方案**：从"参考配色"中选择或自定义；输出 `primary / secondary / accent / background / foreground` 5 个 Tailwind 设计令牌
- **布局结构**：左右结构（控制器 + 展示区）或上下结构（说明 + 演示）
- **排版**：最多 2 个字体家族；标题为正文 1.5–2 倍；行高 1.4–1.6
- **动画类型**：按"动画效果选择指南"选库
- **交互粒度**（见"交互粒度保留原则"章节）：用户需求中出现的每个具体数值/分类/模式都必须映射到一个独立控件，不要为"简洁"而合并

### 3. 准备素材（按需并行）
- 图片 → `generate_image`；音频 → `generate_voice` 或 Web Audio API（代码生成音效）
- 已有参考资料 → `search_web` / `search_knowledge` / `search_papers` / `read_url`
- **【关键】图片和 generate_voice 生成的音频必须拿到 URL，严禁 base64**
- **【关键】禁止引用任何非飞象域的外站资源 URL**（见"媒体资源来源白名单"）
- **【关键】所有媒体资源 URL 必须是真实获取的**（见"媒体资源来源白名单"前 3 项：`generate_image` / `generate_voice` 返回值、飞象素材库、`read_file` 读到的已有 URL），**严禁凭想象拼文件名/路径**（`*_placeholder.png`、`temp_*.png`、`example.jpg` 等一律禁止）；不需要真实媒体时用 SVG / Emoji / CSS 图形替代

### 4. 生成或修改 HTML
- 首次创建 → `create_file`
- **修改已有 HTML（必做）**：
  1. 用户意图是"改/调整/优化/修复/补充/重做"现有交付物时，属于修改场景
  2. 先 `read_file` 目标 HTML；未提供 resourceId 时按"用户最近一次交付物"假设继续，**不要 `ask_user`**
  3. `read_file` 成功后用 `edit_file` 增量修改，保持原配色令牌、布局骨架、控件集合稳定，只改用户要求的部分
  4. 禁止借"改一处"之机把整页重写、简化或改换风格
  5. **收尾必须是成功的 `edit_file` / `create_file` + `terminate`**，禁止以纯文字总结结束本轮
- 严格遵守下方"技术约束规则"

### 5. 交付前对照原始需求自检（**必做，terminate 前最后一步**）

见下方"需求落实度自检"章节。只有所有条目打钩后才调用 `terminate`。

### 6. 回复用户
- 使用指南：功能说明（1-2 句）+ 操作方式（按钮/滑块/手势）
- 修改场景：列出"修改内容 + 效果变化"
- 不贴 HTML 源码、不输出下载链接、不讲技术实现细节
- 调用 `terminate` 结束

## 领域知识

### 内容组织模式（决定 HTML 骨架）

一份单页 HTML 的"总信息量"决定了骨架怎么搭。**不要把一大块内容直接摊平成单屏滚动列表**，这是单页 HTML 最常见的质量问题。

| 内容规模判据 | 骨架 | 控件 |
|---|---|---|
| 单一主题、单屏可容纳 | 单页 | 直接展示 |
| **并列多主题**（如"练习页/答案页"、"课时 1/课时 2"、"不同演示模式"） | **标签页（Tabs）** | 顶部/侧栏 tab 按钮，`showPage(id)` 切换 `.active` 类 |
| **多个同类条目**（如 10+ 练习题、词汇表、步骤列表） | **折叠面板（Accordion）** | 每条可展开/收起；带"展开全部/收起全部"按钮 |
| 既长又有并列主题 | **Tabs + Accordion 组合** | 外层 Tab 切场景，内层 Accordion 展开单题 |

**标签页风格约定（项目统一）：**
- 按钮加 `data-page="{sectionId}"` attr，点击时切换 `.active` class
- `.page { display:none }` + `.page.active { display:block }` 控制显隐
- 激活态 tab 加 `border-bottom: 2px solid var(--primary)` 视觉反馈

折叠面板直接用原生 `<details>` + `<summary>`，并加"展开全部/收起全部"顶部按钮。

**判断信号词：** 用户需求里出现以下词之一 → 必须用 Tabs 或 Accordion：
- "练习题/列表/清单" 且数量 > 5
- "练习 + 答案"、"正文 + 讲解"、"课时 1 / 课时 2"、"不同模式/不同方案"
- "梳理 N 个/N 道"（N ≥ 10）

### 多页打印骨架（A4 练习册 / 字帖 / 习题册 / 试卷）

**触发条件：** 用户需求含"打印/A4/练习册/字帖/习题册/试卷/N 页/可下载打印"等词。

**骨架规则（必须遵守）：**
1. 结构：`<section class="page">` × N（N 由需求决定，默认 4 页；每页必须在代码里显式存在）
2. CSS：
   ```css
   @page { size: A4 portrait; margin: 15mm; }
   .page { page-break-after: always; width: 190mm; min-height: 277mm; }
   @media print { .no-print, .print-btn, header, footer { display: none; } }
   ```
3. 顶部"打印"按钮（`.print-btn`）调用 `window.print()`
4. **每一页都必须包含真实教学内容**（题目/字帖格子/练习正文），禁止仅放占位符（如"第 1 页内容"、"placeholder"、空 div）
5. **禁止使用运行时模板占位符**：不得出现 `{{content}}` / `${data.xxx}` / `<!-- TODO -->` / `data.content` 等需外部注入的引用；所有数据必须在 `create_file` 时以字面量形式写进 HTML/JS

### 交互粒度保留原则（反扁平化）

用户需求中提到的**每一个具体数值、分类、模式、选项**，都必须在 UI 上有**专属控件**，不要为"更简洁"把它们合并成通用控件。

| 需求中出现的表达 | 必须生成的控件 | **禁止**替代方案 |
|---|---|---|
| "+1 / -1 / +5 / +10 等快捷加减分" | 每个数值一个独立按钮 | 用一个通用 `+` `-` 步进器替代全部快捷值 |
| "全员 +5"、"批量操作" | 独立"批量"按钮 | 合并进单人操作 |
| "不同方案/模式/主题/难度" | `<select>` 或一组 radio | 一次只给一个默认，不给选择器 |
| "可调参数（角度/速度/数量/位置）" | `<input type="range">` 或 `<input type="number">` | 硬编码成固定参数 |
| "重置/重新开始" | 独立"重置"按钮 | 混入其他操作 |
| 多课时、多场景 | Tab/Accordion 分开 | 只做第 1 个场景 |

**判断口诀：** 如果用户用到"可以 A，也可以 B，还可以 C"这种枚举句式，**A/B/C 就是三个控件，不是一个控件的三个可能值**。

### 事件绑定完整性（反"空按钮"）

**每一个可视 `<button>`、`[role="button"]`、`.btn`、可点击卡片都必须有事件处理器**。只画 UI 不接线是单页 HTML 最常见的质量问题。

| 实践 | 正确 | 错误 |
|---|---|---|
| 所有按钮都接 handler | `<button onclick="addScore(1)">+1</button>` 或 `document.querySelectorAll('.pet-card').forEach(el => el.addEventListener('click', onPetClick))` | `<button>+1</button>` 裸标签，只有 UI 没有 JS |
| 批量生成按钮时事件委托 | 父容器挂 `click` 监听 + `e.target.dataset.*` 分派 | 每个按钮都需要独立 handler 却漏写 |
| 可视元素必须"看得见 = 摸得着" | 看到的按钮点下去**必然**有 DOM 变化 / console.log / 状态更新 | 按钮点了无反应（静默失败） |

**自检：** 生成完代码后在脑内走查每一个 `<button>`，确认它的 click 会触发一段**可观测**的行为（DOM 改变、计数改变、弹窗、alert、console 输出任一即可）。

### 模拟器 / 实时动画场景控制 UI（反"裸 CSS 循环"）

**触发词表（统一维护）：** 用户需求里出现以下词之一 → 本规则生效：
- "模拟 / 模拟器 / 仿真"
- "实时 / 动态 / 动态显示 / 实时变化"
- "抽取 / 计数 / 试验 / 统计实验"
- "运动 / 轨迹 / 粒子 / 动画循环"

**必须包含：**
1. **开始按钮**（或"播放"）— 初始状态为"未启动"，点击才开始
2. **暂停按钮** — 运行中可暂停
3. **重置按钮** — 恢复到初始状态
4. 当前状态显示（如计数器、进度条）

**禁止：** 页面加载就进入无限 CSS `animation: xxx infinite`，没有任何控制入口。

### 互动答题/判定类场景状态反馈（反"断头闭环"）

当需求属于 **拖拽匹配 / 连线配对 / 填空作答 / 分类归位 / 选择题 / 韦恩图归类 / 排序题** 等"用户操作—系统判分"形态时：

**必须包含（缺一即为失败交付）：**
1. **"提交" / "检查答案" / "判分"按钮** — 无按钮 = 无法收尾；禁止只依赖"放下就自动判分"的隐式交互
2. **"重置" / "重新开始" / "清空"按钮** — 让用户再来一遍
3. **结果反馈态** — 提交后必须显示对/错/得分/正确答案对照；禁止静默
4. 错题重做或查看正确答案的入口（至少二选一）

**判断信号词：** 用户需求里出现以下词之一 → 本规则生效：
- "拖拽到/拖放到/拖动到/吸附到"
- "匹配/配对/对应/连线"
- "分类/归类/归位/填到/放入"
- "挑战/答题/测验/闯关/挑战赛"
- "检查答案/判分/评分/得分"

**与模拟器规则并存时（如"计数挑战""抽取游戏"）：** 两套控件**并存而非替代**——模拟器侧的 开始/暂停/重置 管**进程**，本规则的 提交/检查答案/重置 管**判分**。题区底部一行放判分控件，模拟器侧边或顶部放进程控件。

**典型反例：**
- 现象：韦恩图/分类题，特征词卡片可拖入左/中/右区；做完后**没有"检查答案"按钮**，用户无法知道自己做得对不对
- 根因：只做了"放下就算数"的隐式交互，未补提交/判分控件
- 修复：按本规则补"检查答案"按钮 + 提交后显示对错反馈 + "重新开始"按钮；三者并列放在题区底部

### 需求落实度自检（反"能 demo 就交付"）

每次 `create_file` / `edit_file` 生成完毕、`terminate` 之前必须执行。缺此步骤即为失败交付。

**步骤：**
1. 从用户**原始输入原文**中抽取"显式要求清单"——每一条都要点名：
   - 具体数量词（"2 个挑战区"、"3 类句型"、"6 张图"、"N 张卡片"）
   - 具体操作方式（"拖拽"、"点击"、"滑动"、"输入"）
   - 具体素材类型（"真实地图"、"山脉河流森林"、"井盖"、"某个角色"）
   - 具体步骤 / 流程节点（"检测→结果→再逐一学习"、"输入→生成→分享"）
   - 具体呈现形式（"彩色线段标注"、"弹窗显示"、"进度条"）
2. 对照生成的 HTML，逐条标记：✅ 已实现且方式对齐 / ⚠️ 实现了但方式偏离 / ❌ 未实现
3. 存在任何 ⚠️ 或 ❌ → 继续 `edit_file` 补齐，**不要** `terminate`

**硬约束：**
- **UI 承诺 ≡ 功能实现**：HTML 中任何提示文字（"拖拽井盖"、"点击开始学习"）必须对应真实可用的机制。禁止"UI 写说可以做 X，点下去没反应或是别的行为"。若功能做不到，必须把提示文字改成真正可用的操作说明。
- **入口 ≠ 功能**：做了"下一步"、"开始学习"、"查看详情"、"进入练习"等按钮，必须实现对应的模式切换或新流程。按钮存在但点击后无变化、或只是重置回起点，属于失败交付。
- **具体 > 抽象**：用户提到真实景物（山脉/河流/森林/角色/建筑）时，优先 `generate_image` 或飞象素材库取真实素材；体量不允许时用详细 SVG 插画；**禁止**用单色几何形状（三角/圆/矩形）代替有名目的景物。
- **量词 = 件数**：用户说"N 个 X / M 类 Y"，产物必须出现对应数量，不得为"简洁"减项。
- **流程闭环**：用户描述了 "A→B→C" 的多步流程（如"检测→展示结果→再学习"），三段都要做；禁止只做第一段就交付。

**典型反例：**
- 反例 F（UI 欺骗）：提示文字写"拖拽井盖旋转"，但只有滑块、没有 `draggable` / mousedown handler → 补真实拖拽 *或* 把提示文字改成"用滑块旋转"；两者只能选一，不能留"嘴说拖拽，手做滑块"的不一致
- 反例 G（空入口）：识字游戏"检测结果→跟哪吒学习不认识的字"，实际点"开始学习"只是重开游戏 → 要做学习模式：逐字翻卡 + 上一个/下一个 + 读音/释义/笔顺展示
- 反例 H（减项）：需求"社区地图 3 类句型（问路/指路/描述位置）"，产物只做 2 类 → 补足第 3 类
- 反例 I（抽象代替具体）：需求"展示山脉河流森林的中国地图"，产物用三角形 + 蓝线 + 一堆绿点 → 换用飞象素材库手绘地图 *或* `generate_image` 生成，再叠加互动点

### 教学 narrative 保留规则

用户需求中出现以下词汇时，产物除了交互/动画之外，**必须同时保留教学说明段落**（不要只生成纯动画本体）：

- "教案/备课/完整课时/2 课时/教学设计"
- "学习目标/教学目标/重难点"
- "知识点讲解/原理说明"
- "分步说明/讲解流程"

这类场景的 HTML 应同时包含：
1. 顶部学习目标/知识点简介（`<h1>` + 2-4 个 `<p>` 或 `<ul>`）
2. 中部交互演示（Canvas/SVG/动画）
3. 底部分步讲解或思考题（`<ol>` 或 Accordion）

**禁止**：把教案类需求简化为"只保留动画演示、删掉文字说明"。

### 色彩系统

- 根据学科选：科学-蓝绿，数学-橙紫，语文-暖色
- 通过 Tailwind 设计令牌统一管理色彩（定义 `primary / secondary / accent / background / foreground` 5 个颜色），禁止整页硬编码颜色
- 渐变场景：标题文字渐变（hero 区）、按钮渐变（引导操作）、柔和背景渐变（营造氛围）

### 参考配色方案（5 个）

| 方案 | 风格 | 主题 | 背景 | 文字 | 点缀 | 字体 |
|------|------|------|------|------|------|------|
| 品牌色 | 清新简约 | #A7DBAD/#0A4737 | #D3E09C/#D8FBF7 | #0D2620/#60A0A0 | #FF6421/#A1CAF9 | 无衬线 |
| 复古绿 | 严谨教育 | #2D593E | #1D422B/#EBEDD4 | #021502/#AE7645 | #DC2626/#259525 | 有衬线（宋体/思源宋体） |
| 沉稳橙 | 信息聚焦 | #FF5600 | #F4F3EC | #0C0302/#74706E | #FF5600/#FF8941 | 无衬线 |
| 暗夜 | 科技神秘 | #868686 | #000000 或 #090B2F | #FFFFFF/#E4E4E4 | #4DFF4D/#FF2E26/#FF7710 | 不限 |
| 赛博 | 科技感 | #1A243C | #000000 或 #1C0C57 | #FFFFFF/#E4E4E4 | #175FFF/#F901F7/#67F844 | 不限 |

### 布局与微交互（项目约定）

- 响应式断点：< 768px 用 rem 缩放，>= 768px 撑满视口
- 卡片默认 **不加**投影；需要深度时 `shadow-lg` → 悬停升 `shadow-xl`
- 悬停上浮：卡片 `translateY(-8px)`、按钮 `translateY(-2px)`
- 标题前不加各种表符号（❤️/🎯 之类），正文内容允许 emoji

### 图片容器边界规则（反"半截裁切"）

**核心原则：** 所有插入 hero 区 / 场景卡 / 故事图的图片，**主体必须完整可见**，禁止被父容器 `overflow:hidden` 切掉半个头或半条腿。

**必守约束：**
1. **图片使用 `object-fit: contain` 而非 `cover`**，除非明确要用作背景装饰；`cover` 会裁切主体
2. 图片若定位到卡片边缘（如右下角装饰），**宽度不得 ≥ 50% 容器宽度**，否则必然出界
3. 若必须用绝对定位放小图，给容器 `overflow: visible` 或给图片 `max-width/max-height` + `object-fit: contain`
4. hero 大图必须放 `min-aspect-ratio` 保护区，避免窄容器把主体压成条
5. **严禁**把生成的人物/动物主体图放在"会被 `overflow:hidden` 的卡片边缘"——要么放中间，要么改为 `object-fit: contain` 整体缩放

**自检：** 生成代码后对每张有主体的图（人物/动物/物体），**脑内模拟一下父容器收到 `overflow:hidden` 后图的可见区**——若主体任何一部分落到容器外，必须调整布局或改 `contain`。

**典型反例：**
- 现象：寓言/故事类 hero 区右下角放了一张主体小图（如动物/人物），浏览器实际渲染时**主体被卡片边界切掉一大半**，画面失衡
- 根因：图片 `position: absolute; right: 0; bottom: 0` 且父容器 `overflow: hidden`，图又贴边放，主体必然出界
- 修复：把主体图宽度缩到卡片宽度的 30%、改 `object-fit: contain`、与文案卡错开排布


### 动画效果选择指南

**核心原则：** 动画服务于教学，不为炫技。优先 CSS `transform` / `opacity`，时长 0.3-0.8s，目标 60fps。

| 教学目的 | 动画类型 | 推荐库 |
|---------|---------|--------|
| 引导注意力 | 页面加载/元素入场 | Anime.js |
| 展示数据变化 | 数字滚动/图表动画 | Anime.js |
| 演示过程/步骤 | 图形逐步生成 | Anime.js |
| 复杂动画序列 | 时间轴编排 | GSAP |
| 数学/科学可视化 | 动态图形/粒子 | p5.js |
| 氛围装饰 | 粒子背景 | p5.js |
| 3D 几何/函数曲面 | 3D 渲染 | Three.js（复杂）/ p5.js WEBGL（简单） |

**常见动画库 API 坑：**
- **Anime.js**：easing 参数名 `easing: 'easeInOutQuad'`（官方白名单字符串），禁止随手写 `'ease-in-out'` / `'swing'` / `'bounce'` 等非官方名，会被忽略并 console warning
- **GSAP**：参数名是 `ease`（不是 `easing`），值如 `'power2.inOut'`；两库语法别混用
- 时间单位：Anime.js 用 ms，GSAP 用秒

### 媒体资源来源白名单（严格）

**只允许以下来源：**
1. `generate_image` 返回的 URL（飞象域 `*.fbcontent.cn`）
2. `generate_voice` 返回的 URL（飞象域）
3. 飞象素材库 URL（`musk-test.fbcontent.cn/pub-musk-ai-studio/*`）
4. 代码生成的内嵌 SVG / Canvas 绘制 / CSS 图形
5. Data URI **仅限**小体积 SVG（`data:image/svg+xml,...`）

**严禁：**
- ❌ `https://storage.googleapis.com/*`
- ❌ `https://*.amazonaws.com/*`
- ❌ `https://unsplash.com/*`、`https://images.pexels.com/*` 等图库
- ❌ `https://raw.githubusercontent.com/*`、随手从搜索结果硬编码的图片 URL
- ❌ 任何 Three.js/p5.js 示例教程里 copy 过来的 texture 资源路径
- ❌ 编造的媒体资源 URL（`*_placeholder.png`、`temp_*.png`、`example.jpg` 等凭想象拼出来的文件名/路径），即使拼成飞象域也不行——必须是白名单前 3 项真实返回的 URL

### 技术约束规则（必须遵守）

1. **媒体资源**：严禁 base64 编码图片和音频（小体积 SVG data URI 除外）；外部图片/贴图必须来自"媒体资源来源白名单"
2. **自包含**：产物 HTML 必须能**完全独立运行**。禁止出现 `{{placeholder}}` / `${data.xxx}` / `<!-- TODO -->` / 任何未被替换的模板变量；所有真实数据必须以字面量写进 HTML/JS
3. **事件绑定**：每一个可视 `<button>`、`[role="button"]`、`.btn`、可点击卡片必须有 onclick 或 addEventListener 绑定，禁止"只画 UI 不接线"
4. **外部库引用**：必须从下方"CDN 资源配置"白名单中选择库；白名单内的库**只能使用列出的自定义 CDN 地址**（不要写 cdnjs / jsdelivr 等公共源），未在白名单中的库才允许使用公共 CDN（cdnjs / jsdelivr）。**严禁引入白名单与公共 CDN 都不存在的、自己想象出来的库或路径**
5. **CSS 兼容性**：所有现代 CSS 特性必须添加 `-webkit-` 前缀以支持 Chrome >= 63
6. **响应式**：< 768px 使用 rem 缩放，>= 768px 撑满视口
7. **数学表达式**：使用 LaTeX 标准语法（MathJax 3 渲染），行内公式定界符**必须**用 `\(...\)`、块级公式用 `\[...\]`，**严禁** `$...$` 或 `$$...$$`，详见下方"数学公式渲染规范（MathJax 3）"
8. **JS 中文引号**：含中文字符串用模板字符串或转义，禁止裸引号嵌套

### CDN 资源配置

**【必需】优先使用自定义 CDN：**
为保证加载稳定性和速度，以下常用库已上传至自定义 CDN，**必须使用自定义地址**。未列出的库可使用公共 CDN（cdnjs / jsdelivr）。

**自定义 CDN 库列表：**

```html
<!-- Tailwind CSS 3.4.17 -->
<script src="https://metis-online.fbcontent.cn/metis-misc/zgLDUdmazTYc0B4K6Cor.js"></script>

<!-- Anime.js 3.2.1 -->
<script src="https://metis-online.fbcontent.cn/metis-misc/zZZY40t7WJC7UdQCPACm.js"></script>

<!-- p5.js 1.4.0 -->
<script src="https://metis-online.fbcontent.cn/metis-misc/cnObWiSohGePYbyhB6LlQ.js"></script>

<!-- GSAP 3.12.2 -->
<script src="https://metis-online.fbcontent.cn/metis-misc/OttLWDhjhTYFN64hB5VKG.js"></script>

<!-- Three.js r128 -->
<script src="https://metis-online.fbcontent.cn/metis-misc/RzWcgrRY7zuXErSSLsDmh0.js"></script>
<!-- three@0.128.0/examples/js/controls/OrbitControls.js -->
<script src="https://metis-online.fbcontent.cn/metis-misc/PHKmR6MjMLnuPRSU9CYwog.js"></script>

<!-- MathJax 3（用于 LaTeX 渲染） -->
<script src="https://metis-online.fbcontent.cn/metis-misc/blER0Bn7vsa2JER9IEssf8.js"></script>

<!-- Core.js 3.43.0（Polyfill 兼容库） -->
<script src="https://metis-online.fbcontent.cn/metis-lectio/V5RrzkfjBw62B3K869l3NX.js"></script>
```

**使用规则：**
- 上述列出的库**必须使用自定义 CDN 地址**，禁止改写成 cdnjs / jsdelivr / unpkg 等公共源
- 未列出的库（如 D3.js、ECharts、Hanziwriter 等）可使用公共 CDN，示例：
  - D3.js：`https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.0/d3.min.js`
  - ECharts：`https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.0/echarts.min.js`
  - Hanziwriter：`https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js`
- **禁止凭印象写库名/路径**：不在白名单也不属于上述常见公共库的，先确认确有此库再引入；宁可用白名单内已有库的能力组合替代，也不要引入幻觉出来的库

### 数学公式渲染规范（MathJax 3）

使用 MathJax 3 渲染公式，CDN 见上方"CDN 资源配置"中的 MathJax 3 条目：

```html
<script src="https://metis-online.fbcontent.cn/metis-misc/blER0Bn7vsa2JER9IEssf8.js"></script>
```

**【关键】定界符规范：**
HTML 内容中的数学公式**必须使用 `\(...\)` 作为行内公式定界符**，严禁使用 `$...$` 格式。MathJax 默认配置仅识别标准 LaTeX 定界符，使用错误的定界符会导致公式无法渲染显示。

- 正确示例：`若 \(a=b\)`、`\(x+1=6\)`、`\(\pm\sqrt{10}\)`
- 错误示例：`若 $a=b$`、`$x+1=6$`、`$\pm\sqrt{10}$`
- 适用范围：HTML 中所有数学表达式、变量、符号都必须遵循此规范（包括标题、说明文本、按钮文案、tooltip 等任何用户可见位置）
- 块级公式使用 `\[...\]`，同样禁止 `$$...$$`

### HTML 结构要求

- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` 必需
- 语义化标签：`<main>` / `<section>` / `<article>`，交互元素配完整 ARIA
- Tailwind 脚本放 `<head>`，动画库按需引入
- 重复页面片段（如控制器组件）用 `<template>` + `content.cloneNode(true)` 复用

### 3D 图形选型与踩坑

**选型：** 简单几何体/旋转展示 → p5.js WEBGL；复杂函数曲面、自定义几何、高级材质 → Three.js。

**贴图资源铁律：** 严禁从教程/示例里 copy 外站 texture URL（如 `storage.googleapis.com/llm-ep-multimodal/earth_day.jpg`）。需要贴图时：
- 纯色/渐变 / 星空地球等程序化纹理 → `THREE.CanvasTexture` + 代码绘制（`Math.random()` + 渐变）
- 真实照片 → `generate_image` 产出飞象域 URL
- **严禁** 引用 GCS / GitHub / 任何外站 URL

**p5.js 常见错误：**
- 覆盖内置函数名（禁止用 `sphere / box / cylinder / cone / torus / plane` 作变量名）
- `createCanvas` 忘记传 `WEBGL` 参数

**Three.js 常见错误：**
- 未显式引入 `OrbitControls`（独立文件）
- 场景未设光照，物体全黑
- 忘记 `requestAnimationFrame(animate)` 循环
- 相机位置留在原点看不到物体
- 开了 `enableDamping` 但忘记 `controls.update()`
- 外部贴图 CORS 失败 → 严格按"媒体资源来源白名单"

### CSS 浏览器前缀（目标 Chrome >= 63）

需加 `-webkit-` 前缀的属性：`backdrop-filter`、`appearance`（含 `input[type="range"]`）、`background-clip: text` + `text-fill-color`、`transform`、`transition`、`user-select`。

`box-shadow` Chrome 63 已原生支持，无需前缀。

## 教学设计要点

**认知负荷：**
- 一次一个核心概念
- 5-8 个分步展示
- 渐进式信息呈现

**必备交互：** 播放/暂停/重置、前进/后退、速度调节（0.5x-2x）、进度跳转。

**认知支架：** 关键概念高亮、分步文字说明、常见误区纠正、提示帮助。

## 质量标准

**内容组织（必检）：**
- [ ] 内容 ≥ 3 个并列主题时，已使用 Tabs 分组
- [ ] 内容含 6+ 同类条目时，已使用 Accordion/折叠面板
- [ ] 未把大量内容摊平为一条长滚动页
- [ ] **多页打印材料：每页都有真实内容（题目/字帖/正文），无占位符**

**交互粒度（必检）：**
- [ ] 用户需求中枚举的每个具体数值/分类/模式都有独立控件
- [ ] 需求含"可选/可切换/不同"词汇时，存在 `<select>` 或 radio 组
- [ ] 需求含"参数/角度/速度/数量可调"时，存在 `<input type="range">` 或 `number`
- [ ] 需求含"教案/完整课时/多课时"时，页面同时含教学说明段落 + 交互演示
- [ ] **需求命中模拟器触发词表（模拟/实时/动态/抽取/计数/试验/粒子等）时，含 开始/暂停/重置 三个控制按钮**
- [ ] **需求含"拖拽/匹配/分类/归位/答题/判分"时，含"提交/检查答案"按钮 + 重置按钮 + 提交后显示对错反馈**

**自包含与事件绑定（必检）：**
- [ ] **每个 `<button>` / `[role="button"]` / `.btn` 都有 onclick 或 addEventListener**
- [ ] **无 `{{xxx}}`、`${data.xxx}`、`<!-- TODO -->` 等未展开模板变量**
- [ ] **无任何非飞象域外部媒体 URL**（GCS、AWS S3、unsplash、raw.githubusercontent 等）
- [ ] 所有媒体资源 URL 都是真实获取的，无编造文件名/路径（`*_placeholder.png` / `temp_*.png` / `example.jpg` 等）
- [ ] 所有引用的图片/音频 URL 都能在 `musk-test.fbcontent.cn` 环境访问
- [ ] 本轮未调用 `ask_user`
- [ ] 修改场景以成功的 `edit_file` / `create_file` 收尾，非纯文字结束

**需求落实度（必检，terminate 前最后一关）：**
- [ ] 已从用户原文抽取显式要求清单（数量/方式/素材/步骤/呈现形式），逐条对照产物
- [ ] **UI 承诺 ≡ 功能实现**：提示文字里说的每个操作（拖拽/点击/输入…）都能真正做到
- [ ] **入口 = 功能**：每个"下一步/开始学习/进入练习"按钮点击后都有相应的模式切换或新流程，而非仅重置
- [ ] **具体 > 抽象**：真实景物（山河森林/角色/建筑）用真实素材或详细 SVG，未被单色几何形替代
- [ ] **量词 = 件数**：用户说的 N/M 个数量全部出现
- [ ] **流程闭环**：用户描述的多步流程（A→B→C）三段都做了，不仅停在第一段

**视觉层（必检）：**
- [ ] 至少 3 个 CSS 变量（或 Tailwind 设计令牌） —— 不得硬编码所有颜色
- [ ] 至少 1 个 `@keyframes` 或 `transition` 过渡效果
- [ ] 至少 1 个 `:hover` 反馈（按钮/卡片悬停态）
- [ ] **所有有主体的图片（人物/动物/物体）主体完整可见，未被父容器 `overflow:hidden` 裁切**

**基础通用：**
- [ ] 设计决策明确（配色/布局/字体/动画类型/内容组织模式）
- [ ] 色彩对比度满足 WCAG AA
- [ ] 动画时长 0.3-0.8s，优先 `transform` + `opacity`，目标 60fps
- [ ] 所有现代 CSS 属性已加 `-webkit-` 前缀
- [ ] HTML 含 viewport meta，语义化标签使用正确
- [ ] 白名单内库（Tailwind / Anime.js / p5.js / GSAP / Three.js + OrbitControls / MathJax / Core.js）全部使用"CDN 资源配置"中列出的自定义 CDN 地址
- [ ] 白名单外的库使用公共 CDN（cdnjs / jsdelivr 等）；无本地离线脚本，无凭空想象的库或路径
- [ ] 含数学公式时，全文行内公式用 `\(...\)`、块级公式用 `\[...\]`，无任何 `$...$` 或 `$$...$$`
- [ ] 无 base64 编码媒体资源
- [ ] 兼容移动端与 PC 端设备的鼠标、触摸事件
- [ ] 兼容不同分辨率的移动端与 PC 端
- [ ] 目标浏览器 Chrome >= 63

## 典型错误案例

### 案例 A：html 被生成成"演示"空壳
- **现象**：`<body>` 只渲染"演示"二字 + 一堆空 SVG；控制台报 `Cannot read properties of undefined (reading 'content')`
- **根因**：模板代码里写了 `const items = data.content.items.map(...)`，但 `data` 没在 HTML 里被实际注入
- **修复**：按"多页打印骨架"规则，所有题目内容在 `create_file` 时以字面量写进来；禁止出现 `data.xxx` 这类运行时引用

### 案例 B：3D 地球贴图加载失败
- **现象**：控制台 `Access to image at 'https://storage.googleapis.com/llm-ep-multimodal/earth_day.jpg' has been blocked by CORS`
- **根因**：Three.js 教程里抄了 GCS 的 texture URL 放进代码
- **修复**：按"媒体资源来源白名单"——要么程序化绘制 `CanvasTexture`，要么 `generate_image` 产出飞象域 URL

### 案例 C：40 个按钮只有 1 个会响应
- **现象**：班级积分系统有 40 个宠物卡片按钮，实际点击只有 1 个有效果
- **根因**：批量渲染时没有用事件委托，也没给每个卡片挂 handler
- **修复**：在父容器上 `addEventListener('click', e => { const card = e.target.closest('.pet-card'); if (card) handlePet(card.dataset.id); })`

### 案例 D：拖拽分类题没有"检查答案"按钮
- **现象**：特征词/图形卡片可拖入多个分类区，拖完就没下文了，用户不知道自己分得对不对
- **根因**：只做了"拖动 + 放下吸附"的隐式交互，缺最关键的判分/提交控件
- **修复**：按"互动答题/判定类场景状态反馈"规则，题区底部并排放"检查答案"+"重新开始"；提交后用绿色/红色边框或✓/✗ 标注每张卡是否归对

### 案例 E：hero 区图片被裁一半
- **现象**：hero 区右下角放主体图（人物/动物），实际渲染时主体被卡片边缘切掉一大块，画面失衡
- **根因**：图片 `absolute; right:0; bottom:0` + 父容器 `overflow:hidden` + 图太大贴边
- **修复**：按"图片容器边界规则"——图宽缩到容器 30% 以内 + `object-fit: contain` + 不贴边；或父容器改 `overflow: visible`

## 完整示例

**用户第 1 轮：** "做一个初中物理'力的分解'教学动画"

**Agent 第 1 轮（推理）：**
- 学段：初中；学科：物理 → 沉稳理性基调
- 设计决策：沉稳橙（`primary=#FF5600`、`background=#F4F3EC`、`foreground=#0C0302`、`accent=#FF8941`）；左右结构（左侧参数控制器、右侧矢量图动画）；Anime.js 驱动矢量箭头渐显 + 伸展
- 并行准备素材：`search_knowledge` 查询"力的分解"教学要点

（工具执行完成）

**Agent 第 2 轮：** 调用 `create_file`，按 HTML 结构要求 + 设计决策生成页面；矢量箭头在用户拖动角度/大小滑块时实时重绘。

（工具执行完成）

**Agent 第 3 轮（回复 + terminate）：**

> 已为您生成初中物理"力的分解"教学动画：
> - 左侧可调节合力的大小与方向，右侧实时显示分解后的两个分量及其夹角
> - 支持"平行四边形法则"和"三角形法则"两种演示模式切换
> - 点击"讲解"按钮可看到分步文字说明与关键概念提示

---

**用户第 2 轮：** "把主色改成蓝色"

**Agent 第 1 轮：** `read_file` 确认当前配色令牌 → `edit_file` 将 `primary` 改为 `#3B82F6`，同步调整 `accent` 的互补色。

（工具执行完成）

**Agent 第 2 轮（回复 + terminate）：**

> 已将主色调从橙色改为蓝色（`#3B82F6`），同时把点缀色调整为更柔和的 `#60A5FA`。整体视觉风格由活力偏暖转为沉稳偏冷，更贴合物理学科的理性感。
