# 10 · stroke-animation（汉字笔顺动画 / 严格跟练）深度分析

> 研读对象：`02_Feixiang_Research/skills/飞象Skills/stroke-animation/v1/`
> 文件：`SKILL.md`（535 行，v1.7.5）、`CHANGELOG.md`（322 行，v1.0→v1.7.5）、`templates/animation-loader.js`（3252 行 / ~132KB，生产级单文件 loader）、`templates/animate-demo.html`（双模式 demo）、`templates/trace-prod.html`、`templates/validate-demo.html`、`templates/stroke-data.json`（645KB，笔画名兜底）、`templates/stroke-path.json` + `assets/stroke-path.json`（各 7.7MB，字形几何）。
> 几何 JSON 仅看 schema，未整读巨型数据。

---

## 1. 设计思路

### 1.1 数据/渲染分层：与 stroke-order 严格分工

SKILL.md 第一句就定了分工（`SKILL.md` L8）：**数据层（笔画名）走 `stroke-order`，渲染层（动画/手写）走 `stroke-animation`，两者必须同时加载**。第九节「与 stroke-order 的协同」给了职责矩阵（L462–478）：

| 职责 | stroke-order | stroke-animation |
|---|---|---|
| 笔画数 / 笔画名 / tier | ✅ 唯一来源 | ❌ |
| `<stroke-card>` 文字卡片 | ✅ | ❌ |
| 字形 SVG path / medians 中线 | ❌ | ✅（私有，不暴露） |
| 田字格 / 笔顺动画 / 跟练评分 | ❌ | ✅ |

本 skill 通过 `window.getStrokeData()` 取笔画名，**path 数据完全封装在内部**，禁止访问 `.path`/`_path`/`getCharPath`（核心原则 L25–30）。

### 1.2 两套互不相通的 API：`animate()` 看 vs `mount()` 写

整个 skill 围绕"一句话决策两套 API"（L10–22）：

- **`StrokeTrace.animate()`**——仅观看，自动连播：金色虚拟笔尖沿 median 滑动 + ✍️ 握笔 emoji + 蓝色发光墨迹 + 32 笔画硬笔提示语 + 控件栏。覆盖"看怎么写/笔顺动画/写字指导/生字描红"等**高频默认**意图。
- **`StrokeTrace.mount()`**——手写 + DTW 评分 + 三星 + 错笔强制重写 + 作品感圈点。仅"学生手写/手写评分/错笔纠正/练字游戏"等**明确强交互**意图才用。

两 API **参数集不互通**，严禁互传（严禁清单 #9/#10，L457–458）。这是 v1.7.5 的 P0 路由拆分：早期把"练字/描红/田字格"全路由到 `mount()`，但真实课件里描红页通常只要动画，所以默认改回 `animate()`（`CHANGELOG.md` v1.7.5 根因 L10–12）。

### 1.3 "数据不可信，全部走 API + 校验"的防幻觉哲学

与 drag-interaction 同源的价值观——LLM 不可信：严禁硬编码 SVG path、禁三方库（HanziWriter/cnchar-draw）、禁自造 `<svg><path>`、禁在 `stroke-anim-ready` 事件前调用（严禁清单 8 条，L447–460）。用户输入字必须先 `validate()`/`validateAll()` 校验，返回结构化 `{ok, reason, tier, suggestion}`，`ok:false` 走降级到 `<stroke-card>`（第七节 L422–443）。

### 1.4 评分内核：DTW + Sakoe-Chiba 约束窗

`animation-loader.js` 内含自研 DTW（动态时间规整，L31–96）：用户手写轨迹 vs 标准 medians 做形状相似度比对，对长度/速度不一致友好；用 Sakoe-Chiba 窗 `w=N/5` 把 O(N²) 压到约 O(N·N/5)，单笔 50×50 点约 50µs。无外部依赖，纯算法层。

---

## 2. 迭代路线（CHANGELOG 实证，v1.0 → v1.7.5）

| 版本 | 关键改进（教学/API 影响） |
|---|---|
| v1.0（04-16） | 生产级单文件 loader，2,842 字全覆盖，32 算法层单测 |
| v1.1 | `autoAdvance` 顺滑书写（写完一笔自动跳 700ms）；对齐 stroke-order v57 |
| v1.2 | `validate()`/`validateAll()` 输入校验 + Prompt 路由表 |
| v1.3 | 正反馈四件套：进度条 + 完美笔金色闪光 + 连击徽章 + 整字烟花 |
| v1.4 / v1.4.1 | Watch Mode 写前示范（金色笔尖 + ✍️ 握笔）+ 32 笔画口诀 + 📹 按需示范；autoPlay 默认改按需 |
| **v1.5** | ★ 新增 `animate()` 仅观看 API（与 mount 完全独立） |
| **v1.6** | ★ 错笔强制重写（`scoring.passStars`/`failHoldMs`）+ 整字"作品感"（衬底淡出） |
| v1.6.1 | 32 笔画提示语**全面去毛笔术语**，换小学硬笔语文版（"从左往右写，基本写平"替"侧锋顿入"） |
| **v1.7 / v1.7.1** | ★ 圈点系统："老师批改习字本"——3 星笔画红色手绘圈表扬 + "改正成功"鼓励；v1.7.1 重构为 **PCA 定向椭圆**（横扁长/竖细高/撇捺斜倾，rx≤380 ry≥42）+ 红圈延迟 800ms（先看清自己的字再被圈）+ ★ 五角星表扬章 |
| **v1.7.2** | ★ 教材字表补丁 textbook-patch-v1：补齐 23 个小学低段核心字（六/七/八/十/千/工/父/牛/羊…），**2,842 → 2,865** |
| v1.7.3 | 防旧版 CDN 回退（旧 v3 loader 含书法化提示语）；加 CDN 合约回归测试 |
| v1.7.4 | animate 回调新增 `strokeIndex`(0基)/`strokeNo`(1基)，明确旧 `index` 为 1 基；禁完整组件塞进固定 320px+overflow hidden |
| **v1.7.5** | ★ P0 路由拆分（描红默认 animate）+ test/online CDN 发布策略（`publish.sh` 按 `TARGET_ENV` 渲染，防 online 包引用 musk-test） |

**迭代规律**：早期补"能力"（动画/评分/正反馈），中后期全是**教学正确性 + 工程发布纪律**：去书法术语（小学硬笔语境）、防 CDN 回退、修索引基准歧义、字库补丁。v1.7.2 补丁尤其典型——根因是上游 CSV 漏列 23 字导致下游三级传染（`stroke-data.json` textbook_chars → stroke-order tier → distill 蒸馏），但笔顺/几何其实都在库里，只是字段没圈选（`CHANGELOG.md` L66–96）。

---

## 3. 功能边界

### 3.1 字库分层（硬边界）

- **2,865 教材字（tier=textbook）**：唯一可 `mount`/`animate` 的范围。小学场景必须过滤 `tier!=='textbook'`（严禁 #7）。
- extended（小学范围外）/ 生僻字（超 7818）：走降级 `<stroke-card>` 文字卡，不调动画。

### 3.2 ★ 数据一致性隐患（实证）

本快照里 **stroke-animation 的 `templates/stroke-data.json` 已是 `textbook_count:2865`**（v1.7.2 补丁后），而**同目录 `stroke-path.json` 元数据为 `total_textbook:2865, covered:2865`**——两者一致。但**对照 11 号报告的 stroke-order**：stroke-order 的 `stroke-data.json` 仍是 `textbook_count:2842`、`generated_from` 不含 `textbook-patch-v1`。即**这份快照里两个 skill 的教材字表存在 2842/2865 的版本错位**，与 CHANGELOG 声称"stroke-order 同步发布"（L117）不符。生产部署时需校验两 skill 的 `textbook_chars` 一致，否则会出现"animate 能播但 stroke-card 标 extended"的矛盾。

### 3.3 布局/组件边界

`animate()` 注入的是**完整组件**（笔提示 + 硬笔提示 + 田字格 + 控件栏 + 状态消息），不是裸 320px 画板。SKILL.md L245 立"布局硬规则"：禁固定 320px + overflow hidden（会裁掉字形下半 + 控件栏），需 `min-height:430px` 或自适应；只要裸画板必须同时关 `showHint/showStrokeTip/showControls`。

### 3.4 坐标系

`stroke-path.json` schema：`viewbox:[0,0,1024,1024]`，`y_axis:"up"`，`flip_to_svg: y_svg=900-y_orig`。每字含 `strokes[]`（SVG path 字符串）+ `medians[][]`（中线点序列，评分/动画轨迹用）+ `stroke_count`。

---

## 4. 工程启发（对 ClassIn 互动内容生成 + 数据回收）

### 4.1 ★ 数据采集判断：结构化程度高，但"只到回调、不出页面"

**结论：stroke-animation 的作答数据是四个 skill 里结构化程度最高的——逐笔 DTW 距离、三星、通过与否、原始手写点序列都齐——但同样止步于 JS 回调，没有任何外发通道。** 证据（`animation-loader.js`）：

- **逐笔结果对象极其丰富**（`_onStrokeEnd`，L1631–1648）：`scoreStroke()` 产出后追加 `result.userPts`（原始手写点序列 slice）、`result.strokeName`、`result.index/strokeIndex/strokeNo`、`result.stars`、`result.passed`、`result.errors`（偏差段 startUserIdx/endUserIdx）。这是可直接入库的高价值学情数据。
- **整字结果**（`_finish`→`onFinish`，L1841–1849）：`{ char, strokes（全笔结果数组）, finalScore, finalStars, combo }`。
- **但全 loader grep `postMessage`/`window.parent`/`localStorage`/`report` 均无命中**；唯一的 `dispatchEvent` 是加载完成的 `stroke-anim-ready` 系统事件（L1068–1079）。即**数据只暴露在 `onStrokeComplete`/`onFinish`/`onStrokeStart` 回调里，必须由生成页自行接管**。demo（`animate-demo.html`）也确实没接这些回调——数据生成了，但无人收。

**对 ClassIn 数据闭环的启发：**

- **这是最易改造成数据回收的 skill**：回调已经把"每一笔写得怎么样"结构化到位，只需在 `mount()` 的 `onStrokeComplete`/`onFinish` 里统一 `postMessage` 给壳，即可拿到**笔画级**学情（哪一笔反复写错、几星、重写几次——`_strokeRetries[i]` 也已维护，L1665）。比拖拽/选择题的"对错二值"细得多，是写字课最有价值的过程性数据。
- **`userPts` 原始轨迹**可支撑回放/二次评分/教师批注，建议采集时按需采样压缩（整字几十笔×几十点），别整发。
- **隐患同 drag-interaction**：skill 设计者只管"在客户端把字评准、把反馈做暖"，没有数据契约层。ClassIn 应把"作答事件协议"作为生成互动件的**强制注入项**，而不是指望每个生成页自己接回调。
- **发布纪律可借鉴**：`publish.sh` 按 `TARGET_ENV` 渲染 test/online CDN、CDN 合约回归测试防旧版回退（v1.7.3/v1.7.5）——ClassIn 多环境投放互动件时同样需要这套"环境感知 + 合约测试"防线，避免线上引用测试 CDN。

### 4.2 教学正确性的工程化值得整体抄

- **防幻觉**：笔画名/字形全部走数据 API + 32 笔画白名单，绝不让 LLM 凭记忆写——这套"数据不可信，强制查库 + 校验 + 降级"模式，对 ClassIn 任何"知识正确性敏感"的互动件（公式、史实、字词）都通用。
- **正反馈/作品感的克制设计**：v1.7.1 把红圈从"正圆+同时出现"重构为"PCA 椭圆贴笔形 + 延迟 800ms + 数量上限 2"，全部源于教研反馈"圈贴不住/学生没机会先看自己的字/语义不明"（`CHANGELOG.md` L130）。这种"教研反馈→视觉时序级打磨"的闭环，是 ClassIn 互动件做"激励而不喧宾夺主"的范本。

> 一句话：stroke-animation 把"逐笔学情"算得又准又细，数据就摆在回调里——ClassIn 只要在 `onStrokeComplete`/`onFinish` 接一根 `postMessage`，就能拿到全四个 skill 里最有价值的过程性作答数据。
