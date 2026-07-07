# Phase 6：交付（Deliver）

**输入**：`pages/<slug>/` 已生成  
**输出**：向用户交付路径 + 自检通过

## 步骤

1. 过 [../../teaching-page-v2/SKILL.md](../../teaching-page-v2/SKILL.md) 交付自检（按 product 选多页或 game 清单）
2. 确认 ZIP 存在：
   - static / interactive：`pages/<slug>/<slug>.zip`（四文件）
   - game：`pages/<slug>/<slug>.zip`（index + manifest + scorm-api）
3. 在 `.cursor/workflow/<slug>/deliver.md` 写交付摘要并 `Write` 落盘
4. 回复用户（必须包含）：

```
本地预览：pages/<slug>/index.html
LMS 上传：pages/<slug>/<slug>.zip
产物类型：<static|interactive|game>
页数/关卡：...
```

## 增量修改（已有课件）

1. `Read` 目标 HTML + workflow 历史（若有）
2. 只改用户要求部分；保留 spec、壳、配色
3. 重新执行打包脚本
4. 更新 `deliver.md`

## 失败回滚

| 问题 | 回到 |
|------|------|
| 大纲与需求不符 | Phase 2–3 |
| 缺素材 | Phase 4 |
| HTML/SCORM 错误 | Phase 5 |
| ZIP 缺文件 | 本 Phase 重跑打包 |
