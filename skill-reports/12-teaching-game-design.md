# 12 · teaching-game-design（教学游戏设计）深度分析

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/teaching-game-design/`
> 文件：`v1/SKILL.md`（233 行）、`SKILL_v1.md`（237 行，= v1 仅多一对 `<skill-content>` 包裹标签）、`SKILL_v1_CDN.md`（233 行，与 v1 逐字相同）、`SKILL_v1_CDN版.md`（233 行，同）。四份内容实质相同，无版本差异、无独立 CHANGELOG、无 templates/资产。
> 性质：纯方法论 / 架构规约 skill，不含可复制代码模板（只有片段示例），是"如何把教学游戏写得不乱、有心流"的设计指南。

---

## 1. 设计思路

### 1.1 定位：教学游戏的"架构铁律 + 心流配方"

与 drag-interaction 的"防崩工程"不同，teaching-game-design 是**上层设计规约**——它假设你已经会写交互（拖拽细节交给 drag-interaction），关心的是**游戏结构怎么组织、激励怎么设计、难度怎么爬坡**。

适用边界划得很清（`SKILL.md` L8–18）：要"让学生主动玩、有得分/关卡/激励"才用本 skill；静态讲解走 `html-authoring`、多页 PPT 走 `courseware-*`、题单走 `paper-generation`。

### 1.2 教学游戏的"本质特征四件套"（缺一不可）

L26–32 定义了什么才算教学游戏：**可玩性**（明确机制、主动参与）+ **即时反馈**（每次操作给对错+鼓励+分数）+ **难度递进**（多关卡保持心流）+ **激励机制**（积分/星级/连击/通关特效）。这是一个判定门槛，不满足就不是游戏、不该用本 skill。

### 1.3 架构铁律：状态机 + 单向数据流

skill 的硬核在「架构铁律」三条（L58–115），明显借鉴前端状态管理范式：

1. **生命周期状态机**：`GamePhase` 枚举（INTRO/PLAYING/PAUSED/LEVEL_COMPLETE/GAME_OVER/COMPLETED）+ 集中 `gameState` 对象（phase/level/score/combo/lives/timeLeft/answers… L68–75）。**所有事件 handler 第一行必须有阶段守卫** `if (gameState.phase !== PLAYING) return`（L82–89）。禁散落全局变量、禁跳守卫。
2. **单向数据流**：所有状态变更走集中 `updateState(action, payload)`，action 枚举化（`ANSWER_CORRECT`/`ANSWER_WRONG`/`NEXT_QUESTION`/`NEXT_LEVEL`/`RESTART`/`TIME_UP`），每次变更后调一次 `renderUI()`。**禁在事件回调里直接操作 DOM 改状态显示**（L93–97）。
3. **题库结构**：分关卡的 `questionBank.level1/level2…`，每题带 `type`（choice/drag/fill）+ 题干 + 答案（L99–115），每关 3-5 题、关卡间难度递增。

### 1.4 心流难度曲线

L51–56 给了 5 关爬坡配方：第 1 关人人能过建立信心 → 2-3 关引入干扰项 → 4-5 关接近目标难度 → 可选加分关给优等生成就感。配套游戏类型选择指南（L43–49）把"教学目标→游戏类型"映射成表（记忆→翻牌/选择闯关；理解→分类/排序；计算→限时竞速；应用→模拟/拖拽组装；分析→探索/策略）。

---

## 2. 迭代路线

**无独立 CHANGELOG，四份文件实质同一版本**（仅 `<skill-content>` 包裹标签差异）。从内容可见其成熟度信号：

- 「交互实现要点（项目踩坑）」一节（L155–172）是**实战沉淀**：拖拽必须鼠标+触摸双绑（`touchstart/move/end` 要 `{passive:false}` 才能 `preventDefault`，坐标 `e.touches?e.touches[0]:e`）；计时器单例化 `start/pause/resume`、`<=10s` 加 `.warning`、`<=0` 清 interval 后 `updateState('TIME_UP')`；移动端点击区 ≥44×44px、答题后延迟 0.8-1.2s 进下一题给消化时间。
- 注意：此处的拖拽建议（`mousedown`+`touchstart` 双绑）**与 drag-interaction 的硬约束直接冲突**——drag-interaction 反模式表第一条就是"`mousedown`+`touchstart` 双绑 → 触发顺序混乱"，要求 Pointer Events 单一入口。说明本 skill 的拖拽段成文较早 / 未与 drag-interaction 对齐，**真正写拖拽时应以 drag-interaction 为准**。
- 反馈系统量化到 Hz 级（答对 sine 880Hz/0.3s，答错 square 220Hz/0.4s，升级 523→659→784Hz 阶梯，L134–147，纯 Web Audio 不依赖外部资源），以及固定 CSS 类名 `.correct-answer`/`.wrong-answer`（L127–132，"名称固定，其他代码靠它定位"）——这些都是"被复用打磨过"的细节。

迭代主轴看不到时间线，但内容已是"方法论 + 踩坑清单"的稳态形态。

---

## 3. 功能边界

### 3.1 覆盖

游戏状态机架构、题库组织、反馈系统（视觉+动画+音效+鼓励语池）、难度曲线、激励机制、必备 UI 四区（引导页/主体/反馈区/结算页）+ 规则说明（禁自动开始，必须「开始游戏」按钮，L180）、星级算法（accuracy≥90/70/50→3/2/1 星，L184–191）。

### 3.2 不覆盖 / 依赖外部

- **不含可复制完整模板**：全是片段示例 + 一个文字版"完整示例"（20 以内加减法限时闯关的决策过程，L217–234），需要自己组装。
- **拖拽细节应转 drag-interaction**；笔顺/写字游戏应转 stroke-animation；素材生成依赖 `generate_image`/`generate_voice`（图片音频**必须拿 URL，严禁 base64**，L21/L170–172）；知识范围依赖 `search_knowledge`/`search_web`。

### 3.3 质量门（L207–215）

状态集中管理 + 全事件有守卫；对错都有视觉+动画反馈；每关 3-5 题难度递增；四区齐全；移动端触摸可用按钮 ≥44px；素材走 URL；交付时给玩法说明而非技术细节。

---

## 4. 工程启发（对 ClassIn 互动内容生成 + 数据回收）

### 4.1 ★ 数据采集判断：状态模型已经"天然结构化"，是四个 skill 里最接近"可上报"的

**结论：teaching-game-design 的集中状态机 + 单向数据流，使作答数据天然结构化、天然集中，是埋点改造成本最低的形态——但 skill 本身仍未定义任何外发/上报，数据止于 `gameState`。**

证据与机会点：

1. **`gameState` 已经是一份完整的可序列化学情快照**（L68–75）：`score/combo/maxCombo/correctCount/wrongCount/currentLevel/questionIndex` 全在一个对象里，还专门留了 `answers:[]` 数组。这比 drag-interaction 的"DOM 派生状态"干净得多——**判分不靠数 class，靠读状态对象**。
2. **`updateState(action, payload)` 单向数据流是天然的统一埋点切面**：所有作答都经过这一个函数，action 已枚举化（`ANSWER_CORRECT`/`ANSWER_WRONG`/`NEXT_LEVEL`/`TIME_UP`…）。**只需在 `updateState` 里加一行 `postMessage`，即可零散落地采集全部作答事件**——这是飞象所有交互里最优的埋点位置，没有之一。
3. **但 skill 通篇没有"上报/postMessage/与壳通信"约定**：四区里有"结算页"展示正确率/得分/用时/星级（L179），却只是**展示**，不外发。`answers[]` 被定义了却没说怎么用、怎么流出去。这与飞象"作答数据断流"分析完全吻合——数据算得很全，但只进结算页 UI，不进数据通道。

**对 ClassIn 数据闭环的启发（强）：**

- **把"数据上报"提升为本 skill 的第五条架构铁律**。现有四区 + 状态机已经把作答数据备齐，缺的就是在 `updateState` / 结算页注入标准事件：`{ event, level, questionId, type, userAnswer, correct, score, combo, timeSpent, stars }` → `postMessage` 给壳。改造点单一、风险低。
- **`gameState.answers[]` 应被强制要求落明细**（每题：题目快照 + 学生答案 + 对错 + 用时 + 提示次数），既供结算也供回收。skill 当前留了字段没规范内容，ClassIn 应补这层 schema。
- **状态机 + 单向数据流模式应作为 ClassIn 互动件的"标准骨架"推广**：相比 drag-interaction 的隐式 DOM 状态，本 skill 的集中状态模型让"作答数据可被可靠采集"成为架构的自然结果，而非事后打补丁。**ClassIn 数据回收项目应优先要求互动件采用此骨架。**

### 4.2 教学/体验方法论可直接吃下

- 心流难度曲线（信心关→干扰关→目标关→加分关）、200ms 内即时反馈、鼓励语池防重复、答题后 0.8-1.2s 缓冲——这些是 ClassIn 任何互动件提升完课率/参与度的通用配方。
- 反馈系统的"视觉+动画+音效+文字"四维 + 固定 CSS 类名约定（`.correct-answer`/`.wrong-answer`），是做"可被自动化测试/可被统一换肤"的互动件的好范式。

### 4.3 一个必须修的内部冲突

本 skill 的拖拽建议（`mousedown`+`touchstart` 双绑）与 drag-interaction 硬约束直接矛盾。ClassIn 若把这批 skill 组合使用，**必须建立 skill 间优先级**：拖拽实现以 drag-interaction（Pointer Events 单一入口）为准，teaching-game-design 只负责"游戏架构/激励/难度"层，不再给底层拖拽代码建议。这也提示 ClassIn 的 skill 体系需要一层"交叉冲突仲裁"。

> 一句话：teaching-game-design 的集中状态机 + 单向数据流让作答数据天然结构化、天然集中，`updateState` 是飞象全套交互里最佳的统一埋点切面——只差一行 `postMessage` 就能闭环，这正是 ClassIn 数据回收应优先推广的互动件骨架。
