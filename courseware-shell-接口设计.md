# 飞象互动课件壳（Courseware Shell）接口设计

> 面向前端实现的接口规范。提炼自 `courseware-generator/v18/html-guide.md`、`data-collect/v13`、`html-authoring/v5`。  
> 目标：仿造飞象课件运行时，明确 **HTML 契约 → 壳解析 → iframe 注入 → 子页协议** 全链路。

---

## 1. 架构总览

```
┌──────────────────────────────────────────────────────────────┐
│  Host Document（用户打开的单个 .html）                          │
│                                                              │
│  <template class="page-shared">   ──┐                        │
│  <template class="page-data"> × N   │  壳解析                 │
│  <script src="courseware-shell.js">─┘                        │
│                                                              │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │ 缩略图栏    │  │ 主区 iframe       │  │ 工具栏/翻页      │   │
│  │ thumbnail  │  │ __CW_MODE__=main │  │                 │   │
│  │ iframe × N │  │ srcdoc = 组装页   │  │                 │   │
│  └────────────┘  └──────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**职责划分：**


| 角色               | 职责                                          | 禁止              |
| ---------------- | ------------------------------------------- | --------------- |
| **Agent / 内容生成** | 写 `<template>` 片段、静态资源 URL、`page-shared` 依赖 | 手写壳代码、改壳 JS URL |
| **课件壳 Shell**    | 解析 template、组装 srcdoc、翻页、状态、注入 SDK          | 理解教学内容          |
| **子页 Page**      | 960×540 业务 UI、交互、`postMessage` 协议           | 写完整 HTML 文档     |


---

## 2. HTML 输入契约

### 2.1 文件结构（固定顺序）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>课件标题</title>
</head>
<body>

<div id="cw-loading">加载课件中...</div>

<!-- ① 可选：跨页共享依赖（必须在所有 page-data 之前） -->
<template class="page-shared">
  <!-- <script>/<link>/<style> 片段，注入每页 iframe <head> -->
</template>

<!-- ② 页面内容（AI 编写） -->
<template class="page-data" data-id="1" data-name="封面">
  <!-- 片段：style + HTML + script，无 DOCTYPE/html/head/body -->
</template>

<template class="page-data" data-id="2" data-name="导入">
  ...
</template>

<!-- 可选：Agent 分批注入时的占位标记，交付时保留 -->
<!-- CW_PAGES -->

<!-- ③ 壳框架（固定 CDN，置于所有 template 之后） -->
<script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/user/upload/admin/m6azhRVhvHd74GnTkrMdA7.js"></script>

</body>
</html>
```

### 2.2 Template 属性


| 选择器                    | 属性                     | 说明                           |
| ---------------------- | ---------------------- | ---------------------------- |
| `template.page-shared` | 无                      | 内容注入每页 iframe `<head>`，只声明一次 |
| `template.page-data`   | `data-id`（必填，从 1 连续递增） | 页序号                          |
| `template.page-data`   | `data-name`（必填）        | 页名称，显示在缩略图/工具栏               |


### 2.3 子页内容约束

- 画布：**960 × 540 px**（16:9），壳注入 base CSS：
  ```css
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 960px; height: 540px; }
  ```
- 禁止子页使用 `100vh`（iframe 内取外层视口会错乱），用 `100%`
- 禁止在 `page-shared` 或子页 style 中对 `html/body` 设 `overflow: hidden`
- `<template>` 内 script 禁止出现字面量 `</template>`（用 `<\/template>`）

---

## 3. 壳启动流程（Shell Bootstrap）

```typescript
// 建议实现伪代码
function bootstrap() {
  const sharedHead = parsePageShared();           // ①
  const pages = parsePageData();                // ② 按 data-id 排序
  const title = document.title;

  hideLoading();
  renderChrome(title);                          // 工具栏、缩略图栏、主区

  // 为每个 page 创建 iframe 槽位
  pages.forEach((page, index) => {
    renderThumbnailIframe(page, sharedHead, 'thumbnail');
    if (index === 0) renderMainIframe(page, sharedHead, 'main');
  });

  bindNavigation();
  bindPresentationMode();
  bindClickToAdvance();                         // 演示模式点击翻页
}
```

### 3.1 解析 `page-shared`

```typescript
interface PageShared {
  /** 原始 innerHTML，合法 <head> 子元素：script/link/style/meta */
  headFragments: string;
}

function parsePageShared(): PageShared | null {
  const el = document.querySelector('template.page-shared');
  if (!el) return null;
  return { headFragments: el.innerHTML.trim() };
}
```

### 3.2 解析 `page-data`

```typescript
interface PageData {
  id: number;
  name: string;
  /** template 内部 HTML 片段（style + body 内容 + script） */
  bodyFragment: string;
}

function parsePageData(): PageData[] {
  return [...document.querySelectorAll('template.page-data')]
    .map(el => ({
      id: Number(el.getAttribute('data-id')),
      name: el.getAttribute('data-name') ?? '',
      bodyFragment: el.innerHTML,
    }))
    .sort((a, b) => a.id - b.id);
}
```

---

## 4. `page-shared` 注入机制（核心）

每页在**独立 iframe** 中渲染，父文档 `<head>` **不会继承**。壳必须把 `page-shared` 与子页片段组装成完整 `srcdoc`。

### 4.1 srcdoc 组装算法

```typescript
const MUSK_COLLECT_URL = 'https://www.feixianglaoshi.com/musk-collect/musk-collect.js?v=1.4.0';

const SHELL_INJECTED_BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 960px; height: 540px; }
`;

function buildSrcdoc(
  page: PageData,
  shared: PageShared | null,
  mode: 'main' | 'presentation' | 'thumbnail',
  options?: { injectMuskCollect?: boolean }
): string {
  const sharedHead = shared?.headFragments ?? '';
  const muskScript = options?.injectMuskCollect
    ? `<script src="${MUSK_COLLECT_URL}"><\/script>`
    : '';

  const modeScript = `<script>window.__CW_MODE__='${mode}';<\/script>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>${SHELL_INJECTED_BASE_CSS}</style>
  ${sharedHead}
  ${muskScript}
  ${modeScript}
</head>
<body>
  ${page.bodyFragment}
</body>
</html>`;
}
```

### 4.2 注入顺序（`<head>` 内）


| 顺序  | 内容                              | 来源           |
| --- | ------------------------------- | ------------ |
| 1   | base CSS（960×540）               | 壳固定注入        |
| 2   | `page-shared` 片段                | 内容 HTML      |
| 3   | `musk-collect.js`               | 壳注入（仅数据回收课件） |
| 4   | `window.__CW_MODE__`            | 壳注入          |
| 5   | （子页 `<style>` 在 body 片段内，由内容自带） | page-data    |


### 4.3 实现要点

1. **Tailwind / MathJax / anime.js** 等必须走 `page-shared`，否则子页拿不到。
2. **禁止**在 Host Document 的 `<head>` 里引库指望 iframe 继承——无效。
3. `page-shared` 里的 `<script>` 在 iframe `<head>` 中按声明顺序执行；注意 Tailwind 宜靠前。
4. 同一页可能在 **3 个 iframe** 同时存在（main + presentation + thumbnail），注意性能：thumbnail 可降级渲染。

### 4.4 反模式检测（壳可选实现）


| 反模式                    | 后果          |
| ---------------------- | ----------- |
| 库只写在 Host `<head>`     | 子页样式/脚本全部失效 |
| 子页手写 `musk-collect.js` | 重复加载、竞态     |
| 子页写完整 `<html>` 文档      | 双重嵌套、布局错乱   |


---

## 5. `window.__CW_MODE__` 渲染模式

壳在组装 srcdoc 时注入全局变量，子页只读。

### 5.1 枚举值


| 值                | 场景         | iframe 用途 |
| ---------------- | ---------- | --------- |
| `'main'`         | 主编辑/学习区当前页 | 用户主要交互    |
| `'presentation'` | 全屏演示模式     | 放映同一页     |
| `'thumbnail'`    | 左侧缩略图列表    | 每页预览缩略图   |


### 5.2 子页守卫规范

```typescript
// 写操作守卫（必须）
function guardedSave(data: unknown) {
  if (window.__CW_MODE__ === 'thumbnail') return;
  return new MuskCollect().save('answers', data);
}

// 读操作（不需要守卫，缩略图也要显示真实数据）
async function loadReport() {
  const list = await new MuskCollect().query('answers');
  render(list);
}
```

### 5.3 身份采集守卫（第一页）

```javascript
const STUDENT_KEY = 'musk-student-info';

if (window.__CW_MODE__ !== 'thumbnail') {
  ensureStudentInfo().then(initPage);
}
// UI 在 thumbnail 可渲染，但不得写入 sessionStorage
```

跨页身份存储使用 `**window.parent.sessionStorage**`（非子页 `sessionStorage`），因子页 srcdoc 切换会重建文档。

---

## 6. MuskCollect 自动注入

### 6.1 与独立 HTML 的区别


| 场景                    | musk-collect 引入方式                              |
| --------------------- | ---------------------------------------------- |
| 独立收集页（`data-collect`） | 内容 HTML 手写 `<script src="...musk-collect.js">` |
| **互动课件**              | **壳在 srcdoc `<head>` 自动注入**，内容禁止手写             |


### 6.2 子页 API 用法

```javascript
// ✅ 正确：MuskCollect 是类，需 new
const collect = new MuskCollect();
await collect.save('submissions', { name: '张三', score: 85 });

// ❌ 错误：不存在预置实例
if (window.muskCollect) { ... }
```

### 6.3 instanceId 解析（SDK 内置，壳/子页无需硬编码）

优先级（由 SDK 实现）：

1. 当前 URL 查询参数 `?instanceId=`
2. `window.__MUSK_INSTANCE_ID__`
3. `<meta name="musk-instance-id" content="...">`
4. 顶层窗口 URL

---

## 7. 翻页与状态协议（postMessage）

### 7.1 翻页语义


| 方向    | 行为                           |
| ----- | ---------------------------- |
| 下一页 → | 新页**全新初始态**                  |
| 上一页 ← | 若壳存有该页 state，**恢复**用户离开时的 UI |


### 7.2 子页 → 壳：`saveState`

```javascript
window.parent.postMessage({
  type: 'saveState',
  state: { answered: true, selected: 'B', inputs: { q1: '答案' } }
}, '*');
```

**触发时机：**

- 选择题：每次选项变更即上报（不能等「提交」）
- 填空题：每次 `input` 事件即上报
- 翻页前壳会**立即销毁** iframe，子页来不及在 `unload` 里补存

**state 要求：** 可 `JSON.stringify`，禁止 DOM 节点、函数。

### 7.3 壳 → 子页：`restoreState`

```javascript
window.addEventListener('message', function (e) {
  if (e.data?.type === 'restoreState') {
    restoreFromState(e.data.state); // 直接恢复 UI，勿走带防重守卫的 handler
  }
});
```

### 7.4 壳侧状态存储建议

```typescript
interface ShellState {
  currentPageId: number;
  /** pageId → last saved state */
  pageStates: Map<number, unknown>;
}

function onChildSaveState(pageId: number, state: unknown) {
  pageStates.set(pageId, state); // 覆盖式，保留最新
}

function navigateTo(pageId: number, direction: 'forward' | 'back') {
  if (direction === 'back' && pageStates.has(pageId)) {
    renderPage(pageId, { restore: pageStates.get(pageId) });
  } else {
    renderPage(pageId, { restore: null });
  }
}
```

iframe `load` 后发送：

```javascript
iframe.contentWindow.postMessage({
  type: 'restoreState',
  state: savedState ?? null
}, '*');
```

---

## 8. 拖拽 / 演示模式防误翻页

演示模式下，壳在非交互区域 **click → 下一页**。含拖拽/连线的子页须配合：

### 8.1 拖拽进行中

```javascript
// mousedown/touchstart
el.classList.add('dragging');  // 或 el.setAttribute('data-dragging', '1')

// mouseup/touchend
el.classList.remove('dragging');
```

壳检测 `document.querySelector('.dragging, [data-dragging]')` 时**禁止翻页**。

### 8.2 交互元素标记

```html
<div class="drag-item" draggable="true" data-interactive>拖拽项</div>
<div class="drop-zone" data-interactive>放置区</div>
<canvas data-interactive></canvas>  <!-- 连线 -->
```

壳在 click 冒泡时：若 target 在 `[data-interactive]`、`draggable`、`canvas`、`svg` 上，不翻页。

### 8.3 禁止的交互键

子页**不得**用 `↑↓←→`、空格作为业务快捷键——壳在演示模式拦截用于翻页。

---

## 9. 静态资源约定（生成侧）

课件子页引用的图片/音频须符合 `html-authoring` 白名单：


| 允许                                                           | 禁止                      |
| ------------------------------------------------------------ | ----------------------- |
| `generate_image` / `generate_voice` 返回的 `*.fbcontent.cn` URL | base64 大图/音频            |
| 飞象素材库 `musk-*.fbcontent.cn/pub-musk-ai-studio/`*             | unsplash、GCS、GitHub raw |
| 内嵌 SVG / Canvas / CSS 图形                                     | 编造 `placeholder.png`    |


Phase 3 素材清单 → Phase 4 嵌入：

```html
<img src="https://musk-online.fbcontent.cn/.../xxx.png" alt="">
<audio src="https://musk-online.fbcontent.cn/.../xxx.mp3"></audio>
```

---

## 10. 壳对外 TypeScript 类型（建议）

```typescript
/** 渲染模式 */
type CoursewareMode = 'main' | 'presentation' | 'thumbnail';

/** 子页全局（由壳注入） */
interface CoursewarePageGlobals {
  __CW_MODE__: CoursewareMode;
  MuskCollect?: typeof MuskCollect;
}

/** 子页 → 壳 消息 */
type ChildToHostMessage =
  | { type: 'saveState'; state: Record<string, unknown> };

/** 壳 → 子页 消息 */
type HostToChildMessage =
  | { type: 'restoreState'; state: Record<string, unknown> | null };

/** 壳配置 */
interface CoursewareShellConfig {
  shellScriptUrl: string;
  muskCollectUrl: string;
  muskCollectEnabled: boolean;
  canvasWidth: 960;
  canvasHeight: 540;
}
```

---

## 11. 实现检查清单

### 壳（Shell）必须实现

- [ ] 解析 `page-shared` + `page-data`
- [ ] srcdoc 组装（base CSS → shared → musk-collect → `__CW_MODE__` → body）
- [ ] 主区 / 缩略图 / 演示模式 三套 iframe，`__CW_MODE__` 正确
- [ ] 翻页：前进初始态、后退恢复态
- [ ] 监听 `saveState`，按 `data-id` 存 state
- [ ] iframe load 后发 `restoreState`
- [ ] 演示模式点击翻页 + 拖拽/`.dragging`/`data-interactive` 豁免
- [ ] 键盘翻页（↑↓←→、空格），子页不占用
- [ ] 加载完成后隐藏 `#cw-loading`

### 内容（Agent / 页面作者）必须遵守

- [ ] 共享库只写 `page-shared`
- [ ] 不手写壳 JS URL、不手写 musk-collect
- [ ] 互动页实现 saveState + restoreState
- [ ] 数据上报检查 `__CW_MODE__ !== 'thumbnail'`
- [ ] 拖拽加 `.dragging` / `data-interactive`
- [ ] 图片音频用真实飞象域 URL

---

## 12. 最小可运行 Mock（本地调试）

可用以下 HTML 验证注入逻辑（需自行实现 `courseware-shell-mock.js`）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>注入机制验证</title></head>
<body>
<template class="page-shared">
  <style>:root { --accent: #4f46e5; }</style>
</template>

<template class="page-data" data-id="1" data-name="模式探测">
  <div style="padding:40px;font-family:system-ui">
    <h1 style="color:var(--accent)">MODE: <span id="mode"></span></h1>
    <button id="btn" data-interactive>点我上报 state</button>
  </div>
  <script>
    document.getElementById('mode').textContent = window.__CW_MODE__;
    document.getElementById('btn').onclick = function() {
      if (window.__CW_MODE__ === 'thumbnail') return;
      window.parent.postMessage({ type: 'saveState', state: { clicked: true } }, '*');
    };
    window.addEventListener('message', function(e) {
      if (e.data?.type === 'restoreState' && e.data.state?.clicked) {
        document.getElementById('btn').textContent = '已恢复';
      }
    });
  </script>
</template>

<script src="./courseware-shell-mock.js"></script>
</body>
</html>
```

---

## 13. 参考文件索引


| 主题                          | 路径                                             |
| --------------------------- | ---------------------------------------------- |
| 课件 HTML 结构与 page-shared     | `courseware-generator/v18/html-guide.md` §3    |
| 状态 save/restore             | 同上 §6                                          |
| 拖拽防翻页                       | 同上 §6.5                                        |
| MuskCollect + `__CW_MODE__` | 同上 §7                                          |
| 媒体白名单                       | `html-authoring/v5/references/tech-details.md` |
| 独立页 MuskCollect             | `data-collect/v13/SKILL.md`                    |


---

## 14. 版本说明


| 项           | v18 正式环境                                                  |
| ----------- | --------------------------------------------------------- |
| 壳 JS        | `musk-online.fbcontent.cn/.../m6azhRVhvHd74GnTkrMdA7.js`  |
| MuskCollect | `feixianglaoshi.com/musk-collect/musk-collect.js?v=1.4.0` |
| 生图工具名       | `generate_image`（旧版 `picture_gen`）                        |


早期版本（如 v3）壳 JS 在 `musk-test` 域，协议相同、URL 不同。