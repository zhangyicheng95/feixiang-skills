---
name: teaching-page
description: >-
  K12 教学 HTML 全流程入口。静态课件、互动课件、课程游戏均走 teaching-page-workflow
  Phase 0–6；HTML/SCORM 执行由 teaching-page-v2 完成。
---

# Teaching Page（入口 → Workflow）

```
Read .cursor/skills/teaching-page-workflow/SKILL.md → Phase 0–6
```

| 层 | 目录 | 职责 |
|----|------|------|
| **编排** | `teaching-page-workflow/` | 路由、大纲、确认、素材、交付 |
| **执行** | `teaching-page-v2/` | HTML/壳/SCORM + **本版 templates/** |
| **归档** | `teaching-page-v1/` | 旧 harness，仅回归 |

服务端只提供 Agent 运行时；**全流程在本地 Harness 完成**。

详见 [VERSIONS.md](../VERSIONS.md)。
