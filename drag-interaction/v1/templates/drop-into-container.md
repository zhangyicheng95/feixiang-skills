# 模板 C-1：拖到分类容器（Sortable.js 优先）

> 🚨 **本模板覆盖 90% 的「配对/分类/连线」需求**——绝大多数 drop-match 场景应优先用本模板，而不是 `drop-match.md`（坐标点/异形 zone 才走那个）。
> Sortable.js 内置 setPointerCapture / 触摸三件套 / 浮起 / 复位 / race 防护 / 跨浏览器兼容——所有 v8 SKILL.md 必检 #1-#17 由库代劳。

## 何时用

用户需要"把元素拖到几个**明确的目标容器**里，按属性判定是否命中"。常见场景：

- 食物 → 分类盘（主食/肉类/蔬菜/甜点）
- 单词 → 词性容器（名词/动词/形容词）
- 化学元素 → 周期表对应分组容器
- 题目类型 → 答题分类筐
- 国家 → 大洲容器
- 概念卡 → 学科分类盒

判断信号（同时满足）：

- ✅ drop 目标是**几个明确的 DOM 容器**（不是某个固定坐标点）
- ✅ 命中规则可表达为"待拖元素的某属性 === 容器的某属性"
- ✅ 用户拖错时可接受"自动弹回原位"作为反馈

**不适用本模板的场景**（走 `drop-match.md`）：

- ❌ 目标是固定坐标点（拼图槽位、数轴刻度、连线锚点）
- ❌ 目标是非矩形区域（圆形盘子需精确边界判定、异形 SVG 区域）
- ❌ 需要"画连线"等命中后保留拖拽轨迹

## 完整可复制模板

```html
<div id="food-bank">
  <div class="food-card" data-category="staple">🍚 米饭</div>
  <div class="food-card" data-category="meat">🍖 肉</div>
  <div class="food-card" data-category="vegetable">🥦 西兰花</div>
  <div class="food-card" data-category="dessert">🍰 蛋糕</div>
  <!-- ... -->
</div>

<div id="plates">
  <div class="plate" data-category="staple"><h3>主食</h3></div>
  <div class="plate" data-category="meat"><h3>肉类</h3></div>
  <div class="plate" data-category="vegetable"><h3>蔬菜</h3></div>
  <div class="plate" data-category="dessert"><h3>甜点</h3></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

<style>
  body {
    /* Sortable 在 body 上不需要 touch-action: none（库内部自动处理），
       但 user-select 三件套仍要配 */
    user-select: none; -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .food-card {
    padding: 12px; margin: 4px;
    background: #fff; border-radius: 8px; cursor: grab;
    box-shadow: 0 2px 4px rgba(0,0,0,.1);
  }
  .plate {
    min-height: 120px; padding: 12px; margin: 8px;
    border: 2px dashed #ccc; border-radius: 12px;
    transition: background .2s, border-color .2s;
  }
  /* Sortable 内置 class，自动加上 */
  .food-ghost  { opacity: .3; }                              /* 拖拽时原位置的占位 */
  .food-chosen { cursor: grabbing; }                         /* 被按住的元素 */
  .food-drag   { transform: scale(1.1); box-shadow: 0 8px 16px rgba(0,0,0,.2); }  /* 浮起态 */
  .plate.plate-active { border-color: #4F46E5; background: rgba(79,70,229,.05); } /* 命中预览高亮 */
  .plate.plate-reject { border-color: #EF4444; background: rgba(239,68,68,.05); animation: shake .3s; }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25%     { transform: translateX(-6px); }
    75%     { transform: translateX(6px); }
  }
</style>

<script>
  let score = 0;
  const total = document.querySelectorAll('.food-card').length;

  // 食物源容器：只允许"拖出"，不允许"拖入"
  new Sortable(document.getElementById('food-bank'), {
    group: { name: 'food', pull: true, put: false },
    sort: false,
    // 触摸三件套（必配）
    delay: 100, delayOnTouchOnly: true, touchStartThreshold: 5,
    // 视觉
    animation: 200,
    ghostClass: 'food-ghost', chosenClass: 'food-chosen', dragClass: 'food-drag',
  });

  // 每个分类盘
  document.querySelectorAll('.plate').forEach(plate => {
    new Sortable(plate, {
      group: {
        name: 'food',
        pull: false,
        // 🔑 核心命中判定：返回 true = 允许放入；返回 false = 自动弹回原位 + 触发 shake
        put: (to, from, dragEl) => {
          const ok = dragEl.dataset.category === to.el.dataset.category;
          if (!ok) {
            to.el.classList.add('plate-reject');
            setTimeout(() => to.el.classList.remove('plate-reject'), 400);
          }
          return ok;
        },
      },
      delay: 100, delayOnTouchOnly: true, touchStartThreshold: 5,
      animation: 200,
      ghostClass: 'food-ghost', chosenClass: 'food-chosen', dragClass: 'food-drag',
      // 进入预览高亮
      onMove: (evt) => {
        document.querySelectorAll('.plate').forEach(p => p.classList.remove('plate-active'));
        if (evt.to.classList.contains('plate')) evt.to.classList.add('plate-active');
      },
      // 命中正确（put 返回 true 后才会触发 onAdd）
      onAdd: (evt) => {
        evt.to.classList.remove('plate-active');
        score++;
        // 配对成功默认锁定：去掉源容器的 group 引用 → 不能再被拖出
        // （Sortable 没有元素级 disable，用 setAttribute 标记，子选择器配套过滤即可）
        evt.item.classList.add('locked');
        evt.item.style.pointerEvents = 'none';
        evt.item.style.cursor = 'default';
        if (score === total) setTimeout(showWin, 300);
      },
      onEnd: (evt) => {
        document.querySelectorAll('.plate').forEach(p => p.classList.remove('plate-active'));
      },
    });
  });

  function showWin() { alert('全部分类正确！'); }
</script>
```

## 该模板专属注意

### `pull` / `put` 矩阵（核心配置，配错就废）

| 容器角色 | `pull` | `put` |
|---|---|---|
| 食物源（只出不进） | `true` | `false` |
| 分类盘（只进不出，配对成功锁定） | `false` | `(to, from, el) => 命中判定函数` |
| 双向（可拖入也可拖出，少见） | `true` | `(to, from, el) => 命中判定函数` |

`put` 返回 `false` 时 Sortable **自动弹回原位 + 无任何 DOM 变更 + 不触发 `onAdd`**。这就是为什么不需要写 `onWrong` / FLIP / forceResetActive。

### 命中规则的几种写法

```js
// 简单：属性相等
put: (to, from, el) => el.dataset.category === to.el.dataset.category

// 一对多（容器接受多个类别）
put: (to, from, el) => ['meat', 'fish'].includes(el.dataset.category)

// 容器有名额上限
put: (to, from, el) => to.el.children.length < 3 && /* 类别判定 */

// 排除已配对的（不让重复加）
put: (to, from, el) => !to.el.querySelector(`[data-id="${el.dataset.id}"]`) && /* 类别判定 */
```

### 配对成功后的「锁定」与「可反悔」

**默认锁定**（教研课堂场景的预期）：

```js
onAdd: (evt) => {
  evt.item.style.pointerEvents = 'none';  // 自身不再接收拖拽事件
  evt.item.classList.add('locked');
}
```

**可反悔重做**（需求明确要求时）：

```js
// 1. 分类盘也声明 pull: true
new Sortable(plate, { group: { name: 'food', pull: true, put: ... }, ... });
// 2. 在 onRemove 里回退状态
onRemove: (evt) => { score--; }
```

### 视觉定制三套 class

Sortable 自动给元素挂这三个 class，CSS 完全自由：

| class | 应用对象 | 时机 | 适合做什么 |
|---|---|---|---|
| `ghostClass` | 原位置的占位元素 | 拖动中 | 半透明、虚线、提示"原位置" |
| `chosenClass` | 被按住但未浮起的元素 | mousedown 后、移动前 | 改 cursor、加边框预览 |
| `dragClass` | 真正浮起跟手的元素 | 移动中 | 缩放、阴影、旋转 |

**不需要也不要**自己控制浮起元素的 `position: fixed` / `appendChild` —— Sortable 用 `fallbackOnBody: true` 配置内部已处理。

### 触摸三件套（同模板 B，必配）

```js
delay: 100,              // 触摸长按 100ms 触发（分类游戏比列表排序短，更"拿得起")
delayOnTouchOnly: true,
touchStartThreshold: 5,
```

**列表排序用 200ms，分类游戏用 100ms**：分类游戏是"明确意图要拖"，不需要长按区分滚动。

### body 不要写 `touch-action: none`

模板 A/C（手写）需要 body `touch-action: none`，但 Sortable 内部用 `pointer-events` 控制，**body 写 `touch-action: none` 会让页面无法滚动**。Sortable 场景下：

- body 不写 `touch-action`
- 如果整页不滚动，给最外层容器 `overflow: hidden` 而不是 body `touch-action: none`

## 何时退出本模板，改走 drop-match.md

仅当以下任一条件命中：

| 条件 | 原因 |
|---|---|
| drop 目标不是 DOM 容器（拼图槽位、数轴刻度、坐标点） | Sortable 必须有容器作为 drop 目标 |
| drop 目标是非矩形（圆形盘子需精确边界、异形 SVG zone） | Sortable hit-test 用矩形 bounding box |
| 命中后需要画线 / 留下轨迹 | Sortable 只做 DOM 重排，画线需自己实现 |
| 需要拖到任意自由位置（非容器） | 那是模板 A free-drag 场景 |

## 自检要点

- [ ] Sortable.js CDN 已引入
- [ ] **源容器**配置：`group: { name, pull: true, put: false }`
- [ ] **每个目标容器**配置：`group: { name, pull: false, put: (to,from,el) => 判定函数 }`
- [ ] 触摸三件套：`delay + delayOnTouchOnly + touchStartThreshold`
- [ ] 三件套：`user-select: none` + `-webkit-user-select: none` + `-webkit-touch-callout: none`（body 上）
- [ ] body **没有** `touch-action: none`（会让页面无法滚动）
- [ ] **没有**手动绑 `pointerdown/move/up` 干扰 Sortable
- [ ] 命中成功的反馈在 `onAdd` 回调里（计分、视觉、音效）
- [ ] 命中失败的反馈在 `put` 内（Sortable 自动弹回，自己加 shake 等视觉）
- [ ] 配对完成默认锁定（`pointer-events: none` 或 `pull: false`），除非业务明确要求"可反悔"

## 对照报告（替代 SKILL.md 必检 #1-#17）

本模板生效时，最终回复的对照表如下：

```
| 必检 # | 状态 | 说明 |
|---|---|---|
| #1-#10 | — | Sortable.js 库代劳 |
| #11 pointercancel | — | Sortable 内部处理 |
| #12 Sortable 三件套 | ✅ | L? `delay/delayOnTouchOnly/touchStartThreshold` |
| #13 pointer-events 边界 | ✅ | grep 仅 onAdd 内锁定用，无祖先链/zone 阻塞 |
| #14-#17 | — | 异步状态机、document 委托、状态守卫、错误分支降级 —— Sortable 库代劳 |
```
