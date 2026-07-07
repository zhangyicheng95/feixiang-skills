# Phase 5a：生成静态课件

**输入**：`outline.yaml` + `assets.yaml`  
**执行层**：`teaching-page-v2/`

## 步骤

1. `Read` [../../teaching-page-v2/SKILL.md](../../teaching-page-v2/SKILL.md) + [execute.md](../../teaching-page-v2/execute.md)
2. `Read` [../../teaching-page-v2/feixiang-style.md](../../teaching-page-v2/feixiang-style.md)
3. 按 `outline.pages` 写 Host + `page-data`（**无** `<script>` 互动，或仅 CSS 动画）
4. 页型：`cover` / `concept` / `summary` 为主
5. spec 注明 `product=static`
6. 骨架：[../../teaching-page-v2/templates/courseware-starter.html](../../teaching-page-v2/templates/courseware-starter.html)
7. 从 [imsmanifest.template.xml](../../teaching-page-v2/templates/imsmanifest.template.xml) 生成 `imsmanifest.xml`
8. 复制 `../../teaching-page-v2/assets/scorm-api.js` + `courseware-shell.js`
9. `bash ../../teaching-page-v2/assets/package-scorm.sh pages/<slug>`

## 静态纪律

- 仍用多页 Host + 缩略图（飞象课件形态）
- 禁止为「静态」砍掉壳或 SCORM
- 长文走 `.page-container` 滚动

## 下一步

→ [06-deliver.md](06-deliver.md)
