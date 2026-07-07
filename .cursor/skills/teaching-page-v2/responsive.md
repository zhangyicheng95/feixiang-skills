# 多端适配（PC + iPad）

> 逻辑画布固定 **960×540**；终端差异由**预览壳等比缩放** + **触控优化**解决，不重排为流式布局。

## 预览壳（courseware-shell.js）

| 终端 | 宽度断点 | 行为 |
|------|----------|------|
| **PC** | > 1024px | 左侧缩略图栏 + 居中画布；最大 100% 不放大 |
| **iPad / 小屏** | ≤ 1024px | 缩略图改**顶部横向滚动**；舞台占满剩余高度；画布等比缩小 |
| **窄屏** | ≤ 768px | 顶栏精简按钮；更小缩略图；更小舞台边距 |

### 触控

- 舞台区**左右滑动**翻页（≥ 48px 水平滑动）
- 缩略图、按钮最小触控 **44×44px**（`pointer: coarse`）
- 全屏仍可用；旋转屏幕后 `orientationchange` 重算缩放

### 视口

Host `index.html`：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

## 子页内容（page-shared）

- `.page-container`：`overflow-y:auto` + `-webkit-overflow-scrolling:touch`
- `.btn` / 测验 `.opt`：`min-height:44px`；`touch-action:manipulation`
- 禁止子页 `100vh`；长内容容器内滚动

## 生成注意

1. 双栏网格（`grid-template-columns:1fr 1fr`）在 960 画布内可用；不要假设更宽视口
2. 互动控件间距留足，避免缩略后难点中
3. 封面/全屏页仍 `height:100%` 铺满逻辑画布

## 自检

```
□ PC 浏览器：缩略图在左，画布居中完整可见
□ iPad 竖屏（或 DevTools 768px）：缩略图在顶横向滚，画布缩小但不变形
□ 滑动舞台可翻页；测验按钮可点
□ 长页在 page-container 内可滚动
```
