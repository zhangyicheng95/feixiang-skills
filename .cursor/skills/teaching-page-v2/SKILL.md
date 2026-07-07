---
name: teaching-page-v2
description: >-
  教学 HTML Harness 执行层 v2。由 teaching-page-workflow Phase 5 调用：
  多页 Host + page-data + 预览壳（static/interactive），或单页游戏 HTML。
---

# Teaching Page v2（Harness 执行层）

在 **Cursor Agent** 里：读规则 → 写 HTML → 浏览器打开即跑。不依赖飞象 CDN 壳。

**边界**：本目录是**执行层**，由 [teaching-page-workflow](../teaching-page-workflow/SKILL.md) Phase 5 调用。**不**单独跳过 Workflow 做全流程（修改已有课件除外）。

## 工作流（Phase 5 内）

```
1. 读 .cursor/workflow/<slug>/outline.yaml + intake.yaml（含 execution_layer）
2. Read feixiang-style.md → 选色板 → fx-style 注释
3. static/interactive：templates/courseware-starter.html Host + page-data
   game：templates/game-starter.html 单页 + 状态机
4. Write pages/<slug>/ + package-scorm.sh 或 package-scorm-game.sh
5. 交付自检 + 飞象风 + SCORM（见 scorm.md）
```

详见 [execute.md](execute.md)。

## 产出（SCORM 2004）

| 交付物 | 说明 |
|--------|------|
| **`<slug>.zip`** | **最终产物**，上传 LMS |
| `index.html` | Host（开发目录，便于本地预览） |
| `imsmanifest.xml` | 清单 |
| `scorm-api.js` | 从 [assets/scorm-api.js](assets/scorm-api.js) 复制 |
| `courseware-shell.js` | 从 [assets/courseware-shell.js](assets/courseware-shell.js) 复制 |

打包：`bash assets/package-scorm.sh pages/<slug>`。详见 [scorm.md](scorm.md)。

## 飞象视觉契约

**先 Read [feixiang-style.md](feixiang-style.md)**。页内 `.card` 可轻阴影；画布 `#eef1f5` 无外框阴影；无 emoji。

## spec 注释（必写）

```html
<!-- spec: requirements=...; require=...; core-loop=...; scorm=2004 -->
<!-- fx-style: palette=FX-青(B-08); layout=page-container; keyword=...; source=hash -->
```

## 修改已有课件

`Read` 目标 HTML → 只改用户要求部分；保留 spec、壳路径、配色令牌、`page-data` 结构。

## 交付自检（多页 static / interactive）

```
□ 已 Write 到磁盘（非仅聊天展示）
□ spec + fx-style 覆盖用户硬要求
□ 互动类 core-loop 每步有实现
□ <slug>.zip 已生成（ZIP 根目录 imsmanifest + 四文件）
□ courseware-shell.js + scorm-api.js 与 index.html 同目录（从 assets/ 复制）
□ imsmanifest.xml 四文件 href 正确；spec 含 scorm=2004
□ 测验页提交时调用 __cwScormReport（score + complete + interactions）
□ page-data 连续 data-id 从 1 起
□ page-shared 未误放 Host head；禁止 page-shared 内 script src 外链
□ 标准页 .page-container 内 overflow-y:auto 滚动
□ 子页按 960×540 排版；无 template 内 script 字面量 </template>
□ 已告知 LMS 交付路径（`<slug>.zip`）与本地预览路径（`index.html`）
```

## 交付自检（game 单页）

```
□ <slug>.zip 已生成（ZIP 根目录三文件：imsmanifest + index + scorm-api）
□ 无 courseware-shell.js；结算调用 __cwScormReport
□ 状态机集中管理 phase；触控目标 ≥ 44px
```

## 飞象风自检

```
□ page-container（§4.6）：.page-title + .card + .tip
□ 壳：缩略图 + 居中 960×540；画布与舞台同色
□ 配色与 fx-style 一致；无 emoji
□ PC + iPad：见 responsive.md 自检（缩略图布局、等比缩放、触控翻页）
```

## 参考

- 执行细则：[execute.md](execute.md)
- 模板：[templates/](templates/)（本版本自有，不跨版本共享）
- 视觉：[feixiang-style.md](feixiang-style.md)
- 契约：[reference.md](reference.md)
- SCORM：[scorm.md](scorm.md)
- 多端：[responsive.md](responsive.md)
- 版本：[../VERSIONS.md](../VERSIONS.md)
