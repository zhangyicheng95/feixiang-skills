---
name: math-design
description:数学单页互动 HTML 视觉设计规范。生成或修改任何 K12 数学教学动画、互动课件、算理演示、几何可视化、统计概率、方程函数等单页 HTML 时必须启用；含「互动设计」「习题配置」「三维展示」「闯关游戏」等 prompt 结构亦必须启用。按学段选色：小学1-6→活力高饱和A系，初中高中7-12→智性低饱和B系；统一 H1=40px、布局与安全区。触发词：教学动画、互动课件、算理演示、数形结合、三维展示、单位进率、相遇问题、乘法口诀、时分秒、面积周长、平均数、质数合数、平移旋转轴对称、勾股定理、全等三角形、圆面积周长、圆柱圆锥、表面积展开图、阴影面积、排水法、比例尺、鸡兔同笼、植树问题、平方根立方根、一元一次方程、方程组消元、不等式、因式分解、一次函数、二次函数、分式方程、平行线、坐标系、垂径定理、圆周角、锐角三角函数、诱导公式、等差数列、概率转盘、等腰三角形三线合一、立体几何结构特征。不适用于：多页PPT课件、纯文字答疑无HTML、非数学学科。启用后随机选1套色板（禁止固定A-01），仅读 color-palettes-a.md 或 color-palettes-b.md 对应编号段落及 visual-impact.md，禁止全量加载31套。
---

## 文件导航

| 文件 | 用途 | 何时读取 |
|---|---|---|
| **SKILL.md**（本文件） | 工作流 + 视觉/布局/字号 | **首先读取** |
| [color-palettes-a.md](color-palettes-a.md) | A-色彩01~11 活力高饱和 | Phase 3 选定 A 编号后，**仅读该编号段落** |
| [color-palettes-b.md](color-palettes-b.md) | B-色彩01~20 智性低饱和 | Phase 3 选定 B 编号后，**仅读该编号段落** |
| [visual-impact.md](visual-impact.md) | 图示视觉强化协议 | Phase 4 编写演示区前 |

## 四、色彩选用工作流（Color Selection）

> 依据石墨测试《数学案例·色彩skill应用效果测试（4.22）》：54 案例中 skill 命中率约 50%，命中后 25 套色板仅用到 6 种且高度重复 A-01。以下流程强制执行以提高 **skill 命中率** 与 **色彩命中率**。

```
Phase 1 ┃ 场景判定 → 必须启用
  - 数学 + （教学动画 / 互动课件 / HTML / 三维演示 / 闯关 / 算理 / 几何 / 方程 / 函数 / 统计 / 概率）
  - prompt 含「互动设计」「习题配置」「三维展示」「呈现形式」等批量测试结构
  - 纯多页 PPT、纯文字无 HTML → 不启用

Phase 2 ┃ 学段判定 → 选择 pool
  - 小学 1-6 年级 / 低段算术几何 → pool A（11 套）
  - 初中 7-9 / 高中 10-12 / 代数·函数·三角·数列 → pool B（20 套）
  - 年级未明示：按知识点难度推断；仍不确定 → 默认 pool B

Phase 3 ┃ 随机选 1 套（⚠️ 禁止固定 A-01 / B-01）
  - 从 pool 均匀随机 1 个编号（A-01~A-11 或 B-01~B-20）
  - 禁止连续默认第一套；禁止因 prompt 熟悉而跳过随机
  - 过程输出标注 palette_id（如 A-07 / B-12）

Phase 4 ┃ 按需读取（禁止全量加载 31 套）
  - pool=A → read color-palettes-a.md 中 `####A-色彩XX` 整段
  - pool=B → read color-palettes-b.md 中 `#### 色彩B-XX` 整段
  - read visual-impact.md

Phase 5 ┃ 字号自检（石墨测试：15/25 命中案例 H1 字号错误）
  - H1 必须 40px / font-weight:700 !important（见第三节）
  - 禁止用 42px 或其他值覆盖第三节 H1 规范
```

## 一、 视觉硬性要求 (Visual Identity)
- 可视区域参考比例：16:7，优先一屏展示所有交互，当内容超过可视区域时，建议通过以下方式解决：
   - Step Navigation（步骤切换）
   - Card Tab 切换
- 允许纵向滚动（必要时）
- 演示图示部分必须通过色彩填充保持视觉冲击力，需要读取色彩方案配置 (Color Palettes)
- 必须调用我的色彩方案配置页面
- 按照我的字号系统设计页面
- 按钮统一高度：80px
- 页面采用“安全高度设计”（safe area）
- grid 仅用于模块，不用于锁死整体高度
- 禁止文字前放Emoji表情符号，如果涉及具体元素生成，必须使用svg图形绘制，图形也需要符合色彩要求，符合极简几何图形/插画设计要求。

---

## 二、 布局硬性约束 (Visual & Layout Constraints)

- **一屏优先级 (Single-Screen Priority)**：
  - AI 应以“不产生全局滚动条”为最高目标规划内容密度。
  - **布局公式**：Container(flex) = Header(fixed) + Stage(flex-grow: 1 + overflow-y: auto) + Controls(flex-shrink: 0).
  - **核心意义**：确保标题和按钮始终在首屏，仅让中间的演示内容在必要时提供局部滚动。
- **弹性字号保护**：
  - 默认 H1 为 42px。当内容检测到可能触发滚动时，优先通过 `clamp(30px, 5vh, 42px)` 缩小字号，而非直接溢出。
- **安全边界**：
  - 底部按钮（80px）上方必须保留 `20px` 的固定间距，防止内容与交互组件粘连。

---

## 三、字号系统（Typography）(必须严格要求)

- H1 = 40px / font-weight: 700 !important** (必须确保权重，防止被框架覆盖)
- H2 = 30px / font-weight:600
- H3 = 28px / font-weight:500
- Body = 28px/ font-weight:500
- Caption ≥ 22px/ font-weight:300
- 按钮字号 = 28px/font-weight:500

---

## 五、 色彩方案配置 (Color Palettes)

色板明细已拆分至独立文件。**按 Phase 3 选定的 1 个编号按需读取**，禁止遍历全部 31 套方案：

- 小学 pool → [color-palettes-a.md](color-palettes-a.md)
- 初高中 pool → [color-palettes-b.md](color-palettes-b.md)
- 图示视觉强化 → [visual-impact.md](visual-impact.md)
