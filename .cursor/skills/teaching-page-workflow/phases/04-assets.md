# Phase 4：素材（Assets）

**输入**：定稿 `outline.yaml`  
**输出**：`.cursor/workflow/<slug>/assets.yaml`

## 步骤

1. 扫大纲：哪些页需要图/音/公式/示意图
2. 列出素材清单；能内联 SVG/几何块的**不编造外链**
3. 需要图：优先用户提供的 URL；否则 Unsplash/jsDelivr 等**真实可达** URL
4. 无素材需求的静态页 → `assets: []`
5. `Write` assets.yaml

## assets.yaml

```yaml
assets:
  - page_id: 3
    type: image
    purpose: 滴定管示意图
    url: ""           # 留空则用 SVG 几何块代替
    fallback: svg-inline
  - page_id: 4
    type: audio
    purpose: 正确提示音
    url: ""
    fallback: web-audio-beep
```

## 纪律

- **禁止**编造不存在的图片路径
- **禁止** base64 大图塞进 HTML
- 素材未齐不阻塞生成：用 SVG/色块占位并在 spec 注明

## 下一步

按 `route.yaml` 的 `product` 进入 Phase 5 之一：

- `static` → [05-generate-static.md](05-generate-static.md)
- `interactive` → [05-generate-interactive.md](05-generate-interactive.md)
- `game` → [05-generate-game.md](05-generate-game.md)
