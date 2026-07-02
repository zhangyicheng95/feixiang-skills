# 飞象生产级 Skill 深度研读 ③：`html-authoring`

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/html-authoring/`（87 文件 / ~1.5M，含 v1–v5 五代 `SKILL.md` + `references/` + `math-design/` 子目录 + 根目录平铺/CDN 版本）
> 研读方法：逐版本精读 `SKILL.md`，对比主文档结构、引用拆分、新增 references；交叉核对 `math-design/workflow.md`、`grid-templates.md`、`visual-impact.md`、`color-palettes-a/b.md`、`manipulatives.md`、`examples-and-pitfalls.md`、`tech-details.md` 与 `SKILL_v5_主文档.md`（平台打包形态）。
> 一句话核心发现：**v1→v5 的主线是「从一篇靠 LLM 自觉遵守的软规范，进化成一套机器可验证的硬契约」——把『配色/布局靠感觉』升级为 codepoint 哈希机械抽选，把『做完了吗靠自检』升级为 `<head>` spec 注释 + `window.__math3d` 探针 + `test_html` 断言闭环。**

---

## 0. 目录结构与版本快照（先建立地图）

这个 skill 不是单文件，而是「主干 + 按需附件」的多代快照堆叠，且同一份内容存在多种路径形态（这是平台投递机制留下的痕迹，理解它能避免误读为"重复文件"）：

| 形态 | 路径样例 | 含义 |
|---|---|---|
| 版本目录 | `v1/SKILL.md` … `v5/SKILL.md` | 五代主文档，迭代主线 |
| 子链路 | `v5/math-design/workflow.md` 等 | 数学专用附件（色板/坐标轴/网格） |
| 通用引用 | `v5/references/tech-details.md` 等 | 非数学技术细节附件 |
| 扁平副本 | `v5/workflow.md`、`v5/vN/workflow.md` | 平台把 `math-design/xxx.md` 扁平化为 `.../v5/xxx.md` 的同源副本 |
| 打包形态 | `SKILL_v5_主文档.md` | 真正部署体：`<skill-content>` 包裹正文 + 末尾 `<skill-files>` 给出每个附件的 **CDN URL** |
| 中文别名 | `tech-details_CDN技术细节.md`、`grid-templates_坐标网格模板.md` | 与 v5 同名文件内容一致的人读副本 |

**关键证据（CDN 版 vs 普通版的真正差异）**：`SKILL_v5_CDN版.md`、`SKILL_v5_CDN.md` 与 `v5/SKILL.md` 三者正文**逐字相同**；唯一带"CDN 实体"的是 `SKILL_v5_主文档.md`，它在正文后挂了一张表：

```
| color-palettes-a.md | https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/html-authoring/v5/color-palettes-a.md |
| grid-templates.md   | https://musk-online.fbcontent.cn/.../v5/grid-templates.md |
...（workflow / visual-impact / manipulatives / tech-details / examples-and-pitfalls）
```

> 所谓"CDN 版"并不是另一套规则，而是**同一规则的投递形态**：正文内联进 system prompt，附件以 CDN URL 形式声明，Agent 运行时按需 `read_url`。这正解释了 SKILL 里反复强调的 "math-design 子文件用 `<skill-files>` 表的 CDN `read_url`，禁自拼路径" —— 因为路径会被平台扁平化（`math-design/workflow.md` → `vN/workflow.md`），硬编码路径会读空。

---

## 1. 设计思路：它在解决什么问题

### 1.1 核心问题：让 LLM 稳定产出"能用"的高质量交互 HTML

飞象的业务是 K12 教学内容生成，`html-authoring` 的服务场景非常明确（v1 frontmatter）：

> 「生成或修改单页教学交互 HTML（动画、单页课件、教学海报、教学网页、可打印练习册/字帖）……不适用于多页 PPT 课件、纯知识问答。」

它要对抗的不是"不会写 HTML"，而是 LLM 写 HTML 时**反复犯的同一批工程级劣化**。整套 skill 本质是一份「LLM 生成 HTML 的缺陷防御清单」，每条规则都对应一个真实事故（v1「典型错误案例」A–E 即把事故固化成规则）：

- **空壳化**：`<body>` 只渲染"演示"二字 + 一堆空 SVG，因为代码写了 `data.content.items.map(...)` 却没注入 `data`（案例 A）→ 催生「自包含/禁模板占位符」规则。
- **空按钮**：40 个宠物卡片只有 1 个能点（案例 C，没用事件委托）→ 催生「事件绑定完整性」。
- **断头闭环**：拖拽分类题做完没有"检查答案"，用户不知对错（案例 D）→ 催生「互动答题状态反馈」。
- **外站资源 CORS 失败**：抄 Three.js 教程里的 GCS 贴图 URL（案例 B）→ 催生「媒体白名单」。
- **图片半截裁切**：hero 主体图被 `overflow:hidden` 切掉（案例 E）→ 催生「图片容器边界规则」。

### 1.2 核心设计理念

1. **软约束硬化**：不只说"应该"，而是给**触发词表 + 必含控件 + 禁止替代方案**三件套。例如「交互粒度保留原则」的判断口诀：
   > 「用户用『可以 A，也可以 B，还可以 C』这种枚举句式 → A/B/C 就是三个控件，不是一个控件的三个可能值。」
2. **UI 承诺 ≡ 功能实现**：贯穿全程的最高纪律——"提示文字说能拖拽，就必须真能拖拽；做不到就改文字"，杜绝"嘴说拖拽手做滑块"。
3. **反"能 demo 就交付"**：把验收从"跑起来不报错"提升到"逐条对照用户原文"。
4. **决策有先后**：固定的决策序——产物形态分流 → 内容组织模式（决定骨架）→ 配色 → 布局 → 排版 → 动画 → 交互粒度，避免 LLM 跳步。
5. **禁止 `ask_user`**：需求模糊时按教学经验取默认继续，并在回复里声明假设——这是飞象工程化产线对"一次成型"的硬要求。

### 1.3 关键抽象（这套 skill 的"发明"）

| 抽象 | 作用 | 出现版本 |
|---|---|---|
| **设计令牌** | `primary/secondary/accent/background/foreground` 5 个 CSS 变量统一配色，禁整页硬编码 | v1 |
| **内容组织模式** | 用"总信息量"决定骨架（单页 / Tabs / Accordion / 组合），反"摊平成长滚动页" | v1 |
| **CDN 白名单** | 常用库只许用飞象自定义 CDN，未列库才用公共源，禁幻觉库 | v1（内联）→ v2（外移 system prompt） |
| **媒体白名单** | 只许飞象域 URL + 程序化图形，禁 base64、禁外站、禁编造文件名 | v1 |
| **学科路由** | 数学 vs 非数学双链路分流（math-design / 通用） | **v3** |
| **机械抽选** | codepoint 哈希决定色板与布局，去除 LLM 主观挑色 | **v3** |
| **核心机制契约 (DoD)** | 动手前先声明"最小可玩闭环"作为完成标准 | **v4** |
| **验收 spec 注释** | `<head>` 里写机读 spec，供 `test-html` 回读机检 | **v4** |
| **3D/网格探针** | `window.__math3d.ground/grid` + 硬阈值 + `test_html` 断言 | **v5** |

---

## 2. 迭代路线（重点）：v1 → v5 演进

### 2.1 版本对比总表

| 维度 | v1 | v2 | v3 | v4 | v5 |
|---|---|---|---|---|---|
| **主文档形态** | 单体大文档（~530 行），全部规则内联 | 同 v1 | 单体更大（~610 行），插入学科路由 | **拆分**：主干瘦身到 ~155 行，细节外置 references | 同 v4 结构，主干 ~156 行 |
| **CDN URL** | **内联在 skill 内**（给出 7 条 `metis-online.fbcontent.cn` 实址） | **外移**到 system prompt「外部库 CDN 白名单」 | 同 v2 | 同 v2 | 同 v2 |
| **学科路由** | 无（数学=橙紫，混在通用配色里） | 无 | **新增**：数学→math-design / 非数学→通用，第 0 步最先判定 | 保留并强化（表格化 + 优先级） | 保留 |
| **配色决策** | 5 套"参考配色"主观挑 | 同 v1 | 数学走 31 套 A/B 色板**机械抽选**（查表+哈希）；非数学仍 5 套 | 同 v3 | 同 v3 |
| **完成标准** | 「需求落实度自检」清单（人脑走查） | 同 v1 | 同 v1 + Phase 5 首行 palette 注释硬约束 | **核心机制契约**（DoD）+ **验收 spec 注释**（机读） | 同 v4 + 3D/网格机器断言 |
| **math-design 子文件** | — | — | workflow + color-palettes-a/b + visual-impact（4 个） | +manipulatives（标准坐标轴）= 5 个 | +grid-templates（网格/点阵/3D 地面）= 6 个 |
| **机器验证** | 无 | 无 | 无（仅注释自检） | 引入 `task_write.spec` 跨轮记忆 | **`test_html` 断言闭环**：`window.__math3d` 探针 + 硬阈值，未过不许 `publish_resource` |
| **典型错误案例** | A–E（5 个） | A–E | A–F（+非数学误写注释） | A–F | **A–K**（+G 网格错位 / H 3D 平面底纹 / I GridHelper 不可见 / J 阈值没写进测试 / K 相机 aspect 拉伸） |

### 2.2 逐代关键变化与动机

**v1 → v2：把 CDN 地址从 skill 抽到 system prompt（去重 + 集中维护）**
v1 在 skill 内直接给出 7 条自定义 CDN 实址（如 `Anime.js 3.2.1 → https://metis-online.fbcontent.cn/metis-misc/zZZY...js`）。v2 改写第 4 条技术约束：
> 「常用库的自定义 CDN URL 由 System Prompt『HTML 产物硬约束 → 外部库 CDN 白名单』统一规定，必须直接复用……本 skill 只负责说明单页 HTML 场景的注入位置与加载规则。」
**动机**：CDN URL 是多个 skill（含 courseware）共享的资产，内联会版本漂移；外移到 system prompt 单点维护，skill 只管"放 `<head>`、Tailwind 优先"这类落点。**这是"职责边界"的第一次澄清。**

**v2 → v3：引入「学科路由」+「机械抽选」（最大的一次范式跃迁）**
v3 在工作流插入"第 0 步：学科路由"，并把 frontmatter 改写，明确 "K12 数学单页 HTML 内置 math-design 子链路（31 套 A/B 色板、H1=40px、按钮 80px）"。
- **为什么分流**：数学课件有强烈的统一视觉规范诉求（大字号、一屏布局、固定教具色），通用配色满足不了；但又不能让物理/语文误用数学规格——于是用"非数学学科前缀最高优先级"的命中即停判定来隔离。明确反例（案例 F）："初中物理 HTML 首行写了 `<!-- html-authoring:math-design palette=B-05 -->` 但没 read math-design" → 删注释、禁 read。
- **为什么机械抽选**：LLM 主观挑色会塌缩到"安全色"（总选 A-01/B-12），导致产出同质化。v3 用 codepoint 哈希强制分散：
  ```
  hash = ord(keyword[0])×7 + ord(keyword[-1])×5 + len(prompt)
  palette_id = X-{(hash mod N)+1:02d}
  layout = (ord(keyword[0]) + len(prompt)) mod 3  → L1底栏/L2左栏/L3右栏
  ```
  并要求"优先查表（30 个常见知识点预设 palette）→ 未命中走哈希"，且推理中必须显式输出 `keyword/pool/source/palette_id` 四项。`workflow.md` 反复强调："A-01 居首、B-12 居中**仅是索引**，与命中概率无关……严禁基于『示例用过 X』『太常见』跳号。"
- **首行注释硬约束（Phase 5）**：数学 HTML 第一行必须是 `<!-- html-authoring:math-design palette=<id> layout=<L1|L2|L3> -->`，缺则 `edit_file` 补上才许 `terminate`；非数学首行必须是 `<!DOCTYPE html>` 且禁含该注释。**这是第一个"机器可 grep 的交付指纹"。**

**v3 → v4：主干瘦身 + 引入「契约」与「机读 spec」（从规范到工程协议）**
- **结构重构**：v3 的单体 610 行被拆成「决策与纪律」主干（155 行）+ `references/tech-details.md`（3D/CDN/前缀/动画 API/图片边界/参考配色/媒体白名单）+ `references/examples-and-pitfalls.md`（完整示例 + 错误案例）。主干顶部用引文导航："本文是『决策与纪律』主干……都按需读取，不要凭记忆默写。"
  - **动机**：渐进式披露（progressive disclosure）。常驻 prompt 只保留"必须先决策的纪律"，把"用到才查"的踩坑细节下沉为附件，**降低常驻 token、提高指令遵从密度**。
- **核心机制契约（反空壳总纲）**：把分散的"模拟器三按钮""答题判分""空按钮"统一抽象成 Definition-of-Done：
  > 「游戏/答题/模拟器/互动演示/计算器……动手写代码前先声明该产物的『最小可玩闭环』，当作做完的硬标准……只做外壳（有 UI、无核心闭环）= 失败交付。」
  并给品类闭环表（如 24 点必须有"可点击的 +−×÷ 并参与计算"）。硬约束三连：①未声明契约→不得 `create_file`；②每环节代码真实实现；③未全落地→不得 `terminate`。
- **验收要点 spec（所有产物必做）**：在 `<head>` 写一行机读注释，供 `test-html` 回读：
  ```
  <!-- spec: requirements=...; forbid=...; require=audio,POST-to-URL,28px; count=N; core-loop=... -->
  ```
  并要求同步写入 `task_write` 的 `spec` 字段"跨轮抗压缩"。**这是把"验收"从人脑自检升级为机器可读契约的关键一跃。**
- **manipulatives.md**：math-design 新增"标准二维坐标轴"教具（固定 `viewBox="0 0 308.0001 308.0001"`、固定教具色 `#251F20`、x/y 字母必须与轴同属一个 SVG），解决坐标轴渲染漂移。

**v4 → v5：网格纪律 + 3D 可测试硬阈值（机器验证闭环成型）**
- **grid-templates.md**：新增 SVG/Canvas 网格、点阵纸、单位正方形拼图、Three.js 3D 地面网格模板。核心纪律是用 `grid_intent` 六分支精确区分"要不要画网格"：
  > 「『点坐标/读坐标/展示点位置』不等于要求网格，禁止生成 `grid-layer/.grid-line/renderGrid()`……CSS `background-image`/`linear-gradient` 网格只允许作非测量装饰，不能承担读数、定位或吸附。」
  并要求网格与点、线、轴共用同一 `origin/unit/scale`（原点必是网格交点，轴落在网格线上，容差 ≤0.5px）。
- **3D 硬阈值（最能代表 v5 范式的部分）**：数学 3D 场景必须暴露 `window.__math3d.ground/grid`，且满足可被 `test_html` 断言的数值门槛：
  > `grid.material.opacity >= 0.55`、`ground.material.opacity <= 0.25`、`controls.enablePan === false`、`controls.maxPolarAngle < Math.PI/2`、`Math.abs(camera.aspect - renderer/container 宽高比) <= 0.02`，**且最后一次 `test_html` 通过后才发布**。
  配套给出 `createStandardGroundGrid` / `configureMath3DControls` / `exposeMath3DState` 三段可直接复用的模板，并明确"把阈值当建议"就是失败（案例 J）。
- **错误案例扩到 K**：G（CSS 背景网格导致轴错位）、H（3D 用页面平面底纹）、I（GridHelper 肉眼不可见）、J（阈值没写进测试就发布）、K（相机 aspect 错误把正方体拉成长方体）——全部是"看起来对、机器测不过"的隐蔽劣化。

### 2.3 references 拆分的演进逻辑

| 代 | math-design 子文件 | references（通用） | 拆分逻辑 |
|---|---|---|---|
| v1/v2 | 无 | 无（全内联） | 单体，规则越堆越长 |
| v3 | workflow + color-palettes-a/b + visual-impact | 同样 4 件（镜像） | 先把"数学专属"独立成链路 |
| v4 | +manipulatives | tech-details + examples-and-pitfalls + 上述 | 主干只留纪律，技术细节/示例下沉 |
| v5 | +grid-templates | +grid-templates | 新能力（网格/3D）以"按需附件"加载，不污染主干 |

**拆分主线**：从"全部内联"→"数学独立链路"→"主干/细节分层"→"新能力即插即用附件"。每一步都在**压缩常驻 prompt、保持核心纪律密度**，同时让附件可独立迭代、可被 CDN 单点更新。

---

## 3. 功能边界：能约束什么、约束不了什么

### 3.1 它能稳稳约束的（强项）

- **可 grep 的交付指纹**：首行 palette 注释、`<head>` spec 注释、`window.__math3d` 探针——这些都是字符串/对象级可机检的硬证据。
- **配色与布局的"去主观化"**：codepoint 哈希 + 查表把"挑色挑布局"变成确定性函数，可复现、可校验一致性（注释 vs 推理声明必须一致）。
- **资源安全红线**：媒体白名单 + CDN 白名单是黑名单式硬禁（GCS/AWS/unsplash/raw.githubusercontent/编造文件名全禁），违例即可静态扫描出。
- **结构完整性**：自包含（禁 `{{}}`/`${data.x}`/TODO）、事件绑定、提交/判分控件、模拟器三按钮——都对应可检测的 DOM/JS 模式。
- **3D 几何正确性**：v5 把"看着对"升级成"opacity/aspect/polarAngle 数值达标"，杜绝了视觉合格但比例失真。

### 3.2 它约束不了 / 留有缝隙的（软规范的局限）

- **语义正确性无法保证**：spec 注释能机检"有没有 POST-to-URL、是不是 28px、几页"，但**检不了教学内容是否讲对**（勾股定理证明是否严谨、题目答案是否正确）——这超出 HTML 工程范畴。
- **"机械抽选"的可执行性依赖模型自律**：哈希要靠 LLM 心算 `ord()` 与取模，模型完全可能算错或偷懒直接落 L1/A-01；skill 只能用"必须显式输出 4 项 + 注释一致"来事后抓，**抓不住"算对了但配色其实不好看"**。
- **`grid_intent` 判定是自然语言推断**：六分支靠 LLM 读用户原文区分"点坐标"vs"借助方格读点"，边界模糊时容易误分（要么多画网格、要么该画不画）。
- **依赖外部工具链**：核心闭环靠 `test_html` / `task_write` / `publish_resource` 等运行时工具，前置条件写明"以运行时实际工具清单为准"——**工具不可用时，所有"机器验证"退化回"自觉自检"**。
- **跨轮记忆脆弱**：v4 用 `task_write.spec` 对抗"长对话上下文压缩丢失需求"，但这只是缓解；spec 写漏一条，后续就检不出。
- **双链路隔离靠前缀词表**：学科路由的"非数学学科前缀最高优先级"是关键词匹配，遇到跨学科（如"数学建模物理情境"）可能误判。
- **首行注释的脆弱性**：palette 注释必须是"第一行、在 `<!DOCTYPE html>` 之前"，任何工具/格式化把它移位或删除，机检指纹即失效。

### 3.3 假设前提

1. 产物是**单页自包含 HTML**（多页 PPT 归 `courseware-*`）。
2. 目标浏览器 **Chrome ≥ 63**（故强制 `-webkit-` 前缀、`box-shadow` 免前缀）。
3. 运行环境有飞象工具集（`generate_image/generate_voice/create_file/read_url/test_html/...`）。
4. 媒体资源都能在 `musk-test.fbcontent.cn` 环境访问。
5. CDN URL 由 system prompt 统一供给（skill 不再内联）。

---

## 4. 工程启发：对 ClassIn 互动内容生成的借鉴与警惕

### 4.1 可直接借鉴

1. **"交付指纹"模式 = 让生成物自带可机检契约**
   首行 palette 注释、`<head>` spec 注释、`window.__xxx` 探针，本质都是"让 LLM 把自己的设计决策以机器可读形式写进产物"。ClassIn 做互动课件/小工具时，强烈建议引入类似的 **spec 注释 + 生成后 `test_html` 回读**闭环——把"验收"从人审变成 CI 式断言。这是这套 skill 最值得抄的工程范式。

2. **"机械抽选"对抗同质化**
   LLM 默认会塌缩到安全选项（总用蓝色 `#3B82F6`、总用居中卡片）。用 `hash(关键词) → 配色/布局编号`的确定性映射，既保证多样性又可复现。ClassIn 若有"批量生成不同班级/学科的互动卡片"诉求，这种伪随机分散非常实用。注意配套要求："推理中显式输出抽选四项 + 产物注释与之一致"，否则模型会跳号。

3. **核心机制契约（DoD 前置）**
   "动手前先声明最小可玩闭环，做不到不许交付"——把"空壳"扼杀在编码前。对 ClassIn 的互动题/小游戏生成，建议固化品类闭环表（选择题：出题→作答→判分→反馈→下一题；拖拽：可拖→判定→提交→反馈→重置），并把"未声明契约不得创建文件"作为硬门。

4. **渐进式披露的文档架构**
   主干只放"必须先决策的纪律"，细节下沉为 `read_url` 附件，CDN 单点维护。ClassIn 的 prompt/skill 体系若膨胀，应学 v4 的拆分：**决策纪律常驻、技术踩坑按需加载、共享资产（CDN/令牌）集中声明**。

5. **资源白名单 + 反幻觉**
   "只许白名单域、禁编造文件名/库名、宁用已有库组合也不引幻觉库"——对任何让 LLM 写代码的产线都是必备防线。ClassIn 应建立自己的素材域/CDN 白名单与静态扫描。

6. **设计令牌统一配色**
   强制 5 个 CSS 变量、禁整页硬编码——保证可一键换肤、保证修改场景"只改令牌不重写"。

7. **"UI 承诺 ≡ 功能实现"作为最高纪律**
   这是对抗"演示型幻觉"（提示写能拖拽实际是滑块）的根本原则，应写进 ClassIn 任何交互生成的验收标准。

### 4.2 要警惕的点

1. **机器验证只覆盖"工程正确"，不覆盖"教学正确"**
   spec/探针检不出知识错误。ClassIn 必须**另设内容正确性校验层**（题库比对、学科审校），不能误以为"测试通过=可上线"。

2. **哈希/阈值靠模型自律执行，需"双保险"**
   `ord()` 心算、opacity 阈值，模型会算错或敷衍。建议把这类确定性计算**移出 prompt、交给真实代码/工具执行**（生成时由后处理脚本注入正确 palette/aspect），而非指望 LLM 每次算对。飞象自己也是用 `test_html` 兜底，说明仅靠 prompt 不够。

3. **规则膨胀的维护成本**
   v3 单体 610 行已接近模型注意力极限；v5 即便拆分，math-design 全量也很重。ClassIn 引入此类清单时要警惕"规则越加越长、遵从率反降"，必须配渐进披露 + 定期裁剪冗余。

4. **首行/注释指纹的脆弱性**
   依赖"第一行精确字符串"做机检，任何格式化都可能破指纹。若 ClassIn 采用，建议指纹冗余化（多处埋点 + 容错解析），别只押一行。

5. **强场景耦合**
   31 套色板、H1=40px、按钮 80px、`viewBox=308.0001` 这些是飞象 K12 数学的**领域常量**，不可照搬到 ClassIn 其它学段/形态；要借鉴的是"机械抽选 + 固定规格 + 机器验证"的**方法**，而非具体数值。

6. **CDN 外移的双刃**
   把 CDN URL 移到 system prompt 利于集中维护，但也意味着 skill 与 system prompt 强耦合——脱离飞象运行时，skill 单独不可用。ClassIn 设计共享资产边界时要权衡"可移植性 vs 单点维护"。

---

## 附：贯穿全代的不变内核（无论怎么迭代都没动的底线）

- **媒体白名单**（飞象域 + 程序化图形，禁 base64/外站/编造）——v1 至 v5 一字未松。
- **自包含**（禁运行时模板占位符，数据字面量写死）。
- **事件绑定完整性 + UI 承诺≡功能**。
- **MathJax 3 定界符**：行内 `\(...\)`、块级 `\[...\]`，严禁 `$...$`/`$$...$$`。
- **内容组织模式**（Tabs/Accordion，反摊平长滚动）。
- **交互粒度保留**（枚举=多控件，反扁平化）。
- **Chrome≥63 + `-webkit-` 前缀 + 卡片默认无投影**。
- **禁 `ask_user`，模糊取默认 + 声明假设**。

> 这些是"无论模型多强都会犯"的工程劣化防线；五代演进始终围绕它们加固，只是验证手段从"自检清单"一路硬化到"机器断言"。
