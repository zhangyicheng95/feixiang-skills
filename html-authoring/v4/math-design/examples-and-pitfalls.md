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
