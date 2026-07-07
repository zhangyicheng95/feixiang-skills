# Teaching Page Harness 版本管理

| 版本 | 目录 | 状态 | 职责 |
|------|------|------|------|
| **Workflow** | `teaching-page-workflow/` | **编排入口** | Phase 0–6 全流程 |
| **v2** | `teaching-page-v2/` | **执行层** | HTML + 壳 + SCORM + templates |
| v1 | `teaching-page-v1/` | 冻结归档 | 旧 harness（无 SCORM） |
| 兼容入口 | `teaching-page/` | 转发 | → workflow |

## 架构

```
用户需求
    ↓
teaching-page-workflow（路由·大纲·确认·素材）
    ↓ Phase 5
teaching-page-v2（HTML + 壳 + SCORM API + manifest）
    ↓
pages/<slug>/  →  <slug>.zip 上传 LMS
```

过程产物：`.cursor/workflow/<slug>/`（route / intake / outline / assets / deliver）

执行层绑定：见 `teaching-page-workflow/execution-binding.md`（当前 `v2`）

## 三类产物

| product | Phase 5 | ZIP 脚本 |
|---------|---------|----------|
| `static` | 05-generate-static | `package-scorm.sh` |
| `interactive` | 05-generate-interactive | `package-scorm.sh` |
| `game` | 05-generate-game | `package-scorm-game.sh` |

## SCORM 2004（v2 默认）

详见 `teaching-page-v2/scorm.md`。

## 何时用 v1

对照旧行为 / 回归测试。**禁止**新生成默认走 v1。

## 变更记录

- **2026-07-07**：新增 `teaching-page-workflow` 全流程；本地编排取代「服务端上游」假设
- **2026-07-07**：v2 适配 SCORM 2004 4th Edition；游戏单页 + `package-scorm-game.sh`
- **2026-07-07**：补充 `execution-binding.md`、yaml 示例、游戏/静态分支文档
