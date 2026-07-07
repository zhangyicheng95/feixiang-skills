# 飞象视觉样式规范（Feixiang Style System）

> 目标：让本 harness 生成物**高度接近飞象老师课件**的视觉观感。
> 依据：项目内飞象原始 skill 文件 `html-authoring/color-palettes-*`、`html-authoring/v5/references/visual-impact.md`、`courseware-generator/v18/html-guide.md`。
> 生成教学 HTML 时，**样式必须遵循本文件**，覆盖任何"通用好看"的默认审美。

---

## 0. 一句话审美

**平涂、描边、高对比、结构拆解。**
纯色块面 + 实线描边定义边界 + 演示区网格底纹 + 多色分块，**无阴影、无渐变作主背景、无 emoji 图标**。

---

## 1. 飞象 DNA（7 条硬规则）

| # | 规则 | 说明 |
|---|---|---|
| 1 | **无阴影** | 禁止 `box-shadow`、`text-shadow`、`drop-shadow` 作为卡片/按钮的立体感来源。层次靠**描边**和**色块**。 |
| 2 | **平涂优先** | 背景用**纯色**；禁止把 `linear-gradient` 当页面/卡片主背景（封面可用极轻微同色系渐变，其余一律纯色）。 |
| 3 | **描边定义边界** | 卡片/按钮/演示区都有 `border`（1–4px `solid`）。边色用 `rgba(0,0,0,.3)` 或**比填充更深的同色**。 |
| 4 | **圆角成套** | 整份课件统一一个圆角档：`0 / 8 / 10 / 20 / 26px` 选其一，写入 `--radius`。 |
| 5 | **演示区网格底纹** | 知识点演示区（Stage）用略深纯色底 + CSS `linear-gradient` 网格（见 §4）。仅装饰，非坐标测量。 |
| 6 | **多色分块** | 演示核心知识点时激活色板 **90%+ 预设色**，用不同实色块 + 深描边区分对象，禁止整块单色。 |
| 7 | **无 emoji、用几何** | 标题/要点前禁止 emoji；图标、示意图用 **SVG / 纯色几何块**绘制，配色取自色板。 |

---

## 2. 色板（选定 1 套，全课件统一）

飞象把配色做成**固定色板机械抽选**，不"分析知识点适合什么颜色"。本 harness 精选 6 套（4 浅 2 深），覆盖中小学。

### 选择算法（写进 spec 注释）
```
keyword = 课题核心词（如"酸碱中和""电学""勾股定理"）
学段：小学→倾向 A 系；初高中→倾向 B 系（默认 B）
hash = (keyword 首字符 codepoint + keyword 末字符 codepoint + 页数) mod N
按下表顺序取第 hash 套；用户指定风格/深浅则从命
```

### 2.1 浅色板（默认，适合大多数课件）

**FX-青（科学/理化，源自 B-08）**
```
--bg:#FFFFFF; --text:#00404D; --primary:#00404D; --accent:#137F8B;
--card:#D3F6F4; --card-border:rgba(0,64,77,.30);
--demo-bg:#D3F6F4; --demo-border:#93BFC2; --demo-grid:#DBF1F0;
--btn-primary-bg:#00404D; --btn-primary-fg:#FFFFFF;
--btn-2nd-bg:#ECFCFB; --btn-2nd-fg:#00404D;
--radius:0px; 演示多色:#35E9FE / #DF9012 / #00404D
```

**FX-蓝（通用，源自 B-20）**
```
--bg:#DFEDFF; --text:#0F2336; --primary:#278DEA; --accent:#40A10B;
--card:#FFFFFF; --card-border:rgba(15,35,54,.30);
--demo-bg:#FFFFFF; --demo-border:rgba(15,35,54,.30); --demo-grid:#F1F5FB;
--btn-primary-bg:#83FE91; --btn-primary-fg:#232323;
--btn-2nd-bg:#DFEDFF; --btn-2nd-fg:#000000;
--radius:20px; 演示多色:#83FE91 / #278DEA / #232323
```

**FX-绿（生物/自然，源自 B-02）**
```
--bg:#E2ECD3; --text:#012B1F; --primary:#405E28; --accent:#549B22;
--card:#F7FDF6; --card-border:rgba(1,43,31,.30);
--demo-bg:#F7FDF6; --demo-border:rgba(0,0,0,.30); --demo-grid:#ECF1E6;
--btn-primary-bg:#405E28; --btn-primary-fg:#E2ECD3;
--btn-2nd-bg:#F7FDF6; --btn-2nd-fg:#012B1F;
--radius:8px; 演示多色:#B5FF8B / #549B22 / #405E28
```

**FX-橙（文史/活力，源自 B-05）**
```
--bg:#FFF3D9; --text:#3D3334; --primary:#F8981F; --accent:#9D3E00;
--card:#FFFFFF; --card-border:rgba(0,0,0,.30);
--demo-bg:#FFFFFF; --demo-border:rgba(0,0,0,.30); --demo-grid:#ECECEC;
--btn-primary-bg:#F8981F; --btn-primary-fg:#000000;
--btn-2nd-bg:#FFF6E3; --btn-2nd-fg:#000000;
--radius:0px; 演示多色:#F8981F / #5E7EB4 / #3D3334
```

### 2.2 深色板（实验/几何/科技感）

**FX-深青（理化实验，源自 B-07）**
```
--bg:#0F302F; --text:#EEFFEB; --primary:#06B17A; --accent:#B6FCE5;
--info:#E44B40;
--card:#123A37; --card-border:rgba(238,255,235,.30);
--demo-bg:#123A37; --demo-border:#526F68; --demo-grid:#164441;
--btn-primary-bg:#06B17A; --btn-primary-fg:#FFFFFF;
--btn-2nd-bg:#184C49; --btn-2nd-fg:#EEFFEB;
--radius:0px; 演示多色:#06B17A / #B6FCE5 / #EEFFEB
```

**FX-暗黄（几何/科技，源自 B-15）**
```
--bg:#000000; --text:#FFFFFF; --primary:#F8EF50; --accent:#03DEDE;
--card:#232323; --card-border:rgba(188,227,223,.30);
--demo-bg:#232323; --demo-border:rgba(188,227,223,.30); --demo-grid:#393939;
--btn-primary-bg:#F8EF50; --btn-primary-fg:#000000;
--btn-2nd-bg:#414141; --btn-2nd-fg:#FFFFFF;
--radius:20px; 演示多色:#F672AD / #F8EF50 / #03DEDE / #6AFA77
```

> 3D / Canvas / 几何演示：使用"演示多色"里的实色，配深一档描边；深色板尤其要保证色彩鲜艳（避免光照不足显暗）。

---

## 3. 字号与排版（课件 960×540 档）

飞象全屏 math 用 H1=40/按钮 80px；但**多页课件是 960×540 定尺**，用 courseware 档：

| 角色 | 字号 | 字重 |
|---|---|---|
| 封面主标题 | 34–40px | 800 |
| 页标题 H2 | 26–30px | 700 |
| 小标题 H3 | 18–20px | 700 |
| 正文 | 16–18px | 400–500 |
| 注释/caption | 13–14px | 400 |
| 按钮文字 | 15–16px | 600 |

- 行高 1.5–1.7；页标题下留 12–16px。
- 中文字体：`"PingFang SC","Microsoft YaHei",system-ui,sans-serif`。
- **标题前不加 emoji**；需要图标用 SVG。
- 公式用 `\(...\)` / `\[...\]`（MathJax 从 jsDelivr）。

---

## 4. 组件样式（page-shared 直接提供）

以下 class 应写入 `page-shared`，各页复用。**这是飞象观感的核心**。

```css
/* 卡片：纯色 + 描边，无阴影 */
.fx-card{
  background:var(--card);
  border:2px solid var(--card-border);
  border-radius:var(--radius);
  padding:14px 16px;
}

/* 演示区：略深底 + 网格底纹（装饰） */
.fx-demo{
  background:var(--demo-bg);
  border:2px solid var(--demo-border);
  border-radius:var(--radius);
  background-image:
    linear-gradient(var(--demo-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--demo-grid) 1px, transparent 1px);
  background-size:30px 30px;
}

/* 核心按钮：主色填充 + 深描边，无阴影 */
.fx-btn{
  font-size:15px; font-weight:600;
  padding:9px 20px; cursor:pointer;
  border-radius:var(--radius);
  background:var(--btn-primary-bg); color:var(--btn-primary-fg);
  border:2px solid var(--card-border);
}
/* 次要/未选中按钮 */
.fx-btn--2nd{ background:var(--btn-2nd-bg); color:var(--btn-2nd-fg); }

/* 标签/角标 */
.fx-chip{
  display:inline-block; padding:4px 12px;
  border:2px solid var(--card-border); border-radius:999px;
  background:var(--card); font-size:13px; font-weight:600;
}

/* 演示色块（多色分块用；配深一档描边） */
.fx-block{ border-radius:calc(var(--radius) / 2); border:3px solid; }

/* 页标题条 */
.fx-head{ display:flex; align-items:baseline; gap:12px; }
.fx-head h2{ margin:0; color:var(--primary); }
.fx-head .fx-sub{ font-size:13px; color:var(--text); opacity:.65; }
```

**结构拆解布局**：一页 = 标题条 `.fx-head` + 演示/内容区（`.fx-demo` 或卡片网格）+（可选）控件条。左右留白对称，主演示居中。

---

## 4.5 版式框 + 内嵌画布（飞象「外框 100%，中间固定画布」）

飞象每页结构是两层，**尺寸职责分离**：

1. **外框 `.fx-page`**：宽 **100%**、高 **100%**，铺满宿主 iframe / 课堂窗口；顶栏、底栏、四角装饰、`.fx-toolbar` 贴在外框上（四周增量内容）。
2. **内嵌画布 `.fx-canvas`**：固定 **960×540**（`--cw-w` / `--cw-h`），居中放在 `.fx-canvas-wrap` 内；**所有教学内容只写进画布**，按固定坐标排版，不随外框拉伸。

```
┌─ .fx-page（100% × 100%，外框底色）────────────────────────┐
│ [学科标签]                              [2 / 4]  ←顶栏   │
│         ┌─ .fx-canvas（固定 960×540，描边+网格）─┐       │
│         │  页标题 / 卡片 / 演示 / 互动 / 测验    │       │
│         └──────────────────────────────────────┘       │
│  [可选 .fx-toolbar，画布外、页脚前]                       │
│  飞象课堂 · 学科                  ● ● ○ ○  ←底栏         │
└────────────────────────────────────────────────────────┘
  └ 四角 L 形装饰（贴外框四角）
```

**结构（每页 body 根节点）：**
```html
<div class="slide slide--fit fx-page">
  <header class="fx-topbar">…</header>

  <div class="fx-canvas-wrap">
    <div class="fx-canvas">
      …本页正文 / 演示 / 选项（按 960×540 排版）…
    </div>
  </div>

  <div class="fx-toolbar">…可选控件…</div>

  <footer class="fx-footer">…</footer>
  <span class="fx-corner fx-corner--tl"></span> …
</div>
```

- `data-fx-pagename` / `data-fx-pageno` / `data-fx-progress` 由壳自动填充（`window.__CW_PAGE__`）。
- 长内容：给 `.fx-canvas` 加 `fx-canvas--scroll`，**只在 540px 画布内滚动**；外框顶栏/底栏固定。
- 封面：标题等内容放在 `.fx-canvas` 内；外框仍 100%。
- 互动页：演示在 `.fx-canvas` 内；滑块/按钮放 `.fx-toolbar`（画布外）。

**page-shared 追加 CSS（模板已内置）：**
```css
:root{ --cw-w:960px; --cw-h:540px; }
/* 外框：100% 铺满宿主 */
.fx-page{ position:relative; width:100%; height:100%; box-sizing:border-box;
  display:flex; flex-direction:column; background:var(--bg); overflow:hidden; }
.fx-topbar{ display:flex; align-items:center; justify-content:space-between;
  padding:10px 22px; flex-shrink:0; }
.fx-pageno{ font-size:13px; font-weight:700; color:var(--primary); }
/* 居中槽 + 固定画布 */
.fx-canvas-wrap{ flex:1; min-height:0; display:flex; align-items:center; justify-content:center;
  padding:6px 18px 8px; overflow:hidden; }
.fx-canvas{ width:var(--cw-w); height:var(--cw-h); flex:0 0 auto; padding:14px 18px;
  box-sizing:border-box; background:var(--demo-bg); border:2px solid var(--demo-border);
  border-radius:var(--radius); overflow:hidden; display:flex; flex-direction:column;
  background-image:
    linear-gradient(var(--demo-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--demo-grid) 1px, transparent 1px);
  background-size:30px 30px; }
.fx-canvas--scroll{ overflow-y:auto; -webkit-overflow-scrolling:touch;
  scrollbar-width:thin; scrollbar-color:var(--primary) var(--demo-grid); }
.fx-canvas--scroll::-webkit-scrollbar{ width:10px; }
.fx-canvas--scroll::-webkit-scrollbar-track{
  background:var(--demo-grid); border-left:2px solid var(--demo-border); }
.fx-canvas--scroll::-webkit-scrollbar-thumb{
  background:var(--primary); border:2px solid var(--card-border);
  border-radius:var(--radius); min-height:48px; }
.fx-canvas--scroll::-webkit-scrollbar-thumb:hover{ background:var(--accent); }
```

> 旧版 `.fx-page`/`.fx-canvas` 双层框见上文；**默认新生成对齐飞象真实产物的 `.page-container` 模式（见下）。**

---

## 4.6 飞象产物对齐（壳 + page-container）

**预览壳**（`courseware-shell.js`）：白顶栏 + 缩略 iframe 绿框 + 浅灰舞台居中 960×540 主 iframe（圆角阴影）。

**生成物**：`.page-container` + `.page-title` + `.card` + `.tip`；封面用全屏 `.cover` 特例。

**画布底色**：子页 **960×540 与壳舞台同色 `#eef1f5`**（无白底、无外框阴影）；白卡片仅 `.card` 等组件自带。

**滚动契约**：壳固定 `body` 为 960×540 且 `overflow:hidden`；`.page-container` 必须 `height:100%; max-height:100%; overflow-y:auto`，长内容在容器内滚动，禁止用 `min-height:100%` 撑高 body。

---

## 5. 各页类型飞象化配方

| 页类型 | 飞象配方 |
|---|---|
| **封面** | 全屏 `.cover`；轻渐变可接受；主标题 44–48px；学科 tag 胶囊。 |
| **概念/讲解** | `.page-container` + `.page-title` + `.card` 双栏 + `.tip`。 |
| **互动/演示** | `.page-title` + 浅灰演示区 + `.btn-primary` 控件。 |
| **测验** | `.page-title` + 白底选项块；提交 `.btn-primary`；对错绿/红。 |
| **小结** | `.card` 列表 + `.tip`；无 emoji。 |

---

## 6. 反"AI 味"清单（生成前自查）

以下是本 harness 旧产物的典型 AI 味，**必须避免**：

- ❌ 封面/卡片用紫蓝渐变 `linear-gradient(135deg,#667eea,#764ba2)` → ✅ 用色板纯色
- ❌ 卡片 `box-shadow:0 2px 8px rgba(...)` → ✅ 去阴影，用 `border`
- ❌ 标题/按钮带 emoji（⚡💡🎉✅） → ✅ 去 emoji，用 SVG 或纯文字
- ❌ 圆角随手 12/16px 不统一 → ✅ 统一 `--radius`
- ❌ 通用蓝 `#2563eb` 千篇一律 → ✅ 从 6 套色板按 hash 选
- ❌ 演示区纯白无质感 → ✅ `.fx-demo` 网格底纹 + 多色块
- ❌ 大段浅灰细字 → ✅ 高对比（近黑/近白文字）

---

## 7. spec 注释增补

飞象风产物在 `<head>` spec 里额外声明选色：
```html
<!-- fx-style: palette=FX-青(B-08); radius=0; keyword=酸碱中和; source=hash -->
```
