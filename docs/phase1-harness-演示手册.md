# 第一阶段 · 教学 Agent Harness 演示手册

> **受众**：项目经理、产品、教研（非纯研发）  
> **演示人**：前端 / Agent 方向同学  
> **建议时长**：5–8 分钟（含 1 次现场生成 + 1 个成品浏览）  
> **本期交付物名称**：**最小 Agent Harness（Cursor 版）**

---

## 一、用一句话说清楚 Harness 是什么

**Harness = 让 AI 稳定产出「能上课用的网页」的一套固定机制**，而不是每次聊天碰运气写代码。

| 没有 Harness | 有 Harness（本期） |
|---|---|
| AI 随便写 HTML，格式不统一 | AI 只填规定好的「内容槽位」 |
| 多页课件无法翻页、状态丢失 | 固定壳负责翻页、缩放、答题状态恢复 |
| 无法复现、无法验收 | 有 spec 注释 + 交付自检清单 |

本期 **不依赖飞象后端**，在 **Cursor** 里用自然语言即可跑通全流程。

---

## 二、目录结构（PM 版）

```
飞象Skills/                          ← 研究资料 + 本期 Harness 工程根目录
│
├── docs/
│   └── phase1-harness-演示手册.md    ← 本文件（汇报 / 彩排用）
│
├── .cursor/
│   ├── rules/
│   │   └── teaching-page-harness.mdc ← 【自动路由】识别课件意图 → 强制读 Skill
│   └── skills/teaching-page/         ← 【规则层】教 AI 怎么生成、生成什么形态
│       ├── SKILL.md                  ← 主编排：单页 vs 多页、工作流、自检
│       ├── reference.md              ← 内容契约（template、滚动、postMessage）
│       ├── assets/
│       │   └── courseware-shell.js   ← 【运行时壳】母版（生成时复制到产物目录）
│       └── templates/
│           ├── courseware-starter.html   ← 多页课件骨架
│           └── single-page-starter.html  ← 单页互动骨架
│
├── pages/                            ← 【产物层】已生成的、可打开的课件
│   ├── light-reflection/             ← 示例：初二物理「光的反射」4 页
│   │   ├── index.html
│   │   └── courseware-shell.js
│   └── demo-mvp/                     ← 示例：光合作用 2 页 + 24 点单页游戏
│       ├── index.html
│       ├── courseware-shell.js
│       └── game-24.html
│
├── courseware-shell-接口设计.md       ← 研发向接口说明（二期对接用，汇报可略）
└── 00-Agent-Harness架构设计.md        ← 飞象完整 Harness 逆向参考（本期未全做）
```

### 各目录一句话职责

| 路径 | 角色（Harness 四层对应） | PM 可记为 |
|---|---|---|
| `.cursor/rules/teaching-page-harness.mdc` | 项目级自动路由 | **「一说做课件就走 Harness」的开关** |
| `teaching-page/SKILL.md` | Skill 规则集 | **AI 岗位说明书** |
| `teaching-page/assets/courseware-shell.js` | 云端壳（本地实现） | **课件播放器引擎** |
| `teaching-page/templates/` | 生成起点模板 | **空白教案版式** |
| `pages/*/` | 最终交付 HTML | **老师拿到的课件成品** |

---

## 三、端到端数据流（汇报用图）

```
教师 / 演示者输入需求（自然语言）
        ↓
项目 Rule 识别「课件 / 教学 HTML」意图（无需每次 @teaching-page）
        ↓
Cursor Agent 读取 teaching-page Skill（SKILL.md）
        ↓
AI 按规则写出 index.html（内容片段 + spec 验收条）
        ↓
同目录放入 courseware-shell.js（从 assets 复制）
        ↓
浏览器打开 index.html → 壳解析页面 → 翻页 / 互动 / 状态恢复
```

**关键点（可强调）**：**Rule + Skill + 壳** 三层配合——Rule 负责「什么时候走 Harness」，Skill 负责「怎么写」，壳负责「怎么播」。AI **不写**播放器逻辑。

---

## 四、两种产物形态（汇报时 30 秒带过）

| 形态 | 触发词示例 | 产出文件 | 课堂场景 |
|---|---|---|---|
| **多页课件 multi** | 「4 页课件」「PPT 式」「翻页」 | `index.html` + `courseware-shell.js` | 串讲课、导入→讲解→互动→测验 |
| **单页互动 single** | 「24 点游戏」「单页动画」 | 一个完整 `.html` | 课堂小游戏、单活动页 |

### 怎么下指令（不必每次 @）

本仓库已配置 **`.cursor/rules/teaching-page-harness.mdc`**：在 Cursor 里说清教学意图即可，Agent 会自动读 `teaching-page` Skill。

| 写法 | 是否推荐 |
|---|---|
| `做一个小学科学「食物链」3 页课件，输出到 pages/food-chain/` | ✅ 演示推荐（自然、像产品） |
| `@teaching-page 做一个…` | ✅ 可选，更保险 |
| 只聊飞象架构、写汇报、不改 HTML | — 不会误触课件流程 |

---

## 五、演示脚本（5–8 分钟）

### 准备（演示前 10 分钟）

- [ ] 打开 Cursor，工作区为 `飞象Skills`（确保 Rule / Skill 在本仓库生效）
- [ ] 浏览器空白标签页待命
- [ ] 确认示例路径可打开：
  - `pages/light-reflection/index.html`
- [ ] 网络：现场生成不依赖外网；示例页不依赖飞象 CDN
- [ ] （可选）本地服务：`cd pages/light-reflection && python3 -m http.server 8765`

---

### 第 1 幕：问题 + 目标（约 1 分钟）

**讲稿要点：**

> 我们要解决的不是「AI 能不能写网页」，而是「AI 写的网页能不能 **稳定当课件用**」。  
> 第一阶段交付的是 **Harness**：**项目 Rule（自动路由）+ Skill（生成规范）+ 播放器壳 + 内容契约**。  
> 飞象完整版还有后端 Runtime 和教研 SOP，那是二期；本期证明 **窄契约 + 平台壳** 路线可行。

**可展示**：本手册第二节目录树（或 PPT 贴目录截图）。

---

### 第 2 幕：成品体验（约 2 分钟）— 保底，必做

**操作：**

1. 浏览器打开 `pages/light-reflection/index.html`
2. 按顺序演示 4 页：
   - **封面** → 下一页
   - **概念讲解** → 指出反射定律；**若内容多，在页内上下滚动**（已支持）
   - **互动作图** → 拖动滑块，展示入射角 / 反射角同步变化
   - **选择题** → 选答案 →「提交答案」→ 看得分 →「重新作答」
3. 回到第 3 页再进第 4 页，说明 **翻页后答题状态可恢复**（Harness 能力）

**讲稿要点：**

> 这是同一条 Harness 管线产出的成品，不是设计师手搓 PPT。  
> 播放器负责翻页和状态；内容页由 AI 按模板生成。

---

### 第 3 幕：现场生成（约 3 分钟）— 高光，建议做

**在 Cursor 新对话输入（可复制，无需 @）：**

```text
做一个小学科学「食物链」3 页课件：
1 封面 2 概念（生产者/消费者/分解者） 3 一道选择题测验。
输出到 pages/food-chain/
```

**演示时解说（边等 Agent 边讲）：**

> 项目 Rule 识别到「做课件」→ Agent 自动读 Skill → 选多页模式 → 写 HTML 片段 → 复制壳脚本。  
> 我们约束 AI 只写 `<template>` 里的教学内容，不写播放器。

**生成完成后：**

1. 打开 `pages/food-chain/index.html`
2. 快速翻 3 页，点一下测验
3. 若生成失败或超时：**切回第 2 幕成品**，说「流程与产物形态一致，本次用预置示例」

---

### 第 4 幕：本期边界 + 二期路线图（约 1 分钟）

**本期已交付（IN）：**

| 项 | 状态 |
|---|---|
| 项目 Rule 自动路由（teaching-page-harness） | ✅ |
| Skill 编排（teaching-page） | ✅ |
| 本地课件壳（courseware-shell） | ✅ |
| 内容契约（template / page-shared / spec） | ✅ |
| 端到端示例（light-reflection） | ✅ |
| Cursor 内自然语言 prompt 生成（无需 @） | ✅ |

**本期未做（OUT，二期）：**

| 项 | 说明 |
|---|---|
| 飞象式后端 Agent Runtime | 工具链、resourceId、轮询 UI |
| 教研专家 SOP | 课标 / 教材 / 学情自动大纲 |
| 数据回收（MuskCollect） | 班级作答、报告页 |
| 自动化云测（test-html） | Playwright 门禁 |
| 拖拽 / 动画组件 Skill | 依赖白名单、Sortable 等 |

**收尾句：**

> 第一阶段 Harness 证明：**用自然语言 + 固定壳，可以稳定产出多页互动课件**。  
> 下一步在 Harness 上叠 Runtime 和产品 UI，而不是推翻重来。

---

## 六、常见问题（PM / 教研可能会问）

| 问题 | 建议回答 |
|---|---|
| 和飞象老师有什么区别？ | 飞象是完整 SaaS + 教研黑盒；我们是 **Harness 内核** 自研验证，可接入自己的课堂产品。 |
| 老师怎么用？ | 本期研发态：Cursor + **一句话**生成（Rule 自动走 Harness）；产品化后变成网页表单 + 进度条，Harness 不变。 |
| 每次都要 @teaching-page 吗？ | **不用**。本仓库 Rule 已配置；演示用自然语言即可，`@teaching-page` 仅作加倍保险。 |
| 没有网能用吗？ | 示例与壳均本地文件；课件内若引外部 CDN 图库则需网络（可二期规范白名单）。 |
| 安全 / 版权？ | 示例内容为原创教学脚本；飞象 Skill 为研究参考，商用需自研规则。 |
| 为什么有两个 js？ | `index.html` 是内容；`courseware-shell.js` 是播放器，必须同目录。 |
| 内容超出屏幕？ | 长页使用 `slide--scroll`，页内可滚动；规则已写入 Skill。 |

---

## 七、演示成功标准（验收勾选）

汇报前自检，**满足 ≥5 条** 即可视为 Phase 1 Harness 演示通过：

- [ ] 能口头说清 Harness 与「单次 AI 写页」的区别  
- [ ] `light-reflection` 四页可翻页、互动、测验可提交  
- [ ] 能指出仓库中 **Rule、Skill、壳、产物** 四处位置  
- [ ] 现场生成 **或** 有可信理由使用预置示例（生成超时）  
- [ ] 说清本期 IN / OUT，未过度承诺 SOP、数据闭环  
- [ ] 产物为磁盘上的 `pages/`，而非仅在聊天里贴代码  

---

## 八、附录：研发快速路径（演示人自用）

| 动作 | 路径 / 命令 |
|---|---|
| 打开成品 | `open pages/light-reflection/index.html`（macOS） |
| 本地 HTTP | `cd pages/light-reflection && python3 -m http.server 8765` |
| 自动路由 Rule | `.cursor/rules/teaching-page-harness.mdc` |
| Skill 位置 | `.cursor/skills/teaching-page/SKILL.md` |
| 壳母版 | `.cursor/skills/teaching-page/assets/courseware-shell.js` |
| 更新壳后 | 需同步复制到各 `pages/*/courseware-shell.js` |

---

## 九、一页 PPT 结构建议（可直接做幻灯片）

1. **标题**：第一阶段交付 — 教学 Agent Harness（Cursor 版）  
2. **问题**：AI 写网页 ≠ 能用的课件  
3. **方案**：Rule 自动路由 + Skill 规范 + 窄契约（template）+ 平台壳（shell）  
4. **目录结构**：树状图（第二节，含 `.cursor/rules/`）  
5. **Demo 截图**：光的反射 — 互动作图 + 测验  
6. **现场**：一句话生成（可选录屏）  
7. **边界**：本期 IN / OUT 表（第五节）  
8. **下一步**：Runtime UI、test-html、数据回收  

---

*文档版本：Rule 自动路由 + teaching-page Skill + courseware-shell 滚动修复 · 2026-06*
