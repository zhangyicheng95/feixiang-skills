---
name: stroke-animation
description: 生成汉字笔顺动画、写字指导、生字描红动画、田字格展示或严格手写跟练的 AI 互动课件时必须加载此 skill。基于 MakeMeAHanzi ARPHIC 公版字形 + stroke-order 教研笔顺数据蒸馏的 2,865 教材字几何库（v1.7.5 拆分高频笔顺动画与小众练字游戏路由，并支持 test/online CDN 发布渲染）。默认使用 `StrokeTrace.animate()` 做笔顺动画/写字指导/普通描红展示；只有明确要求学生手写、我来写、手写评分、星级评分、错笔纠正、强制重写或练字游戏时才使用 `StrokeTrace.mount()`。严禁硬编码 SVG 路径、引入 HanziWriter/cnchar-draw 等三方笔顺库。触发词：笔顺动画、运笔展示、看怎么写、写字指导、生字描红、描红动画、田字格展示；严格触发词：学生手写、我来写、手写评分、错笔纠正、练字游戏。
---

# 汉字笔顺动画与严格跟练标准（v1.7.5）

> 与 `stroke-order` 配套：数据层（笔画名）走 stroke-order，渲染层（动画 / 手写）走本 skill。**两者必须同时加载**。

## 一、两套 API 一句话决策

| 用户意图 | 用什么 |
|---|---|
| "看怎么写"、"笔顺动画"、"演示一遍"、"运笔展示"、"写字指导"、"普通描红 / 生字描红 / 写字指导" | **默认用 `StrokeTrace.animate()`** 仅观看，自动连播 |
| "学生手写"、"我来写"、"手写评分"、"星级评分"、"错笔纠正"、"强制重写"、"练字游戏" | **`StrokeTrace.mount()`** 手写 + 评分 |
| "先看一遍再我来写 / 先动画再手写评分" | **双模式联动**（默认 animate，加切换按钮到 mount，见 §6.4） |
| "笔画名 / 笔画数 / 笔顺步骤列表"（仅文字） | ❌ 不用本 skill，用 stroke-order 的 `<stroke-card>` |

**两个 API 完全独立，参数集不互通**。不要给 mount 传 `mode:'animate'`、不要给 animate 传 `scoring`/`watchMode`。

**路由原则**：笔顺动画是高频默认能力；练字游戏是小众强交互能力。没有手写采样、评分、错笔纠正诉求时，不调用 `mount()`。

## 二、核心原则

1. **严禁硬编码任何 SVG path 字符串**（MakeMeAHanzi 路径极长，AI 记忆不可靠）
2. **path 数据完全封装在内部**，禁止访问 `.path` / `_path` / `getCharPath` 等私有 API
3. **必配套 `stroke-order`**：本 skill 通过 `window.getStrokeData()` 取笔画名
4. **禁三方库**：HanziWriter、cnchar-draw、chinese-stroke、hanzi-animator
5. **小学场景仅 2,865 教材字**：扩展字（曼/丁/丙等）走降级 UI，不调 mount/animate

## 三、依赖加载（顺序不可反）

**必须使用当前 skill 版本的附件 CDN。源码示例只是本地默认基线；发布包会由 `publish.sh` 渲染为目标环境版本。严禁跨环境引用 CDN，也不要回退到同一环境的旧版 `animation-loader.js`。**

```html
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-loader.js"></script>
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-animation/v1/templates/animation-loader.js"></script>
```

`animation-loader.js` 加载完后自动派发 `stroke-anim-ready` 事件（每个页面只派发一次）。**所有 mount/animate 调用都必须放在事件 listener 内**。

### 3.1 test / online CDN 发布策略

源码文档默认展示测试基线 URL。发布到 online 时禁止引用 musk-test，必须由 `publish.sh` 按 `TARGET_ENV` 渲染 CDN：

```bash
# 测试环境：按测试环境真实版本指定
TARGET_ENV=test STROKE_ANIMATION_VERSION=<测试目标版本> STROKE_ORDER_VERSION=<测试 stroke-order 版本> bash publish.sh

# 正式环境：按线上真实版本显式指定；当前 online 若只存在 stroke-order/v1，就传 v1
TARGET_ENV=online STROKE_ANIMATION_VERSION=<线上目标版本> STROKE_ORDER_VERSION=<线上 stroke-order 版本> bash publish.sh
```

运行时 `stroke-path.json` 默认从当前 `animation-loader.js` 脚本 URL 推导同版本 `assets/stroke-path.json`；笔画名兜底从当前 `stroke-loader.js` 脚本 URL 推导同版本 `assets/stroke-data.json`。生成页也可以用 `data-stroke-path` / `data-stroke-data` 或 `window.STROKE_ANIM_PATH_URL` / `window.STROKE_DATA_URL` 显式覆盖。

## 四、`StrokeTrace.mount()` — 跟练游戏

### 4.1 最小用法

```html
<div id="trace"></div>
<script>
window.addEventListener('stroke-anim-ready', function () {
  StrokeTrace.mount({ target: '#trace', char: '学' });
});
</script>
```

`mount` 自动注入完整 UI：田字格 + Canvas 手写区 + 当前笔提示 + 三星反馈 + 重写/下一笔/重新开始/📹 看示范 按钮。

### 4.2 完整 API（含 v1.6 新增）

```js
const handle = StrokeTrace.mount({
  target: '#box',                          // ★ CSS 选择器或 Element
  char: '学',                              // ★ 必须在 2865 教材字内

  grid:    { style: 'tian' },              // 'tian' | 'mi' | 'nine' | 'none'
  brush:   { color: '#2D3436', width: 22 },

  scoring: {
    enabled: true,
    showStars: true,
    showSegmentErrors: true,
    threshold: { excellent: 0.90, good: 0.75, pass: 0.60 },
    // ★ v1.6：通过门槛
    passStars:   2,    // 2 (默认) | 1 (宽松) | 3 (严格)
    failHoldMs:  1000  // 错笔停留显示红笔的时长 ms（让学生看清错在哪）
  },

  hints: {
    showOutline: true,         // 字形衬底（待写米驼/当前橙/已完成绿三色）
    pulseNextStroke: true,     // 下一笔起点呼吸圆
    showStrokeName: true,      // hint 行显示笔画名（"横钩"）
    showStrokeTip: true        // hint 下方 32 笔画硬笔提示语（💡，v1.6.1 起小学语文版文案）
  },

  // 写前示范：金色虚拟笔尖 + ✍️ 握笔 emoji 跟随笔尖
  watchMode: {
    enabled: true,
    autoPlay: false,           // false（默认按需点）| 'first' | true
    showHand: true,
    showButton: true,
    retryAfterFails: 0         // 连续 N 次未达通过线自动慢速示范，0=关闭
  },

  // 顺滑书写：通过笔后自动跳到下一笔
  autoAdvance: true,           // true（默认）| 'on-pass' | false
  autoAdvanceDelay: 700,

  // 正反馈四件套（默认全开）
  celebration: {
    enabled: true,
    perfectStroke: true,       // 3 星笔金色闪光
    combo: true, comboMin: 2,  // 连击徽章
    fireworks: true,           // 整字 ≥2 星烟花
    fireworksDuration: 1800
  },
  progress: { showBar: true },

  // ★ v1.6 / v1.7 / v1.7.1：整字写完后的"作品感" + 圈点系统
  artwork: {
    enabled: true,                 // 衬底淡出，保留田字格 + 学生笔迹
    message: '🎉 这是你写出来的字！',
    // ★ v1.7 圈点系统（v1.7.1 增强：PCA 定向椭圆 + 延迟出现 + ★ 表扬章）
    praiseCircles: true,           // 3 星笔画在作品态用红色手绘圈圈出来表扬
    maxPraiseCircles: 2,           // ★ v1.7.1 默认 2（克制视觉，避免重叠）
    praiseStartDelayMs: 800,       // ★ v1.7.1 衬底淡出后再画红圈的延时（先让学生看清自己写的字）
    praiseStaggerMs: 220,          // ★ v1.7.1 多个圈错落出现的间隔
    praiseStar: true,              // ★ v1.7.1 在每个红圈一端附 ★ 五角星章，让"圈是表扬"的语义无歧义
    retryPraise: true              // 重写过的笔画在点评区显示"改正成功"鼓励文案
  },

  onStrokeStart:    function ({ index, strokeIndex, strokeNo, name, startPoint }) {},
  onStrokeComplete: function ({ index, strokeIndex, strokeNo, strokeName, stars, passed, ... }) {},
  onFinish:         function ({ char, strokes, finalScore, finalStars, combo }) {},
  onReset:          function () {}
});

handle.reset();          // 完整重置（也是作品感"再写一次"按钮触发）
handle.redoStroke();     // 重写当前笔
handle.nextStroke();     // 进入下一笔（v1.6：当前笔未通过会被拒绝）
handle.setChar('字');    // 切换练习字
handle.playDemo(slow?);  // 主动播当前笔示范
handle.destroy();
```

### 4.3 ★ v1.6 跟练新规则

**错笔不保留，必须写对再前进**：

| 阶段 | 行为 |
|---|---|
| 学生抬笔 | 评分（DTW + 三星） |
| **达到 `passStars`**（默认 ≥2 星） | 笔迹保留 → 进度 +1 → 自动进入下一笔 |
| **未达 `passStars`**（0/1 星） | 红笔标注偏差段，停留 `failHoldMs`（默认 1s）→ 自动清除该笔笔迹 → 强制重写当前笔 |

**未通过时**：不更新进度条、不计入 combo、不启用「下一笔」按钮、不响应自动跳转、手动点「下一笔」会显示温和提示「先把这一笔写对再继续」。

**前面已通过的笔不受影响**——只清当前一笔的错笔。

**整字完成"作品感" + 圈点系统**：

| 视觉元素 | 时机 | 含义 |
|---|---|---|
| 标准衬底淡出 | 整字完成 | 作品感主体（v1.6） |
| 学生笔迹保留 | 整字完成 | 作品感主体（v1.6） |
| 鼓励文案 + 综合分 | 整字完成 | 作品感主体（v1.6） |
| 烟花 / 星级 / 连击 | 整字完成 | 既有正反馈（v1.3） |
| **红色手绘圈** | **作品态** | **★ v1.7 圈点系统：3 星笔画"老师批改式"圈出表扬，作用于学生笔迹** |
| **"改正成功"鼓励文案** | **作品态点评区** | **★ v1.7：曾经写错并重写通过的笔，给"重写后变准了"等鼓励，不显示旧错误轨迹** |
| 「再写一次 ↻」按钮 | 作品态 | 由「下一笔」变身（v1.6） |

**v1.7 / v1.7.1 圈点系统 = "老师批改习字本"反馈**：

| 行为 | 说明 |
|---|---|
| 红圈只圈学生最终笔迹 | 不会触碰已淡出的标准衬底 |
| 仅 3 星 + 通过的笔可圈 | `r.stars === 3 && r.userPts.length >= 2` |
| 数量上限 `maxPraiseCircles` | 默认 **2**（v1.7.1 改）；多于此数按 `final` 分降序取 top N |
| **★ 红圈贴合笔画走向（v1.7.1）** | **PCA 定向椭圆**：横笔 → 扁长椭圆 / 竖笔 → 细高椭圆 / 撇捺 → 斜倾椭圆，副轴 `ry` 保底 42 px，主轴 `rx` 上限 380 px |
| **★ 红圈延迟出现（v1.7.1）** | 衬底淡出 ~800 ms 后再画（`praiseStartDelayMs`），让学生**先看清自己写的字**，再被老师"圈出来" |
| **★ 红圈附 ★ 表扬章（v1.7.1）** | 每个椭圆主轴一端打一个红色五角星，让"红圈 = 写得好"的语义零歧义；可关 `praiseStar: false` |
| 完成态文案首行说明 | 自动追加"✨ 老师圈出 N 笔写得最好的"，让学生立刻读懂红圈含义 |
| 重写鼓励 | 仅针对"曾经失败 ≥1 次后通过"的笔（`_strokeRetries[i] > 0`）；≥4 笔时前 2 行详细 + 第 3 行聚合为"还有 N 笔也成功改正了" |
| 状态隔离 | `reset()` / `setChar()` / 点击「再写一次」 / `destroy()` 全部清空（红圈 SVG 节点 + 待触发延迟 timer + 重写计数） |

**作品态视觉时序（v1.7.1 修订）**：

```
T=0 ms      整字最后一笔通过 → _enterArtworkMode()
T=0 ms      衬底（米驼/橙/绿三色 outline）开始 0.8s CSS transition 淡出
T=0 ms      完成消息浮现："🎉 这是你写出来的字！…"
T=0 ms      文案首行已写出"✨ 老师圈出 2 笔写得最好的"（红圈尚未出现，但学生先看到说明）
T=800 ms    setTimeout 触发 → _drawPraiseCircles() → SVG <g.st-circles> 挂载
T=800 ms    第 1 个红圈手绘弹出 0.65 s
T=800+220 ms 第 2 个红圈错落出现
T=1150 ms+   每个椭圆 350 ms 后 ★ 表扬章"啪"地盖章（旋转 + 缩放）
```

`artwork.enabled: false` 可一次性关掉作品感 + 圈点系统，回退到旧的"完成提示 + 重新开始按钮"。`praiseCircles: false` / `retryPraise: false` / `praiseStar: false` 可分别单独关，核心错笔重写逻辑不受影响。

### ★ v1.7 红圈、红笔、重写记录三种视觉反馈的语义边界

| 反馈 | 视觉 | 时机 | 含义 |
|---|---|---|---|
| 红笔标注（v1.0+） | 半透明红色覆盖在错笔上 | 当前笔写错的瞬间，停留 `failHoldMs` 后清除 | "**当前**这笔不对，看哪里偏了" |
| 红圈（v1.7） | 红色手绘风椭圆环，圈在学生笔迹外 | 整字完成后的作品态 | "**最终**这笔写得真好，老师圈出来" |
| 重写鼓励（v1.7） | 白底圆角胶囊 ✅ 文字 | 作品态点评区 | "**改正成功**了，棒"——不再强调错过 |

**红笔错误标注绝不残留到作品态**（`tracer.clearCurrent()` 已在失败保留期到点后清除当前 canvas）。

### 4.4 教学场景预设

| 场景 | 推荐配置 |
|---|---|
| 默认课堂 | 全部默认即可 |
| 低年级初学（更宽容） | `scoring: { passStars: 1 }` 一星即过 |
| 高年级 / 字帖训练 | `scoring: { passStars: 3 }` 必须三星才前进 |
| 考试 / 静默练习 | `celebration: { enabled: false }, watchMode: { enabled: false }` |
| 自动加强引导 | `watchMode: { autoPlay: 'first', retryAfterFails: 2 }`，连续 2 次未通过自动慢速示范 |
| 关闭作品感（旧行为） | `artwork: { enabled: false }` |
| 关闭红圈（保留作品感 + 重写鼓励） | `artwork: { praiseCircles: false }` |
| 关闭重写鼓励（保留红圈） | `artwork: { retryPraise: false }` |
| 关闭 ★ 表扬章（仅留椭圆） | `artwork: { praiseStar: false }` |
| 红圈数量更克制（小学低年级） | `artwork: { maxPraiseCircles: 1 }` 只圈最优秀那笔 |
| 红圈出现更慢（更突出"作品感"） | `artwork: { praiseStartDelayMs: 1500 }` |
| 红圈出现更快（节奏紧凑） | `artwork: { praiseStartDelayMs: 200, praiseStaggerMs: 100 }` |

## 五、`StrokeTrace.animate()` — 笔顺动画

### 5.1 最小用法

```html
<div id="anim" style="min-height:430px"></div>
<script>
window.addEventListener('stroke-anim-ready', function () {
  StrokeTrace.animate({ target: '#anim', char: '学' });
});
</script>
```

加载后**自动一笔一笔连播**：金色虚拟笔尖沿 median 滑动 + ✍️ 握笔 emoji 跟随 + 蓝色发光墨迹 + 32 笔画硬笔提示语（"从左往右写，基本写平" 等小学语文场景文案，**v1.6.1 起替换毛笔术语**） + 控件栏（⏯ ⏭ ⏮ 🔁 调速）。

**布局硬规则**：`StrokeTrace.animate()` 默认注入的是完整组件，不只是 320x320 画板；组件包含当前笔提示、硬笔提示、田字格、底部控件栏和状态消息。不要把 animate 的 target 写成固定 320px 高度再 overflow:hidden，否则会裁掉字形下半部分和控件栏。默认完整组件建议让高度自适应，或给 target 至少 `min-height: 430px; overflow: visible;`。如果只想放一个固定正方形画板，必须同时设置 `showHint:false, showStrokeTip:false, showControls:false`，并且不要在页面文案里声称有底栏控制条。

### 5.2 完整 API

```js
const handle = StrokeTrace.animate({
  target: '#box', char: '学',           // ★ 必需
  autoStart: true, loop: false, speed: 1.0,
  perStrokeMs: 1100, pauseBetweenStrokes: 350,
  showHand: true, handEmoji: '✍️', handSize: 80,
  showBrush: true, showHint: true, showStrokeTip: true,
  showControls: true, grid: { style: 'tian' },
  onStrokeStart: function ({ index, strokeIndex, strokeNo, name, total }) {},
  onStrokeEnd:   function ({ index, strokeIndex, strokeNo, name, total }) {},
  onComplete:    function ({ char, total }) {}
});
handle.play(); handle.pause(); handle.next(); handle.prev();
handle.restart(); handle.setSpeed(2); handle.setChar('字');
handle.isPlaying(); handle.destroy();
```

`index` 保持向后兼容，为 1 基序号（第 1 笔返回 1）。`strokeNo` 也是 1 基序号，适合展示给学生；`strokeIndex` 是 0 基数组索引，适合外部数组、步骤条、DOM id 同步。

### 5.3 外部步骤条同步（可选）

`animate` 已经自带当前笔提示和控件栏。默认不要再额外生成一套右侧步骤状态，以免出现两个状态源。确实需要外部步骤条时，必须用 `strokeIndex` 找 0 基 DOM id：

```js
validation.strokeNames.forEach(function (name, idx) {
  var badge = document.createElement('span');
  badge.id = `step-${idx}`;
  badge.textContent = `${idx + 1}. ${name}`;
  steps.appendChild(badge);
});

StrokeTrace.animate({
  target: '#anim',
  char: '学',
  onStrokeStart: function ({ strokeIndex, strokeNo, name, total }) {
    var currentBadge = document.getElementById(`step-${strokeIndex}`);
    // 只高亮 currentBadge；展示文字用 strokeNo / total。
  }
});
```

### 5.4 典型场景

| 场景 | 配置 |
|---|---|
| 课堂讲解新生字"先看一遍" | 默认 |
| 复习模式（老师循环演示）| `loop: true, speed: 0.7` |
| 嵌入 PPT 课件无控件 | `showControls: false, autoStart: true, loop: true` |

## 六、Prompt 路由（LLM 选 API 的核心规则）

### 6.1 路由总规则

```
prompt 含 "看 / 演示 / 笔顺动画 / 怎么写 / 看一遍 / 运笔展示 / 写字指导 / 生字描红 / 描红动画"
  → StrokeTrace.animate()  仅观看，无手写

prompt 只有明确出现“学生手写 / 我来写 / 手写评分 / 星级评分 / 错笔纠正 / 强制重写 / 练字游戏”
  → StrokeTrace.mount()    手写 + 评分（v1.6 默认错笔重写 + 作品感）

prompt 只有 "练字 / 描红 / 写字" 这类泛词，但没有手写采样、评分、错笔纠正诉求
  → StrokeTrace.animate()  作为写字指导或描红动画展示

prompt 仅含 "笔画名 / 笔画数 / 笔顺步骤列表"（纯文字需求）
  → 用 stroke-order 的 <stroke-card>，本 skill 不引入

prompt 含双重需求 "先看一遍再我来写 / 先动画再手写评分"
  → 双模式联动（§6.4）
```

### 6.2 路由表

| # | 用户输入样例 | 用什么 |
|---|---|---|
| 1 | "看「学」字怎么写"、"学字笔顺动画" | `animate({ char: '学' })` |
| 2 | "演示一下春夏秋冬的笔顺" | 多 `animate()` |
| 3 | "缘字描红页"、"生字写字指导"、"练「学」字怎么写" | `validate('学')` → `animate({ char })` |
| 4 | "展示春夏秋冬的写法"、"练四季字的笔顺" | 一个 animate 舞台 + 生字切换（§6.5） |
| 5 | "我要手写学字并评分"、"练字游戏：学生写完给星级" | `validate('学')` → `mount({ char })` |
| 6 | "先看一遍再我来写「学」"、"先笔顺动画再手写评分" | 双模式联动（§6.4） |
| 7 | "我想练龘字" / 生僻字 | `validate()` → 降级到 `<stroke-card>` |
| 8 | 用户输入 `'`、`abc`、emoji | `validate().reasonText` 直接显示 |
| 9 | "一年级上册第 1 课生字写字指导" | `validateAll` → 多字 animate 切换 |
| 10 | "「学」字几画？哪些笔画？"（仅文字） | ❌ 不用本 skill，用 `<stroke-card>` |

### 6.3 标准骨架：普通写字指导 / 描红动画 → animate

```html
<div id="anim" style="min-height:430px"></div>
<div id="err" style="color:#C0392B;font-size:13px;margin:8px 0"></div>
<script>
window.addEventListener('stroke-anim-ready', function () {
  var r = window.StrokeTrace.validate('学');   // ← 用户想展示的字
  if (r.ok) {
    StrokeTrace.animate({ target: '#anim', char: r.char, loop: true });
  } else {
    document.getElementById('err').textContent = r.reasonText;
  }
});
</script>
```

### 6.3b 标准骨架：明确手写评分 / 练字游戏 → mount

```html
<div id="trace"></div>
<div id="err" style="color:#C0392B;font-size:13px;margin:8px 0"></div>
<script>
window.addEventListener('stroke-anim-ready', function () {
  var r = window.StrokeTrace.validate('学');   // ← 用户明确要手写评分的字
  if (r.ok) {
    StrokeTrace.mount({ target: '#trace', char: r.char });
  } else {
    document.getElementById('err').textContent = r.reasonText;
  }
});
</script>
```

### 6.4 标准骨架：双模式联动（先看后练）

```html
<div id="stage"></div>
<button id="mAnim" class="active">📺 看怎么写</button>
<button id="mPrac">✍️ 我来写</button>
<script>
let h = null, ch = '学';
function rebuild(mode) {
  if (h && h.destroy) h.destroy();
  h = (mode === 'animate')
    ? StrokeTrace.animate({ target: '#stage', char: ch })
    : StrokeTrace.mount   ({ target: '#stage', char: ch });
}
window.addEventListener('stroke-anim-ready', () => rebuild('animate'));
mAnim.onclick = () => { rebuild('animate');  mAnim.classList.add('active'); mPrac.classList.remove('active'); };
mPrac.onclick = () => { rebuild('practice'); mPrac.classList.add('active'); mAnim.classList.remove('active'); };
</script>
```

### 6.5 标准骨架：多字笔顺课件

```html
<div id="app"></div>
<script>
window.addEventListener('stroke-anim-ready', function () {
  var r = window.StrokeTrace.validateAll('春夏秋冬');
  var app = document.getElementById('app');
  app.innerHTML = '<div id="char-tabs"></div><div id="anim-stage" style="min-height:430px"></div>';
  var tabs = document.getElementById('char-tabs');
  var handle = null;
  function showChar(ch) {
    if (handle && handle.setChar) {
      handle.setChar(ch);
    } else {
      handle = StrokeTrace.animate({ target: '#anim-stage', char: ch, loop: true });
    }
  }
  r.valid.forEach(function (ch, idx) {
    var btn = document.createElement('button');
    btn.textContent = ch;
    btn.onclick = function () { showChar(ch); };
    tabs.appendChild(btn);
    if (idx === 0) showChar(ch);
  });
  r.invalid.forEach(function (x) {
    app.insertAdjacentHTML('beforeend', '<stroke-card char="' + x.char + '"></stroke-card>');
  });
});
</script>
```

多字笔顺课件用一个动画舞台，不要为每个字创建一个 `mount()` 跟练游戏。切换字优先用 `handle.setChar(ch)`；只有用户明确要求“每个字都要学生手写评分”时，才进入 `mount()` 跟练模式。

## 七、`validate` / `validateAll` — LLM 输入校验

```js
StrokeTrace.validate('学');
// { ok:true, char:'学', reason:null, strokeCount:8, strokeNames:[...],
//   tier:'textbook', hasPath:true, hasNames:true, suggestion:null }

StrokeTrace.validateAll('春眠不觉晓');
// { ok:true, totalHans:5, valid:['春','眠','不','觉','晓'], invalid:[] }
```

`ok:false` 时 `reason` 枚举：

| reason | 情形 | LLM 应对 |
|---|---|---|
| `not-ready` | 字库还没加载 | 等 `stroke-anim-ready` 事件 |
| `empty` | 输入空 / 纯空白 / null | 提示用户输入汉字 |
| `not-han` | 首字符非汉字（字母/符号/emoji）| 显示 `reasonText` |
| `not-in-textbook` | 在 extended 库（小学范围外） | 用 `<stroke-card>` 降级 |
| `not-in-library` | 超出 7818 字库（生僻字） | 用 `<stroke-card>` 或换字 |

辅助 API：`StrokeTrace.isReady()` / `hasChar(c)` / `listChars()` / `getTier(c)` / `preload(arr?)`。

## 八、严禁清单

| # | 禁止 | 后果 |
|---|---|---|
| 1 | SVG path 字符串字面量出现在代码 | 数据失控 |
| 2 | 访问 `.path` / `_path` / `getCharPath` 等私有 API | 违反封装 |
| 3 | 引入 HanziWriter / cnchar-draw 等三方库 | 数据冲突 |
| 4 | 自行构造 `<svg><path>` 或 `<canvas>` 渲染汉字 | 没有可信数据 |
| 5 | 只引 stroke-animation 不引 stroke-order | 笔画名缺失 |
| 6 | stroke-animation 在 stroke-order 之前引入 | 顺序错 |
| 7 | 对 extended 字调 `mount`/`animate` | 显示"不在字库" |
| 8 | 在 `stroke-anim-ready` 之前调用 mount/animate | 一直显示"加载中" |
| 9 | 给 mount 传 `mode:'animate'` 等不存在的参数 | 仍是练字模式 |
| 10 | 把 mount 与 animate 的参数互传（`animate({ scoring })`、`mount({ loop })`） | 都被忽略 |
| 11 | 未经 `validate()`/`hasChar()` 直接对用户输入字 mount | 兜底缺失 |
| 12 | 在 `validate().reasonText` 之上自行编造解释 | 信息不一致 |

## 九、与 stroke-order 的协同

| 职责 | stroke-order | stroke-animation |
|---|---|---|
| 笔画数 / 笔画名 / tier | ✅ 唯一来源 | ❌ |
| 笔画名展示卡片 `<stroke-card>` | ✅ | ❌ |
| 字形 SVG path / 中线 medians | ❌ | ✅（私有不暴露） |
| 田字格、笔顺动画、跟练 + 评分 | ❌ | ✅ |

**简单规则**：

```
仅文字需求（笔画名 / 笔画数 / 笔顺步骤）  →  只引 stroke-order
观看 / 写字指导 / 普通描红 / 生字描红       → 引两个，用 animate()
明确手写评分 / 错笔纠正 / 练字游戏          → 引两个，用 mount()
双重意图（先动画再手写评分）                → 引两个，双模式联动
```

## 十、生成后自检

```
□  1. 引入 stroke-loader.js 与 animation-loader.js？顺序正确？
□  1a. animation-loader.js 是否使用 `publish.sh` 渲染后的目标环境版本，没有跨环境或回退旧版？
□  2. 没有 HanziWriter / cnchar-draw 等禁用库？
□  3. 没有 'M ' + 数字 开头的 SVG 路径字面量？没有 .path 字段访问？
□  4. mount/animate 在 stroke-anim-ready 事件之内调用？
□  5. 普通描红/写字指导默认用 animate；只有明确手写评分/错笔纠正/练字游戏才用 mount，没混用、没互传参数？
□  6. 用户输入字调用了 validate()/validateAll() 校验？
□  7. ok:false 的字走了降级（reasonText 显示 / <stroke-card>）？
□  8. 小学场景过滤了 tier !== 'textbook' 的字？
□  9. ★ v1.6：使用默认 passStars 即可获得"错笔强制重写"行为，未自行覆盖为 0；
□ 10. ★ v1.6：未关 artwork.enabled，让学生写完字看到"作品感"反馈；
□ 11. 双重需求"先看再练"用 §6.4 双模式联动，不是单一 API。
□ 12. 使用 `animate({ showControls:true })` 时，target 没有固定 320px 高度 + `overflow:hidden`；完整组件至少有 `min-height: 430px` 或高度自适应。
□ 13. 外部步骤条高亮使用 `strokeIndex`，没有把 1 基 `index` 当 DOM/数组下标。
□ 14. 发布到 online 时禁止引用 musk-test；SKILL.md 与 loader 由 `publish.sh` 按 `TARGET_ENV` 渲染到目标 CDN。
```

## 十一、纯文本对话模式

用户仅询问跟练/描红功能但不要求生成代码时：

> "跟练与运笔练习需要生成交互式网页。我可以为你生成一个田字格练习页面，挑选字后自带评分、星级反馈和错笔强制重写。"

**严禁凭记忆描述任何字的运笔动作**（"先写一竖，再写一横"等）。

## 十二、关联资源

- `assets/stroke-path.json`（7.6 MB / gzip ~3 MB，运行时一次加载，**不进 LLM context**）
- `templates/animation-loader.js`（~117 KB / gzip ~33 KB 单文件 loader）
- `templates/animate-demo.html`（v1.6 双模式 demo · 错笔重写 + 作品感）
- `templates/trace-prod.html`（生产级跟练 demo）
- `templates/validate-demo.html`（validate API 演示）

## 十三、版本简史

| 版本 | 关键改进 |
|---|---|
| v1.0 | 生产级 loader · 2,842 字全覆盖 · 单文件 53KB |
| v1.1 | autoAdvance 顺滑书写 · 对齐 stroke-order v57（data v56） |
| v1.2 | `validate()` / `validateAll()` 输入校验 · Prompt 路由表 |
| v1.3 | 正反馈四件套（进度条 + 完美闪光 + 连击 + 烟花） |
| v1.4 | Watch Mode 写前示范 · 32 笔画口诀 · 📹 按需示范按钮 |
| v1.4.1 | watchMode 默认按需触发 · ✍️ 右手握笔 emoji |
| v1.5 | ★ 新增 `animate()` 笔顺动画 API（仅观看） |
| v1.6 | 错笔强制重写（`scoring.passStars`/`failHoldMs`）+ 整字"作品感"完成态（`artwork`，衬底淡出） |
| v1.6.1 | 32 笔画提示语全面切换为硬笔小学语文版（用"从左往右写，基本写平"替代旧版书法化提示语） |
| v1.7 | 圈点系统：作品态 3 星笔画红色手绘圈表扬（仅圈学生笔迹）+ 重写笔画"改正成功"鼓励文案 + 严格状态清理 + 15 个新单测 |
| v1.7.1 | 圈点系统视觉重构：PCA 定向椭圆贴合笔画走向（横扁长 / 竖细高 / 撇捺斜倾，rx≤380 ry≥42 保底）+ 红圈延迟 800ms 出现（先笔迹后表扬）+ 每圈附 ★ 红五角星表扬章 + 文案首行"老师圈出 N 笔写得最好的"+ 默认 maxPraiseCircles 改为 2 + 7 个 PCA 单测 |
| **v1.7.2** | **★ 教材字表补丁 textbook-patch-v1：补齐 23 个小学低段核心字（六/七/八/十/千/豆/雾/父/牛/羊/门/去/关/工/厂/午/年/文/电/支/衣/兵/卡），字库 2,842 → 2,865。这些字在上游 metis_gonsis_cn_dictionary CSV 漏列；笔顺与几何全部已存在，仅补 textbook_chars 字段 + 重蒸 stroke-path.json 即可** |
| **v1.7.3** | **防旧版 CDN 回退：正文依赖示例改为当前测试版本 v8，loader 默认几何数据改为 v8 assets，并增加 CDN 合约回归测试，避免再次加载含旧书法化提示语的 v3 loader** |
| **v1.7.4** | **修正 animate 生成契约：回调新增 `strokeIndex`(0 基) / `strokeNo`(1 基)，明确旧 `index` 为 1 基；禁止完整 animate 组件放进固定 320px + overflow hidden 容器；外部步骤条只用 `strokeIndex` 同步；测试基线切到 v9** |
| **v1.7.5** | **P0 路由与发布策略：普通描红/写字指导默认走 animate；只有明确手写评分/错笔纠正/练字游戏才走 mount；多字课件改为单动画舞台 + `setChar`；发布脚本按 `TARGET_ENV` 渲染 test/online CDN，loader 从当前脚本 URL 推导同版本 assets** |
