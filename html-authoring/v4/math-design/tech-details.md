# html-authoring · 技术细节（按需 read_url）

## 参考配色方案（5 个，**仅非数学场景**；数学走 math-design）

| 方案 | 风格 | 主题 | 背景 | 文字 | 点缀 | 字体 |
|---|---|---|---|---|---|---|
| 品牌色 | 清新简约 | #A7DBAD/#0A4737 | #D3E09C/#D8FBF7 | #0D2620/#60A0A0 | #FF6421/#A1CAF9 | 无衬线 |
| 复古绿 | 严谨教育 | #2D593E | #1D422B/#EBEDD4 | #021502/#AE7645 | #DC2626/#259525 | 有衬线(宋体/思源宋体) |
| 沉稳橙 | 信息聚焦 | #FF5600 | #F4F3EC | #0C0302/#74706E | #FF5600/#FF8941 | 无衬线 |
| 暗夜 | 科技神秘 | #868686 | #000000 或 #090B2F | #FFFFFF/#E4E4E4 | #4DFF4D/#FF2E26/#FF7710 | 不限 |
| 赛博 | 科技感 | #1A243C | #000000 或 #1C0C57 | #FFFFFF/#E4E4E4 | #175FFF/#F901F7/#67F844 | 不限 |

通用规则：科学-蓝绿 / 语文-暖色 / 物理化学-沉稳；用 5 个 CSS 变量（primary/secondary/accent/background/foreground）统一管理，禁整页硬编码；渐变用于标题(hero)/按钮/柔和背景。

## 图片容器边界规则（反"半截裁切"）

核心：插入 hero/场景卡/故事图的图片**主体必须完整可见**，禁被父容器 `overflow:hidden` 切掉。
1. 图片用 `object-fit:contain` 而非 `cover`（cover 会裁主体），除非明确作背景装饰；
2. 定位到卡片边缘的图，宽度不得 ≥50% 容器宽，否则必出界；
3. 必须绝对定位放小图时，给容器 `overflow:visible` 或给图 `max-width/height` + `object-fit:contain`；
4. hero 大图设 `min-aspect-ratio` 保护区，避免窄容器压成条；
5. 严禁把人物/动物主体图放在"会被 `overflow:hidden` 的卡片边缘"——放中间或改 `contain`。
自检：对每张有主体的图，脑内模拟父容器 `overflow:hidden` 后的可见区，主体任何部分出界就调整。

## 动画效果选择指南

优先 CSS `transform`/`opacity`，0.3-0.8s，60fps。

| 教学目的 | 动画类型 | 推荐库 |
|---|---|---|
| 引导注意力 / 元素入场 | 加载/入场 | Anime.js |
| 数据变化 | 数字滚动/图表 | Anime.js |
| 演示过程/步骤 | 逐步生成 | Anime.js |
| 复杂动画序列 | 时间轴编排 | GSAP |
| 数学/科学可视化 | 动态图形/粒子 | p5.js |
| 3D 几何/曲面 | 3D 渲染 | Three.js(复杂)/p5.js WEBGL(简单) |

**库 API 坑**：
- Anime.js：easing 用官方白名单字符串 `easing:'easeInOutQuad'`，禁 `'ease-in-out'`/`'swing'`/`'bounce'`（被忽略 + console warning）。
- GSAP：参数名 `ease`（不是 easing），值如 `'power2.inOut'`；两库别混用。
- 时间单位：Anime.js 用 ms，GSAP 用秒。

## 媒体资源来源白名单（严格）

**只允许**：① `generate_image` 返回 URL(飞象域 `*.fbcontent.cn`) ② `generate_voice` 返回 URL ③ 飞象素材库(`musk-test.fbcontent.cn/pub-musk-ai-studio/*`) ④ 代码内嵌 SVG/Canvas/CSS 图形 ⑤ 小体积 SVG 的 Data URI。
**严禁**：`storage.googleapis.com/*`、`*.amazonaws.com/*`、unsplash/pexels 等图库、`raw.githubusercontent.com/*`、教程里 copy 的 texture 路径、**编造的 URL**（`*_placeholder.png`/`temp_*.png`/`example.jpg`，即便拼成飞象域也不行）。

## CDN 资源使用（注入位置与加载规则）

CDN URL **不在本 skill 重复定义**——常用库（Tailwind/Anime.js/GSAP/p5.js/Three.js+OrbitControls/MathJax/Core.js）的自定义 CDN URL 由 System Prompt「HTML 产物硬约束 → 外部库 CDN 白名单」统一声明，直接复用。
- 注入位置：所有 `<script>` 放 `<head>`，Tailwind 优先加载，其余按需。
- 未列库（D3/ECharts/HanziWriter 等）用公共 CDN（cdnjs/jsdelivr）：
  - D3：`https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.0/d3.min.js`
  - ECharts：`https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.0/echarts.min.js`
  - HanziWriter：`https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js`
- 禁凭印象写库名/路径；宁用白名单内库能力组合替代幻觉库。

## 数学公式渲染（MathJax 3，补充）

- CDN 用 System Prompt 白名单 MathJax3 URL 放 `<head>`。
- **所有**数学表达式/变量/符号都用 `\(...\)`/`\[...\]` 包裹（含标题、说明、按钮文案、tooltip）。
- 正确：`若 \(a=b\)`、`\(x+1=6\)`、`\[\int_0^1 x^2\,dx\]`；错误：`若 $a=b$`、`$$\int...$$`。

## HTML 结构要求

`<meta name="viewport" content="width=device-width, initial-scale=1.0">` 必需；语义化 `<main>/<section>/<article>` + 完整 ARIA；Tailwind 放 `<head>`；重复片段用 `<template>`+`content.cloneNode(true)`。

## 3D 图形选型与踩坑

选型：简单几何体/旋转 → p5.js WEBGL；复杂曲面/自定义几何/高级材质 → Three.js。
**贴图铁律**：严禁从教程 copy 外站 texture URL。纯色/渐变/星空地球 → `THREE.CanvasTexture` 代码绘制；真实照片 → `generate_image` 飞象域 URL；严禁 GCS/GitHub/任何外站。
- p5.js 坑：禁用 `sphere/box/cylinder/cone/torus/plane` 作变量名（覆盖内置）；`createCanvas` 别忘 `WEBGL`。
- Three.js 坑：未引 `OrbitControls`；未设光照(物体全黑)；忘 `requestAnimationFrame(animate)`；相机在原点看不到物体；开 `enableDamping` 忘 `controls.update()`；外部贴图 CORS 失败（按媒体白名单）。

## CSS 浏览器前缀（目标 Chrome ≥ 63）

需加 `-webkit-`：`backdrop-filter`、`appearance`(含 `input[type=range]`)、`background-clip:text`+`text-fill-color`、`transform`、`transition`、`user-select`。`box-shadow` 已原生支持，无需前缀。

## 教学设计要点

认知负荷：一次一个核心概念、5-8 分步、渐进呈现。必备交互：播放/暂停/重置、前进/后退、速度(0.5x-2x)、进度跳转。认知支架：关键概念高亮、分步说明、误区纠正、提示帮助。
