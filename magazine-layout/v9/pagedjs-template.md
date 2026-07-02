# Paged.js A4 HTML 模板规范

## 必备脚本

使用指定版本的 Paged.js：

```html
<script src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js"></script>
```

含数学公式时必须引入 MathJax，并让 Paged.js 在公式渲染后再分页：

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
```

## 标准 HTML 骨架

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>精美排版资料</title>
  <!-- 如果有分数、公式、根式，先加载 MathJax，再让 Paged.js 分页 -->
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
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #1f2623;
      background: #f2f3ef;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }

    .document {
      background: #fffefa;
    }

    .no-print {
      display: block;
    }

    @media print {
      body {
        background: #fff;
      }

      .no-print {
        display: none !important;
      }
    }

    .pagedjs_pages {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 24px 0;
    }

    .pagedjs_page {
      background: #fffefa;
      box-shadow: 0 8px 24px rgba(31, 38, 35, 0.16);
    }

    .section,
    .question,
    .question-group,
    .answer-area,
    table,
    figure,
    img,
    .keep-together {
      break-inside: avoid;
    }

    .source-figure {
      margin: 4mm 0;
      text-align: center;
    }

    .source-figure img,
    .question img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
      object-fit: contain;
    }

    .source-figure figcaption {
      margin-top: 2mm;
      color: #6b7280;
      font-size: 10px;
    }

    .source-pages {
      margin: 0 0 8mm;
      padding: 5mm;
      border: 1px solid #cfd8d3;
      background: #fff;
      break-inside: avoid;
    }

    .source-page {
      margin: 0 0 6mm;
      break-inside: avoid;
    }

    .source-page img {
      width: 100%;
      border: 1px solid #d7ded9;
      background: #fff;
      display: block;
    }

    .source-note {
      margin: 0 0 3mm;
      color: #4b5f57;
      font-size: 11px;
    }

    .math {
      white-space: nowrap;
    }

    .print-btn {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 10;
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      color: #fff;
      background: #5b21b6;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(91, 33, 182, 0.22);
    }
  </style>
</head>
<body>
  <main class="document">
    <!-- 在这里写流式内容，不手动切 page，不写死页面高度 -->
  </main>
  <button class="print-btn no-print" onclick="window.print()">打印本页</button>
</body>
</html>
```

## 打印铁律

- 交给 Paged.js 自动分页，不手写 `<div class="page">`。
- 不写 `height: 100vh`、`overflow: hidden`、固定页面高度。
- 默认 A4 纵向，边距 `12mm 15mm`。
- 题目、表格、图片、答题区必须加 `break-inside: avoid`。
- 原卷图片必须复用或以原页面截图兜底保留，不能因为排版重构而丢图。
- PDF/截图类必须包含真实 `<img>` 原卷资源标签；`<object>`、`<embed>`、`<iframe>` 不计入保真通过。
- 禁止使用“[此处保留原卷图形]”“图略”“占位”“请参考原卷保真层”“更多题目请参考原卷”等文字代替原图或缺失题目。
- 禁止猜测或拼接图片地址；`img src` 必须来自工具返回的真实 URL。
- 禁止给保真图片添加 `onerror` 隐藏失败或显示“请参考 PDF 附件”。
- 禁止使用 `[此处原卷为...]` 或任何文字描述代替原图。
- 如果没有真实图片 URL，不要使用本 HTML 模板，直接返回阻塞说明。
- 有 `\dfrac`、`\frac`、`\times`、根式、方程时必须启用 MathJax，且不能把 LaTeX 源码转义成可见文本。
- 填空题使用真实横线，不用下划线字符堆叠：

```css
.blank {
  display: inline-block;
  min-width: 64px;
  border-bottom: 1px solid #222;
  vertical-align: baseline;
}
```

- 手写答题区使用横线或浅色网格，不能只留空白：

```css
.writing-lines {
  min-height: 46mm;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 8mm,
    rgba(31, 38, 35, 0.28) 8.2mm
  );
}
```

## PDF 原卷逐页图片结构

PDF、扫描卷必须使用逐页图片或页面截图，不能用空白 PDF 嵌入框冒充保真：

```html
<section class="source-pages">
  <h2>原卷逐页图片</h2>
  <figure class="source-page keep-together">
    <img src="工具返回的原卷第1页图片URL" alt="原卷第 1 页" />
  </figure>
  <figure class="source-page keep-together">
    <img src="工具返回的原卷第2页图片URL" alt="原卷第 2 页" />
  </figure>
</section>
```

如果当前工具链只能拿到 PDF URL，不能拿到图片 URL，不要生成空白框。应说明“当前缺少 PDF 转图/图片提取能力”，等待后端提供逐页图片资源。
不要自己把 PDF URL 改写成 `?page=1`，也不要猜测 `_page_1.png`。

## 推荐视觉风格

| 风格 | 适用 | 关键样式 |
|---|---|---|
| 优雅紫色练习单 | 小学英语、语文、综合练习 | 背景 `#faf5ff`，标题 `#5b21b6`，重点框淡紫 |
| 清爽学术绿 | 数学、科学、知识清单 | 米白纸、深绿标题、细分割线、紧凑表格 |
| 经典试卷黑白 | 正式考试、测评 | 白底黑字、少装饰、题号清晰、答题区明显 |
| 温和低幼彩色 | 低年级趣味练习 | 少量柔和色块、图标点缀、不能影响打印 |
| 古典纸本文雅 | 古诗文、阅读 | 宋体/衬线标题、浅米底、注释侧栏 |

## 排版密度建议

- 选择题：可用两栏或三栏网格，但题干长时回到单栏。
- 填空题：单列优先，保证手写空间。
- 词汇/短语清单：可用 3-5 列紧凑网格。
- 阅读理解：文章单栏，题目可分组，避免文章和题目被不自然截断。
- 教案：按环节分块，不追求题单式压缩。
