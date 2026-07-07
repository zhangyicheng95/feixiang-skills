# Teaching Page 契约参考

> **视觉样式一律以 [feixiang-style.md](feixiang-style.md) 为准**（飞象风：平涂/描边/无阴影/无 emoji/网格演示区/多色分块）。本文件只记录**技术契约**（结构、协议、排障）。

## 设计令牌（飞象色板）

令牌整组取自选定飞象色板，示例（FX-青 / B-08）：

```css
:root{
  --bg:#FFFFFF; --text:#00404D; --primary:#00404D; --accent:#137F8B;
  --card:#D3F6F4; --card-border:rgba(0,64,77,.30);
  --demo-bg:#D3F6F4; --demo-border:#93BFC2; --demo-grid:#DBF1F0;
  --btn-primary-bg:#00404D; --btn-primary-fg:#FFFFFF;
  --btn-2nd-bg:#ECFCFB; --btn-2nd-fg:#00404D;
  --radius:0px;
}
```

组件类 `.fx-card` / `.fx-demo` / `.fx-btn` / `.fx-btn--2nd` / `.fx-chip` / `.fx-block` / `.fx-head` 见 feixiang-style.md §4，模板 `page-shared` 已内置。**换色板 = 整组替换 `:root` 令牌值**，组件不动。

## 视口与滚动（multi）

- **预览壳**（`assets/courseware-shell.js`）：飞象风 UI；主区居中 **960×540** iframe，不足时缩小、全屏时**等比放大**（不拉伸变形）；全屏范围为 **缩略图栏 + 主舞台**（顶栏/底栏隐藏，按 Esc 退出）
- **子页注入**：`html,body { width:960px; height:540px; overflow:hidden; background:#eef1f5 }`（与舞台同色，无白底卡片）
- **预览壳**：`.cw-stage-frame` **禁止** `box-shadow` / 圆角外框；阴影仅允许在页内 `.card`
- **标准页**：`.page-container` 内 `overflow-y:auto` 滚动；封面/转场为全屏特例（`.cover` 等）
- **禁止**子页用 `100vh`；禁止在 Host `page-shared` 写 `<script src="…"><\/script>`

## 壳层 srcdoc 注入（排障）

- 壳用 `iframe.srcdoc = 字符串` 注入子页；**不要**对 `page.body` 里的 `</script>` 替换成 `<\/script>`——子页内联脚本无法闭合，3D / 测验点击会全部失效。
- `<\/script>` 只用于 `courseware-shell.js` 源文件内拼接 pageReady 尾脚本（防截断壳自身）。

## multi 页文件结构

```html
<template class="page-shared">
  <style>:root { --primary: #2563eb; }</style>
</template>

<template class="page-data" data-id="1" data-name="封面">
  <style>...</style>
  <div class="slide">...</div>
  <script>...</script>
</template>

<script src="./courseware-shell.js"></script>
```

## postMessage 协议（multi）

| 方向 | type | 说明 |
|---|---|---|
| 子→壳 | `saveState` | 状态变更即发送，state 可 JSON.stringify |
| 壳→子 | `restoreState` | 后退到已访问页时恢复；state 可能为 null |

## 壳注入全局（multi）

- `window.__CW_MODE__`：`'main'`（本 MVP 壳仅主区）

## 与飞象差异（Cursor MVP）

| 项 | 本 Skill | 飞象生产 |
|---|---|---|
| 壳 | 本地 `courseware-shell.js` | CDN 闭源 |
| 缩略图 | 简化侧栏 | 完整三 iframe |
| MuskCollect | 无 | 数据回收 |
| test_html 云测 | 无，靠交付自检 | Playwright 云函数 |
| 媒体 | 公开 CDN 可用 | 仅 fbcontent 白名单 |
