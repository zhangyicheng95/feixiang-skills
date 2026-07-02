# 07 · paper-generation 深度研读报告

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/paper-generation/`（3 文件，约 36K）
> 性质判定：**真实生产级 skill**，但与本批其他三者**不同族**——它不是 HTML 视觉/排版/测试 skill，而是**工具编排（tool-orchestration）型 skill**：把"出题/组卷/找题"封装成一套搜索-筛选-呈现的工具流水线。
> 研读方式：完整 Read `v1/SKILL.md` 与 `SKILL_v1.md`（两份**字节级相同**），`SKILL_v1_CDN.md` 为 CDN 投放副本。

---

## 0. 文件清单

| 文件 | 角色 |
|---|---|
| `v1/SKILL.md` / `SKILL_v1.md` | 主文档（相同）：适用场景、前置工具清单、开场三要素、6 种标准模式 A-F、防超纲铁律、错误处理 SOP、质量标准、完整示例 |
| `SKILL_v1_CDN.md` | 同内容的 CDN 投放版 |

单一文档、无子文件、无 schema、无 CHANGELOG——相对 math-design/physics 更"轻"，因为它的复杂度落在**工具调用图**而非文档资产里。

---

## 1. 设计思路

### 1.1 本质是一张"工具调用决策图"
前置条件列出近 20 个必备工具（第 21 行）：`search_papers`/`filter_questions`/`analyze_papers`/`search_questions`/`search_keypoints`/`search_curriculum_standards`/`search_resources`/`search_web`/`consult_expert`/`detect_beyond_words`/`layout_questions`/`create_question_sheet`/`create_question_paper`/`create_paper_by_id`/`insert_sop`/`ask_user`/`terminate`。

SKILL 的核心价值是**告诉模型在什么意图下，按什么顺序，调哪几个工具**——它是命题业务的"工具编排手册"。

### 1.2 三道关卡式工作流
1. **开场三要素确认（学科/学段/知识点）**：分三档处理——三要素全清楚直接开工；1-2 个清楚则 `ask_user` 给"具体推断 + 2-4 个选项"，**禁止开放式提问**（不准问"你要什么学科？"）；完全无法推断才列典型选项。设计要点：**优先推断、把追问变成确认题**，降低交互摩擦。
2. **模式判定（关键词→模式）**：一张意图路由表把诉求分到 6 种模式：
   - A 按卷查题 / B 按知识点查题 / C 专题整理 / D 按卷搜卷 / E 改编命题 / F 套卷组题（≥5 题）；
   - 特殊：凡含「材料/情境/阅读/素材/主题/背景/搜索」或所有阅读题 → **新材料新情境命题**，立即 `insert_sop` 取专项 SOP，严格按 SOP 执行（不准自己编排）。
3. **标准模式流水线**：每个模式给出确定的工具序列，例如 B（防超纲最严）：`search_keypoints`（取图谱标准名）→ `search_web`（查教材范围）→ 向用户输出**防超纲分析** → `search_questions` 筛题 → `create_question_sheet` + 防超纲自检 → 不合格剔除重出 → 合格 `terminate`。

### 1.3 领域第一性约束：防超纲铁律
这是整份 skill 的"灵魂约束"（§领域知识）：
- 学生可能只学到某知识点、未学后续 → **任何超纲题都不可接受**；
- 「有理数加减法题不能出现乘除；一元一次方程题不能借题涉及二次方程」（给出具体红线例子）；
- **`search_keypoints` 必须先做**，因为 `search_questions` 的 keyword 必须是**知识图谱标准名**（语义相近但字面不同搜不到）；
- **每道题逐题做防超纲自检，不合格直接剔除**。

### 1.4 工具选择的硬约束（踩坑沉淀）
- **禁用 `search_web` 查专业教学素材 → 改 `search_resources`**；`search_web` 全程最多 2 次。
- 英文阅读素材：`search_resources` 自动路由到 **the Guardian API**，只传 1-3 个英文关键词，禁中文/文体/来源字段；之后**不要 `read_url`**（素材已完整返回）；**即便返回新闻/时评也必须接受并改编，不要质疑质量**（防止模型陷入"素材不合适"的死循环）。
- 题目含图时：优先 `search_questions` 搜真题并**以题目 ID 呈现**（markdown 里占位图不渲染）。
- `search_papers`+`filter_questions` 优先于 `analyze_papers`（只有前者拿得到原题内容）。

---

## 2. 迭代路线

本目录只有 v1，无 CHANGELOG，但文档内部沉淀了大量"踩坑后写死"的规则，等价于隐式迭代记录：

- **错误处理 SOP 表**（遇到再查）是典型的"线上失败回灌"：
  - `search_papers` 搜不到 → ① adcode 补 6 位 → ② 扩 adcode（北京 110000+110100 全输）→ ③ 去非标准关键词 → ④ 去低优参数 → ⑤ 换 `search_questions`；
  - 缺教材版本 → 用地区代替（先 `search_web` 确认 地区↔教材版本 映射）；
  - 末尾硬规则：「**严禁直接告诉用户'没搜到'。搜不到大概率是参数错。**」——这条明显是被"模型轻易放弃"反复坑出来的。
- **公式/排版微约束**也是踩坑沉淀：`create_question_sheet` 的 markdown **不再标题号**（排版自带）；**用单美元 `$...$` 包公式（双美元会直接换行）**；划线词 `<u>文字</u>`；加点字 `<span style="text-emphasis: filled dot black;">字</span>`；语文/英语阅读材料**首行缩进两个全角空格**。

> 这些都属于"一次坑、一条规"的增量硬化，是工具编排型 skill 的主要迭代形态——不改流程骨架，只在叶子节点不断补防御规则。

---

## 3. 功能边界

**纳入**：出题/命题/生成试卷·题单·练习题、按知识点/专题找题、改编题目、原创材料情境题（走 SOP）。

**排除（显式）**：
- 错因诊断 → 用 `error-analysis-flow` skill；
- 教学动画/课件/游戏等非题目类交付物 → 走 html-authoring / courseware-generator / teaching-game-design；
- 纯知识问答 → 直接文字回复，无需命题。

**交付收口（质量标准）**：最终必须以 `create_question_sheet` / `create_question_paper` / `create_question_paper_by_id` 结尾（题目以外内容也要 `create_question_sheet` 写成 markdown 文档交付）；三要素模糊**必须** `ask_user`，绝不"猜想默认"硬走；每题过防超纲自检。

**与邻居 skill 的关系**：
- **与本批其余三者解耦**：math-design/physics/test-html 服务"互动 HTML 产物"；paper-generation 服务"题目/试卷文档产物"，交付物形态（question_sheet/paper）完全不同，**不经过 test-html 的 Playwright 验收**。
- **与课件体系的衔接点**：当出的题需要进互动课件/单页时，题目内容会下游交给 html-authoring/courseware-generator；但**公式分隔符不兼容**——paper-generation 用 `$...$`，html/physics 用 `\(...\)`，跨域复用需做分隔符转换（见报告 06 §3）。
- **自带"专家"子调用**：`consult_expert`（可指定 task_name 细分：主题适配/文本长度/超纲词处理/命题/干扰项/解析）与 `detect_beyond_words`（超纲词 & 字数检测），是 SOP 内嵌的质量子环节。

---

## 4. 工程启发（对 ClassIn 互动内容生成项目）

1. **区分"视觉生成型"与"工具编排型"两类 skill**：本 skill 提醒——不是所有 skill 都在写视觉/代码规范。ClassIn 若接入题库/资源检索/知识图谱等后端能力，应单独建立**工具编排型 skill**：核心是"意图→工具序列"的决策图，而非样式规范。

2. **把追问变成确认题**：开场三要素"优先推断 + 给 2-4 选项确认 + 禁开放式问题"，是降低对话摩擦的高质量交互范式。ClassIn 的需求澄清环节应同样**先推断、再用单选确认**，避免"你想要什么"式空问。

3. **意图路由表 + 每模式确定工具序列**：6 模式 A-F 各有固定流水线，消除了"模型自由编排导致漏步"的风险。ClassIn 的内容生成入口应建**关键词/意图路由表**，每条路由绑定确定的工具调用序列与收口动作。

4. **领域第一性约束要前置且逐项自检**：防超纲铁律是教育内容的安全红线，且要求"先取标准名、逐题剔除"。ClassIn 生成教学内容（尤其题目/讲解）必须内建**学段范围/课标合规**的前置约束与逐条自检，不能事后补救。

5. **错误处理 SOP 化 + 禁止轻易放弃**：搜不到→按固定阶梯重试，且"严禁直接说没搜到"。ClassIn 调用外部检索/生成服务时应配套**分级重试 SOP**，并禁止模型在第一次失败就向用户摆烂。

6. **外部数据源的"接受即用"纪律**：Guardian 素材"即便是新闻也必须接受改编、不要质疑质量、不要再 read_url"，是防止模型陷入素材挑剔死循环的实用约束。ClassIn 接外部素材时应明确**素材可用性默认成立**，把质量把控放到下游改编/审校环节而非检索环节。

7. **交付必须落到结构化产物收口**：强制以 `create_question_sheet/paper` 结尾、禁纯文字结束。ClassIn 任何生成 skill 都应有**明确的"产物落地 + terminate"收口**，杜绝"只在对话里口头交付"。
