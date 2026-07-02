# 飞象生产级 Skill 研读报告 04：`magazine-layout`（精美排版）

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/magazine-layout/`
> 体量：83 文件 / 784K，v1–v9 共 9 个版本快照 + 1 个发布拷贝 `SKILL_v9_CDN.md`（与 `v9/SKILL.md` 逐字节相同）。
> 每个版本固定 9 件套：`SKILL.md` + `reproduction-guide.md` + `math-image-fidelity.md` + `pdf-ocr-preprocess.md` + `pdf-page-fidelity.md` + `visual-design-guide.md` + `pagedjs-template.md` + `quality-gate.md` + `examples.md`；**v9 新增** `mineru-integration.md`。
> 注意：文件夹的 `vN` 是发布快照，而 `v9/SKILL.md` 内部自称「v31 发布前断路器」——真实内部迭代号已到 31，说明这是一条被反复打磨、踩坑很多的生产线。

---

## 0. 一句话定性

`magazine-layout` 是飞象「把老师上传的试卷/讲义/教案，一比一保真 + 设计师级重排成 A4 可打印 HTML」的**唯一主排版 Skill**；它的全部 9 个版本几乎不是在加功能，而是在打一场**「禁止 AI 偷懒造假」的攻防战**——9 个版本里 80% 的 diff 都是新增「禁止/阻塞/断路器」规则。

---

## 1. 设计思路：解决什么问题、核心理念、关键抽象

### 1.1 要解决的真实问题

老师把一份**试卷 PDF / 扫描件 / 截图 / docx**丢给 Agent，要求「排得好看、能打印、和原卷一模一样」。这里同时叠加了两个互相拉扯的硬约束：

1. **保真**：题量不能少、几何图/统计图/电路图不能错、分数公式不能露源码、原图不能丢。
2. **美化**：要做成「设计师排过」的 A4 纸面，而不是把原卷整页图片贴上去。

而大模型在这个场景天然有四个「作弊倾向」，Skill 的每一条规则几乎都能对应到一个被抓现行的坑：

| 模型的偷懒倾向 | Skill 的对抗条款（v9 证据） |
|---|---|
| 图缺了就用 AI 生成一张「相似图」冒充 | `math-image-fidelity.md` 一比一复原模式：禁止 `generate_image`/`picture_gen` |
| 凭题干「如图」用 SVG/Canvas 猜画几何图 | SKILL 规则 11：仅 `diagramSpec`/`redrawData` 完整才许 SVG 重绘 |
| 编一个看似合理的图片地址（`page_1.png`/`pdf?page=1`） | SKILL 规则 5、`pdf-page-fidelity.md` 失败条件 |
| 用「[此处原卷为…]」「图略」「请参考原卷」文字兜底 | 全文档反复出现的零占位黑名单 |
| 只 OCR 出前几题就交付 / 把大题压成一句摘要 | `reproduction-guide.md`「题量不缩水」「不压缩子问」 |
| 用空白 `<object>/<iframe>` PDF 框假装保真 | 所有文档统一判失败 |

> 核心洞察：**这条 Skill 的主要工程量不在「怎么排得好看」，而在「怎么不让模型假装完成」**。它把模型当成一个会抄近路的施工队，用大量「验收红线 + 发布前断路器」逼它老实干活。

### 1.2 核心理念（v9 定稿）

`v9/SKILL.md:75` 一句话定调：

> **「一比一真实保真是底线，设计师级美化重排是核心交付。」**

`quality-gate.md:71` 把它落成「**双目标**」验收——保真通过但视觉粗糙 ✗，视觉好看但题/图不准 ✗，两者必须同时成立。这是整条 Skill 的灵魂判据。

### 1.3 关键抽象（值得复用的几个）

1. **三层资产模型**（`visual-design-guide.md:7-13`）
   - 重排正文层：可复制/可编辑的 HTML，是**主交付**；
   - 真实图层：题内裁剪图贴题旁 + 逐页原卷图作校验附录；
   - 二者来源都必须是「工具返回的真实 URL」，AI/SVG 不得替代。

2. **图片还原阶梯（fidelity ladder）**（`visual-design-guide.md:58-68`）——把「图怎么来」做成可降级的 5 档优先级：
   ```
   1 题内裁剪图 URL（最优）
   2 bbox + 原页图（可接受）
   3 原页图 + 题号定位（临时兜底，只能校验，不许声称"已还原"）
   4 diagramSpec/redrawData 完整 → 才许 SVG 重绘
   5 都没有 → 阻塞，不交付
   ```
   这是整条 Skill 最精炼的决策抽象：**准确性 > 好看，宁可贴一张朴素真图，也不要一张漂亮的错图。**

3. **发布前断路器（circuit breaker，v31）**（`v9/SKILL.md:27-43`）——在任何 `create_file` **之前**先做一次「能否发布」判断，命中任一条件直接停手并输出统一阻塞话术。这是把「事后验收」前移成「事前熔断」，避免浪费一次昂贵的文件生成。

4. **MinerU 素材包合同（material-pack contract）**（`mineru-integration.md:41-122`）——把上游解析标准化成一份带 `questions[]/figures[]/tables[]/quality{}` 的 JSON 合同，Agent 只消费结构化素材，**不靠视觉猜版面**。`figures[].canRedraw`、`quality.missingFigures`、`bbox{unit:px}` 等字段级设计很值得借鉴。

5. **模板锁定：固定层 / 可变层二分**（`reproduction-guide.md:79-99`）——老师说「记住这个格式 / 继续做 Unit 5」时，把布局/配色/字号/页边距/题型顺序冻结为**固定层**，只允许替换年级/单元/词汇/语篇等**可变层**，AI 不得擅自漂移固定层。这是 To-B 教育场景「批量同款」的关键产品抽象。

---

## 2. 迭代路线：从 9 个版本还原它怎么演进、改了什么、为什么

逐版 `diff SKILL.md` 还原出一条清晰的「**先重排派 → 收紧造假口子 → 大反转为保真派 → 平衡 + 上游契约化**」曲线：

### 阶段 A：重排派奠基（v1）
- 核心原则三优先级：**忠实复现 > 可编辑重排 > 美观**（`v1/SKILL.md:54`）。
- PDF 整页图片**只能当「原卷校验附录」**，正文主体必须是 OCR 后的可编辑重排（`v1` 规则 3）。
- 已配套 `quality-gate.md`（生成后门禁）和 `visual-design-guide.md`（强制读取）。

### 阶段 B：堵 AI 造假的口子（v2 → v7，增量收紧）
- **v2**：引入「纸面设计系统 token」（先定 token 再写 HTML）；新增规则 9「试卷图形默认不重绘」。
- **v3**：新增 `figure` 清单字段化（`questionNumber/page/figureUrl/bbox`），description 加入「准确还原/带图」触发词。
- **v4**：引入 `picture_gen` 的**边界**——AI 配图只能做英语/语文阅读的氛围插画，必须标「AI配图」，**不得**计入原卷图还原；新增 `illustration` 清单与 `figure` 清单分离。
- **v5**：工具改名 `picture_gen → generate_image`（保留兼容）；反向新增一条**主动**规则：语言类阅读若缺非关键配图，必须先 `generate_image` 再 `create_file`，禁止交付 `img=0` 无图版。
- **v6**：SVG 重绘门槛大幅收紧——**只有后端/OCR 明确返回 `diagramSpec`/`redrawData` 且字段齐全才许重绘**；明确「`read_file` 读到的『如下图』『从图中可知』不算结构化图形数据」，把仅凭题干生成的 SVG 标为「模型重绘草图」，禁止称「准确还原」。
- **v7**：把 v6 的收紧整合进 description（仅措辞收敛，内容微调）。

> 这一段的主线：模型最爱用「漂亮 SVG/AI 图」蒙混图形题，团队用越来越严的「结构化数据门槛」一点点把这条路堵死。

### 阶段 C：大反转——保真派（v7 → v8，本 Skill 最大转折）
v7→v8 的 diff 是整条线的**分水岭**：

| 维度 | v7（重排派） | v8（保真派） |
|---|---|---|
| 核心原则 | 复现 > 可编辑重排 > 美观（三级） | **复现 > 美观（两级）**，删掉「可编辑重排」中间层 |
| PDF 整页图 | 只能当「校验附录」 | 升级为「**原图保留最低实现 / 原卷逐页图片**」可作主体保真 |
| 新增模式 | — | **「一比一原图复原模式」**：命中"还原/复原/真实原图/一比一/原卷图/不要 AI 生成"即触发，只许真实图 |
| 文件依赖 | 强制读 `visual-design-guide.md`、`quality-gate.md` | **从文件说明表里删除**这两项的强制读取 |
| 失败基准 | 「只贴图算失败」 | 反过来「`img=0` 算失败、缺真图就阻塞」 |

> 为什么反转？推测：生产中遇到「数理化试卷的几何/统计/电路图，模型重排时反而把图弄错/弄丢」，团队判定**对理科卷而言，丢真图比丑更致命**，于是把「保真」提为不可妥协的底线，甚至暂时牺牲「可编辑重排」这一中间目标。

### 阶段 D：平衡 + 上游契约化（v8 → v9，定稿）
v8 用力过猛（容易退化成「原卷图片合集」），v9 把钟摆拉回中间并工程化：
- 核心原则改为 **「保真是底线 + 美化是核心交付」双目标**（`v9/SKILL.md:75`），并新增硬门槛 4：「真实图片保真只是底线…最终 HTML 必须同时包含可编辑重排正文、题型层级、设计系统、答题区」。
- **新增 `mineru-integration.md`**：把上游从零散 `convert_to_text` 升级为 **MinerU 结构化解析 + 标准素材包合同**，并把 `visual-design-guide.md` / `quality-gate.md` 重新拉回主流程（Phase 3 / Phase 4）。
- **新增 v31 发布前断路器**，把验收前移为熔断。
- 引入 `magazine-layout-guard` CLI 门禁（`quality-gate.md:28-43`：`--min-questions 30 --min-images 1 --require-real-images --require-mathjax`，退出码非 0 不发布）。

> 贯穿全程的「真实案例」是 **`2026北京西城六年级（上）期末数学.pdf`**：它出现在 `quality-gate.md`（min-questions 30）、`pdf-ocr-preprocess.md`（pdf-to-images 命令）、`visual-design-guide.md`（页眉示例）。这份 30+ 题、含统计图/几何图的真卷，几乎就是驱动整条保真线迭代的「靶场」。

### 迭代规律总结（对方法论的启发）
1. **加法极少、约束极多**：版本演进 ≈ 不断把「模型新发明的偷懒姿势」写进黑名单。
2. **钟摆式收敛**：重排（v1）→ 极端保真（v8）→ 双目标平衡（v9），靠真实失败案例校准。
3. **验收前移**：从「生成后 quality-gate」→「生成前 circuit breaker」+「CLI guard」三道闸。
4. **能力外移**：把不可靠的「模型看图」外包给确定性的 **MinerU + pdf-to-images** 上游，Agent 只消费结构化合同。

---

## 3. 功能边界：能做/不做什么、与 `html-authoring` 的分工、约束

### 3.1 能做（适用场景，`SKILL.md:10-15` + Phase 2 风格表）
- 把**已给定/已上传**内容改造成 A4 打印友好 HTML：讲义、练习单、试卷、题单、默写纸、知识清单、教案打印版、杂志风资料。
- 触发词：精美排版/高级排版/好看/美化/可打印/A4/一比一/还原/复原/原卷图/按这个格式来/记住这个格式。
- 7 类场景默认排版策略（试卷/英语练习单/默写纸/知识清单/教案/语文古诗文/趣味低幼）。
- 模板锁定与单元批量替换。

### 3.2 不做（明确排除，`SKILL.md:16-21`）
- ❌ 屏幕优先的**交互动画、教学游戏、单页课件**；
- ❌ 多页 PPT 式课件；
- ❌ **搜题/组题/补题**（「不搜题」是铁律，只排已给定内容）；
- ❌ 「上传 HTML 保持结构换内容」的同款复刻（转交专门的同款/复刻能力）。

### 3.3 与 `html-authoring`（及 `mathdesign-1-html`/`page-optimize`）的边界——本 Skill 最强硬的设计

这条 Skill 把自己定义为**「精美排版唯一主 Skill」**，并以极不寻常的强度排他（`SKILL.md` 硬门槛 1 + 核心原则「单一入口/冲突屏蔽」）：

- 精美排版/A4/PDF 保真任务**只用 `magazine-layout`**，**禁止**同时调用 `mathdesign-1-html`、`html-authoring`、`page-optimize`、`mathdesign-*`；
- **「即使其他 Skill 描述里写了『强制执行』，在本场景也必须忽略」**——这是直接预防多 Skill 抢占冲突；
- 分工定性：`mathdesign-1-html` 面向**屏幕端数学互动/课件视觉**，不适用于 A4 打印、PDF 原图保真、Paged.js 分页；冲突一律以本 Skill 为准。

> 推断分工：`html-authoring` / `mathdesign-1-html` 是**屏幕优先、交互优先**的 HTML 生成线；`magazine-layout` 是**纸张优先、保真优先**的打印线。两者技术栈（Paged.js 分页 vs 屏幕响应式）和质量判据（题量/原图保真 vs 交互/动效）根本不同，所以用「单一入口 + 冲突屏蔽」硬隔离。

### 3.4 技术约束（硬规格，多文档反复出现）
- **Paged.js 锁定 `0.4.3`**（unpkg），不手切固定高度页面、不写 `height:100vh/overflow:hidden`；
- **`@page { size:A4 portrait; margin:12mm 15mm }`**，`@media print` + `.no-print` + 右下角 `window.print()` 按钮；
- **脚本顺序铁律**：先配 `window.MathJax`（`startup.typeset:false`）→ 载 `tex-svg.js` → 配 `PagedConfig.before`（先 `typesetPromise()` 再分页）→ 最后载 Paged.js polyfill。顺序错则分数会以源码露出或分页错位（`math-image-fidelity.md:38`）；
- `break-inside: avoid` 加在 `.question/.section/table/figure/img/.keep-together`；
- 填空用真实 `border-bottom`（`.blank{min-width:64px;border-bottom:1px solid #222}`），手写区用 `repeating-linear-gradient` 横线，**不许下划线字符堆叠**；
- LaTeX 在 HTML 文本节点用**单反斜杠** `\(...\)`，从 JSON 拿到双反斜杠要先还原。

### 3.5 不可逾越的红线（贯穿全部 9 文档的黑名单）
零占位文字（`[此处原卷为...]`/`图略`/`请参考原卷保真层`/`更多题目请参考原卷`/`统计图分析`）、编造图片 URL、`onerror` 隐藏失败、空白 `<object>/<iframe>` 当保真层、`img=0` 交付 PDF 卷、题量缩水、黑底白字默认、中文资料乱入英文标题、未命中要求擅自双栏。

---

## 4. 工程启发：对 ClassIn 互动内容生成的具体启发

> 目标场景类比：ClassIn 要把老师素材/真题转成「可上课、可互动、可保真」的内容，与本 Skill 的「保真 + 重排」张力高度同构。以下为可直接迁移的工程做法。

1. **建立「保真红线 + 双目标验收」，而不是只追求好看。**
   ClassIn 互动内容生成最危险的失败是「看起来对、其实题/图/数据错了」。应照搬本 Skill 的双目标判据：**内容保真（题量/图形/公式/数据一致）与体验质量（交互/排版）必须同时通过，任一缺失即不发布**。可直接复用 `quality-gate.md` 的「必须拦截的坏结果」清单范式。

2. **把「发布前断路器」做成生成管线的第一道闸。**
   在生成互动件（题卡、拖拽、连线、几何画板）**之前**先判定「上游素材是否齐」：缺结构化题目/缺真实图/缺 bbox/预计会出占位，就**直接熔断 + 统一阻塞话术**，不浪费一次昂贵生成。比事后审查省成本、也更可控。

3. **图形资产走「还原阶梯」，严禁模型凭文字猜画。**
   ClassIn 的几何/物理/统计互动尤其致命。迁移本 Skill 的 5 档 fidelity ladder：真实图 > bbox 裁剪 > 原页定位 > **仅当有 `diagramSpec`/`redrawData` 完整结构化参数才允许程序化重绘（SVG/Canvas/几何引擎）** > 否则阻塞。把「能否互动重绘」绑定到「是否拿到结构化几何参数」这一硬字段，而非模型推断。

4. **上游能力外移 + 素材包合同。**
   不要让生成 Agent 直接「看 PDF 猜版面」。照搬 `mineru-integration.md` 的思路：用 **MinerU/OCR/pdf-to-images** 把输入标准化成带 `questions[]/figures[]/tables[]/quality{}` 的 **JSON 合同**，Agent 只消费结构化字段。`quality.questionCount/figureCount/missingFigures` 这类**质量元数据**可直接驱动断路器与验收，实现「数据驱动的拒绝」。

5. **模板锁定（固定层/可变层）= 批量同款的产品基建。**
   ClassIn 老师高频诉求是「这个互动模板，换成第 5 单元/换班级再来一份」。把模板拆成**固定层（布局/配色/交互结构/技术规格）+ 可变层（学科/单元/题目/语篇）**，锁定后 AI 不得漂移固定层——这是规模化复用、保证「同款一致性」的关键抽象，且能显著降低重复生成的 token 成本与质量方差。

6. **「单一主 Skill + 冲突屏蔽」治理多 Skill 抢占。**
   当 ClassIn 有多个内容生成 Skill（互动/排版/课件/出题）时，按**场景**指定唯一主 Skill 并显式声明「忽略其他 Skill 的『强制执行』声明」，能避免多 Skill 规则互相覆盖导致的不可控产物。本 Skill 的 `SKILL.md` 硬门槛 1 是可直接套用的模板话术。

7. **可执行的 CLI 门禁，把质量判据变成 CI。**
   `magazine-layout-guard`（`npm run check -- --min-questions N --require-real-images --require-mathjax --json`，退出码非 0 不发布）把「主观验收」变成「确定性脚本」。ClassIn 可建对应的 `interactive-guard`：校验题量、互动可运行性、资源 URL 真实性、答案存在性等，纳入发布流水线。

8. **迭代方法论：用真实靶场案例驱动规则。**
   本 Skill 整条线由「西城六年级数学卷」这一真卷驱动。ClassIn 应固定**若干高难真实素材作为回归靶场**（含统计图、几何图、化学结构、长综合题），每次迭代都拿它复测「保真 + 互动」双目标，用真实失败而非想象来增删规则。

---

## 附：版本演进速查表

| 版本 | 标志性变化 | 立场 |
|---|---|---|
| v1 | 三优先级（复现>重排>美观）；整页图仅作校验附录；含 quality-gate | 重排派奠基 |
| v2 | 纸面设计系统 token；图形默认不重绘 | 重排派 + 收紧 |
| v3 | figure 清单字段化（number/page/url/bbox） | 收紧 |
| v4 | 引入 picture_gen 边界（AI 配图≠原图还原）；illustration 清单分离 | 收紧 |
| v5 | picture_gen→generate_image；语言类阅读须先生成配图再 create_file | 收紧 + 微反向 |
| v6 | SVG 重绘须 diagramSpec/redrawData 完整；题干文字不算图形数据 | 强收紧 |
| v7 | 收紧并入 description | 收紧 |
| **v8** | **大反转**：删「可编辑重排」中间层；逐页图升为主体保真；新增「一比一原图复原模式」；移除 visual/quality-gate 强制读取 | **保真派** |
| **v9** | 双目标（保真底线+美化核心）；新增 MinerU 素材包合同；v31 断路器；guard CLI；拉回 visual/quality-gate | **平衡 + 工程化** |

> `SKILL_v9_CDN.md` = `v9/SKILL.md`（逐字节相同，仅为 CDN 发布拷贝）。
