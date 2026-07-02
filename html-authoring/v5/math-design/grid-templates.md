# math-design 数学网格、点阵与 3D 地面网格模板

> 仅数学场景可读取。非数学场景禁止读取本文件。

本文件约束“具有数学读数或空间参照意义”的网格/点阵/地面网格。色板里的 CSS 背景网格只能作为非测量性装饰或颜色参数来源，不能直接承担读点、对齐、拖拽吸附、坐标纸、几何画布或 3D 地面。

## 读取条件

当页面实际绘制以下内容时，必须读取本文件：

- 明确要求方格线、网格线、坐标网格、坐标纸、方格纸、点阵纸
- 需要借助方格/点阵读点、定位、对齐、刻度、拖拽吸附、几何画布
- 小学面积/周长/数格子场景中，图形由单位正方形拼成，且用户要求“一个正方形对应背景一个格子”“图形嵌入网格”“正方形四边贴合网格线”
- 带坐标轴/函数图像且用户明确要求“方便学生读点/借助方格读点/参考线/辅助线”
- 数学 3D 几何、立体图形、体积/表面积、空间关系演示中的地面/底面参照

只说“点坐标 / 读坐标 / 展示点位置 / 在坐标系中标点 / 实时显示坐标”不是读取本文件的理由；这类坐标轴场景默认无背景方格。

## 分流原则

| 场景 | 默认 | 允许的实现 | 禁止 |
|---|---|---|---|
| 坐标系/坐标轴/函数图像，用户未要求网格 | 无背景方格 | 轴线、短刻度、标签、点/线/曲线 | CSS 网格背景、SVG/Canvas 全幅网格、网格切换入口 |
| 坐标系/函数图像，用户明确要求方格 | 有完整坐标网格 | SVG/Canvas `grid-layer`，与轴共用 `origin/unit/scale` | CSS `linear-gradient` 伪装坐标网格 |
| 统计图明确要求参考线 | 有图表参考线 | SVG/Canvas/chart-layer，按图表比例尺绘制 | 把统计参考线误做成坐标纸 |
| 方格纸/点阵纸/几何画布/拖拽吸附 | 有方格或点阵 | SVG/Canvas `grid-layer` 或 `dot-layer`，吸附逻辑同源 | DOM/CSS 背景与拖拽坐标分离 |
| 单位正方形拼图/周长面积数格子 | 每个小正方形占 1 格 | Canvas、SVG 或 CSS Grid，但必须用同一 `CELL` 与 `cells` 数据驱动背景、方块和周长 | 各图形手写 `path/translate/left/top`，背景格距和方块尺寸双轨 |
| 数学 3D 几何 | 有 3D 地面网格 | Three.js `GridHelper` 或地面线段对象，且肉眼可见 | 页面平面 CSS 网格背景、不可见的同色网格、相机转到地面以下 |

## CSS、SVG、Canvas、Three.js 的边界

- CSS `background-image` / `linear-gradient` / `repeating-linear-gradient`：只用于非测量性视觉底纹，例如普通模块、卡片、非读数背景。不得用于坐标读点、几何对齐、拖拽吸附或 3D 地面。
- SVG：适合静态或轻交互的坐标系、函数图、几何画布、点阵纸。优势是 DOM 可检查、层级清晰、轴和网格天然可同源。
- Canvas：适合大量点、动态拖拽、频繁重绘、模拟器。必须把 `origin/unit/scale` 作为唯一状态源，每次重绘先画网格再画数据。
- Three.js：适合数学 3D 几何。地面网格必须是 3D 场景对象，随相机透视变化，不是页面背景。

## SVG 坐标网格模板

适用于带坐标轴、函数图、坐标纸、可读点的平面直角坐标系。所有点、线、轴、刻度必须使用同一套换算函数。

```html
<svg id="math-canvas" class="math-svg" viewBox="0 0 640 640" role="img" aria-label="数学坐标图">
  <rect class="paper-bg" x="0" y="0" width="640" height="640" rx="16"></rect>
  <g id="grid-layer" class="grid-layer" aria-hidden="true"></g>
  <g id="axis-layer" class="axis-layer"></g>
  <g id="data-layer" class="data-layer"></g>
  <g id="label-layer" class="label-layer"></g>
</svg>
```

```js
const SVG_SIZE = 640;
const ORIGIN = { x: 320, y: 320 };
const UNIT = 40;
const RANGE = 7;

function sx(x) {
  return ORIGIN.x + x * UNIT;
}

function sy(y) {
  return ORIGIN.y - y * UNIT;
}

function line(className, x1, y1, x2, y2) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('class', className);
  el.setAttribute('x1', x1);
  el.setAttribute('y1', y1);
  el.setAttribute('x2', x2);
  el.setAttribute('y2', y2);
  return el;
}

function buildCoordinateGrid() {
  const grid = document.getElementById('grid-layer');
  grid.replaceChildren();
  for (let i = -RANGE; i <= RANGE; i += 1) {
    const x = sx(i);
    const y = sy(i);
    grid.appendChild(line('grid-line grid-line-v', x, sy(-RANGE), x, sy(RANGE)));
    grid.appendChild(line('grid-line grid-line-h', sx(-RANGE), y, sx(RANGE), y));
  }
}

function buildAxes() {
  const axis = document.getElementById('axis-layer');
  axis.replaceChildren(
    line('axis-line x-axis', sx(-RANGE), sy(0), sx(RANGE), sy(0)),
    line('axis-line y-axis', sx(0), sy(-RANGE), sx(0), sy(RANGE))
  );
}
```

```css
.math-svg {
  width: min(86vmin, 640px);
  aspect-ratio: 1 / 1;
  display: block;
}
.paper-bg { fill: var(--stage-bg, #F7FDF6); }
.grid-line {
  stroke: var(--grid-color, rgba(37, 31, 32, 0.22));
  stroke-width: 1.25;
  vector-effect: non-scaling-stroke;
}
.axis-line {
  stroke: #251F20;
  stroke-width: 2.2;
  vector-effect: non-scaling-stroke;
}
```

**对齐硬约束：**

- `sx(0) === ORIGIN.x`，`sy(0) === ORIGIN.y`，原点是网格交点。
- x 轴的 y 坐标必须等于某条水平网格线的 y；y 轴的 x 坐标必须等于某条垂直网格线的 x。
- 轴、刻度、标签、函数曲线、点位、辅助线都调用 `sx()` / `sy()`，不得各自写一套 `left/top`。

## 标准坐标轴组件加网格

若已按 `manipulatives.md` 使用 `.standard-axis`，不要改 6 个标准 path。显式要求方格时，在同一个 SVG 内、6 个标准 path 之前插入网格层，围绕 `AXIS_CENTER` 对称生成。

```js
function line(className, x1, y1, x2, y2) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  el.setAttribute('class', className);
  el.setAttribute('x1', x1);
  el.setAttribute('y1', y1);
  el.setAttribute('x2', x2);
  el.setAttribute('y2', y2);
  return el;
}

const AXIS_SIZE = 308.0001;
const AXIS_CENTER = 154.082;
const UNIT = 22;
const STEPS = 6;

function axisGridPosition(n) {
  return AXIS_CENTER + n * UNIT;
}

function buildStandardAxisGrid(svg) {
  const grid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  grid.setAttribute('id', 'grid-layer');
  grid.setAttribute('class', 'grid-layer');
  for (let i = -STEPS; i <= STEPS; i += 1) {
    const p = axisGridPosition(i);
    grid.appendChild(line('grid-line grid-line-v', p, axisGridPosition(-STEPS), p, axisGridPosition(STEPS)));
    grid.appendChild(line('grid-line grid-line-h', axisGridPosition(-STEPS), p, axisGridPosition(STEPS), p));
  }
  svg.insertBefore(grid, svg.firstElementChild);
}
```

## SVG 点阵纸与几何画布模板

适用于平面图形、拖拽顶点、等底等高三角形、图形变换等。点阵可作为几何画布背景，但仍必须是 SVG 图层，不是 CSS 背景。

```html
<svg id="geometry-board" viewBox="0 0 720 480" role="img" aria-label="点阵几何画布">
  <rect class="paper-bg" width="720" height="480"></rect>
  <g id="dot-layer" class="dot-layer" aria-hidden="true"></g>
  <g id="shape-layer" class="shape-layer"></g>
  <g id="handle-layer" class="handle-layer"></g>
</svg>
```

```js
const BOARD = { width: 720, height: 480 };
const GRID = { originX: 60, originY: 420, unit: 24 };

function gx(x) {
  return GRID.originX + x * GRID.unit;
}

function gy(y) {
  return GRID.originY - y * GRID.unit;
}

function snapPoint(px, py) {
  return {
    x: Math.round((px - GRID.originX) / GRID.unit),
    y: Math.round((GRID.originY - py) / GRID.unit)
  };
}

function drawDotGrid() {
  const layer = document.getElementById('dot-layer');
  layer.replaceChildren();
  for (let x = 0; x <= 25; x += 1) {
    for (let y = 0; y <= 16; y += 1) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'grid-dot');
      dot.setAttribute('cx', gx(x));
      dot.setAttribute('cy', gy(y));
      dot.setAttribute('r', '1.7');
      layer.appendChild(dot);
    }
  }
}
```

**几何画布规则：**

- 用户只要求“平面图形/几何变换”时，可用点阵或方格辅助，但点、线、顶点拖拽必须与网格同源。
- 用户没有要求坐标轴时，不要自动添加 x/y 轴。
- 拖拽吸附只能调用 `snapPoint()`；不能让视觉网格和吸附格距分离。

## 单位正方形拼图模板

适用于小学“面积/周长/数格子/方格纸拼图”场景。触发语包括：一个正方形对应一个格子、图形嵌入网格、正方形四条边贴合浅蓝色网格线、周长红色描边、随机图形也必须由完整格子拼成。

本节只约束拼图演示区，不限制整页配色、按钮布局、教学说明或其它非拼图组件。若只是普通平面图形、坐标轴或装饰网格，不要强行套本模板。

**核心原则：**

- 全文件只定义一处 `CELL`；背景格、黄色方块、红色周长、拖拽吸附都使用它。
- 所有图形用 `cells: [[col,row], ...]` 表示；固定图形和随机图形调用同一个渲染函数。
- 禁止图形 1/2 用手写 `path/translate`，图形 3/4 用另一套算法；这种“多套几何”最容易导致部分图形偏半格。
- 周长红线由外轮廓边计算，内部共享边不描红；不要给每个小方块单独加红色 outline。

推荐 Canvas 实现：

```js
const CELL = 50;
const GRID_COLS = 14;
const GRID_ROWS = 10;

const SHAPES = [
  { name: 'L 型五方块', cells: [[5,4],[5,5],[5,6],[6,6],[7,6]] },
  { name: '一字四方块', cells: [[5,5],[6,5],[7,5],[8,5]] },
  { name: '田字四方块', cells: [[6,4],[7,4],[6,5],[7,5]] },
  { name: '阶梯凸型', cells: [[5,6],[6,6],[6,5],[7,5],[7,4]] }
];

canvas.width = GRID_COLS * CELL;
canvas.height = GRID_ROWS * CELL;

function drawUnitGrid(ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#b9d8ee';
  ctx.lineWidth = 1;
  for (let c = 0; c <= GRID_COLS; c += 1) {
    ctx.beginPath();
    ctx.moveTo(c * CELL + 0.5, 0);
    ctx.lineTo(c * CELL + 0.5, GRID_ROWS * CELL);
    ctx.stroke();
  }
  for (let r = 0; r <= GRID_ROWS; r += 1) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL + 0.5);
    ctx.lineTo(GRID_COLS * CELL, r * CELL + 0.5);
    ctx.stroke();
  }
}

function drawCells(ctx, cells, fill = '#ffd34d') {
  cells.forEach(([c, r]) => {
    ctx.fillStyle = fill;
    ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
    ctx.strokeStyle = '#d9a300';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c * CELL + 0.75, r * CELL + 0.75, CELL - 1.5, CELL - 1.5);
  });
}
```

周长外轮廓：

```js
function getOuterEdges(cells) {
  const set = new Set(cells.map(([c, r]) => `${c},${r}`));
  const edges = [];
  cells.forEach(([c, r]) => {
    const x = c * CELL;
    const y = r * CELL;
    if (!set.has(`${c},${r - 1}`)) edges.push({ x1: x, y1: y, x2: x + CELL, y2: y });
    if (!set.has(`${c},${r + 1}`)) edges.push({ x1: x, y1: y + CELL, x2: x + CELL, y2: y + CELL });
    if (!set.has(`${c - 1},${r}`)) edges.push({ x1: x, y1: y, x2: x, y2: y + CELL });
    if (!set.has(`${c + 1},${r}`)) edges.push({ x1: x + CELL, y1: y, x2: x + CELL, y2: y + CELL });
  });
  return edges;
}

function drawPerimeter(ctx, cells) {
  ctx.save();
  ctx.strokeStyle = '#e53935';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  getOuterEdges(cells).forEach((edge) => {
    ctx.beginPath();
    ctx.moveTo(edge.x1, edge.y1);
    ctx.lineTo(edge.x2, edge.y2);
    ctx.stroke();
  });
  ctx.restore();
}
```

CSS Grid / SVG 也可以使用，但必须等价满足：

- `.grid-board { --cell: 50px; grid-template-columns: repeat(cols, var(--cell)); }`
- `.unit-cell { width: var(--cell); height: var(--cell); box-sizing: border-box; }`
- 每个 cell 的 `grid-column/grid-row` 由 `cells` 数据生成，不在 HTML 里散落手写像素。
- 红色周长用 `getOuterEdges(cells)` 生成 SVG line/path，不能靠每格 outline 冒充周长。

随机图形必须只增删整格：

```js
function makeRandomCells(count = 6, start = [6, 5]) {
  const cells = [start];
  const seen = new Set([start.join(',')]);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (cells.length < count) {
    const base = cells[Math.floor(Math.random() * cells.length)];
    const [dc, dr] = dirs[Math.floor(Math.random() * dirs.length)];
    const next = [base[0] + dc, base[1] + dr];
    const key = next.join(',');
    if (next[0] > 0 && next[0] < GRID_COLS - 1 && next[1] > 0 && next[1] < GRID_ROWS - 1 && !seen.has(key)) {
      seen.add(key);
      cells.push(next);
    }
  }
  return cells;
}
```

交付自检函数建议保留在 HTML 中，供 `test_html` 调用：

```js
function validateUnitSquareGrid(shapes = SHAPES) {
  const failures = [];
  if (!Number.isFinite(CELL) || CELL < 24) failures.push('CELL invalid');
  shapes.forEach((shape) => {
    const seen = new Set();
    shape.cells.forEach(([c, r]) => {
      if (!Number.isInteger(c) || !Number.isInteger(r)) failures.push(`${shape.name} has non-integer cell`);
      if (seen.has(`${c},${r}`)) failures.push(`${shape.name} duplicate cell ${c},${r}`);
      seen.add(`${c},${r}`);
      const x = c * CELL;
      const y = r * CELL;
      if (Math.abs(x / CELL - c) > 0.001 || Math.abs(y / CELL - r) > 0.001) {
        failures.push(`${shape.name} cell is not on grid`);
      }
    });
    const edges = getOuterEdges(shape.cells);
    edges.forEach((edge) => {
      [edge.x1, edge.x2].forEach((x) => {
        if (Math.abs(x / CELL - Math.round(x / CELL)) > 0.001) failures.push(`${shape.name} perimeter x off grid`);
      });
      [edge.y1, edge.y2].forEach((y) => {
        if (Math.abs(y / CELL - Math.round(y / CELL)) > 0.001) failures.push(`${shape.name} perimeter y off grid`);
      });
    });
  });
  return { ok: failures.length === 0, failures };
}
```

Playwright 最低断言：

```python
result = page.evaluate("() => window.validateUnitSquareGrid && window.validateUnitSquareGrid()")
assert result and result["ok"], result
```

## Canvas 动态网格模板

适用于大量动态元素或高频拖拽。Canvas 必须每帧按同一参数先画网格，再画轴/图形/标签。

```js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const state = {
  origin: { x: 320, y: 320 },
  unit: 40,
  range: 7
};

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function cx(x) {
  return state.origin.x + x * state.unit;
}

function cy(y) {
  return state.origin.y - y * state.unit;
}

function drawCanvasGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(37,31,32,0.22)';
  ctx.lineWidth = 1.25;
  for (let i = -state.range; i <= state.range; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx(i), cy(-state.range));
    ctx.lineTo(cx(i), cy(state.range));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx(-state.range), cy(i));
    ctx.lineTo(cx(state.range), cy(i));
    ctx.stroke();
  }
  ctx.restore();
}

function drawCanvasAxes() {
  ctx.save();
  ctx.strokeStyle = '#251F20';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx(-state.range), cy(0));
  ctx.lineTo(cx(state.range), cy(0));
  ctx.moveTo(cx(0), cy(-state.range));
  ctx.lineTo(cx(0), cy(state.range));
  ctx.stroke();
  ctx.restore();
}
```

Canvas 自检：`state.origin.x % state.unit` 不要求为 0；只要求网格线由 `origin + n * unit` 生成，轴线也由 `origin` 生成，因此轴必然落在网格线上。

## Three.js 标准地面网格模板

适用于数学 3D 几何、立体图形、体积/表面积、空间关系。地面网格必须是 3D 对象，不能写在页面 CSS 背景上。网格必须比地面/背景更深或更浅，不能与地面同色导致肉眼不可见。

本节参数是硬阈值，不是风格建议。生成数学 3D 场景时必须直接复用以下函数，或逐项等价实现：`grid.material.opacity >= 0.55`、`ground.material.opacity <= 0.25`、`controls.enablePan === false`、`controls.maxPolarAngle < Math.PI / 2`、`window.__math3d.ground` 和 `window.__math3d.grid` 必须存在。禁止把 `GridHelper` 的透明度降到 `0.3/0.4/0.5`，禁止只暴露 `hasGroundGrid` 而不暴露对象本身。

```js
function createStandardGroundGrid(scene, opts = {}) {
  const size = opts.size ?? 12;
  const divisions = opts.divisions ?? 24;
  const majorColor = opts.majorColor ?? 0x174a3a;
  const minorColor = opts.minorColor ?? 0x6fa58f;
  const fillColor = opts.fillColor ?? 0xf7fdf6;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      color: fillColor,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.012;
  ground.renderOrder = 1;
  scene.add(ground);

  const grid = new THREE.GridHelper(size, divisions, majorColor, minorColor);
  grid.position.y = 0.01;
  grid.renderOrder = 2;
  grid.material.transparent = true;
  grid.material.opacity = 0.72;
  grid.material.depthWrite = false;
  scene.add(grid);

  return { ground, grid };
}
```

推荐相机和控制器约束：

```js
function syncMath3DViewport(camera, renderer, container) {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function configureMath3DControls(camera, controls, boxHeight = 2) {
  camera.position.set(8, 7, 9);
  controls.target.set(0, Math.max(0.8, boxHeight / 2), 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 28;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI / 2 - 0.08;
  controls.update();
}
```

相机宽高比也是硬要求：`PerspectiveCamera` 禁止长期使用 `aspect=1` 作为宽屏舞台的相机比例。初始化 renderer 后必须立刻调用 `syncMath3DViewport(camera, renderer, container)`，并在 `resize` 事件中复用同一函数；必须在第一次 `animate()` / `renderer.render()` 前完成同步。否则正方体、球体等会在宽屏容器里被横向拉伸或纵向压扁，视觉上变成长方体/椭球。

推荐暴露测试状态：

```js
function exposeMath3DState(extra = {}) {
  window.__math3d = {
    scene,
    camera,
    renderer,
    controls,
    ground,
    grid,
    hasGroundGrid: true,
    ...extra
  };
}

exposeMath3DState({
  box
});
```

若变量名不同，仍必须映射到同名调试字段：

```js
window.__math3d = {
  scene,
  camera,
  renderer,
  controls,
  ground: groundMesh,
  grid: groundGridHelper,
  solid: currentSolid,
  hasGroundGrid: true
};
```

3D 自检：

- `renderer.domElement` 或 `#stage` 不得设置 CSS `background-image` 网格。
- `grid.type === "GridHelper"` 或地面线段对象存在；若使用 `GridHelper`，`grid.material.opacity >= 0.55`，`grid.position.y > ground.position.y`，地面材质 `transparent=true` 且 `opacity <= 0.25`。这些阈值必须写进代码和 `test_html`，不得用“肉眼看起来可以”替代。
- 网格颜色与地面/场景背景必须有明确明度差，禁止地面和网格都用同一深绿/同一浅灰。失败例：`ground=0x158A60` 且 `grid=0x148259`、`opacity=0.3`，视觉上等于没有网格。
- 几何体底面、投影、测量线以 `y=0` 地面为参照；相机和 OrbitControls 的 target 指向几何体中心附近。
- 禁止相机/控制器允许转到地面以下导致地面遮挡模型；设置 `controls.maxPolarAngle < Math.PI / 2`，并保持 `controls.enablePan=false`。缺省不写 `enablePan` 也视为不合格，因为后续平移可能把模型拖出地面参照。
- HTML 必须暴露 `window.__math3d`，供 `test_html` 断言 `hasGroundGrid`、`ground`、`grid`、`grid.type`、`grid.material.opacity`、`ground.material.opacity`、`controls.enablePan`、`controls.maxPolarAngle` 和 CSS 背景。
- 3D 几何体比例自检：`Math.abs(camera.aspect - renderer.domElement.clientWidth / renderer.domElement.clientHeight) <= 0.02`；若 canvas 取不到 client 尺寸，用渲染器 drawing buffer 尺寸等价校验。禁止正方体/球体因 camera aspect 错误被拉伸。
- `test_html` 若失败必须先修复并重跑，严禁在最后一次 `test_html.passed !== true` 时调用 `publish_resource` 或结束任务。
- 地面网格颜色来自当前 palette 的浅色/边框色或其数值化结果；不要引入外站贴图。
- 数学 3D 优先 Three.js；若使用 p5 WEBGL 或 SVG 伪 3D，仍必须用对应 3D/透视场景对象或 SVG 地面网格层表达“地面”，不能用页面平铺背景。

## 从色板 CSS 网格转为数学图层参数

色板段落中的网格通常写成：

```css
linear-gradient(#E0E0E0 1px, transparent 1px),
linear-gradient(90deg, #DADADA 1px, transparent 1px);
background-size: 30px 30px;
```

当它只作装饰，可保留为 CSS。若用户需要数学网格，必须转为参数：

- `#E0E0E0` / `#DADADA` → `--grid-color` 或 Three.js `minorColor`
- `1px` → SVG/Canvas `stroke-width`
- `30px 30px` → `UNIT = 30` 或按舞台尺寸换算后的 `unit`
- `background-color` → SVG `paper-bg` / Canvas 背景 / Three.js `ground` fill

转换后不得保留原 CSS 网格背景，避免出现图层错位。

## 交付自检

- 默认坐标轴/函数图/图表轴线场景：无 CSS 网格背景、无 `grid-layer`、无网格切换入口；轴线、短刻度、标签、数据图形清晰可见。
- 显式坐标方格：横线和竖线都真实渲染；网格、轴、刻度、点/线/曲线同源；x/y 轴落在网格线上；网格线肉眼可见但不压过数据。
- 点阵/几何画布：所有顶点、拖拽手柄、吸附逻辑都使用同一 `origin/unit/scale`。
- 单位正方形拼图：所有方块是整数格坐标；每个小正方形宽高等于 `CELL`；固定图形和随机图形共用同一渲染函数；周长红线端点均在格线上，且内部共享边不描红。
- 统计参考线：按图表比例尺绘制，不误伤柱形/折线/分箱标签。
- 数学 3D：没有页面平面 CSS 网格；3D 场景中存在地面网格对象，模型与地面关系清楚。
