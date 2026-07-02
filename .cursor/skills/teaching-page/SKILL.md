---
name: teaching-page
description: >-
  Generates runnable K12 teaching HTML (single-page interactives or multi-page
  courseware with local shell). Use when the user asks for 教学页面、互动课件、教学动画、
  单页 HTML、课堂演示、答题页、拖拽练习、多页课件、PPT式课件, or wants a browser-openable
  teaching page from a prompt.
---

# Teaching Page（最小 Harness + Skill）

在 **Cursor Agent** 里用本 Skill：读规则 → 写 HTML → 用户浏览器打开即跑。不依赖飞象 Runtime / CDN 壳。
**产物视觉必须贴近飞象老师**：平涂、描边、高对比、结构拆解，无阴影 / 无渐变主背景 / 无 emoji。

## 路由（第 0 步，命中即停）

| 用户意图 | 模式 | 产出 |
|---|---|---|
| 多页 / 课件 / PPT / 翻页 / 缩略图 | `multi` | 1 个 `.html` + 同目录 `courseware-shell.js` |
| 其他（动画、海报、单页练习、游戏） | `single` | 1 个完整 `.html` |

需求模糊时默认 `single`；页数 ≥2 或明确「课件」→ `multi`。

## 工作流

```
1. 从用户原文抽取可验收要点 → 写入 <head> 的 spec 注释
2. 【必做】读 feixiang-style.md → 按算法选 1 套色板 → 写 fx-style 注释
3. 有玩法/答题/模拟器 → 先声明「最小可玩闭环」（见下）
4. 选模式 → 读对应模板（本目录 templates/，已内置飞象风 page-shared）
5. Write 文件到用户指定路径；未指定则 pages/<简短英文名>/
6. multi 模式：必须把 assets/courseware-shell.js 复制到与 .html 同目录
7. 交付前过「交付自检」+「飞象风自检」→ 告知用户用浏览器打开路径
```

**禁止**：只输出代码块不建文件；multi 模式引用飞象 CDN 壳；用 base64 大图/长音频。

## 飞象视觉契约（所有产物必遵守）

**第一动作：先 `Read` 本目录 [feixiang-style.md](feixiang-style.md)**，按其规则生成。核心 7 条：

1. **无阴影**——禁止 `box-shadow` 做立体感，层次靠描边 + 色块。
2. **平涂**——背景纯色；禁止 `linear-gradient` 当页/卡主背景（封面最多极轻同色渐变）。
3. **描边**——卡片/按钮/演示区都有 `border`（1–4px solid），边色 `rgba(0,0,0,.3)` 或深同色。
4. **圆角成套**——全课件统一一个 `--radius`（0/8/10/20/26 选一）。
5. **演示区网格底纹**——Stage 用略深纯色底 + CSS 网格（`background-size:30px 30px`），仅装饰。
6. **多色分块**——演示核心知识点激活色板 90%+ 预设色，实色块 + 深描边区分对象。
7. **无 emoji**——标题/要点前禁用 emoji；图标示意图用 SVG / 纯色几何块。

**选色**：按 keyword 首末字符 codepoint + 页数取模，从 feixiang-style.md §2 的 6 套色板机械选 1 套；用户指定深浅/风格则从命。选定后写入 `page-shared` 的 `:root` 令牌与 `.fx-*` 组件（模板已内置，替换令牌值即可）。

## 最小可玩闭环（互动类必做）

动手写代码前，用一句话声明 DoD，并在 spec 里写 `core-loop=...`：

| 类型 | 闭环 |
|---|---|
| 选择题/闯关 | 出题 → 作答 → 判分/反馈 → 下一题或重置 |
| 拖拽配对 | 真拖拽 → 命中判定 → **检查按钮** → 对错反馈 → 重置 |
| 模拟/动画 | 开始 / 暂停 / 重置 + 状态可见 |

每个可见按钮必须有事件，点击后 DOM 或文案必须变化。

## spec 注释（所有产物必写）

放在 `<head>` 内，两行：

```html
<!-- spec: requirements=用户硬要求逐条; require=必含项; forbid=禁止项; core-loop=仅互动类 -->
<!-- fx-style: palette=FX-青(B-08); radius=0; keyword=酸碱中和; source=hash -->
```

## 模式 A：单页 `single`

- 完整 `<!DOCTYPE html>` 文档，首行 `<!DOCTYPE html>`。
- 画布建议 `min-height: 100vh` 或固定 960×540 居中；`:root` 令牌取自选定飞象色板。
- 遵循飞象视觉契约（平涂/描边/无阴影/无 emoji），组件用 `.fx-*`（见 feixiang-style.md §4）。
- 公式用 `\(...\)` / `\[...\]`（若用 MathJax，从 jsDelivr 引）。
- 图片/音频：优先用户给的 URL；否则 Unsplash/jsDelivr 等公开 CDN，**禁止编造不存在的路径**。
- 模板见 [templates/single-page-starter.html](templates/single-page-starter.html)。

## 模式 B：多页 `multi`

- **只写 `<template>` 片段**，禁止在 `page-data` 里写 `<html>`/`<head>`/`<body>`。
- 视口 **960×540**（宽固定、高为可视窗口）；共享库只放 `page-shared`，禁止放 Host `<head>`。
- 壳脚本固定：`<script src="./courseware-shell.js"></script>`（与 html 同目录）。

### 画布与溢出（必遵守）

壳在 iframe 内注入 **宽 960px、高 540px、纵向可滚动** 的视口。内容超高时应在视口内滚动，**禁止被裁切且无法查看**。

**`page-shared` 必须包含**（直接复制）：

```css
.slide {
  width: 100%;
  min-height: 540px;
  box-sizing: border-box;
}
.slide--fit {
  /* 单屏封面/全屏动画：恰好铺满 540px */
  height: 540px;
  overflow: hidden;
}
.slide--scroll {
  /* 多题测验、长文讲解：视口内滚动 */
  max-height: 540px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

| 页面类型 | 用法 |
|---|---|
| 封面、单屏动画 | 外层 `slide slide--fit` |
| 概念讲解、多题测验、列表 | 外层 `slide slide--scroll` |
| 互动作图（控件+画布） | 优先一屏放下；放不下用 `slide--scroll` |

**禁止**：在 `.slide` 上写 `overflow: hidden` 且内容超过 540px；禁止 `height: 100%` 撑满后再塞超长内容却不加滚动。

**高度预算**（尽量一屏，超出再滚）：标题区 ≤80px；正文 16–18px 行高 1.5；单页选择题 ≤3 题，更多则拆页。
- 互动页须 `postMessage` 状态（翻页恢复）：

```javascript
// 变更即上报
window.parent.postMessage({ type: 'saveState', state: { /* 可 JSON 序列化 */ } }, '*');
// 恢复
window.addEventListener('message', (e) => {
  if (e.data?.type === 'restoreState') restoreUI(e.data.state);
});
```

- 拖拽页：`mousedown` 加 `.dragging`，`mouseup` 移除。
- **`page-shared` 禁止写 `<script src="…"><\/script>`**（会破坏 Host HTML 解析，导致只剩最后一页）。外部库用正常 `</script>` 闭合，或仅在需要的子页里 **动态 `createElement('script')` 加载**。
- 模板见 [templates/courseware-starter.html](templates/courseware-starter.html)。
- 壳实现见 [assets/courseware-shell.js](assets/courseware-shell.js) — **生成 multi 时复制到产出目录，不要改壳逻辑**。

## 修改已有文件

1. `Read` 目标 HTML。
2. 只改用户要求部分；保留 spec、配色令牌、壳 script 路径。
3. multi 模式改页内容只动对应 `<template class="page-data">`。

## 交付自检（全部 ✓ 才能结束）

```
□ 已 Write 文件到磁盘（非仅聊天展示）
□ spec + fx-style 两行注释存在且覆盖用户硬要求
□ 互动类：core-loop 每步有代码实现
□ 每个按钮/可点元素有事件且有效
□ multi：courseware-shell.js 与 .html 同目录；page-data 连续 data-id 从 1 起
□ multi：page-shared 中的库未误放在 Host head
□ multi：page-shared 含 `.slide` / `slide--fit` / `slide--scroll` 规则；长内容页使用 `slide--scroll`
□ 无字面量 </template> 在 template 内 script 中（用 <\/template>）
□ 已告诉用户打开方式（浏览器打开文件路径）
```

## 飞象风自检（全部 ✓ 才算"像飞象"）

```
□ 全程无 box-shadow / text-shadow（层次靠 border + 色块）
□ 页/卡背景是纯色，未用渐变作主背景（封面允许极轻同色渐变）
□ 卡片/按钮/演示区都有 solid border；圆角统一为 --radius
□ 配色来自选定色板（fx-style 注释一致），非通用蓝 #2563eb
□ 标题/要点/按钮无 emoji；图标示意图用 SVG/几何块
□ 演示/互动区用 .fx-demo 网格底纹，核心演示激活多色分块
□ 文字高对比（近黑/近白），非大片浅灰细字
```

## 回复用户格式

1. 一句话说明页面做什么、怎么操作（1–2 句）。
2. 产出路径列表。
3. multi 时提醒：两文件需同目录，双击 html 或用 Live Server 打开。

## 附加参考

- **飞象视觉样式（必读）**：[feixiang-style.md](feixiang-style.md)
- 契约细节见 [reference.md](reference.md)
- 飞象完整版对照见项目根 `courseware-shell-接口设计.md`（不必每次读取）
