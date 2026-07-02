# 11 · stroke-order（汉字笔顺数据层）深度分析

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/stroke-order/`
> 文件：`SKILL_v1_CDN.md`（= `v1/SKILL.md`，418 行，v11.7）、`v1/templates/stroke-loader.js`（231 行，= 根 `stroke-loader.js` = `v42/templates/stroke-loader.js`，三份逐字相同）、`v1/templates/stroke-card.js`（209 行，= `v42/templates/stroke-card.js`）、`v1/templates/stroke-snippet.html`（134 行）、`v1/templates/audit-page.html`（116 行）、`v1/stroke-data.json` + `assets/stroke-data.json`（各 645KB，7818 字）。
> 与 stroke-animation 是配套关系：本 skill 是**数据层**，只出"笔画名/笔画数/tier"，不做任何渲染动画。

---

## 1. 设计思路

### 1.1 唯一目标：根治"LLM 凭记忆写笔顺"的幻觉

整个 skill 是一个**纯数据 + 防幻觉规约**。核心原则（`SKILL.md` L8–17）：

1. AI **严禁硬编码笔画数据**（`['撇','横',...]`），因为"AI 的笔顺记忆已多次出错"；
2. **对话正文也严禁举例笔画名**（禁忌 #12）；
3. 唯一数据源 = CDN 上 `stroke-data.json`（7818 字）；
4. 唯一查询入口 = `getStrokeData(char)` → `{char, count, strokes, source, tier}`；
5. 禁一切三方笔顺库（cnchar / cnchar-draw / HanziWriter / chinese-stroke）；
6. 两级字表分层（textbook / extended）。

### 1.2 双层置信度（tier）字表

- **`tier:'textbook'`（2,842 字）**：小学语文部编版 1-6 年级会写+认读+OVERRIDE 高频易错字，**3 轮教研审核，100% 可靠**。
- **`tier:'extended'`（4,976 字）**：《通用规范汉字表》中未入教材的字，自动映射 + 启发式，≥98% 但未完全审核。

小学场景**强制只用 textbook**（场景 A 严格模式，L131–145；禁忌 #6）；通用查询可用 extended 但必须 UI 标注"小学范围外"。

### 1.3 组件化彻底消灭"双数据源"

skill 的灵魂是 `<stroke-card>` / `<stroke-tier>` 两个 Web Component（`stroke-card.js`）：LLM **只写 `<stroke-card char="学">`**，组件内部统一调 `getStrokeData`/`isTextbookChar` 渲染字头/画数/逐笔/tier 徽章。设计意图明写在组件注释（`stroke-card.js` L4–8）："根治 LLM 生成 HTML 时使用两套数据源的问题"。`<stroke-tier>` 专门解决"LLM 想在组件外（标题/列表旁）手写'小学范围内/外'徽章"导致与 tier 字段不一致的 bug（点名"讯"字 bug，`SKILL.md` L41–52 / 禁忌 #11）。

---

## 2. 迭代路线（从 SKILL.md / loader 注释反推，无独立 CHANGELOG）

版本号散落各处，可拼出演进主线（当前 SKILL 标 **v11.7**，loader 注释标 v10.0，card 标 1.1.0，data 标 v56）：

- **v10.x**：双层置信度 tier 引入（`stroke-snippet.html` 标 v10.6）；v10.7 把 `strokes` 元素升级为 `new String` 实例并附 `.name/.index/.path` 兼容字段（`stroke-loader.js` L167–185）——这是为兼容 LLM 三种常见写法（`${s}` / `s.name` / `s.index`）的妥协；v10.9 立"单一数据源原则"（L254–276）。
- **v11.x**：两级字表（textbook/extended）正式化；系统性笔顺修正落库（穴字头 HP→横钩、阝 HZZZG→横撇弯钩、风/气族 HZWG→横斜钩、学字族连续 HP、OVERRIDE 硬覆盖 25 字，L404–411）。
- **v11.7（当前）**：新增**禁忌 #12 防幻觉举例**——封堵 LLM 在"教学亮点/引言/思考过程"里举例笔画名。根因写得极透（L208–223）：LLM 在对话正文阶段**不会调 `getStrokeData()`**，只能凭训练数据举例，**必然幻觉**（点名"枫"字过程输出写"横折弯钩"、组件却渲染"横斜钩"的自相矛盾 bug，"横折弯钩"正是 cnchar 历史错误）。给了"标准介绍语模板"（L240–252），只留 `{字}`+`{画数}` 两个动态值。
- **数据版本**：`stroke-data.json` 标 `v56-2026-04-15`，`generated_from` 含"v11.4 子序列启发式 + v11.5/v11.6 OVERRIDE 补齐"。

迭代主轴 = **不断围堵 LLM 绕过数据层的每一种姿势**（硬编码→塞 template→组件外手写徽章→对话正文举例），把数据真源收得越来越紧。

---

## 3. 功能边界

### 3.1 严格只做数据层，不做渲染

SKILL.md L122–127 明写："**本 skill 不提供笔画 SVG 路径数据**"，需要动画请交给上游渲染组件（即 stroke-animation）。`getStrokeData` 返回的 `strokes_detail[].path` 恒为空串（`stroke-loader.js` L182；禁忌 #9：虚构 `path.setAttribute('d', s.path)`）。

### 3.2 返回值契约（精确，易踩坑）

`getStrokeData('手')` →（`SKILL.md` L70–85 / `stroke-loader.js` L137–194）：
```
{ char:'手', count:4, strokes:['撇','横','横','弯钩'],   // ★ strokes[i] 是字符串
  strokes_detail:[{index:1,name:'撇',path:''},...],      // 对象数组
  source:'db', tier:'textbook' }
```
**最高频错误**（禁忌 #8）：`d.strokes[i].name` / `.path` → undefined（强调"已多次出错"）。loader 用 `new String` 实例附加字段做了兼容兜底，但 SKILL 仍力推直接用字符串数组或 `strokes_detail`。

`source` 枚举：`db`（正常）/`loading`/`error`/`missing`/`invalid`（含非 32 标准笔画的兜底，`stroke-loader.js` L154–163）。永不抛异常。

### 3.3 32 标准笔画白名单

skill 锁定 32 种标准笔画名（基本6+折类5+钩类12+提类2+弯折组合7，`SKILL.md` L181–189），loader 内 `STD32_SET` 做二次校验。特别强调"竖折（L形直角）≠竖弯（弧形过渡）"。

### 3.4 与 stroke-animation 的字表错位（实证）

本快照里 stroke-order 的 `stroke-data.json`：`textbook_count:2842`、`generated_from` **不含** textbook-patch-v1；而 stroke-animation 同名文件已是 **2865**（含补丁）。即两 skill 在此快照存在 **2842/2865 教材字表错位**（详见 10 号报告 §3.2）。stroke-animation v1.7.2 CHANGELOG 声称"stroke-order skill 同步发布"，但这份 stroke-order 数据尚未跟进——生产校验时须对齐两者 `textbook_chars`，否则 tier 判定不一致。

---

## 4. 工程启发（对 ClassIn 互动内容生成 + 数据回收）

### 4.1 "权威数据层 + Web Component + 防幻觉规约"三件套可整体复用

stroke-order 是四个 skill 里**最纯粹的"知识正确性基础设施"**。对 ClassIn 内容生成的核心启发：

- **任何"答案/知识正确性敏感"的内容都应建独立数据层**（笔顺、拼音、公式、史实、单位换算……），LLM 只允许引用、不允许生成。用 `getStrokeData` 式的"唯一入口 + 永不抛异常 + source/tier 枚举"做契约。
- **Web Component 是消灭"双数据源"的最佳载体**：`<stroke-card>` 让 LLM"一行标签搞定 + 内部统一取数"，从结构上杜绝它在多处手写不一致内容。ClassIn 互动件里凡是"同一事实多处展示"（题干/选项/解析/语音文案）都应组件化收口。
- **禁忌 #10/#11/#12 的演进**揭示一条规律：**只锁代码不够，必须连"对话正文/教学亮点"一起锁**——因为 LLM 在解释阶段不查库、必幻觉。ClassIn 的内容质检规则也应覆盖"介绍文案"，而不只是代码块。SKILL 甚至给了可执行自检：用正则 `(横|竖|撇|捺|点|提|钩|折|弯)` 扫介绍文字（L287）。

### 4.2 ★ 数据采集判断：本 skill 本身无作答数据，但提供两类可借鉴机制

**结论：stroke-order 是纯展示数据层，没有"作答"概念，因此与"作答数据回收"直接无关**——`<stroke-card>` 只渲染、无交互、无对错、无上报。但它提供两个对数据闭环有用的副产品：

1. **`audit-page.html` 是一套现成的"人工标注数据采集器"**（L31–113）：分层抽样（A 全检/B 10%/C 2%/D 启发式）+ 外链字典核对 + ✓/✗ 标记 + `localStorage` 持久化 + **CSV 导出**（`exportResults`，L101–112）。这正是 ClassIn 做"内容质量人工审核 / 模型评测标注"时可直接复用的轻量采集范式——单页 HTML + localStorage + CSV 导出，零后端。
2. **tier 字段是天然的"内容可信度标签"**：采集学情时若带上"该字是 textbook 还是 extended"，能区分"学生答错"与"题目本身超纲"，避免脏数据。ClassIn 采集作答数据时也应同步采"内容置信度元数据"。

### 4.3 与 stroke-animation 的协同是"数据/渲染解耦"的范本

stroke-order（数据）+ stroke-animation（渲染）严格分层、各自独立发版、通过 `window.getStrokeData()` 单向依赖——这种"数据 skill 被多个渲染 skill 复用"的架构，正是 ClassIn 互动内容平台该有的形态：底层知识库 skill 一份，上层各种互动形态 skill 复用同一份数据，杜绝每个互动件各带一份会漂移的数据。**但本快照暴露的 2842/2865 错位也提醒：解耦后必须有跨 skill 数据版本一致性校验，否则解耦的代价就是漂移。**

> 一句话：stroke-order 本身不产作答数据，但它的"权威数据层 + 组件收口 + 防幻觉到文案级"三件套，是 ClassIn 保证生成内容正确性的地基；其 `audit-page` 还顺手给了一套零后端的人工标注采集器。
