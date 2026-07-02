# PDF 原页保真层

## 目标

上传 PDF、扫描卷、截图卷时，必须先保证“原卷看得见”，但这只是校验底线，不是最终排版交付。这里的“看得见”必须是页面内真实 `<img>` 图片，不是可能显示为空白的 PDF 嵌入框。真正的精美排版主体必须是 OCR/结构化后的可编辑 HTML 重排正文。

## 失败条件

以下任一情况直接判定失败，不能交付：

- HTML 中没有真实 `<img>`，却声称保留了原图。
- 用 `<object>`、`<embed>` 或 `<iframe>` 嵌入 PDF 后显示为空白框，仍声称保真通过。
- 自己拼接或猜测图片 URL，例如 `resourceId + page_1.png`、`pdf?page=1`，但该 URL 不是工具返回的真实资源。
- 图片标签带 `onerror` 隐藏失败或显示“请参考 PDF 附件”等兜底文案。
- 使用“[此处保留原卷图形]”“[此处原卷为...]”“图略”“占位”“原图见附件”等文字冒充原图。
- 使用“请参考原卷保真层”“更多题目请参考原卷”等话术代替缺失图形或缺失题目。
- 使用“请参考原卷图示”“统计图分析”“补充统计图”等摘要代替图形题、统计图题或子问。
- 只保留 OCR 文本，丢失几何图、统计图、表格、选项图。
- 无法完整提取题目时，只交付前几题或摘要。
- 只有逐页原卷图片，没有可编辑重排正文，却声称完成精美排版。
- 把“原卷保真层/原卷逐页图片”放在正文主体位置，替代题目重排。

## 保真层优先级

按可用能力选择，优先级从高到低：

1. 后端先返回 OCR 文本、题型结构、题号、公式识别结果、题内图片 URL 或题内图片 bbox，用于生成重排正文。
2. 如果能从 PDF 中提取或裁剪题内图片，HTML 用 `<img>` 回填到对应题目附近。
3. 后端将 PDF 每页转为 PNG/JPEG，HTML 用 `<img>` 放入“原卷校验附录”，并供题内图裁剪核对。
4. 如果只有逐页图片，没有完整 OCR/题目结构，必须告知“当前缺少 OCR 文本/题目结构化结果，无法完成真正重排”，并停止生成 HTML，不能生成贴图式伪排版。
5. 如果有 OCR 文本但没有图形依赖题的题内图 URL/bbox，必须阻塞或要求补题内图片裁剪/定位能力；不得用“见附录”替代题内图。

`<object>`、`<embed>`、`<iframe>` 可以作为“下载原 PDF”的补充链接，但不能命名为“原卷保真层”，不能放在页面首屏占据大块空白，不能替代逐页图片。

`<img src>` 只能使用工具上下文里真实存在的 URL，包括上传资源返回的图片 URL、PDF 转图工具返回的页面图片 URL、OCR/转换工具返回的图片 URL。禁止按命名规律猜测 URL。

## 推荐 HTML：原卷校验附录

如果后端已将 PDF 转成每页图片，只能放在正文之后作为校验附录：

```html
<section class="source-pages">
  <h2>原卷校验附录</h2>
  <p>以下图片仅用于核对原题、图形和公式，不替代前文重排正文。</p>
  <figure class="source-page keep-together">
    <img src="page-1.png" alt="原卷第 1 页" />
    <figcaption>原卷第 1 页</figcaption>
  </figure>
  <figure class="source-page keep-together">
    <img src="page-2.png" alt="原卷第 2 页" />
    <figcaption>原卷第 2 页</figcaption>
  </figure>
</section>
```

## 推荐 HTML：题内图回填

如果后端已提供题内图 URL 或裁剪结果，必须放回对应题目附近：

```html
<li class="question question-with-figure keep-together">
  <div class="question-main">
    <div class="question-body">18. 如图，...</div>
    <div class="answer-line"></div>
  </div>
  <figure class="question-figure">
    <img src="真实题内图URL" alt="第 18 题图" />
    <figcaption>第 18 题图</figcaption>
  </figure>
</li>
```

如果只有原页图和 bbox，必须由后端先裁剪成图片 URL，或提供可安全渲染的裁剪参数。Agent 不得凭视觉猜测 bbox。

## 推荐后端转图命令

`OCRmyPDF` 只增加 OCR 文本层，不负责转 HTML 图片。需要另加 PDF 转图工具。

可选方案：

```bash
pdftoppm -png -r 160 input.pdf page
```

```bash
pdftocairo -png -r 160 input.pdf page
```

```bash
gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r160 -sOutputFile=page-%03d.png input.pdf
```

这些命令产出的 `page-1.png`、`page-2.png` 等图片再上传为资源，供 Agent 嵌入 HTML。

## Agent 执行规则

- 如果上传资源是 PDF，必须优先寻找逐页图片、页面截图、缩略图或题内原图 URL，并用 `<img>` 写入 HTML。
- 如果工具上下文里只有 resourceId，没有 URL，必须通过可用工具读取/引用资源；无法拿到 URL 时，不得写占位文字冒充保留。
- OCR/结构化文本用于生成重排正文；原页图片只能用于校验附录或题内图回填。
- 图形依赖题必须使用题内图 URL、裁剪图 URL 或明确 bbox。只有整页原图但没有 bbox 时，不得宣称题内图已还原。
- 重排层题量无法确认时，不得只交付前几题；必须继续提取，或明确阻塞。
- 没有可编辑重排正文时，不得交付只有原卷图片的 HTML。
- 无法提取题内图或统计图时，不得用“请参考原卷图示”糊弄；必须阻塞或等待题内图片裁剪/定位能力。
- 只有 PDF URL 且没有任何图片 URL 时，不得创建空白 PDF 框；必须输出阻塞说明，而不是生成伪完成 HTML。
- 只有 resourceId 时，不得猜测 `https://resource.feixiang.cn/...page_1.png` 或 `https://api.feixiang.cn/...pdf?page=1` 这类地址。
- 没有真实图片 URL 时，禁止调用 `create_file`，禁止输出任何 HTML 文件。

## 自检

- [ ] HTML 中有可编辑重排正文，且原卷图片只作为题内图或校验附录。
- [ ] 每道图形依赖题都有题号级图片回填或明确阻塞原因。
- [ ] 没有“此处保留”“此处原卷为”“图略”“占位”等伪保真文字。
- [ ] 没有“请参考原卷保真层”“更多题目请参考原卷”等偷懒话术。
- [ ] 没有“请参考原卷图示”“统计图分析”等摘要替代题目。
- [ ] 没有空白 `<object>`、`<embed>`、`<iframe>` PDF 框冒充保真层。
- [ ] 没有编造图片 URL，所有 `<img src>` 都能追溯到工具返回结果。
- [ ] 没有用 `onerror` 隐藏图片加载失败。
- [ ] 没有真实图片 URL 时，已停止生成 HTML 并返回阻塞说明。
- [ ] 重排正文先出现，原卷校验附录后出现；图片不替代正文。
