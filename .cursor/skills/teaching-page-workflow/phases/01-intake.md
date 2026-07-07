# Phase 1：接单（Intake）

**输入**：用户原文 + `route.yaml`  
**输出**：`.cursor/workflow/<slug>/intake.yaml`

## 步骤

1. 从用户原文抽取**可验收硬要求**（页数、学科、必含互动/测验、禁止项）
2. 继承 `route.yaml` 的 `product`、`execution_layer`；定 `slug`、`title`、`output_dir`（默认 `pages/<slug>/`）
3. 互动/游戏类：写一句 `core_loop`（最小可玩闭环）
4. `Write` intake.yaml

## intake.yaml 字段

```yaml
slug: acid-base-demo
title: 酸碱中和反应 · 初二化学
product: interactive
execution_layer: v2
output_dir: pages/acid-base-demo
keyword: 酸碱中和
requirements: 初二化学; 4页; 滴定模拟; 4题测验
require: 中和滴定,pH变化,判分
forbid: emoji; 外链视频
core_loop: 滴碱→pH升→中和提示; 测验选题→提交→SCORM上报
page_count_hint: 4
scorm: true
```

## 教研提示（可选，不阻塞）

有时间可读 `courseware-generator/v18/outline-guidance.md` 的信息确认思路，补全 `grade` / `subject` / `topic`；**Cursor 环境无飞象教研工具时，用常识推断并在 intake 注明假设**。

## 下一步

→ [phases/02-outline.md](phases/02-outline.md)
