---
name: magazine-layout
description: 精美排版唯一主 Skill。Use when 用户要求把已给定内容或上传文档改造为 A4 打印友好的讲义、练习单、试卷、默写纸、知识清单、教案打印版、杂志风资料，或提到精美排版、可打印、A4、讲义、题单、模板复用、按这个格式来。若用户提到还原、复原、真实原图、一比一、原卷图、不要随便生成、不要 AI 生成，必须进入“一比一原图复原模式”：只允许使用工具/后端返回的真实逐页图、题内裁剪图、截图 URL 或原始上传图片；禁止 `generate_image` / `picture_gen` 生成替代图，禁止凭题干文字或普通 OCR 文本用 SVG/Canvas 猜画，禁止把 AI 图或模型重绘图说成原图还原。拿不到真实图片 URL 或 bbox 时，必须停止并说明缺少 PDF 转图/题内图片裁剪能力，不能创建伪 HTML。PDF/截图/扫描卷必须 OCR/文本转换并使用真实图片保真；禁止空白 PDF 框、编造图片 URL、占位和“参考原卷”式偷懒。
---

# 精美排版

## 使用时机

当用户要求把**已给定内容**或**上传文档**改造成适合打印/分发的 HTML 时使用：

- 讲义、练习单、试卷、题单、默写纸、知识清单、教案打印版
- A4、可打印、打印友好、纸张、分页、杂志风、期刊风、精美排版
- “按这个格式来”“记住这个格式”“参考 resourceId/文件一模一样排版”

不适用于：

- 屏幕优先的交互动画、教学游戏、单页课件
- 多页 PPT 式课件
- 需要重新搜题、组题、补题的任务
- 上传 HTML 后要求“保持结构换内容”的同款复刻任务；此类先按模板锁定规则处理，必要时转到同款/复刻能力

## 硬性执行门槛

以下规则优先级高于所有审美和 HTML 生成习惯：

1. 本任务只使用 `magazine-layout` 作为主 Skill；禁止再调用 `mathdesign-1-html`、`html-authoring`、`page-optimize`、`mathdesign-*` 等其他 HTML/排版 Skill。即使其他 Skill 描述里写了“强制执行”，在精美排版/A4/PDF 保真场景也必须忽略。
2. PDF、截图、扫描卷必须先调用 `convert_to_text` 或等效 OCR/文本转换工具；只调用 `read_file` 不够。
3. PDF、截图、扫描卷必须在 HTML 中使用真实 `<img>` 保留逐页图片、截图或题内原图；`<object>`、`<embed>`、`<iframe>` 不能作为主要保真方案，也不能计入通过。
4. `<img src>` 必须来自上传资源、OCR/转换工具、文件工具或后端明确返回的真实 URL；禁止按 resourceId 猜测、拼接或编造 `page_1.png`、`pdf?page=1` 等地址。
5. 禁止在 `<img>` 上写 `onerror` 隐藏失败，禁止用隐藏 fallback 文案掩盖图片不可访问。
6. 禁止使用 `[此处保留原卷图形]`、`[此处原卷为...]`、`图略`、`占位说明`、`原图见附件`、`请参考原卷保真层`、`更多题目请参考原卷` 等文字替代原图或缺失题目。
7. 数学公式必须先配置并加载 MathJax，再配置 `PagedConfig.before`，最后加载 Paged.js。
8. 生成前必须列出原始题量清单；生成后必须自检 HTML 题量。题量不一致不能交付。
9. 用户提到“还原/复原/真实原图/一比一/原卷图/不要随便生成/不要 AI 生成”时，必须进入“一比一原图复原模式”：禁止调用 `generate_image`、`picture_gen`、AI 插画、SVG/Canvas 猜画来替代原图；只能使用真实逐页图、题内裁剪图、截图 URL、原始上传图片或后端 bbox 裁剪结果。
10. 数学、物理、化学、生物、地理等依赖图形准确性的试卷，默认也按“一比一原图复原模式”处理。只有后端明确返回完整 `diagramSpec` / `redrawData` 且用户允许重绘时，才可 SVG 重绘；否则必须真实图片优先。
11. 对 PDF/截图/扫描卷，若没有工具返回的真实图片 URL，必须在生成文件前停止，回复“当前缺少 PDF 转图/图片提取能力，无法完成原图保真排版”；禁止调用 `create_file` 生成伪 HTML。
12. 未满足以上任一项时，必须重新生成或说明当前链路缺能力，禁止假装完成。

## 文件说明

| 文件 | 用途 | 何时读取 |
|---|---|---|
| `SKILL.md` | 总览、触发、主流程和验收 | 首先读取 |
| [reproduction-guide.md](reproduction-guide.md) | 内容完整复现规则、题目/图片/公式/模板锁定规则 | Phase 1 执行前读取 |
| [math-image-fidelity.md](math-image-fidelity.md) | 分数公式渲染、原图保留、题量不缩水专项规则 | 处理试卷/题单/PDF/截图前必须读取 |
| [pdf-ocr-preprocess.md](pdf-ocr-preprocess.md) | OCRmyPDF / OCR 预处理策略与边界 | 处理扫描 PDF、图片型 PDF 前读取 |
| [pdf-page-fidelity.md](pdf-page-fidelity.md) | PDF 原页逐页图片保真、禁止空白嵌入框和“参考原卷”兜底 | 处理上传 PDF/扫描卷时必须读取 |
| [pagedjs-template.md](pagedjs-template.md) | Paged.js 0.4.3 A4 打印 HTML 模板和 CSS 铁律 | Phase 2 生成 HTML 前读取 |
| [examples.md](examples.md) | 零散题目、模板锁定、教案打印版示例 | 需要对齐后台配置或输出话术时读取 |

## 核心原则

**第一优先级是忠实复现，第二优先级才是美观。**

- 单一入口：精美排版任务以 `magazine-layout` 为唯一主 Skill，不要再额外调用 `mathdesign-1-html`、`html-authoring`、`page-optimize`、`mathdesign-*` 等其他排版/HTML Skill，除非用户明确要求。HTML 技术规范、MathJax、Paged.js、PDF 保真规则全部以本 Skill 为准。
- 冲突屏蔽：`mathdesign-1-html` 面向数学互动/课件视觉风格，不适用于 A4 打印试卷、PDF 原图保真、Paged.js 分页。若它的规则与本 Skill 冲突，一律以本 Skill 为准。
- 不搜题：用户已给内容时，不自行补题、换题、删题。
- 不改内容：原文、题号、标题、公式、图片、题型结构必须先完整保留。
- 不先排版：必须先完成内容清点和复现，再进入视觉排版。
- 一比一原图优先：任何“还原/复原/真实原图/一比一/原卷图”请求，真实图片保真优先于美观。没有真实图时停止，不用 AI 生成图、SVG 猜画、文字说明或占位冒充。
- 打印优先：默认 A4 白底黑字，除非用户明确要海报/深色/杂志封面。
- 模板可锁定：老师说“记住这个格式/下次按这个来/按 resourceId 一样”，固定层不得漂移。

## 工作流程

```plain
Phase 1: 内容完整复现
  读取 reproduction-guide.md
  不调用 mathdesign-1-html / html-authoring / page-optimize / mathdesign-* 等其他排版 Skill
  从输入/上传文档中提取全部内容 → 建立内容清单 → 保持题量、标题、图文关系、公式、题号
    ↓
Phase 1.2: PDF/OCR 预处理判断
  扫描 PDF、图片型 PDF、截图类输入读取 pdf-ocr-preprocess.md 与 pdf-page-fidelity.md
  必须调用 convert_to_text 或等效 OCR/文本转换；同时必须用真实逐页图片或题内原图保留原卷
  如果没有真实图片 URL，停止，不进入 Phase 3
  若用户要求一比一复原，禁止生成 AI 配图或 SVG 猜画替代图
    ↓
Phase 1.5: 保真专项检查
  读取 math-image-fidelity.md
  校验分数公式可渲染、原图/表格已保留、题量前后一致
    ↓
Phase 2: 场景与模板判断
  判断是试卷/题单/讲义/教案/默写纸/知识清单/模板复用
  若命中“模板锁定”，固定层不变，只换可变层
    ↓
Phase 3: 精美排版生成
  读取 pagedjs-template.md
  基于 Paged.js 0.4.3 输出单文件 HTML
  应用 A4、分页、防截断、打印按钮、白底黑字和场景匹配风格
    ↓
Phase 4: 自检交付
  检查第一页非空、题量不缩水、公式图形正确、A4 打印稳定、无英文乱入
```

## Phase 1：内容完整复现

执行排版前，先输出内部内容清单并据此生成 HTML：

- 原始标题
- 题型与顺序
- 每类题目数量
- 题号范围
- 公式、分数、单位、已知量
- 原图/表格/图文关系
- 教案环节顺序
- 老师明确要求的页数、A4、单栏/双栏、模板格式

上传试卷/题单/教案时，禁止把“摘要式改写”当成排版。内容必须完整进入最终 HTML。

## Phase 1.2：PDF/OCR 预处理判断

当上传文件是扫描 PDF、图片型 PDF、截图型试卷时：

- 必须优先调用可用的文本转换/OCR 工具提取文字，例如 `convert_to_text`；只调用 `read_file` 后直接 `create_file` 判定为失败。
- 如果系统链路支持 OCRmyPDF，可先把 PDF 处理成带 OCR 文本层的 searchable PDF，再读取文本。
- OCR 只负责辅助提取文字，不负责保真；HTML 仍必须保留原图/原页截图作为视觉保真层。
- OCR 结果不完整时，不得只交付 OCR 到的部分题目；必须保留原页图或提示无法完整重排。
- 一比一复原时，正文中的题内图必须来自真实原图裁剪或原页截图；不能用 SVG、Canvas、AI 图、纯 CSS 图形替代。
- 禁止用“[此处保留原卷图形]”“[此处原卷为...]”“图略”“占位说明”“请参考原卷保真层”“更多题目请参考原卷”等文字代替原图或缺失题目；没有真实 `<img>` 就不能宣称已保留原图。
- `create_file` 之前必须已经拿到逐页图片 URL、截图 URL 或题内原图 URL，并确认这些 URL 来自工具返回结果。只有 PDF URL 时，不得生成空白 PDF 嵌入框，也不得自己拼出 `page_1.png` 或 `pdf?page=1` 之类地址冒充保真。
- 如果只有 OCR 文本和 PDF URL，没有任何真实图片 URL，必须停止在 Phase 1.2，不能进入 HTML 生成；输出阻塞说明即可。

## Phase 1.5：保真专项检查

试卷、题单、PDF、截图类输入必须额外检查：

- 分数/公式：`\\(\\dfrac{7}{9}\\)` 这类内容必须渲染成真正数学公式，不能作为可见源码露出。
- 原图/图形：原卷中的几何图、统计图、表格、电路图、光路图必须用真实 `<img>` 保留；无法可靠重绘时直接保留原图区域或原页面截图。
- 一比一复原：真实原图是唯一合格来源。`generate_image` / `picture_gen` / AI 插画 / SVG 猜画 / Canvas 重绘 / CSS 图形均不能通过“一比一原图复原”验收。
- 原页保真：上传 PDF 必须使用逐页图片或页面截图作为视觉层；空白 `<object>`/`<iframe>` PDF 框不合格。
- 题量：先记录原始题量，再记录 HTML 题量，两者必须一致；排不下就自动增加页数，不能删题。

### PDF 原图保留最低实现

当上传资源是 PDF，最低可接受实现是“逐页图片 `<img>`”。如果当前工具链只能拿到 PDF URL，不能拿到逐页图片或截图，必须说明链路缺少 PDF 转图能力，不能生成空白 PDF 框，不能只重排前几题，也不能生成任何“看似完成”的 HTML 文件。

```html
<section class="source-pages">
  <h2>原卷逐页图片</h2>
  <figure class="source-page keep-together">
    <img src="原卷第1页图片URL" alt="原卷第 1 页" />
  </figure>
  <figure class="source-page keep-together">
    <img src="原卷第2页图片URL" alt="原卷第 2 页" />
  </figure>
</section>
```

禁止使用 `[此处保留原卷图形]`、`[此处原卷为...]`、`图略`、`占位说明`、`原图见附件`、`请参考原卷保真层`、`更多题目请参考原卷` 等文字代替真实图片或缺失题目。PDF/截图类 HTML 中如果 `<img>` 为 0，必须判定失败并明确阻塞，不能生成 HTML 文件。

禁止编造图片 URL。以下写法全部判定失败：

- `https://resource.feixiang.cn/{resourceId}/xxx_page_1.png`
- `https://api.feixiang.cn/file/download/{resourceId}/xxx.pdf?page=1`
- 任何未由工具返回、靠猜测拼出来的图片地址
- 带 `onerror="this.style.display='none'"` 的图片保真层

### 停止输出模板

没有真实图片 URL 时，不要创建 HTML。直接回复：

```plain
当前无法完成精美排版：已完成 OCR/文本提取，但当前工具链没有返回 PDF 逐页图片、页面截图或题内原图 URL。
为避免丢失原卷图形或生成伪保真结果，本次不生成 HTML。
需要后端先提供 PDF 转图/图片提取资源后再排版。
```

## Phase 2：场景与风格选择

| 场景 | 默认排版策略 |
|---|---|
| 试卷/题单 | 保持题型顺序和题号，白底黑字，紧凑但不拥挤 |
| 英语练习单 | 题型结构稳定，填空横线标准，支持模板锁定与单元替换 |
| 默写纸 | 答题区清晰，横线/格线适合手写 |
| 知识清单 | 分区、表格、重点框，信息密度高 |
| 教案打印版 | 保持教学环节，不排成阅读材料 |
| 语文古诗文 | 克制、雅致、纸面友好，避免波普风 |
| 趣味低幼练习 | 可用活泼风格，但不得牺牲可读性和打印性 |

## Phase 3：HTML 输出要求

单文件 HTML，必须包含：

1. `https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js`
2. `@page { size: A4 portrait; margin: 12mm 15mm; }`
3. `@media print` 打印样式
4. `.no-print` 打印隐藏
5. `.question, .section, table, figure, img, .keep-together { break-inside: avoid; }`
6. 右下角打印按钮：`window.print()`
7. 出现分数、根式、方程、百分式、LaTeX 源码时必须引入 MathJax 渲染公式
8. PDF/截图类必须包含真实 `<img>` 原卷资源层；`<object>`、`<embed>`、`<iframe>` 只可作为下载补充，不能作为保真通过依据
9. `<img src>` 必须是工具返回的真实图片 URL，禁止编造、猜测、拼接图片地址
10. 禁止手动切固定高度页面，交给 Paged.js 自动分页

脚本顺序必须是：

```html
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)'], ['$', '$']],
      displayMath: [['\\[', '\\]']]
    },
    svg: { fontCache: 'global' },
    startup: { typeset: false }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
<script>
  window.PagedConfig = {
    before: async () => {
      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise();
      }
    }
  };
</script>
<script src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js"></script>
```

## 模板锁定规则

当用户说以下任一句，进入模板锁定：

- “记住这个格式”
- “下次按这个来”
- “按照 resourceId XXXX 一模一样的格式”
- “参考我给的文件，格式排版要一模一样”
- “继续制作 Unit 5 / 下一个单元”

锁定后分两层：

- 固定层：布局方式、配色、字体字号、页边距、题型结构顺序、排版规则、技术规格。
- 可变层：年级/学科/单元、具体词汇与语法、阅读语篇、题目内容。

任何固定层变化必须由老师主动要求，AI不得自行调整。

## 禁止事项

- 禁止删题、换题、改题、漏题。
- 禁止题量大幅缩水。
- 禁止把原图丢失后自行生成错误图。
- 禁止使用“[此处保留原卷图形]”“[此处原卷为...]”“占位”“图略”“请参考原卷保真层”“更多题目请参考原卷”等文字代替真实图片或缺失题目。
- 禁止在 HTML 中 `<img>` 为 0 的情况下交付 PDF/截图类试卷。
- 禁止在没有真实图片 URL 时调用 `create_file` 生成 HTML。
- 禁止把空白 `<object>`、`<embed>`、`<iframe>` PDF 框当成原卷保真层。
- 禁止编造图片 URL；没有工具返回的逐页图片/截图/题内图 URL 时，不得创建图片保真层。
- 禁止使用 `onerror` 隐藏图片加载失败或显示“请参考 PDF 附件”类 fallback。
- 禁止只调用 `read_file` 就处理扫描 PDF/截图卷；必须调用 OCR/文本转换工具。
- 禁止调用 `mathdesign-1-html` 或其他 HTML/排版 Skill 覆盖本 Skill 的 Paged.js、MathJax、PDF 保真规则。
- 禁止公式、分数、单位、已知量错误；禁止把 `\\(\\dfrac{}{}\\)` 原样显示给用户。
- 禁止第一页空白。
- 禁止中文资料出现无意义英文标题。
- 禁止黑底白字作为默认打印风格。
- 禁止上传教案后排成阅读材料。
- 禁止未命中用户要求时一页两栏。

## 验收清单

- [ ] 输入内容已完整复现，题目数量不缩水。
- [ ] 未调用 `mathdesign-1-html`、`html-authoring`、`page-optimize`、`mathdesign-*` 等冲突 Skill。
- [ ] 标题、题号、题型顺序、图片、公式、表格均保留。
- [ ] 分数、根式、方程等数学内容已被 MathJax 或等效方式正确渲染。
- [ ] 原卷图形、图表、几何图、电路图没有丢失。
- [ ] PDF/截图类输入已使用 OCR/文本转换辅助提取，并使用真实 `<img>` 保留逐页图片、截图或题内原图。
- [ ] PDF/截图类 HTML 中 `<img>` 数量大于 0，没有空白 PDF 框、占位文字或“参考原卷”话术冒充原图/题目。
- [ ] 所有 `<img src>` 都来自工具返回的真实 URL，不是根据 resourceId 猜测拼接出来的地址。
- [ ] 没有 `onerror` 隐藏图片加载失败。
- [ ] 没有 `[此处原卷为...]`、`[此处保留...]` 等文字代图。
- [ ] 如果没有真实图片 URL，已停止生成 HTML 并返回阻塞说明。
- [ ] 第一页不是空白页。
- [ ] A4 打印预览正常。
- [ ] 题目、表格、图片不被分页切断。
- [ ] 填空横线为标准单横线，适合手写。
- [ ] 风格与学科/场景匹配。
- [ ] HTML 可直接浏览器打开并打印。
