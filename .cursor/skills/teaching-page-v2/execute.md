# 执行细则（互动课件 HTML · SCORM 2004）

> 形态与页数由**服务端上游**保障；Harness 产出 SCORM 2004 4th Edition 单 SCO 包。

## 步骤

1. 规划各页：封面 / 讲解 / 互动 / 测验 / 小结
2. 逐页写 `<template class="page-data" data-id data-name>`
3. `Read` [feixiang-style.md](feixiang-style.md) → 色板写入 `page-shared`
4. 以 [../teaching-page-shared/templates/courseware-starter.html](../teaching-page-shared/templates/courseware-starter.html) 为 Host 骨架
5. 生成 [../teaching-page-shared/templates/imsmanifest.template.xml](../teaching-page-shared/templates/imsmanifest.template.xml) → `imsmanifest.xml`
6. 复制 assets/scorm-api.js + assets/courseware-shell.js
7. **打包**：`bash assets/package-scorm.sh pages/<slug>` → 生成 `<slug>.zip`
8. 过 SKILL.md 交付自检 + [scorm.md](scorm.md) 自检

## 飞象产物对齐

- **预览壳**：白顶栏 + 缩略图栏 + 浅灰舞台 + 居中 960×540 iframe
- **子页**：`.page-container` + `.page-title` + `.card` + `.tip`；封面用 `.cover`
- **画布**：`#eef1f5`；长内容在 `.page-container` 内滚动
- **互动**：`saveState` + 测验 `__cwScormReport`；触控目标 ≥ 44px（见 [responsive.md](responsive.md)）

## 契约

- Host 加载顺序：`<script src="./scorm-api.js">` → `<script src="./courseware-shell.js">`
- `<meta name="cw-mastery-score" content="70">`；spec 含 `scorm=2004`
- 只写 `<template>` 片段；`data-id` 从 1 连续

## 禁止

- 判定 single/multi（服务端职责）
- 省略 imsmanifest / scorm-api / **未打 ZIP**（SCORM 交付不完整）
- 测验页无 `__cwScormReport` 提交上报
