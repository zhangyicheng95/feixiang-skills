---
name: teaching-page-workflow
description: >-
  K12 教学 HTML 全流程编排（本地 Harness）。覆盖静态课件、互动课件、课程游戏三类产物；
  Phase 0–6 从接单到大纲、确认、素材、生成、SCORM 打包交付。服务端仅提供 Agent 运行时，全流程在此执行。
---

# Teaching Page 全流程（Workflow）

> **服务端只提供 Agent 运行环境**；路由、教研、生成、打包均在本地 `.cursor/skills` 完成。

## 何时启用

用户要生成或重做：教学页面、静态课件、互动课件、课程游戏、课堂演示、多页课件、SCORM 包。

**入口**：本文件 → 按 Phase 顺序执行，**禁止**跳过 Phase 直接写 HTML（修改已有文件走 [phases/06-deliver.md](phases/06-deliver.md) 增量分支）。

## 三类产物

| 类型 | `product` | 生成路径 | 典型页型 |
|------|-----------|----------|----------|
| 静态课件 | `static` | Phase 5 → [phases/05-generate-static.md](phases/05-generate-static.md) → v2 | 封面 / 讲解 / 小结 |
| 互动课件 | `interactive` | Phase 5 → [phases/05-generate-interactive.md](phases/05-generate-interactive.md) → v2 | + 演示 / 测验 |
| 课程游戏 | `game` | Phase 5 → [phases/05-generate-game.md](phases/05-generate-game.md) | 单页完整 HTML + 状态机 |

路由规则见 [route.md](route.md)。

## 工作流总览

```
Phase 0  路由      route.md           → .cursor/workflow/<slug>/route.yaml
Phase 1  接单      phases/01-intake.md    → intake.yaml
Phase 2  大纲      phases/02-outline.md   → outline.yaml
Phase 3  确认      phases/03-confirm.md   → 用户确认后 outline 定稿
Phase 4  素材      phases/04-assets.md    → assets.yaml（可空）
Phase 5  生成      phases/05-generate-*.md → pages/<slug>/
Phase 6  交付      phases/06-deliver.md   → <slug>.zip + 回复用户
```

工作目录：`.cursor/workflow/<slug>/`（过程产物，本地可选提交）；最终产物：`pages/<slug>/`。

执行层绑定见 [execution-binding.md](execution-binding.md)（当前默认 `v2` → `teaching-page-v2/`）。

## Phase 执行纪律

1. **串行**：上一 Phase 产出文件存在后，再进入下一 Phase。
2. **落盘**：每 Phase 必须 `Write` yaml/文档，禁止只在聊天里规划。
3. **飞象对齐**：大纲/互动设计借鉴 `courseware-generator/v18/outline-guidance.md`；游戏借鉴 `teaching-game-design/v1/SKILL.md`；HTML 执行一律走 `teaching-page-v2/`，**模板只读该版本 `templates/`**。
4. **SCORM**：`interactive` / `static` 多页 → 四文件 ZIP；`game` 单页 → 见 `05-generate-game.md`。

## 修改已有课件

1. `Read` `pages/<slug>/index.html`
2. 判断 `product`（有 `template.page-data` → static/interactive；完整单页无 template → game）
3. 仅更新相关 Phase 产物（通常跳过 Phase 3）
4. Phase 5 增量修改 → Phase 6 重新打包 ZIP

## 参考

| 文档 | 用途 |
|------|------|
| [route.md](route.md) | Phase 0 路由 |
| [phases/](phases/) | 各 Phase 细则 |
| [execution-binding.md](execution-binding.md) | 执行层版本绑定（v2 / 未来 v3） |
| [templates/](templates/) | yaml 示例（`*.example`） |
| [../teaching-page-v2/SKILL.md](../teaching-page-v2/SKILL.md) | HTML/壳/SCORM 执行层 |
| [../VERSIONS.md](../VERSIONS.md) | 版本说明 |
