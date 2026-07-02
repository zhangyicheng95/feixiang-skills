# 模板 B：列表排序

## 何时用

用户需要"拖拽改变一组同类条目的顺序"。常见场景：

- 把解题步骤拖成正确顺序
- 把历史事件按时间排序
- 把知识点按重要性/学习顺序排
- 教师把教学环节卡片重排

判断信号：

- 条目数量固定，**只换顺序，不增减**
- 条目是同类的（同样的视觉、同样的语义粒度）
- 不需要把元素拖到"指定目标区"判断对错（那是模板 C）

**不适用**：自由拖动（模板 A）、拖到目标区（模板 C）、跨列表拖拽（用 Sortable.js 的 `group` 配置自行扩展）。

## 完整可复制模板

```html
<ul id="sortable-list">
  <li>步骤 1：审题</li>
  <li>步骤 2：列方程</li>
  <li>步骤 3：求解</li>
  <li>步骤 4：检验</li>
</ul>

<!-- CDN 用法见 SKILL.md「输出约定」第 5 条 -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>

<style>
  #sortable-list {
    list-style: none; padding: 0; max-width: 400px;
    /* 列表内允许垂直滚动，由 Sortable 内部识别"拖" vs "滚" */
    touch-action: pan-y;
  }
  #sortable-list li {
    padding: 12px 16px; margin-bottom: 4px;
    background: #fff; border: 1px solid #ddd; border-radius: 4px;
    cursor: grab;
    /* 三件套：前两个压制选中，第三个专门压制 iOS 长按菜单 */
    user-select: none; -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .sortable-ghost { opacity: 0.4; background: #fff5eb; }
  .sortable-chosen { cursor: grabbing; }
</style>

<script>
  Sortable.create(document.getElementById('sortable-list'), {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    // ↓ 配置三件套：解决移动端"拖" vs "滚"冲突，缺一不可
    delay: 200,              // 触摸时长按 200ms 才触发（避免与滚动冲突）
    delayOnTouchOnly: true,  // 桌面鼠标立即响应，delay 仅作用于触摸
    touchStartThreshold: 5,  // 5px 内的微抖不视为拖拽，容忍误触
    onEnd: (evt) => {
      // 业务回调：evt.oldIndex / evt.newIndex 是 DOM 顺序索引
      // 例：判断当前顺序是否正确
      const order = Array.from(evt.to.children).map(li => li.textContent.trim());
      console.log('新顺序：', order);
      // 例：和正确答案比较
      // if (JSON.stringify(order) === JSON.stringify(answer)) showCorrect();
    }
  });
</script>
```

## 该模板专属注意

### 移动端的"拖" vs "滚"冲突（必须配置！）

这是 Sortable.js 在移动端最常见的踩坑：默认配置下，用户想滚动列表会变成拖拽第一个 item。

**必配三件套**：

```js
delay: 200,              // 长按 200ms 才触发拖拽
delayOnTouchOnly: true,  // 桌面端不延迟（鼠标用户立即响应）
touchStartThreshold: 5,  // 5px 误触容忍
```

配合 CSS：

```css
touch-action: pan-y;  /* 列表容器允许垂直滚动手势 */
```

### 不要手动写"拖到某位置触发什么"的逻辑

Sortable.js 用 `onEnd` 回调统一处理。**不要**自己监听 li 的 `pointerdown/move/up` 去判断"拖到哪里了"——Sortable 已经在内部完整处理了 DOM 重排，自己再加一套必然冲突。

业务逻辑只需要在 `onEnd` 里读当前 DOM 顺序：

```js
const order = Array.from(evt.to.children).map(li => li.dataset.value);
```

### 跨列表拖拽

如果要"把 A 列表里的 item 拖到 B 列表"，给两个列表配同名 `group`：

```js
Sortable.create(listA, { group: 'shared', ... });
Sortable.create(listB, { group: 'shared', ... });
```

但**这种场景更像是"分类配对"，建议改用模板 C drop-match**，业务逻辑更清晰。

### 验证答案的常见两种模式

**模式 1：拖完立即判断**（即时反馈）

```js
onEnd: (evt) => {
  const order = Array.from(evt.to.children).map(li => li.dataset.step);
  if (JSON.stringify(order) === JSON.stringify(['审题','列方程','求解','检验'])) {
    showSuccess();
  }
}
```

**模式 2：拖完不判断，点"提交"才判断**（适合多步操作题）

```js
document.getElementById('submit').addEventListener('click', () => {
  const order = Array.from(list.children).map(li => li.dataset.step);
  // ...
});
```

## 自检要点

- [ ] Sortable.js CDN 已引入
- [ ] 配置了 `delay + delayOnTouchOnly + touchStartThreshold` 三件套（不配移动端必然误触）
- [ ] 列表容器 `touch-action: pan-y`
- [ ] li 有 `user-select: none` + `-webkit-touch-callout: none`
- [ ] **没有**手动绑 `pointerdown/move/up` 干扰 Sortable
- [ ] `onEnd` 回调里有业务逻辑（判断顺序、保存状态、计分等）
