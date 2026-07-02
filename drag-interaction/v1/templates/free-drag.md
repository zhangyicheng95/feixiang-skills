# 模板 A：自由拖动

## 何时用

把一个或多个元素自由拖动到任意位置。常见场景：

- 物理实验：拖动物块演示力的合成/分解
- 几何：拖动顶点改变三角形/多边形
- 物体定位：把图标拖到画布任意位置
- 自定义"棋盘"：拖动棋子但不限定落点

**不适用**：列表排序（用模板 B sortable-list）、拖到指定区域判定（用模板 C drop-match）。

## 完整可复制模板

```html
<div id="drag-stage">
  <div class="draggable" data-drag style="left:20px;top:20px">拖我</div>
  <!-- 多个可拖元素：直接加 <div class="draggable" data-drag>...，事件已委托 -->
</div>

<style>
  #drag-stage {
    position: relative;
    width: 100%;
    height: 400px;
    background: #f6f6f6;
    /* 必检 #2：touch-action: none 阻止浏览器默认滚动/缩放手势；不写移动端必然不响应 */
    touch-action: none;
    /* 必检 #3：三件套全配齐——前两个压制选中，第三个专门压制 iOS 长按菜单 */
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .draggable {
    position: absolute;
    width: 80px; height: 80px;
    background: #ff5600; color: #fff;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px;
    cursor: grab;
    /* 三件套 + touch-action 全部双写到子层，避免依赖继承的写法不一致 */
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .draggable.dragging { cursor: grabbing; opacity: 0.8; }
</style>

<script>
(function () {
  const stage = document.getElementById('drag-stage');
  let activeEl = null, activePid = null, offsetX = 0, offsetY = 0;

  stage.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-drag]');
    if (!el) return;
    activeEl = el;
    activePid = e.pointerId;
    // 必检 #5 + #6：用 getBoundingClientRect 算 offset，禁用 e.offsetX/Y（不同浏览器含义不同）
    const r = el.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;
    // 必检 #4：捕获指针后 move/up 永远派发给本元素，跨边界也不丢
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
  });

  stage.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePid || !activeEl) return;
    const sr = stage.getBoundingClientRect();
    let x = e.clientX - sr.left - offsetX;
    let y = e.clientY - sr.top - offsetY;
    // 必检 #7：边界 clamp，元素不会飞出舞台
    const maxX = stage.clientWidth - activeEl.offsetWidth;
    const maxY = stage.clientHeight - activeEl.offsetHeight;
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));
    activeEl.style.left = x + 'px';
    activeEl.style.top = y + 'px';
  });

  function endDrag(e) {
    if (e.pointerId !== activePid || !activeEl) return;
    activeEl.classList.remove('dragging');
    activeEl.releasePointerCapture(e.pointerId);
    activeEl = null; activePid = null;
  }
  // 必检 #11：pointerup 和 pointercancel 共用清理；漏写 cancel 会让来电中断后元素卡死
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
})();
</script>
```

## 该模板专属注意

- **舞台必须有明确的尺寸和 `position: relative`**：可拖元素是 `position: absolute`，没参照系会飞到 body 上去
- **多个可拖元素**直接复制 `<div class="draggable" data-drag>`，事件已经委托到 `stage`，不需要每个元素绑 listener
- **要记住拖完的位置**：拖完后的 `left/top` 已经写到 inline style，刷新页面会丢；如需持久化把 `endDrag` 里加 `localStorage.setItem(...)` 业务回调
- **想要拖动有惯性/物理效果**：本模板不支持，建议直接用 interact.js 的 `inertia` 选项

## 自检要点

- [ ] 舞台元素三件套齐：`touch-action: none` + `user-select: none` + `-webkit-touch-callout: none`
- [ ] `pointerdown` 里调用了 `setPointerCapture`
- [ ] 坐标用 `clientX/Y - getBoundingClientRect().left/top`，不是 `offsetX/Y`
- [ ] 边界 clamp 已加
- [ ] `pointercancel` 和 `pointerup` 走同一个清理函数
