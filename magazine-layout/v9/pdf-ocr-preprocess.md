# PDF/OCR 预处理策略

## 目标

扫描 PDF、图片型 PDF、截图型试卷不能只依赖模型“看图重写”。正确流程是优先使用 MinerU 或等效文档解析服务；没有 MinerU 时再退回 `convert_to_text`、OCRmyPDF、PDF 转图等组合方案。

1. 用 MinerU 解析出 Markdown、阅读顺序 JSON、图片、HTML 表格、LaTeX 公式、bbox 和逐页图片。
2. 用 OCR/文本转换拿到可编辑文字，图片里的文字和表格必须尽量转为可编辑 HTML。
3. 同时保留原图或原页面截图作为 `<img>` 校验和保真层。
4. 再基于可确认的结构化素材做高级 A4 重排。

MinerU/OCR 是结构化提取，不是最终排版；原图/逐页图是保真校验，不是正文主体。

重要边界：OCRmyPDF 只负责增加 OCR 文本层，不能把 PDF 页自动变成 HTML 图片。PDF 原图保真还需要“PDF 转图片”；HTML 嵌入原 PDF 容易在浏览器/打印中变成空白框，不能作为保真通过依据。

## 后台工具链

在飞象后台 Agent 中，优先使用可用工具：

- MinerU 或等效文档解析服务：推荐上游，用于 PDF/图片/DOCX/PPTX/XLSX 转 Markdown、JSON、图片、HTML 表格和 LaTeX 公式。
- `convert_to_text`：用于图片/PDF OCR 或文本转换，作为 MinerU 未接入时的退路。
- `read_file`：用于读取上传文档文本层。
- `call_skill` / `skills`：用于读取 `magazine-layout` 的完整规则。

处理顺序：

```plain
call_skill("magazine-layout")
  ↓
优先读取 MinerU 素材包（Markdown/JSON/images/tables/formulas/bbox/pageImages）
  ↓
若无 MinerU，再 convert_to_text(fileUrls/imageUrls)
  ↓
建立题量清单 + 图片清单 + 表格清单 + 公式清单
  ↓
可编辑重排正文 + 真实原图校验层（逐页 img / 题内 img）
  ↓
Paged.js A4 HTML
```

## MinerU 能做什么

MinerU 是推荐的上游文档解析层。它可将 `PDF`、图片、`DOCX`、`PPTX`、`XLSX` 转成 Markdown、JSON 等机器可读格式，输出阅读顺序文本，保留标题段落列表结构，抽取图片，识别图片说明、表格、表格标题和脚注，把公式转成 LaTeX，把表格转成 HTML，并能检测扫描/乱码 PDF 后启用 OCR。详细素材包合同见 `mineru-integration.md`。

适合：

- PDF 试卷、扫描卷、教案、讲义。
- 图片中含文字、表格、填空题，需要转为可编辑 HTML 的场景。
- 数学/理科公式、表格、复杂多栏版面。
- 后端希望用 CLI/FastAPI/服务化方式统一预处理文档。

边界：

- MinerU 解析结果仍需质量校验，不能盲信 OCR。
- MinerU 的 Markdown/JSON 不是最终精美排版，Agent 仍需做 A4 设计系统和打印分页。
- 对图形题，MinerU 抽取的真实图片/bbox 优先；不能因为有文字描述就 SVG 猜画。
- 表格识别失败时，必须保留真实表格截图并提示需要复核。

## OCRmyPDF 能做什么

OCRmyPDF 是命令行工具，可以给扫描 PDF 增加 OCR 文本层，使 PDF 可搜索、可复制。它的价值是：在不破坏原 PDF 图片层的前提下，增加可读文字层，方便后续 `read_file` 或文本抽取。

适合：

- 扫描 PDF。
- 图片型试卷 PDF。
- 老师上传整份 PDF，里面没有可复制文本。
- 需要尽量保留原图分辨率，同时增加 OCR 文本层。

不适合：

- 在浏览器 HTML 里直接运行。
- 替代版面保真。
- 替代人工/规则对题量、公式、图形的校验。
- 后台 Agent 未暴露 shell/系统命令时直接调用。

## 推荐命令

本地或后端预处理可使用：

```bash
ocrmypdf -l chi_sim+eng --deskew --rotate-pages --skip-text input.pdf output.ocr.pdf
```

说明：

- `-l chi_sim+eng`：中英文混合 OCR。
- `--deskew`：纠偏扫描页。
- `--rotate-pages`：自动纠正页面方向。
- `--skip-text`：已有文本层的页面跳过 OCR，避免重复处理。

如果只做最小处理：

```bash
ocrmypdf -l chi_sim+eng input.pdf output.ocr.pdf
```

## 集成建议

### 产品当前可落地方案

优先方案：

1. 老师上传 PDF/图片/DOCX。
2. 后端异步调用 MinerU，产出 Markdown、reading-order JSON、images、tables HTML、formulas LaTeX、layout/spans 和 pageImages。
3. 后端把 MinerU 输出标准化为 `mineru-integration.md` 中定义的素材包。
4. Agent 基于素材包生成可编辑 A4 精美 HTML；图片只作为题内真实图、表格识别失败兜底或原卷校验。
5. 后端用 `magazine-layout-guard` 门禁，不通过则不发布。

退路方案：如果后台 Agent 不能直接跑 MinerU/OCRmyPDF：

1. 老师上传 PDF。
2. 后台先走 `convert_to_text`。
3. 用 `tools/pdf-to-images` 将 PDF 每页转为 PNG，并把 PNG 上传为资源 URL。
4. HTML 中必须放入这些真实逐页图片 URL；如果没有逐页图片，不能用空白 PDF 嵌入框冒充保真，也不能继续生成 HTML。
5. OCR 文本只用于辅助重排。

本地验证命令：

```bash
cd tools/pdf-to-images
npm install
npm run convert -- --input "../../2026北京西城六年级（上）期末数学.pdf" --out "../../tmp/pdf-pages-test"
```

该工具会输出 `page-01.png`、`page-02.png` 等图片和 `manifest.json`，后端上传 PNG 后把真实 URL 交给 Agent。

上传完成后，把上传返回结果整理为 `upload-manifest.json`，再生成 Agent 可直接使用的保真输入：

```bash
cd tools/pdf-to-images
npm run build:fidelity -- --upload-manifest "../../tmp/pdf-pages-test/upload-manifest.json"
```

该命令会输出：

- `source-pages.html`：包含真实 `<img>` 的原卷逐页 HTML 片段。
- `agent-fidelity-prompt.md`：包含资源 ID 和 URL 的 Agent 输入说明。
- `fidelity-resources.json`：标准化后的逐页图片资源清单。

Agent 生成 HTML 时必须直接使用 `source-pages.html` 中的真实 URL，不能重新猜测或改写。但逐页图片只能作为校验或裁剪来源，不能替代可编辑重排正文。

### 后端增强方案

如果研发后续愿意加能力：

1. 上传文档后先异步跑 MinerU，生成 Markdown/JSON/images/tables/formulas/layout。
2. 对扫描 PDF 可先或同时跑 OCRmyPDF，生成 `output.ocr.pdf`。
3. 同步用 `tools/pdf-to-images`、`pdftoppm`、`pdftocairo` 或 Ghostscript 将 PDF 每页转为 PNG。
4. 把 MinerU 结构化结果、OCR 后 PDF、每页图片、题内图裁剪资源传给 Agent。
5. Agent 用结构化文本/表格/公式做高级排版，同时用真实图片做保真校验。

### PDF 转图命令

OCRmyPDF 之后，建议再跑：

```bash
pdftoppm -png -r 160 output.ocr.pdf page
```

或：

```bash
pdftocairo -png -r 160 output.ocr.pdf page
```

或：

```bash
gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r160 -sOutputFile=page-%03d.png output.ocr.pdf
```

## 强制边界

- OCR 结果不完整时，不能删题。
- OCR 识别不出图形时，必须保留原图。
- OCR 识别公式错误时，以原图为准。
- MinerU 识别出的图片表格，应优先转成 HTML `<table>`；不能只把表格截图贴到正文里。
- MinerU 只提供 Markdown、没有真实图片/逐页图时，不能宣称一比一原图复原。
- OCRmyPDF 只能改善文本提取，不解决 MathJax、Paged.js、HTML 排版本身。
- 禁止用“占位说明”“请参考原卷保真层”“更多题目请参考原卷”代替原图或缺失题目；没有真实 `<img>` 就不能交付 PDF/截图类试卷。
- 禁止用“[此处原卷为...]”描述图形来代替原图。
- 禁止把 `<object>`、`<embed>`、`<iframe>` 空白 PDF 框当成保真层。
- 禁止按 resourceId 或 PDF 文件名猜测图片 URL；图片 URL 必须来自工具返回结果。
- 禁止用 `onerror` 隐藏图片加载失败。
- 没有真实图片 URL 时，禁止生成 HTML 文件，必须返回阻塞说明。

## 验收

- [ ] PDF 已有可读文本层，或已通过 MinerU/OCR/文本转换提取内容。
- [ ] 图片中的文字、表格已尽量转为可编辑 HTML，而不是只贴截图。
- [ ] HTML 使用真实 `<img>` 保留原图/原页截图。
- [ ] HTML 中没有“此处保留”“此处原卷为”“图略”“占位”“请参考原卷保真层”“更多题目请参考原卷”等伪保真文字。
- [ ] HTML 中没有空白 PDF 嵌入框冒充保真层。
- [ ] HTML 中没有编造图片 URL 或 `onerror` 失败隐藏逻辑。
- [ ] 没有真实图片 URL 时，未生成 HTML 文件。
- [ ] OCR 文本与原图题量一致。
- [ ] 分数/公式没有因为 OCR 误识别而被错误改写。
