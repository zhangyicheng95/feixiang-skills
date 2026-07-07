# 执行层绑定

Workflow **只编排**；HTML/壳/SCORM **由执行层 Skill 完成**。执行层随 Harness 版本演进，**禁止跨版本引用模板或 assets**。

## 当前默认

| 字段 | 值 |
|------|-----|
| `execution_layer` | `v2` |
| 目录 | `.cursor/skills/teaching-page-v2/` |
| 模板 | `teaching-page-v2/templates/` |
| 运行时 | `teaching-page-v2/assets/`（`courseware-shell.js`、`scorm-api.js`、打包脚本） |

在 `route.yaml` 与 `intake.yaml` 中**必须**写入 `execution_layer: v2`，便于日后切 v3 时 Phase 5 可读绑定。

## Phase 5 路由

| product | 文档 | 打包脚本 |
|---------|------|----------|
| `static` | [phases/05-generate-static.md](phases/05-generate-static.md) | `assets/package-scorm.sh` |
| `interactive` | [phases/05-generate-interactive.md](phases/05-generate-interactive.md) | `assets/package-scorm.sh` |
| `game` | [phases/05-generate-game.md](phases/05-generate-game.md) | `assets/package-scorm-game.sh` |

## 归档执行层

| 层 | 目录 | 何时用 |
|----|------|--------|
| v1 | `teaching-page-v1/` | 回归对照；**禁止**新生成默认绑定 |

## 升级 v3 时（预留）

1. 新建 `teaching-page-v3/`，自带 `templates/` + `assets/`
2. 更新本文件默认 `execution_layer`
3. Workflow Phase 0–4 可不变；Phase 5 文档增加 v3 分支或改默认指向
