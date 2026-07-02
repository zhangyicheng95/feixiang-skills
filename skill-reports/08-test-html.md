# 08 · test-html 深度研读报告

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/test-html/`（11 文件，约 196K）
> **性质判定：真实生产级 skill，绝非测试夹具/样例。** 它是飞象生成体系的**质量验收层（QA skill）**——指导模型如何用 `test_html`（Playwright 云函数）对生成的 HTML 做自动化单测。文件量大是因为同时归档了 **v1/v2/v3 三代主文档 + 附件库 + 两份溯源稿**，而非堆了测试 HTML 样本。
> 研读方式：完整 Read v1/v2/v3 三代 SKILL、`v3/references/test-templates.md`，比对 `test-templates_从chat提取.md`、`test-templates_断言模板.md` 两份溯源稿。

---

## 0. 文件清单与"为何不是夹具"的判定

| 文件 | 角色 | 判定证据 |
|---|---|---|
| `v3/SKILL.md` = `SKILL_v3.md` = `SKILL_v3_当前版.md` = `SKILL_v3_CDN.md` | **当前版主文档**（多份相同副本） | frontmatter `name: test-html`，是标准 skill 头 |
| `v3/references/test-templates.md` | v3 附件库（代码模板/致命写法/示例/反面教材） | 被 SKILL 用 `read_url` 按需引用 |
| `SKILL_v2_历史版.md` / `v2/SKILL.md` | 第二代主文档 | 含内联"致命写法清单" |
| `SKILL_v1_历史版.md` / `v1/SKILL.md` | 第一代主文档 | 最冗长、无附件拆分 |
| `test-templates_从chat提取.md` / `test-templates_断言模板.md` | 两份**溯源稿**，内容=v3 附件库 | 文件名直陈来源是"从 chat 提取" |

**判定结论**：本目录是一个 skill 的**完整版本演进档案**（v1→v2→v3）+ 其 references 附件 + 提取溯源稿。它指导"如何测别人生成的 HTML"，自身**不含被测 HTML 样本**。所谓"test-html"指的是 `test_html` 这个工具，不是"测试用的 html 文件"。**它是真 skill。**

---

## 1. 设计思路

### 1.1 定位：把"生成完就交付"升级为"先测后交"
SKILL 触发于两个场景：（1）`create_file`/`edit_file` 改完 HTML 后验证；（2）用户反馈功能/布局/渲染异常时**先写复现测试确认问题再修**（"先测后改"）。明确划出**不适合测**的（视觉审美"不好看"、性能感受"卡/慢"→直接读代码）。

### 1.2 灵魂机制：must-cover 清单
核心方法论是"**测试不是机械套模板，而是从需求抽清单**"。四类清单来源（v3 表格）：
1. **动词+名词（交互）**→ 触发动作 + 前后状态比对（三步法：名词→存在/计数；动词→mouse/keyboard/click；状态→等信号再断言）；
2. **声明式约束（禁止/只准/全部/每个/固定为/至少 N）**→ **否定式或全称断言，全局扫**（"这个背景对"要写成"全页无禁用色"）；
3. **核心玩法闭环**→ **清单第一条**，端到端走通产生反馈（24 点：选数字→选运算符→判定=24→对错→重置），而非只验"按钮存在"；
4. **交付可达性（多文件/index/链接/已发布资源）**→ **逐链接 `page.goto` 断言非 404/NoSuchKey 且核心元素渲染**。

格式硬规则：每段 `playwrightCode` 顶部先写 `# must-cover:`，每条 `[N]` 对应一处断言；不测就写 `# skipped: <理由>`，**不准默默省略**。

### 1.3 两道红线"硬门"（v3 新增）
> 来源③核心闭环、来源④可达性**未通过 → 不得判定交付完成、不得 terminate**。

这两类正是线上反复翻车点（交付"连运算符都没有"的游戏外壳 / 点开链接 NoSuchKey），靠"按钮存在/能渲染"的表层断言兜不住。

### 1.4 工程化细节（云函数现实约束）
- **单次云函数最长 60s**：等待统一 `page.wait_for_timeout(ms)`，单条 ≤2000ms，**总等待 ≤20s**；复杂场景拆多次调用。
- **诊断只认 page console**：Python `print` 不回传，必须 `page.evaluate("console.log(...)")` 把值灌进 page console。
- **失败默认怪 HTML**：除非（a）Playwright API/语法错、（b）已诊断证实渲染对只是断言错、（c）NameError/SyntaxError，否则不准把矛头指向测试代码。
- **反"原地打转"**：同段代码连续失败≥2 次强制切诊断版；**严禁逐轮提交字节级相同的 playwrightCode**；同思路失败≥3 次换策略（flex↔grid/换实现/换选择器/查缺失依赖）。

### 1.5 收尾"验证结论卡"（必填，纯中文，给用户看）
固定模板：状态（✓完全通过/⚠部分通过/✗未通过）、需求覆盖 N/M 项逐条、主因、下一步、仍需补测。**只有"✓ 且 N/M 全中"才算可交付**；`pass=true` ≠ 没问题。设施异常连续≥3 次仍要出卡片（状态✗、主因"执行超时/设施异常"），明确告知"未经自动化验证、建议人工检查"，**禁止假装通过、禁止只字不提**。

---

## 2. 迭代路线（v1 → v2 → v3，可逐字段追踪）

这是本批四个 skill 中**迭代证据最完整**的一个：

| 维度 | v1（历史版） | v2（历史版） | v3（当前版） |
|---|---|---|---|
| **结构** | 单文档全量、最冗长（~520 行） | 单文档 + **内联"致命写法清单"5 条**（首次出现） | **主干瘦身 + 附件库拆分**（`references/test-templates.md`），SKILL 仅剩"纪律与决策" |
| **致命写法清单** | 无 | 新增 5 条（Python 非 JS 正则 / evaluate 禁 f-string / strict mode `.first` / range 禁 `fill()` / 免 import 白名单） | 保留并压缩，移入前置条件 + 附件库顶部 |
| **核心闭环/可达性** | 仅作为"高频漏项"提示 | 仍是软提示 | **升级为"硬门红线"**：未过不得 terminate；新增**资源可达性模板 7.2**（逐链接 goto + OSS `NoSuchKey/NoSuchBucket/AccessDenied` 正则扫 + "空壳"检测 + 导航后 `goto(index_url)` 回原页） |
| **spec 播种** | 无 | 无 | **新增**：产物首行 `<!-- spec: ... -->` 或 `task_write.spec`/`spec_ref` 时，据 `forbid/require/core-loop/count/links` 逐条播种清单 |
| **品类补盲表** | 散文式"高频品类常漏项" | 同 v1 | 收成表格（教学游戏/拖拽/动画/课件单页/错题诊断 五类常漏项） |
| **零尺寸公式检测** | `getBoundingClientRect` 宽高=0 | 同 v1 | **新增 `offsetParent===null` 跳过 display:none 合法隐藏公式**，消除折叠/标签页假阳性 |
| **响应式溢出** | 详细对象（tag/cls/right/vw） | 同 v1 | 压缩为 `tagName+'.'+className`，更省 token |
| **MathJax 识别** | MathJax3/2/KaTeX 三分支 | 同 | 同，注释标"MathJax2(CDN 老版仍常见)" |

**迭代主线**：v1 把所有内容塞进一个长文档 → v2 把"线上真实失败"沉淀成显式"致命写法清单" → v3 做了两件大事：(a)**主干/附件分离**（决策纪律留主干，代码模板移附件，按需 `read_url`，省上下文）；(b)**把"软提示"升级成"硬门红线 + spec 契约播种"**，专打线上两大翻车点（空壳游戏、死链）。

`test-templates_从chat提取.md` 这个文件名是**直接证据**：v3 的附件库是**从真实 chat 记录里提取**沉淀的，属于典型的 dogfooding/经验回灌。

---

## 3. 功能边界

**纳入**：任何 `create_file`/`edit_file` 产出的 HTML（生成后验证、修改后回归、用户报障复现）。按 HTML 特征组合模板：基础渲染（必测）/ 响应式 375·768·1280 / LaTeX 渲染 / 复杂交互（真实拖拽 `mouse.*` 非 `drag_to`、键盘、动画等信号）/ evaluate 调底层 API / 约束符合性（全局扫）/ 核心闭环 / 资源可达性 / 资源加载。

**排除**：视觉审美、性能感受（直接读代码，不测）。前置必须先拿 `resourceId`（不能同轮生成又测）。

**与邻居 skill 的关系（它是全体的下游验收层）**：
- **验收 html-authoring / courseware-generator / teaching-game-design / drag-interaction 的产物**：这些 skill 的"硬约束"正是 test-html 的断言对象——
  - html-authoring 的"核心机制契约/反空壳"（24 点必须有运算符、模拟器须开始/暂停/重置）↔ test-html 模板 7.1 核心闭环；
  - html-authoring 的"验收要点 spec 注释"（落到 `<head>`）↔ test-html 的 **spec 播种**（`forbid/require/core-loop/count/links`）。两者是**生成端写契约、验收端读契约**的配对设计；
  - math-design 的 H1/按钮/单屏/调色板白名单 ↔ test-html 模板 6 约束符合性（`getComputedStyle` 全局扫）+ 模板 2 响应式；
  - physics-formula-typography 的 MathJax3 渲染 ↔ test-html 模板 3 LaTeX（`mjx-container`/`mjx-merror`/零尺寸）。
- **不验收 paper-generation**：题单/试卷是 question_sheet/paper 文档产物，不经 Playwright。

> 由此可见飞象生成体系是**"生成 skill 写规范+spec → test-html 按 spec 自动验收"**的双层闭环架构，test-html 是把所有视觉/排版 skill 的硬约束"兑现成可执行断言"的统一关口。

---

## 4. 工程启发（对 ClassIn 互动内容生成项目）

1. **互动内容必须有自动化验收层，且早于"交付"**：test-html 把"先测后改 + 未过不得 terminate"写进流程。ClassIn 生成互动课件/游戏后，应有**Playwright（或等价）自动验收环节**作为 terminate 前置硬门，而非靠人工抽查。

2. **"生成端写 spec，验收端读 spec"是关键耦合**：html-authoring 把验收要点落进 `<head>` spec 注释，test-html 据此播种清单。ClassIn 应建立**产物自带机器可读契约（spec）**的约定（数量/配色/字号/必含元素/核心玩法/数据回收 URL/学段红线），让验收从"凭经验猜"变成"按契约逐条核"。

3. **两道红线打中互动内容的真痛点**：**核心玩法闭环**（反"空壳"）与**资源可达性**（反"死链/NoSuchKey"）。ClassIn 互动产物（尤其多页/多文件/带跳转）必须把这两条设为不可降级的硬门——"按钮存在/能渲染"永远兜不住"真能玩/真能打开"。

4. **断言要"否定式 + 全称 + 全局扫"**：声明式约束（禁止/全部/每个）不能单点验，要 `getComputedStyle` 全页扫。ClassIn 的合规检查（禁某色/每页水印/全局禁英文/调色板白名单）都应写成**全局遍历断言**。

5. **诊断纪律 + 反原地打转**：失败默认怪产物、连续失败强制切诊断版、严禁字节级重复提交同测试、同思路≥3 次换策略。ClassIn 的自动修复 agent 必须内建这套**防死循环纪律**，否则会在"改产物-重测-同样失败"里空转烧 token。

6. **平台约束要写进 skill**：60s 云函数上限 → 20s 等待预算 / 单条 ≤2000ms / 拆多次调用；console 回传机制 → 必须灌 page console。ClassIn 的验收 skill 同样要把**执行环境的真实硬限制**显式写入，并给出绕过写法（拆调用、参数传值防注入、range 用 JS 赋值+dispatch input）。

7. **主干/附件分离的文档工程**：v3 把"决策纪律"留主干、"代码模板"移 `references/` 按需 `read_url`。ClassIn 的大型 skill 应同样**主干瘦身 + 附件按需加载**，控制每次注入上下文的体量，同时保留完整模板库可寻址。

8. **诚实降级 + 强制结论卡**：设施异常也要出卡、明说"未经验证、建议人工检查"，禁止谎报通过。ClassIn 验收结果应有**统一结论卡 + 诚实降级态**，区分"真通过/部分通过/未验证"。
