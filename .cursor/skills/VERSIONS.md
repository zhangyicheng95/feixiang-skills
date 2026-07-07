# Teaching Page Harness 版本管理

| 版本 | 目录 | 状态 | 职责 |
|------|------|------|------|
| **v2** | `teaching-page-v2/` | **当前默认** | 互动课件 HTML + 本地预览壳（纯执行） |
| 共享模板 | `teaching-page-shared/templates/` | 生成骨架 | `courseware-starter.html` |
| v1 | `teaching-page-v1/` | 冻结归档 | 旧 harness（含内嵌 single/multi 路由） |
| 兼容入口 | `teaching-page/` | 转发 | → v2 |

## 架构边界

```
服务端上游（形态、页数、路由）
        ↓
teaching-page-v2（本仓库 .cursor — 只生成 HTML + 壳）
        ↓
pages/<slug>/index.html + courseware-shell.js
```

**本 Harness 不包含**：前置决策层、single/multi 判定、`.cursor/decisions/`。

## 何时用 v1

对照旧行为 / 回归测试。**禁止**新生成默认走 v1。

## 变更记录

- **2026-07-06**：v2 精简 — 移除本地决策层；单页/多页归服务端
- **2026-07-06**：v2 初版 — 决策层从 v1 harness 迁出（已废弃本地决策）
