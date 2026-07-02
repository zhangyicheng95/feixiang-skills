# PDF/OCR 预处理策略

## 目标

扫描 PDF、图片型 PDF、截图型试卷不能只依赖模型“看图重写”。正确流程是：

1. 用 OCR/文本转换拿到可编辑文字。
2. 同时保留原图或原页面截图作为 `<img>` 视觉保真层。
3. 再基于可确认的文字做重排。

OCR 是辅助提取，不是替代原卷。

重要边界：OCRmyPDF 只负责增加 OCR 文本层，不能把 PDF 页自动变成 HTML 图片。PDF 原图保真还需要“PDF 转图片”；HTML 嵌入原 PDF 容易在浏览器/打印中变成空白框，不能作为保真通过依据。

## 后台工具链

在飞象后台 Agent 中，优先使用可用工具：

- `convert_to_text`：用于图片/PDF OCR 或文本转换。
- `read_file`：用于读取上传文档文本层。
- `call_skill` / `skills`：用于读取 `magazine-layout` 的完整规则。

处理顺序：

```plain
call_skill("magazine-layout")
  ↓
convert_to_text(fileUrls/imageUrls)
  ↓
建立题量清单 + 图片清单
  ↓
真实原图保真层（逐页 img / 题内 img） + 可确认文字重排层
  ↓
Paged.js A4 HTML
```

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

如果后台 Agent 不能直接跑 OCRmyPDF：

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

Agent 生成 HTML 时必须直接使用 `source-pages.html` 中的真实 URL，不能重新猜测或改写。

### 后端增强方案

如果研发后续愿意加能力：

1. 上传 PDF 后先异步跑 OCRmyPDF。
2. 生成 `output.ocr.pdf`。
3. 同步用 `tools/pdf-to-images`、`pdftoppm`、`pdftocairo` 或 Ghostscript 将 PDF 每页转为 PNG。
4. 把 OCR 后的 PDF 与每页图片作为新资源传给 Agent。
5. Agent 用 OCR 文本做结构化排版，同时用原页图片做保真层。

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
- OCRmyPDF 只能改善文本提取，不解决 MathJax、Paged.js、HTML 排版本身。
- 禁止用“占位说明”“请参考原卷保真层”“更多题目请参考原卷”代替原图或缺失题目；没有真实 `<img>` 就不能交付 PDF/截图类试卷。
- 禁止用“[此处原卷为...]”描述图形来代替原图。
- 禁止把 `<object>`、`<embed>`、`<iframe>` 空白 PDF 框当成保真层。
- 禁止按 resourceId 或 PDF 文件名猜测图片 URL；图片 URL 必须来自工具返回结果。
- 禁止用 `onerror` 隐藏图片加载失败。
- 没有真实图片 URL 时，禁止生成 HTML 文件，必须返回阻塞说明。

## 验收

- [ ] PDF 已有可读文本层，或已通过 OCR/文本转换提取内容。
- [ ] HTML 使用真实 `<img>` 保留原图/原页截图。
- [ ] HTML 中没有“此处保留”“此处原卷为”“图略”“占位”“请参考原卷保真层”“更多题目请参考原卷”等伪保真文字。
- [ ] HTML 中没有空白 PDF 嵌入框冒充保真层。
- [ ] HTML 中没有编造图片 URL 或 `onerror` 失败隐藏逻辑。
- [ ] 没有真实图片 URL 时，未生成 HTML 文件。
- [ ] OCR 文本与原图题量一致。
- [ ] 分数/公式没有因为 OCR 误识别而被错误改写。
