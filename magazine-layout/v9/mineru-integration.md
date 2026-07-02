# MinerU 上游解析接入

## 目标

`magazine-layout` 不直接猜 PDF 版面、公式和题内图。PDF、图片、DOCX、PPTX、XLSX 等上传文档应优先由 MinerU 或等效文档解析服务转成结构化素材包，再由 Agent 做 A4 精美重排。

MinerU 适合作为精美排版的上游解析层，因为它能把 `PDF`、图片、`DOCX`、`PPTX`、`XLSX` 转成 Markdown / JSON 等机器可读格式，并支持阅读顺序、标题段落结构、图片抽取、表格转 HTML、公式转 LaTeX、扫描件 OCR、多语言 OCR 和版面可视化结果。

## 推荐链路

```plain
用户上传 PDF/图片/DOCX
  ↓
MinerU 解析：Markdown + reading-order JSON + images + tables HTML + formulas LaTeX + layout/spans
  ↓
后端标准化为 magazine-layout 素材包
  ↓
Agent 基于结构化素材生成 A4 精美 HTML
  ↓
magazine-layout-guard 门禁
  ↓
通过后发布；失败则返回缺少 OCR/图片/表格/公式/题量结构
```

## 后端必须保留的 MinerU 输出

后端不要只把 MinerU 的 Markdown 文本传给 Agent。至少需要保留：

- `content.md`：按阅读顺序排列的正文 Markdown，用于可编辑重排。
- `content.json`：阅读顺序 JSON 或等价结构，用于题号、段落、列表、标题层级和块级 bbox。
- `images/`：MinerU 抽取出的原文图片、题内图、截图区域；必须上传成真实 URL。
- `tables`：HTML 表格或结构化表格数据。图片表格必须优先转成 `<table>`，不能只保留截图。
- `formulas`：LaTeX 公式或公式 span，供 MathJax 渲染。
- `layout/spans`：页面、块、行、span 的 bbox 与类型，用于题内图和题目绑定。
- `visualization`：版面可视化、span 可视化结果，用于研发排查，不直接交给用户。

## 标准化素材包

MinerU 输出进入 Agent 前，后端应标准化为以下合同：

```json
{
  "source": {
    "parser": "mineru",
    "fileName": "input.pdf",
    "pageImages": [
      {
        "page": 1,
        "url": "https://...",
        "width": 1240,
        "height": 1754
      }
    ]
  },
  "document": {
    "title": "文档标题",
    "markdownUrl": "https://...",
    "jsonUrl": "https://...",
    "blockCount": 120
  },
  "questions": [
    {
      "id": "q-001",
      "number": "1",
      "section": "选择题",
      "stemHtml": "题干文本，含 MathJax/HTML 表格",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "figures": ["fig-001"],
      "tables": ["table-001"],
      "sourcePage": 1,
      "bbox": {
        "x": 120,
        "y": 300,
        "width": 780,
        "height": 180,
        "unit": "px"
      }
    }
  ],
  "figures": [
    {
      "id": "fig-001",
      "questionId": "q-001",
      "url": "https://...",
      "sourcePage": 1,
      "bbox": {
        "x": 520,
        "y": 360,
        "width": 300,
        "height": 210,
        "unit": "px"
      },
      "kind": "original_crop",
      "canRedraw": false
    }
  ],
  "tables": [
    {
      "id": "table-001",
      "questionId": "q-010",
      "html": "<table>...</table>",
      "sourcePage": 2,
      "bbox": {
        "x": 90,
        "y": 510,
        "width": 960,
        "height": 240,
        "unit": "px"
      },
      "fallbackImageUrl": "https://..."
    }
  ],
  "quality": {
    "questionCount": 30,
    "figureCount": 5,
    "tableCount": 2,
    "formulaCount": 18,
    "ocrConfidence": 0.92,
    "missingFigures": [],
    "warnings": []
  }
}
```

## Agent 使用规则

Agent 拿到 MinerU 素材包后：

1. 先建立内容清单：标题、章节、题号、题量、图片、表格、公式、答案区。
2. Markdown/JSON 文本必须转成可编辑 HTML，不得只贴截图。
3. MinerU 识别出的表格必须优先转成 `<table>`；只有识别失败时才用真实表格截图兜底，并标记需要人工复核。
4. MinerU 识别出的公式必须用 LaTeX + MathJax 渲染；疑似识别错误时保留原图或公式截图作为校验。
5. 题内图必须来自 `figures.url`、`tables.fallbackImageUrl` 或后端 bbox 裁剪结果，禁止 AI 生成图/SVG 猜画冒充。
6. `pageImages` 只作为原卷校验附录或裁剪来源，不能替代可编辑重排正文。
7. 如果 `quality.missingFigures`、低 OCR 置信度、题量不一致或表格/公式缺失，必须阻塞或返回补齐要求，不能发布伪完成 HTML。

## A4 排版要求

MinerU 负责“转成结构化素材”，不负责最终美化。Agent 仍必须：

- 使用 A4 `@page`、Paged.js 和打印样式。
- 设计统一 token：字体、颜色、间距、题号锚点、答题区、表格风格。
- 控制信息密度：页边距、卡片间距和 `break-inside` 要适合打印，不能每页只排很少内容。
- 对图片文字做 OCR 后转成可编辑内容；图片只作为原图校验或识别失败兜底。

## 阻塞条件

以下情况禁止生成或发布最终 HTML：

- 只拿到 PDF URL，没有 MinerU Markdown/JSON、逐页图或抽取图片。
- 只拿到 Markdown，缺少原图/题内图/页面截图，无法做一比一校验。
- 表格只作为图片存在且可读文字未转成 `<table>`，但 Agent 却宣称完成可编辑排版。
- 数学/理科图形题没有真实图 URL/bbox，却使用 SVG/Canvas/AI 图替代。
- 题量、图片数、表格数和 MinerU 质量元数据不一致。

## 与旧方案关系

- MinerU 优先级高于零散 `convert_to_text`，因为它能同时提供阅读顺序、结构、图片、表格、公式和 OCR。
- OCRmyPDF 仍可作为扫描 PDF 的预处理补充，但不能替代 MinerU 的结构化解析，也不能替代 PDF 转图和题内图裁剪。
- `tools/pdf-to-images` 仍用于生成逐页 `pageImages` 或补齐原卷校验附录。
