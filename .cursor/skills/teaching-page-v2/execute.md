# 执行细则（互动课件 HTML）

> 形态与页数由**服务端上游**保障；Harness 只按需求生成 Host + 子页 + 预览壳。

## 步骤

1. 规划各页：封面 / 讲解 / 互动 / 测验 / 小结（页数来自用户或上游指令）
2. 逐页写 `<template class="page-data" data-id data-name>`
3. `Read` [feixiang-style.md](feixiang-style.md) → 色板写入 `page-shared`
4. 以 [../teaching-page-shared/templates/courseware-starter.html](../teaching-page-shared/templates/courseware-starter.html) 为 Host 骨架
5. 复制 [assets/courseware-shell.js](assets/courseware-shell.js) → 产出目录
6. 过 SKILL.md 交付自检

## 飞象产物对齐

- **预览壳**：白顶栏 + 缩略图栏 + 浅灰舞台 + 居中 960×540 iframe（无外框阴影）
- **子页**：`.page-container` + `.page-title` + `.card` + `.tip`；封面用 `.cover`
- **画布**：`#eef1f5`；长内容在 `.page-container` 内 `overflow-y:auto`
- **互动**：`postMessage` saveState / restoreState（见 [reference.md](reference.md)）

## 契约

- 只写 `<template>` 片段；禁止在 `page-data` 里写 `<html>`/`<head>`/`<body>`
- 壳：`<script src="./courseware-shell.js"></script>`
- `data-id` 从 1 连续
- `page-shared` 禁止 `<script src="…">` 外链

## 禁止

- 判定或分支 single/multi（服务端职责）
- 飞象 CDN 壳；手改 `courseware-shell.js` 逻辑
- 只贴代码不 Write 文件
