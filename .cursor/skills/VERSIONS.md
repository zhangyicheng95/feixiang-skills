# Teaching Page Harness 版本管理

| 版本 | 目录 | 状态 | 职责 |
|------|------|------|------|
| **v2** | `teaching-page-v2/` | **当前默认** | 互动课件 + SCORM 2004 运行时 |
| 共享模板 | `teaching-page-shared/templates/` | 生成骨架 | courseware-starter + imsmanifest 模板 |
| v1 | `teaching-page-v1/` | 冻结归档 | 旧 harness（无 SCORM） |
| 兼容入口 | `teaching-page/` | 转发 | → v2 |

## 架构边界

```
服务端上游（形态、页数、路由）
        ↓
teaching-page-v2（HTML + 壳 + SCORM API + manifest）
        ↓
pages/<slug>/  →  ZIP 上传 LMS
```

## SCORM 2004（v2 默认）

每套产物：**`<slug>.zip`**（LMS 上传）+ 开发目录四源文件（本地预览）。

打包：`teaching-page-v2/assets/package-scorm.sh`

详见 `teaching-page-v2/scorm.md`。

## 何时用 v1

对照旧行为 / 回归测试。**禁止**新生成默认走 v1。

## 变更记录

- **2026-07-07**：v2 适配 SCORM 2004 4th Edition
- **2026-07-06**：v2 精简 — 单页/多页归服务端；移除本地决策层
