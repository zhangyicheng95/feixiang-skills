# 飞象 Skills 拆解报告 · 索引与跨 Skill 综合

> 基于 `02_Feixiang_Research/skills/飞象Skills/` 下 12 个生产级 skill、299 个文件的逐文件研读。
> 每份文档统一覆盖四个维度：**设计思路 / 迭代路线 / 功能边界 / 工程启发**。
> 研读日期：2026-06-26。

---

## 一、文档索引

| 编号 | 文档 | 对应 Skill | 角色 |
|---|---|---|---|
| 00 | `00-Agent-Harness架构设计.md` | —（总纲） | 整个智能体 harness 层架构 |
| 01 | `01-courseware-generator.md` | courseware-generator | 主编排（v1–v18） |
| 02 | `02-data-collect.md` | data-collect | 数据闭环（v1–v13） |
| 03 | `03-html-authoring.md` | html-authoring | HTML 生成规范（v1–v5） |
| 04 | `04-magazine-layout.md` | magazine-layout | 杂志式排版/保真（v1–v9） |
| 05 | `05-math-design.md` | math-design | 数学视觉（被 html-authoring 收编前快照） |
| 06 | `06-physics-formula-typography.md` | physics-formula-typography | 物理公式排版 |
| 07 | `07-paper-generation.md` | paper-generation | 组卷/出题（工具编排型） |
| 08 | `08-test-html.md` | test-html | 自动化验收层（QA skill） |
| 09 | `09-drag-interaction.md` | drag-interaction | 拖拽交互（防崩工程） |
| 10 | `10-stroke-animation.md` | stroke-animation | 笔迹动画 + DTW 评分 |
| 11 | `11-stroke-order.md` | stroke-order | 笔顺数据层 |
| 12 | `12-teaching-game-design.md` | teaching-game-design | 教学游戏状态机 |

---

## 二、跨 Skill 综合洞察

### 1. harness 的本质：两头收紧、中间放大
飞象的 harness 是「**宿主工具 runtime + 渐进式披露的 Skill 规则集 + 服务端专家 SOP + 云端运行时壳框架**」四层协作。Skill 不是代码，而是分层加载的、状态机式的 prompt 约束集。它用"**窄内容契约（`<template>` 片段、`MuskCollect` 三动词、设计令牌）+ 平台壳**"把不可靠的 LLM 在输入与输出两端收紧、只在中间的创意生成放开。

### 2. 全线共有的工程范式：规范 + 工具 + 自检契约三者捆绑演进
从 html-authoring（v1→v5 软规范硬化为机器可验证契约）、magazine-layout（v1→v9 不断新增"禁止/断路器"规则）、test-html（按 spec 自动测）到 courseware-generator（5-Phase 流水线），所有 skill 都遵循同一范式：**生成端写规范+spec → 验收端按 spec 自动测 → 案例驱动逐条打补丁**。每条硬约束都被刻意写成可机检的具体数值与全局断言。这是飞象把"LLM 概率输出"驯化为"可交付生产物"的核心方法论。

### 3. 对 ClassIn 最关键的发现：作答数据"算全了却没外发"
交互类四 skill（drag / stroke-animation / stroke-order / teaching-game）已经把作答数据**算得很全**（stroke 逐笔 DTW/三星、game 的集中 `gameState.answers[]`），但**无一例外止步于 JS 回调 / DOM class / 结算页 UI，全部缺少 `postMessage` 外发通道**——这正是飞象"作答数据断流"的结构性根因。

> **对 ClassIn 数据闭环项目的直接启示**：我们要补的不是"重算一遍作答"，而是在飞象已有的算法切面上接一根外发管线。最佳埋点切面已识别：
> - drag：`onAdd` / `onEnd`
> - stroke：`onStrokeComplete` / `onFinish`
> - game：`updateState`

---

## 三、需要修正的跨 Skill 不一致（各 worker 实测发现）

这些是本快照里真实存在的生产隐患/口径冲突，建议对齐：

| 冲突点 | 详情 | 涉及 |
|---|---|---|
| **笔顺字表错位** | stroke-order 教材字表停留在 **2842** 字，stroke-animation 已打补丁到 **2865** 字，两 skill 字表不同步 | 10 / 11 |
| **公式分隔符口径冲突** | paper-generation 用单美元 `$...$`，physics-formula-typography / html-authoring 链路用 `\(...\)` `\[...\]` | 03 / 06 / 07 |
| **拖拽实现冲突** | teaching-game-design 建议 mouse+touch 双绑，与 drag-interaction 的防崩硬约束相抵触，缺 skill 间仲裁 | 09 / 12 |

---

## 四、可直接迁移到 ClassIn 的工程资产（汇总）

1. **交付指纹 + test 回读闭环**：生成物带可 grep 的 spec 注释，发布前自动断言，未过不许发布。
2. **机械抽选抗同质化**：用 codepoint 哈希从色板/模板池里确定性抽选，避免 LLM 每次都选同一套。
3. **DoD（核心机制契约）前置**：把"做完了的标准"写在生成之前，而非事后自检。
4. **渐进式披露**：SKILL.md 主干瘦身 + references 按需 `read_url`，控制 prompt 体积。
5. **资源/CDN 白名单 + 反噪音约束**：限定可用库，禁止 LLM 幻觉生产代码与假元数据。
6. **上游能力外移 + JSON 合同**：把确定性强的环节（如 MinerU 素材包）移出 prompt，用结构化合同对接。
7. **发布前断路器 + 双目标验收**：保真是底线、美化是交付，二者必须同时成立才放行。
8. **集中状态机 + 单向数据流**：teaching-game 的 `gameState` 模式，天然产出结构化作答，是数据回收的理想底座。
