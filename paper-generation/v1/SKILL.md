---
name: paper-generation
description: 当用户要求出题、命题、生成试卷/题单/练习题、按知识点或专题找题、改编题目、或需要原创材料情境题时使用；覆盖试卷命题的工具编排、错误处理 SOP 与防超纲铁律。
---

# paper-generation

## 适用场景

- 用户提出"出一套 / 一道 / 一张试卷 / 练习题 / 题单"、"按知识点找题"、"整理某专题"、"改编这道题"、"搜一张北京中考卷"等**命题或找题**需求
- 用户提出"根据这篇材料出题"、"以 X 主题的情境命题"等**材料情境类原创命题**需求（必须走 §新材料新情境 SOP）

**不适用于：**

- 错因诊断（用 `error-analysis-flow` skill）
- 教学动画/课件/游戏等非题目类交付物
- 纯知识问答（直接文字回复即可，无需命题）

## 前置条件

必须可用的工具：`search_papers`、`filter_questions`、`analyze_papers`、`search_questions`、`search_keypoints`、`search_curriculum_standards`、`search_resources`、`search_web`、`consult_expert`（task_name 可指定细分任务）、`detect_beyond_words`、`layout_questions`、`create_question_sheet`、`create_question_paper`、`create_paper_by_id`、`insert_sop`、`ask_user`、`terminate`。

## 工作流程

### 开场三要素确认（每次命题都做）

优先主动推断**学科 / 学段 / 知识点**。推断覆盖度分三档处理：
- **三要素都清楚** → 不调 `ask_user`，直接进入对应模式
- **1-2 个部分清楚** → 用 `ask_user` 给出具体推断 + 2-4 个选项供用户确认，**禁止开放式问题**（如 "你要什么学科？"）
- **某要素完全无法推断** → 用 `ask_user` 给该要素下 2-4 个典型选项

推断示例：
- "分数加法应用题" → 小学数学，直接出
- "语法选择题" → 英语，学段未知 → `ask_user` 列"小学/初中/高中"

### 模式判定

根据用户原始诉求选择模式：

| 关键词 / 意图 | 模式 | 下一步动作 |
|---|---|---|
| "根据材料 / 情境 / 阅读 / 素材 / 主题 / 背景 / 搜索素材"、所有阅读题 | **新材料新情境命题** | 立即调 `insert_sop` 获取 SOP，严格按 SOP 步骤执行 |
| "从某类试卷找题" / "找一套真题" | 按卷查题 | §标准模式 A |
| "按知识点找题 / 出题" | 按知识点查题 | §标准模式 B |
| "整理 XX 专题 / 专项" | 专题整理 | §标准模式 C |
| "搜一张 XX 试卷" | 按卷搜卷 | §标准模式 D |
| "改编这道题" / "仿 XX 真题命一道" | 改编命题 | §标准模式 E |
| "出一张卷 / 一套练习（≥5 题）" | 套卷组题 | §标准模式 F |

### 标准模式

**A. 按卷查题**
1. `search_papers` 找符合条件的全部试卷
2. `filter_questions` 筛出符合需求的试题
3. `create_question_sheet` 呈现

**B. 按知识点查题**（防超纲最严）
1. `search_keypoints` 取知识点在图谱中的标准名（必须做，`search_questions` 的 keyword 不匹配标准名搜不到）
2. `search_web` 查知识点 / 教材范围
3. 向用户输出**防超纲分析**："本题限 X 学段 X 单元范围；包含 / 不包含的内容；禁止借题发挥"
4. `search_questions` 按防超纲标准筛题
5. `create_question_sheet` 呈现 + 防超纲自检；不合格则剔除后重新 `create_question_sheet`；合格 → `terminate`

**C. 专题整理**
1. 按学习逻辑分类（教师视角）
2. 对每个分类：`search_keypoints` → `search_questions` 取 2-3 道经典题，难度由易到难
3. `create_question_sheet` 按分类呈现；题量不足就如实展示

**D. 按卷搜卷**
1. `search_papers` 找卷
2. **每张试卷单独调用一次 `create_question_paper_by_id`**（不要用 `create_question_sheet`）

**E. 改编命题 / 单题原创（非材料情境）**
1. 需要素材 → `search_web` + `search_resources`；改编指向某道真题（如"北京中考压轴题"）→ `search_papers` + `filter_questions`
2. `search_questions` 找改编对象（即使用户没要求"参考"也必须做，否则易超纲）
3. 向用户输出知识点 + 防超纲分析 + 改编部分
4. `create_question_sheet`（题目以 markdown 写入 sheet，**不要再 `layout_questions`**）
5. 防超纲自检 → 不合格重出 → 合格 `terminate`

**F. 套卷组题（≥5 题）**
1. 需要素材 → `search_web` / `search_resources`
2. `search_papers` 找同类试卷
3. `filter_questions` 取符合需求的题
4. 不足 → `search_questions` 补齐
5. `create_question_sheet` 编排（**优先复用已有题，不要新命题**）

## 领域知识

### 防超纲铁律（核心）

- 学生可能只学到某一知识点，没学后续内容 → **任何超纲题都不可接受**
- 有理数加减法题不能出现乘除；一元一次方程题不能借题涉及二次方程
- `search_keypoints` 必须先做，`search_questions` 的 keyword 必须是**图谱标准名**（语义相近但字面不同搜不到）
- 防超纲自检每道题都做，不合格的直接剔除

### 「材料 / 情境命题」识别

只要原文里出现 **阅读 / 材料 / 情境 / 主题 / 素材 / 搜索 / 背景** 任一词，或所有阅读题需求，都走 `insert_sop` 获取专项 SOP。不要跳过 SOP 自己编排。

### 工具选择约束

- **禁用 `search_web` 查专业教学素材** → 改用 `search_resources`
- 搜英文阅读素材 → `search_resources`（自动路由到 the Guardian API，只传 1-3 个英文关键词，禁止中文 / 文体 / 来源等其他字段；后续**不要** `read_url`，素材已完整返回；即使返回新闻报道 / 时事评论也必须接受并改编，不要质疑质量）
- `search_web` 最多用 2 次
- 题目必须含图时，优先 `search_questions` 搜真题并**以题目 ID 呈现**（在 question_sheet 里写 ID 而非 markdown，因为 markdown 里占位图不会被渲染）
- `search_papers` + `filter_questions` 优先于 `analyze_papers`（只有前者拿得到原题内容）

### 错误处理 SOP（遇到再查）

| 症状 | 依次尝试 |
|---|---|
| `search_papers` 搜不到 | ① adcode 补 6 位；② 扩 adcode（北京 110000 + 110100 全输）；③ 去掉非标准关键词；④ 去掉低优参数；⑤ 换 `search_questions` |
| 缺教材版本等参数 | ① 用地区代替（`search_web` 确认地区 ↔ 教材版本映射）；② 直接搜该字段；③ 忽略该字段扩大召回再筛 |
| `search_curriculum_standards` 空结果 | 换关键词；仍空用 `search_web` |
| `search_questions` 找不到题 | ① 确认先做了 `search_keypoints`；② 换 keyword；③ 换 `search_papers` |
| `filter_questions` 筛不到 | ① 换 `analyze_papers`；② 改参数重试 2 次；③ `search_web` |

**严禁**直接告诉用户"没搜到"。搜不到大概率是参数错。

## 质量标准

- 三要素模糊时**必须** `ask_user` 确认，绝不以"猜想默认"往下走
- 每道题都通过防超纲自检
- 最终交付必须以 `create_question_sheet` / `create_question_paper` / `create_question_paper_by_id` 结尾（题目以外的内容也要 `create_question_sheet` 写成 markdown 文档交付）
- `create_question_sheet` 的 markdown 里**不再标题号**（排版自带）；用 `$...$` 单美元符包公式（双美元会直接换行）
- 划线词用 `<u>文字</u>`；加点字用 `<span style="text-emphasis: filled dot black;">字</span>`
- 语文 / 英语阅读材料**首行缩进两个全角空格**

## 完整示例

**Case 1：按知识点出题**

```
用户："出一道有理数加法的题"

步骤：
1. 推断：初中数学七年级上，直接开工
2. search_keypoints keyword="有理数加法"
3. search_web 查七年级有理数加法教材范围
4. 向用户输出防超纲分析："本题限于有理数加法；不涉及乘除 / 乘方 / 开方"
5. search_questions 用标准知识点名筛题
6. create_question_sheet 呈现 1 道题
7. 防超纲自检 → 合格 → terminate
```

**Case 2：材料情境命题（走 SOP）**

```
用户："出一篇原创中考英语阅读"

步骤：
1. 命中"阅读" → 立即 insert_sop，拿到专项 SOP
2. 按 SOP 步骤执行（search_resources 取 Guardian 素材 → consult_expert 主题适配检查 → detect_beyond_words 检查超纲词 & 字数 → consult_expert 文本长度调整 / 超纲词处理 / 命题 / 干扰项 / 解析 → create_question_sheet 交付）
```
