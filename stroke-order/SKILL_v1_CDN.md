---
name: stroke-order
description: 生成汉字笔顺教学内容时必须加载此 skill。提供 7818 字权威笔顺数据库（2842 小学教材字经教研审核 + 4976 小学范围外字），通过 stroke-loader.js 加载并用 stroke-card 组件一行展示。严禁 AI 硬编码笔画数据、严禁引入 cnchar/HanziWriter 等运行时笔顺库、严禁在介绍文字/教学亮点/过程输出中举例具体笔画名（如"横、竖、撇、点、捺、横折弯钩等"）——所有笔画名必须由 stroke-card 组件渲染，任何描述性文字只说画数不列举笔名。返回 tier 字段区分"小学范围内/外"。触发场景：笔顺、笔画、识字写字、笔顺演示、写字课件、笔画数、田字格、生字卡片、描红、笔顺动画。
---

# 汉字笔顺数据标准（v11.7 · 双层置信度版 · 禁忌 #12 防幻觉举例）

## 核心原则

1. **AI 严禁硬编码笔画数据**（如 `['撇','横',...]`）——AI 的笔顺记忆已多次出错。
2. **对话正文也严禁"举例"笔画名**（如"如：横、竖、撇、捺 等"）——训练数据里的旧错表示法必然污染介绍段文字，与组件渲染自相矛盾。详见禁忌 #12。
3. **唯一数据源**：CDN 上的 `stroke-data.json`，覆盖 7818 字。
4. **唯一查询入口**：`getStrokeData(char)` 返回 `{char, count, strokes, source, tier}`。
5. **禁引任何第三方笔顺库**：cnchar、cnchar-draw、HanziWriter、chinese-stroke 全部禁用。
6. **两级字表分层**：
   - **`tier: 'textbook'`**（2,842 字）：小学语文教材字（会写+认读+OVERRIDE），教研审核 + 系统性规则修复
   - **`tier: 'extended'`**（4,976 字）：小学范围外的通用字（字典扩展），笔顺仍可靠（≥98%）但非教材重点

## 生成代码时必做（照抄 URL，不要改）

在 HTML `<head>` 注入：

在 HTML `<head>` 注入（**两个脚本同时加载**）：

```html
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-loader.js"></script>
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-card.js"></script>
```

## ✨ 推荐写法：使用组件（一行搞定，**根治双数据源问题**）

### 完整卡片 `<stroke-card>`

```html
<stroke-card char="学"></stroke-card>
<stroke-card char="曼" size="large"></stroke-card>
<stroke-card char="手" layout="horizontal"></stroke-card>
<stroke-card char="曼" show-strict="true"></stroke-card>   <!-- 小学严格模式 -->
```

### 单独徽章 `<stroke-tier>`（**解决"讯"字外层标签与组件冲突的 bug**）

LLM 常在**组件外**（标题、列表、说明文字旁）想加一个"小学范围内/外"的徽章。**严禁手写此类徽章文本**，应使用此组件：

```html
<!-- ❌ 严禁（即使看起来是教研字也不能自行判断） -->
<span class="badge">✓ 小学范围内</span>

<!-- ✅ 正确：交给组件，保证与数据一致 -->
<h2>讯 <stroke-tier char="讯"></stroke-tier></h2>
<!-- 自动渲染为橙色「⚠ 小学范围外」（因为讯不在教材表） -->
```

**LLM 只需写 `<stroke-card char="X">` 或 `<stroke-tier char="X">`，组件内部统一调用 `getStrokeData`/`isTextbookChar` 渲染字头 / 画数 / 逐笔 / tier 徽章 / 提示文本**。所有需要显示笔画名或字库归属的地方都由组件控制，LLM **不必也不应**在页面任何位置手写笔画名或徽章文本，**彻底根除双数据源冲突**。

### 组件属性

| 属性 | 可选值 | 默认 | 说明 |
|---|---|---|---|
| char | 汉字 | — | **必填** |
| size | small/default/large | default | 字号 |
| layout | vertical/horizontal | vertical | 布局 |
| show-tips | true/false | true | 是否显示逐笔徽章 |
| show-tier | true/false | true | 是否显示"小学范围内/外"徽章 |
| show-strict | true/false | false | 严格模式（非教材字拒绝展示） |
| show-missing | true/false | true | 字表外字是否显示"暂无数据" |

## ⚠️ `getStrokeData` 返回值的**精确结构**（重要，必读）

```js
var d = window.getStrokeData('手');
// d === {
//   char: '手',
//   count: 4,                                 // 笔画总数（整数）
//   strokes: ['撇', '横', '横', '弯钩'],        // ★ 字符串数组 ★（每项是笔画名）
//   strokes_detail: [                          // 对象数组（兼容 API）
//     { index: 1, name: '撇',   path: '' },
//     { index: 2, name: '横',   path: '' },
//     { index: 3, name: '横',   path: '' },
//     { index: 4, name: '弯钩', path: '' },
//   ],
//   source: 'db',
//   tier: 'textbook'
// }
```

### 🚫 **严禁的典型错误写法**

```js
// ❌ 错！strokes[i] 是字符串 '撇'，不是对象。.name 返回 undefined
d.strokes[i].name             // → undefined（已多次出错）
d.strokes[i].path             // → undefined（且本 skill 不提供 SVG path）

// ❌ 错！笔画不是数字编号
d.strokes[i].id
d.strokes[i].order

// ❌ 错！假装有画法路径
path.setAttribute('d', s.path)  // s.path 不存在
```

### ✅ **正确用法（二选一）**

**写法 A：最简洁（推荐）**——直接用字符串数组：

```js
d.strokes.forEach(function(name, i) {
  // name 就是笔画名字符串（'撇'/'横'/'横钩' 等）
  listEl.innerHTML += '<li>第 ' + (i+1) + ' 笔：' + name + '</li>';
});
```

**写法 B：需要对象访问时**——用 `strokes_detail`：

```js
d.strokes_detail.forEach(function(s) {
  // s.index:笔画序号（1-based），s.name:笔画名，s.path:保留为空串
  listEl.innerHTML += '<li>第 ' + s.index + ' 笔：' + s.name + '</li>';
});
```

### 关于 SVG 动画

**本 skill 不提供笔画 SVG 路径数据**。如果 LLM 生成 HTML 时需要"笔顺动画"：
- 只展示"笔画名称列表"和"笔画数"（文本形式）
- 不要自己构造 `<svg><path d="...">`，没有 path 数据
- 如需动画，建议交给飞象老师自己的笔顺渲染组件（上游环境处理），本 skill 只做数据层

## 场景化使用约束（按 tier 分化）

### 场景 A：小学语文教学（课件/练习/生字卡）——**严格模式**

**强制约束**：只使用 `tier === 'textbook'` 的字。

```js
var d = window.getStrokeData(ch);
if (d.source !== 'db' || d.tier !== 'textbook') {
  // 提示用户替换字或不展示笔顺
  showMessage('"' + ch + '" 不在小学语文会写/认读字表，未提供笔顺');
  return;
}
// 正常使用 d.strokes
```

**触发关键词**：「小学」「一年级」「部编版」「会写字」「识字写字」「生字」「田字格」「语文课件」等。

### 场景 B：通用笔顺查询——**宽松模式**

可以使用所有 `source === 'db'` 的字，但对 `tier === 'extended'` 必须**明显标注"小学范围外"**：

```html
<!-- 小学范围内：正常展示 -->
<div class="pinyin-card tier-textbook">
  <span class="count">8 画</span>
  <span class="strokes">...</span>
  <span class="badge">✓ 小学范围内</span>
</div>

<!-- 小学范围外：橙色徽章 + 虚线 -->
<div class="pinyin-card tier-extended" style="border: 1px dashed #bdc3c7">
  <span class="badge">⚠ 小学范围外</span>
  <span class="count">11 画</span>
  <span class="strokes">...</span>
</div>
```

**触发关键词**：「笔顺查询」「成人识字」「汉字笔画」等非小学教材场景。

### 判定默认场景

如果 prompt 包含以下**任一**关键词，判定为"小学语文场景"→ 走严格模式：

- "小学" / "幼小衔接"
- "一年级" / "二年级" / "三年级" / "四年级" / "五年级" / "六年级"
- "部编版" / "人教版" / "统编版"
- "生字" / "会写字" / "会读字" / "识字"
- "语文课件" / "小学语文" / "识字写字"

其他场景默认用**宽松模式**。

## 32 种标准笔画名称（白名单）

- 基本(6)：点、横、竖、撇、捺、提
- 折类(5)：横折、竖折、撇折、横撇、撇点
- 钩类(12)：竖钩、弯钩、斜钩、卧钩、竖弯钩、横钩、横折钩、横折弯钩、横撇弯钩、横折折折钩、竖折折钩、横斜钩
- 提类(2)：竖提、横折提
- 弯折组合(7)：竖弯、横折弯、横折折撇、竖折撇、竖折折、横折折、横折折折

> 注意：**竖折**（L 形直角，如"山"第2笔）与**竖弯**（弧形过渡，如"四"第4笔）是两个不同的独立笔画，不可互换。

## 禁忌清单

| # | 禁止 | 后果 |
|---|---|---|
| 1 | 代码中出现 `['撇','横',...]` 这种笔画数组字面量 | 数据源失控 |
| 2 | 引入 cnchar / cnchar-order / cnchar-draw | 数据冲突 |
| 3 | 引入 HanziWriter | 加载 `{char}.json` 污染 |
| 4 | 除 `getStrokeData()` 外获取笔画数据 | 绕过校验 |
| 5 | `source !== 'db'` 时用 AI 记忆补全 | 复活原 bug |
| 6 | **小学场景使用 `tier: 'extended'` 的字** | **混淆教材标准** |
| 7 | 笔画数据塞进 `<template>` / 静态 JSON script | 等价硬编码 |
| 8 | **`d.strokes[i].name` 或 `d.strokes[i].path`** | **undefined，页面显示错误** |
| 9 | 虚构 SVG 路径 `path.setAttribute('d', s.path)` | 本 skill 不提供 path 数据 |
| **10** | **在"提示区 / 思考过程 / 描述文本 / 卡片 tooltip"里手写笔画名称** | **双数据源冲突** |
| **11** | **在组件外手写"小学范围内/外"/"部编版教材"/"课内字/课外字"等字库归属标签** | **与 `tier` 字段不一致**（如 bug："讯"字外层标绿色"范围内"但数据层是范围外）|
| **12** | **在"过程输出 / 教学亮点 / 引言介绍 / 教学设计说明"里"举例枚举"具体笔画名称**（如"横、竖、撇、点、捺、横折弯钩等"） | **与组件渲染矛盾**（如 bug："枫"字过程输出写"横折弯钩等"但右侧组件渲染"横斜钩"，两者自相矛盾）|

### 🎯 禁忌 #12 深度说明（v11.7 新增，针对"枫"字过程输出矛盾 bug）

禁忌 #10 已覆盖"具体描述某字某笔"。禁忌 #12 进一步封堵 LLM 最爱的"**举例式侥幸**" —— 即便不针对具体字，也不得在介绍段、教学亮点、思考文本等对话正文中**列举/举例/示范任何笔画名称**。

#### ❌ 严禁写法（即使不提特定字名也不行）

```markdown
教学设计亮点：
1. 权威数据：接入 7818 字权威笔顺数据库，确保"枫"字的笔画数（9 画）及每一笔的名称（如：横、竖、撇、点、捺、横折弯钩 等）完全准确。

根据教学需求，本字笔画常见如：横、竖、撇、捺、提、横折、竖钩、弯钩……

每一笔（如：撇、横、竖钩 等）规范展示……
```

**根因**：LLM 在对话正文（"过程输出 / 思考过程"）阶段**不会调用 `getStrokeData()`**，只能凭训练数据的存量知识举例，**必然触发幻觉**（如枫字的"横折弯钩"就是训练数据里 cnchar 的历史错误）。

#### ✅ 正确写法

```markdown
教学设计亮点：
1. 权威数据：接入 7818 字权威笔顺数据库，每一笔名称以右侧笔顺卡片为准；
2. 动静结合：支持逐笔动画和一键重放；
3. 概念可视化：卡片呈现笔画数与逐笔分解，便于学生跟练；
4. 场景贴合：匹配小学语文写字/识字课堂。
```

**要点**：
- 提"画数"可以（数字），但**不举例具体笔画名**
- 说"以右侧卡片为准" / "详见组件渲染"，把笔画名的解释权全部交给 `<stroke-card>`
- 如必须让用户看到笔画名，**只能通过组件**（`<stroke-card>` 或 `<stroke-tier>`）

#### 标准介绍语模板（建议直接套用）

```
已为您生成"{字}"字（{画数}画）的笔顺演示动画网页。

教学设计亮点：
1. 权威数据：接入 7818 字权威笔顺数据库，每一笔名称以右侧卡片为准；
2. 动静结合：支持逐笔动画分解 / 一键重新演示；
3. 概念可视化：鲜亮配色 + 田字格辅助，突出书写规范；
4. 教学适配：匹配{小学语文 / 通用场景}，可直接投屏上课使用。
```

模板中**只有 `{字}` 和 `{画数}` 是动态值**，其他所有描述性文字都是固定的，从根本上杜绝 LLM 在介绍段"发挥"举例。

### 🎯 单一数据源原则（v10.9 新增，根治 UI 不一致）

**所有笔画名称在页面上的任何展示位置**（右侧分解区、左侧思考区、说明文本、tooltip、动画提示、语音朗读文案等）**必须**引用同一个 `getStrokeData(ch).strokes[i]`。

**最简单的做法：直接用 `<stroke-card>` 组件**，组件内部保证一致。

如果必须自己拼 UI，**禁止**在任何地方手写字符串如：

```html
<!-- ❌ 严禁：描述性文本里硬写笔画名 -->
<p>"手"字第 1 笔是撇，从右上撇到左下...</p>

<!-- ❌ 严禁：JS 里另写一份笔画数组 -->
const tips = { 手: ['撇','横','横','弯钩'] };

<!-- ✅ 正确：所有地方统一用 d.strokes -->
<p>第 1 笔是<span id="tip-0"></span>，<span id="desc-0"></span></p>
<script>
  const d = window.getStrokeData('手');
  document.getElementById('tip-0').textContent = d.strokes[0];   // 从同一数据源
  document.getElementById('desc-0').textContent = getDescription(d.strokes[0]);
</script>
```

## 生成后自检

1. 只引入了 `stroke-loader.js`，无 cnchar/HanziWriter
2. `chars` 数组只含汉字字符
3. 代码里搜不到任何笔画名称字符串字面量
4. 所有笔画数据通过 `getStrokeData()`
5. **根据场景判定 strict/loose 模式，在 strict 模式下过滤 `tier !== 'textbook'` 的字**
6. extended 字 UI 上有"小学范围外"视觉标识
7. 数据缺失/错误分支显示"暂无数据"
8. **对话正文/教学亮点/介绍段里搜不到任何笔画名枚举**（禁忌 #12）—— 用正则 `(横|竖|撇|捺|点|提|钩|折|弯)` 扫一遍自己的介绍文字，如命中请改为"以右侧卡片为准"

## 纯文本对话模式

当用户仅对话询问笔顺（不生成代码）：

> "笔顺需要通过代码查询权威数据库。请要求我生成教学网页（小学课件会仅使用 2842 教材字，通用场景覆盖 7818 字）。"

**严禁凭记忆输出任何字的笔顺**。

## 完整正确示范（可直接复制）

### 方式 A：组件化（**推荐，最简，杜绝双数据源**）

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"><title>生字笔顺教学</title>
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-loader.js"></script>
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-card.js"></script>
</head>
<body>
  <h1>生字笔顺</h1>
  <stroke-card char="学"></stroke-card>
  <stroke-card char="写"></stroke-card>
  <stroke-card char="字"></stroke-card>
</body>
</html>
```

### 方式 B：自控 UI（必须严格保持"单一数据源"）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>笔顺教学</title>
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-loader.js"></script>
<style>
  .card { border: 1px solid #eee; padding: 16px; margin: 8px; display: inline-block; border-radius: 8px; }
  .card.dim { border: 1px dashed #ccc; opacity: 0.8; }
  .ch { font-size: 48px; font-weight: bold; }
  .count { color: #e74c3c; margin: 4px 0; }
  .count.dim { color: #888; }
  .step { display: inline-block; padding: 2px 8px; margin: 2px; background: #f0f0f0; border-radius: 4px; font-size: 12px; }
  .badge { font-size: 11px; padding: 2px 6px; border-radius: 8px; }
  .badge-ok { background: #d5f5e3; color: #27ae60; }
  .badge-warn { background: #f4f6f6; color: #7f8c8d; }
  .miss { color: #999; font-style: italic; }
</style>
</head>
<body>
<div id="app">加载中...</div>
<script>
// AI 只填字符数组，禁止填笔画数据
var chars = ['学', '写', '字', '手', '彭'];

window.addEventListener('stroke-data-ready', function() {
  var app = document.getElementById('app');
  app.innerHTML = '';
  chars.forEach(function(ch) {
    var d = window.getStrokeData(ch);
    var card = document.createElement('div');
    card.className = 'card';

    if (d.source !== 'db') {
      card.innerHTML = '<div class="ch">' + ch + '</div><div class="miss">暂无数据</div>';
      app.appendChild(card);
      return;
    }

    // tier 降级：extended 字用虚线+灰色
    var isTextbook = d.tier === 'textbook';
    if (!isTextbook) card.classList.add('dim');

    // ★ 正确用法：d.strokes[i] 是字符串，直接拼 ★
    var stepsHtml = '';
    d.strokes.forEach(function(name, i) {
      stepsHtml += '<span class="step">' + (i+1) + '. ' + name + '</span>';
    });

    card.innerHTML =
      '<div class="ch">' + ch + '</div>' +
      '<div class="count' + (isTextbook ? '' : ' dim') + '">共 ' + d.count + ' 画</div>' +
      '<span class="badge ' + (isTextbook ? 'badge-ok' : 'badge-warn') + '">' +
        (isTextbook ? '✓ 小学范围内' : '⚠ 小学范围外') +
      '</span>' +
      '<div style="margin-top:8px">' + stepsHtml + '</div>';
    app.appendChild(card);
  });
});
</script>
</body>
</html>
```

**此样板可直接照抄，改 `chars` 数组即可。注意**：
- `d.strokes.forEach(function(name, i) {...})` —— `name` 是字符串（`'撇'`、`'横钩'`...）
- **不要** `d.strokes[i].name` —— 没有 `.name` 字段
- **不要** `d.strokes[i].path` —— 不提供 SVG path

### 小学严格模式过滤（仅 textbook 字）

```js
if (d.source !== 'db' || d.tier !== 'textbook') {
  showMessage(ch + '不在小学教材字表');
  return;
}
```

## 数据库覆盖范围

- **2842 字 textbook**：小学语文部编版 1-6 年级全部会写字 + 认读字 + OVERRIDE 高频易错字
- **4976 字 extended**：通用规范一级字表（《通用规范汉字表》）中未被教材纳入的字，如"曼/丁/丙/乔/丸/丽/丢/丫/举/乍/之/乎"等

## 数据库已覆盖的系统性修正（LLM 无需关心，自动生效）

- 穴字头 HP → 横钩
- 阝部件 HZZZG → 横撇弯钩
- 殳/朵/㕣 部件 HZZ → 横折弯
- 风/气族 HZWG → 横斜钩
- 学字族连续 HP → 首个横钩
- OVERRIDE 硬覆盖 25 字（鼎/写/凹/凸/虫/互/今/小/东 等）

## 关联资源

- `assets/stroke-data.json`（630 KB CDN 资源，运行时加载，**不进 LLM context**）
- `templates/stroke-loader.js`（加载器，暴露 `getStrokeData` + `isTextbookChar`）
- `templates/stroke-snippet.html`（即拿即用模板，带 tier 降级 UI）
