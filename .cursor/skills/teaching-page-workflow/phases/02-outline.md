# Phase 2：大纲（Outline）

**输入**：`intake.yaml`  
**输出**：`.cursor/workflow/<slug>/outline.yaml`

## 步骤

1. 按 `product` 规划页面/关卡结构
2. 每页/关：`id`、`name`、`type`、一句话 `goal`、`interaction`（无则 `none`）
3. `interactive`：至少标 1 页 `demo` 或 `quiz` 的 `interaction` 要点
4. `game`：写 `levels[]`（每关 3–5 题或任务），不拆多页 Host
5. `Write` outline.yaml

## 页型（type）

| type | 用途 |
|------|------|
| `cover` | 封面 |
| `concept` | 概念讲解 |
| `demo` | 互动演示（saveState） |
| `quiz` | 测验（__cwScormReport） |
| `summary` | 小结 |

## outline.yaml 示例（static）

```yaml
title: 细胞结构 · 初一生物
product: static
execution_layer: v2
page_count: 3
pages:
  - id: 1
    name: 封面
    type: cover
    goal: 课题与学习目标
    interaction: none
  - id: 2
    name: 结构讲解
    type: concept
    goal: 细胞膜、细胞质、细胞核
    interaction: none
  - id: 3
    name: 小结
    type: summary
    goal: 三结构功能对照
    interaction: none
```

单页静态（`page_count: 1`）仍用 `courseware-starter` + 1 条 `page-data`，保留壳与 SCORM。

## outline.yaml 示例（interactive）

```yaml
title: 酸碱中和反应 · 初二化学
product: interactive
execution_layer: v2
page_count: 4
pages:
  - id: 1
    name: 封面
    type: cover
    goal: 呈现课题与学习目标
    interaction: none
  - id: 2
    name: 概念讲解
    type: concept
    goal: 定义中和反应与方程式
    interaction: none
  - id: 3
    name: 滴定模拟
    type: demo
    goal: 观察 pH 随滴碱变化
    interaction: slider+reset; saveState
  - id: 4
    name: 课堂测验
    type: quiz
    goal: 4 题选择判分
    interaction: choice×4; scormReport on submit
```

## game 大纲示例

```yaml
title: 酸碱配对闯关
product: game
execution_layer: v2
game:
  levels:
    - id: 1
      name: 入门
      questions: 3
      difficulty: easy
    - id: 2
      name: 进阶
      questions: 4
      difficulty: medium
  mechanics: choice闯关; 即时反馈; 计分; 结算页
  core_loop: 选题→作答→反馈→下一题→通关结算→scormReport
```

## 下一步

→ [phases/03-confirm.md](phases/03-confirm.md)
