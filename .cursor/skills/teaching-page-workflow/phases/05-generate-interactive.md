# Phase 5b：生成互动课件

**输入**：`outline.yaml` + `assets.yaml`  
**执行层**：`teaching-page-v2/`（主路径）

## 步骤

1. `Read` [../../teaching-page-v2/SKILL.md](../../teaching-page-v2/SKILL.md) + [execute.md](../../teaching-page-v2/execute.md)
2. `Read` [../../teaching-page-v2/feixiang-style.md](../../teaching-page-v2/feixiang-style.md) + [scorm.md](../../teaching-page-v2/scorm.md)
3. 按 `outline.pages` 逐页实现：
   - `demo`：`saveState` + 最小 core-loop
   - `quiz`：提交时 `__cwScormReport({ score, complete, interactions })`
4. 将 `intake.core_loop` 写入 spec 注释
5. 骨架：[../../teaching-page-v2/templates/courseware-starter.html](../../teaching-page-v2/templates/courseware-starter.html)
6. `Write` `pages/<slug>/` 四源文件
7. 从 [imsmanifest.template.xml](../../teaching-page-v2/templates/imsmanifest.template.xml) 生成 manifest；复制 `assets/scorm-api.js` + `courseware-shell.js`
8. `bash ../../teaching-page-v2/assets/package-scorm.sh pages/<slug>`

## 互动扩展（按需）

大纲 `interaction` 含拖拽/分类/排序时，Read 仓库 `drag-interaction/v1/SKILL.md` 选模板后再写子页脚本。

## 飞象对齐（可选深读）

- 大纲页型与互动设计：`courseware-generator/v18/outline-guidance.md`
- HTML 细节：`courseware-generator/v18/html-guide.md`（配色、组件、禁止项）

## 下一步

→ [06-deliver.md](06-deliver.md)
