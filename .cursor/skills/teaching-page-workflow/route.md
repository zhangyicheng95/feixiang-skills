# Phase 0：产物路由

在用户第一条需求到达后 **5 秒内**判定 `product`，并 `Write` `.cursor/workflow/<slug>/route.yaml`。

## 判定（命中即停）

| 条件 | `product` |
|------|-----------|
| 闯关 / 游戏 / 计分 / 关卡 / 翻牌 / 限时挑战 / 边玩边学 | `game` |
| 多页 / 课件 / PPT / 翻页 / 缩略图 / 互动课件 / 演示+测验 | `interactive` |
| 仅讲解 / 静态 / 知识呈现 / 不要互动 / 阅读型 | `static` |
| 页数 ≥2 且未明确游戏 | `interactive` |
| 单页动画 / 海报 / 一屏演示（无翻页） | `static`（单页 Host 或单页 game 除外） |

**歧义默认 `interactive`**；明确「小游戏」→ `game`。

## route.yaml

```yaml
product: interactive  # static | interactive | game
execution_layer: v2     # 绑定执行层，见 execution-binding.md
slug: acid-base-demo
title: 酸碱中和反应 · 初二化学
keyword: 酸碱中和
rationale: 用户要求 4 页含滴定互动与测验
```

## 下一步

→ [phases/01-intake.md](phases/01-intake.md)
