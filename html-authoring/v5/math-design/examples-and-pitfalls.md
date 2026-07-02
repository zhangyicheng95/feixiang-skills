# html-authoring · 完整示例与典型错误案例（按需 read_url）

## 完整示例

### 示例 M：数学场景（走 math-design 子链路，**每次必须独立查表/算式，不得照搬本示例编号**）

**M-1 初中知识点 → 查表命中**
用户："做一个勾股定理证明教学动画，输出单页互动 HTML"
- 学科路由：数学 → read `math-design/workflow.md`
- 学段：初中 → pool B；Phase 3 查表：`勾股定理` → **palette_id=B-04**
- 抽选 ┃ keyword=勾股定理 pool=B source=table palette_id=B-04
- 布局：`ord("勾")=21246`，`len(prompt)=25` → `(21246+25)%3=1` → **L2 左栏**
- Phase 4：`read_file` color-palettes-b.md 中 B-04 段 + visual-impact.md
- 执行：`create_file`，首行 `<!-- html-authoring:math-design palette=B-04 layout=L2 -->`

**M-2 小学知识点 → 查表命中**
用户："做一个鸡兔同笼解题教学动画"
- pool=A；查表 `鸡兔同笼` → **A-06**；布局 `(ord("鸡")=40481 + 13)%3=0` → **L1 底栏**
- 首行 `<!-- html-authoring:math-design palette=A-06 layout=L1 -->`

**M-3 不在表中 → 算式兜底**
用户："做一个余弦定理交互动画"（不在 30 条表内）
- pool=B；未命中 → 算式：`hash=ord("余")×7+ord("理")×5+len(prompt)=20313×7+29702×5+11=290712`；`palette_id=B-{(290712%20)+1:02d}=B-13`
- 抽选 ┃ keyword=余弦定理 pool=B source=hash palette_id=B-13
- 布局 `(20313+11)%3=2` → **L3 右栏**；首行 `<!-- html-authoring:math-design palette=B-13 layout=L3 -->`

### 示例 P：非数学场景（走通用配色，多轮）

**第 1 轮** 用户："做一个初中物理'力的分解'教学动画"
- 学科路由：物理 → **通用**；禁 read math-design；禁 palette 注释
- 设计：沉稳橙（primary=#FF5600）；左右结构；Anime.js
- `create_file` 首行 `<!DOCTYPE html>`（无 math-design 注释）
- 回复 + terminate：左侧调合力大小方向、右侧实时显示分量及夹角；两种法则切换；讲解分步说明。

**第 2 轮** 用户："把主色改成蓝色"
- `read_file` 确认配色令牌 → `edit_file` 将 `primary` 改 `#3B82F6`、同步 accent → 回复 + terminate。

---

## 典型错误案例

**A · html 被生成成"演示"空壳**
现象：`<body>` 只渲染"演示"二字 + 空 SVG；console 报 `Cannot read properties of undefined (reading 'content')`。
根因：模板代码写了 `const items = data.content.items.map(...)`，但 `data` 没被实际注入。
修复：所有内容在 `create_file` 时以字面量写进来；禁 `data.xxx` 运行时引用。

**B · 3D 地球贴图加载失败**
现象：console `Access to image at 'https://storage.googleapis.com/...earth_day.jpg' blocked by CORS`。
根因：Three.js 教程里抄了 GCS 的 texture URL。
修复：程序化绘制 `CanvasTexture`，或 `generate_image` 产飞象域 URL（见 tech-details「3D 贴图铁律」）。

**C · 40 个按钮只有 1 个会响应**
现象：班级积分 40 个宠物卡片，实际只 1 个有效果。
根因：批量渲染没用事件委托、也没逐个挂 handler。
修复：父容器 `addEventListener('click', e => { const card = e.target.closest('.pet-card'); if (card) handlePet(card.dataset.id); })`。

**D · 拖拽分类题没有"检查答案"按钮**
现象：卡片可拖入分类区，拖完没下文，用户不知对错。
根因：只做"拖动+吸附"隐式交互，缺判分/提交控件。
修复：题区底部并排"检查答案"+"重新开始"；提交后用绿/红边框或 ✓/✗ 标注每张卡（对应核心机制契约·拖拽行）。

**F · 非数学误写 math-design 注释**
现象：初中物理 HTML 首行写了 `<!-- html-authoring:math-design palette=B-05 -->` 但没 read math-design。
根因：把数学交付格式套到非数学场景。
修复：删注释、改「参考配色方案」、禁 read math-design。

**E · hero 区图片被裁一半**
现象：hero 右下角主体图被卡片边界切掉一大块。
根因：图 `position:absolute;right:0;bottom:0` + 父容器 `overflow:hidden` + 图太大贴边。
修复：图宽缩到容器 30% 内 + `object-fit:contain` + 不贴边；或父容器 `overflow:visible`（见 tech-details「图片边界规则」）。

**G · 坐标系用 CSS 背景网格导致轴线错位**
现象：平面直角坐标系的 x/y 轴夹在两条方格线之间，点位标签看似在网格上但实际读数偏移。
根因：把色板里的 `linear-gradient` 背景当成数学坐标网格，轴、点、曲线另用 SVG/Canvas 坐标换算，两套 `origin/unit` 不一致。
修复：默认坐标轴场景直接删除背景方格；用户明确要求方格线/坐标纸时，按 `math-design/grid-templates.md` 生成 SVG/Canvas `grid-layer`，与轴、刻度、点、曲线共用同一 `origin/unit/scale`。

**H · 3D 立体图形用了页面平面底纹**
现象：长方体/圆柱体显示在有网格的 Stage 背景上，但网格不随相机旋转，也不能表达地面。
根因：用 CSS 背景网格伪装 3D 地面；网格不是 3D 场景对象。
修复：数学 3D 几何优先 Three.js，在 scene 内添加 `GridHelper` 或标准地面线段对象；`#stage` / renderer 背景保持纯色或色板背景。

**I · 3D 场景有 GridHelper 但肉眼看不见**
现象：源码里有 `THREE.GridHelper`，截图看起来仍是纯色舞台；旋转视角时地面可能遮挡长方体。
根因：地面和网格使用近似同色、网格 opacity 过低、地面不透明，且 OrbitControls 允许相机转到地面以下；测试只检查 canvas 存在，没有检查网格可见性。
修复：按 `grid-templates.md` 设置透明地面、较高对比度网格、`grid.position.y > ground.position.y`、`controls.maxPolarAngle < Math.PI/2`，并暴露 `window.__math3d` 供测试断言。

**J · 3D 场景视觉合格但没有模板级通过**
现象：人工目测能看到地面网格，但源码里 `grid.material.opacity` 只有 `0.3/0.4/0.5`，`controls.enablePan` 缺失或被设成 `true`，`window.__math3d` 只暴露 `hasGroundGrid`，没有暴露 `ground/grid`；甚至最后一次 `test_html` 失败后仍然发布。
根因：把 `grid-templates.md` 的 3D 参数当成建议，没有把阈值写进代码和测试；测试脚本只检查页面可见或 canvas 存在，未校验地面网格对象和控制器约束。
修复：直接复用 `createStandardGroundGrid`、`configureMath3DControls`、`exposeMath3DState` 三段模板；`test_html` 必须断言 `window.__math3d.ground/grid`、`grid.material.opacity >= 0.55`、`ground.material.opacity <= 0.25`、`controls.enablePan === false`、`controls.maxPolarAngle < Math.PI/2`。最后一次测试未通过时先修复并重跑，禁止发布。

**K · 正方体或球体在宽屏舞台里被拉伸**
现象：源码里确实使用 `BoxGeometry`、六个正方形面或 `SphereGeometry`，但截图中的正方体像长方体，球体像椭球；地面网格本身可能合格。
根因：`PerspectiveCamera(45, 1, ...)` 初始化后只给 renderer 设置了宽屏尺寸，没有在第一次渲染前同步 `camera.aspect` 与容器宽高比；只在 `resize` 事件里修正，首屏不会触发。
修复：初始化 renderer 后立刻调用 `syncMath3DViewport(camera, renderer, container)`，并在 `resize` 中复用；`test_html` 断言 `Math.abs(camera.aspect - renderer/container 宽高比) <= 0.02`，禁止标准几何体因相机比例错误产生视觉误导。
