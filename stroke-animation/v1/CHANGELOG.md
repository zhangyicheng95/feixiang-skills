# stroke-animation · CHANGELOG

> 飞象老师 · 汉字田字格跟练 + 笔顺动画 skill。
> 本日志按"最新 → 最旧"组织，仅记录会影响课件生成、教学体验或公开 API 的变更。

---

## v1.7.5 · P0 路由拆分与 test/online CDN 发布策略（2026-06-15）

### 根因

`SKILL.md` 早期把“跟练 / 练字 / 描红 / 田字格练习 / 写字游戏”都直接路由到 `StrokeTrace.mount()`。在真实课件中，“生字描红页”“写字指导页”更常见且通常只需要笔顺动画；练字游戏属于小众强交互场景，只有明确要求学生手写、评分、错笔纠正或强制重写时才应该触发。

同时，源码与发布文档默认写死测试 CDN。上线正式环境前，如果包内仍引用 `musk-test` 或测试侧 `stroke-order/v57`，线上会继续出现资源 404 或跨环境加载。

### 修复

- 路由规则拆分：普通描红 / 生字描红 / 写字指导默认走 `StrokeTrace.animate()`；只有“学生手写 / 我来写 / 手写评分 / 星级评分 / 错笔纠正 / 强制重写 / 练字游戏”才走 `StrokeTrace.mount()`。
- 多字笔顺课件示例改为“一个动画舞台 + 生字按钮 + `handle.setChar(ch)`”，不再示范循环创建多个跟练游戏。
- `src/data-loader.js` 不再硬编码测试侧 `stroke-path.json` / `stroke-data.json` 完整 URL；默认从当前 `animation-loader.js` / `stroke-loader.js` 脚本 URL 推导同版本 assets。
- `publish.sh` 新增 `TARGET_ENV`、`CDN_ORIGIN`、`STROKE_ANIMATION_VERSION`、`STROKE_ORDER_VERSION`、`STROKE_TRACE_VERSION`，在打包临时目录渲染 `SKILL.md` 与 loader 兜底常量，避免 online 包引用 musk-test。
- 新增 `tests/test_routing_contract.js` 与 `tests/test_cdn_publish_strategy.js`，回归锁定路由与发布策略。

---

## v1.7.4 · animate 布局与外部步骤同步契约修正（2026-06-03）

### 根因

最新测试页已正确加载 `stroke-animation` v8，但生成 HTML 把 `StrokeTrace.animate()` 的完整组件放进固定 280/320 px 高且 `overflow-hidden` 的容器。`animate` 默认会渲染当前笔提示、硬笔提示、田字格、底部控件栏和状态消息，固定高度会裁掉字形下半部分与控件栏。

同页外部步骤条使用 `step-0 / step-1 / step-2` 这类 0 基 DOM id，但 `onStrokeStart.index` 是历史兼容的 1 基序号，导致左侧正在演示第 2 笔时右侧高亮第 3 个步骤。

### 修复

- `StrokeTrace.animate()` 的 `onStrokeStart` / `onStrokeEnd` 回调新增 `strokeIndex`（0 基数组索引）和 `strokeNo`（1 基展示序号），保留旧 `index` 为 1 基以兼容旧页面。
- `StrokeTrace.mount()` 的 `onStrokeStart` 与 `onStrokeComplete` 结果同步新增 `strokeIndex` / `strokeNo`，减少两套 API 的序号歧义。
- `SKILL.md` 明确：完整 `animate` 组件不能放进固定 320px 高度 + `overflow:hidden` 的 target；使用控件栏时应高度自适应或至少 `min-height: 430px`。
- `SKILL.md` 新增外部步骤条标准片段，要求 DOM/数组同步使用 `strokeIndex`，展示文字使用 `strokeNo`。
- 测试基线 CDN 契约升级到 `stroke-animation/v9`，默认几何数据 URL 同步升级到 v9 assets。
- 新增 `tests/test_animate_contract.js`，回归检查回调字段、索引基准文档和完整组件容器约束。

---

## v1.7.3 · 防旧版 CDN 回退与硬笔提示守门（2026-06-03）

### 根因

测试基线已加载 `stroke-animation` v7，但 `SKILL.md` 正文依赖示例仍指向 `stroke-animation/v3/templates/animation-loader.js`。模型会优先照抄正文示例，导致生成 HTML 实际加载 v3 loader；v3 的运行时 `STROKE_TIPS` 仍含书法化提示语，因此测试页会显示不符合硬笔教学的逐笔说明。

### 修复

- `SKILL.md` 依赖加载示例改为当前测试版本 `stroke-animation/v8/templates/animation-loader.js`。
- 明确禁止生成代码引用 `stroke-animation/v1` 到 `stroke-animation/v7` 的旧版 `animation-loader.js`。
- `src/data-loader.js` 默认几何数据 URL 改为 `stroke-animation/v8/assets/stroke-path.json`，避免默认数据回退旧版本。
- 清理打包进 `templates/animation-loader.js` 的残留“虚拟毛笔 / 收笔顿”等提示性注释，统一为硬笔教学语境。
- 新增 `tests/test_cdn_contract.js`，回归检查 SKILL 正文、源码默认 URL、打包后 loader 是否仍可能回退旧 CDN，并检查运行时 `STROKE_TIPS` 不含书法化提示词。

---

## v1.7.2 · 教材字表补丁 textbook-patch-v1（2026-05-06）

> 教研反馈：「十、千、工、八、六、七」等小学一年级核心字在 demo 输入后报"不在字库内（仅支持 2,842 教材字）"。

### 根因（追根溯源）

源数据 `metis_gonsis_cn_dictionary-textbook_chapter_cn_word.csv`（飞象老师内部教材关联表）在维护时漏列了 23 个小学低段核心字：

| 类别 | 漏字 |
|---|---|
| 数字 | 六 / 七 / 八 / 十 / 千 |
| 自然/食物 | 豆 / 雾 |
| 称谓 | 父 |
| 动物 | 牛 / 羊 |
| 方位/时间 | 门 / 去 / 关 / 工 / 厂 / 午 / 年 |
| 基础事物 | 文 / 电 / 支 / 衣 / 兵 / 卡 |

漏字导致下游传染：

1. `stroke-data.json` 的 `textbook_chars` 字段 (=2842) 不含这 23 字
2. `stroke-order` skill 把这 23 字标为 `tier: 'extended'` 而非 `'textbook'`
3. `stroke-animation` 的 `distill_stroke_path.py` 严格按 `textbook_chars` 蒸馏，`stroke-path.json` 也缺这 23 字
4. demo 内输入这些字 → "不在字库"

但这 23 字的笔顺 + 几何**全都已经在字库里**：
- `stroke-order` 的 `data` 字典 7818 条全部有合法 32 标准笔画名
- MakeMeAHanzi `graphics.txt` 全部有 strokes/medians 几何（笔画数对齐）

仅是 `textbook_chars` 字段圈选时漏选了。

### 修复

- 新增 `scripts/patch_textbook_chars.py`：维护 `PATCH_TEXTBOOK_CHARS` 教研补丁字表 + 幂等地把字补入 `textbook_chars` 字段 + 同步两份 `stroke-data.json`
- 元数据新增 `textbook_chars_patches: [{version, added_chars, reason}]` 追溯字段
- 重跑 `distill_stroke_path.py` 得到 **`stroke-path.json` 2842 → 2865** （covered 100%，0 笔画数不一致）
- 全局把"2,842 教材字"字面量 bump 到 "2,865"（SKILL.md / 教研测试指南 / 运行时报错 / demo hint / stroke-order SKILL）

### 受益

| 类型 | 之前 | 之后 |
|---|---|---|
| `StrokeTrace.hasChar('十')` | `false` | `true` |
| `StrokeTrace.getTier('千')` | `'extended'` | `'textbook'` |
| `mount({char: '工'})` | "不在字库内"报错 | 正常跟练 |
| `animate({char: '父'})` | 报错 | 正常播放笔顺动画 |
| stroke-order `<stroke-card char="八">` 角标 | "extended"待验证 | "textbook"教研审核 |

### 体积

- `stroke-data.json` 630.0 → 630.1 KB（+0.1 KB，仅 textbook_chars 字符串扩了 23 字）
- `stroke-path.json` 7.51 → 7.36 MB（实际略减——重新序列化更紧凑；新增 23 字几何抵消）
- Loader 不变（不含字库数据）

### 兼容

- ✅ v1.6 / v1.6.1 / v1.7 / v1.7.1 行为完全保持
- ✅ animate() / mount() / validate() / validateAll() 行为不变
- ✅ stroke-order skill 同步发布，textbook tier 与 stroke-animation 一致
- ✅ 现有 115 个单测全部通过
- ✅ 后续教研发现新漏字时只需扩 `PATCH_TEXTBOOK_CHARS` 列表 + 重跑 patch + distill 即可，无需改代码

### 后续

- 推动平台数据维护方修补 `metis_gonsis_cn_dictionary-textbook_chapter_cn_word.csv` 源 CSV，让下次重跑 `generate.py` 时直接含核心字（届时本补丁机制可作为兜底保留）

---

## v1.7.1 · 圈点系统视觉重构（2026-05-06）

> 教研反馈：v1.7 红圈是**正圆**且与笔迹**同时出现**，导致：① 横/竖/折等长笔画的圆贴不住笔形，多笔圆互相重叠成一坨；② 学生没机会先看清自己写的字；③ "红圈到底圈了什么"语义不明。本版本针对性重构。

### 重构

- **PCA 定向椭圆**替代正圆（`_strokeOrientedEllipse`）：
  - 协方差矩阵特征向量决定椭圆主轴方向
  - 横笔 → 扁长椭圆 / 竖笔 → 细高椭圆 / 撇捺 → 斜倾椭圆 / 横折 → 沿对角的斜椭圆
  - 副轴 `ry` 保底 42 px（避免一根直线笔的椭圆变成一条线）
  - 主轴 `rx` 上限 380 px（避免极长笔的圈占满整字）
- **红圈延迟 800 ms 出现**（`praiseStartDelayMs`，与 CSS 衬底淡出 0.8s 同步）：
  - `_enterArtworkMode` 用 `setTimeout` 包裹 `_drawPraiseCircles`
  - 学生先看清自己的字（衬底淡出留白） → 再被老师"圈出来"，视觉层次清晰
  - 新增 `this._artworkTimer` 字段；`reset / setChar / destroy / _exitArtworkMode` 全部 `clearTimeout`
- **每圈附 ★ 红五角星表扬章**（`_starPath` + `praiseStar` 配置）：
  - 通过手写 `_starPath` 生成 SVG path，比 emoji 更可靠（不受 OS 字体影响）
  - 椭圆主轴一端 350 ms 后"啪"地盖章（`st-star-pop` 动画：缩放 + 旋转）
  - 让"红圈 = 写得好"的语义零歧义
- **完成态文案首行追加**"✨ 老师圈出 N 笔写得最好的"消除歧义
- **默认 `maxPraiseCircles` 3 → 2**（更克制视觉，避免重叠）

### 新增配置

```js
artwork: {
  maxPraiseCircles: 2,         // 红圈数量上限（v1.7.1 默认改 2）
  praiseStartDelayMs: 800,     // ★ v1.7.1：衬底淡出后再画红圈的延时
  praiseStaggerMs: 220,        // ★ v1.7.1：多圈错落出现间隔
  praiseStar: true             // ★ v1.7.1：是否打 ★ 五角星表扬章
}
```

### 新增测试

`tests/test_circles.js` 新增 7 个 PCA 椭圆单测（共 22 通过）：
- 少于 2 点 → null
- 水平长笔 → theta≈0, ry 触底, rx ≫ ry, rx 不超 RX_MAX
- 垂直长笔 → theta≈±π/2
- 45° 斜对角 → |theta|≈π/4
- 圆形点云 → rx ≈ ry（PAD 设计差）
- 极长笔 → rx 截断到 RX_MAX=380
- 横/竖两笔的主轴方向明显区分

### 体积

- Loader: `127 KB → 132 KB`（+5 KB raw / +2 KB gzip）
- 总测试数: 108 → **115**（+7）

### 兼容

- ✅ v1.6 / v1.6.1 / v1.7 行为全部保持
- ✅ animate() 不受影响
- ✅ 现有 28+14+19+32 = 93 个旧测试 + 22 个圈点测试全部通过

---

## v1.7 · 圈点系统 MVP（2026-05-06）

> 在 v1.6 整字"作品感"基础上，新增"老师批改习字本"式反馈：3 星笔画红圈表扬 + 重写笔画"改正成功"鼓励。

### 新增

- **圈点系统**：整字通过的作品态出现后，对最终通过且 3 星的笔画在学生笔迹外画**红色手绘风**椭圆环表扬（独立 SVG `<g class="st-circles">` 层，不影响 fxCanvas 烟花）。
  - 36 段折线 + 抖动 + `stroke-linejoin: round` + `stroke-dasharray: 9 5 16 6` + 轻微旋转 = 接近老师手写圆圈的视觉。
  - 每个圈错落淡入（CSS animation-delay 每笔 +0.18s）。
- **重写鼓励文案**：在作品态点评区追加 ✅ 胶囊式贴纸，对每个"曾经失败 ≥1 次后通过"的笔（`_strokeRetries[i] > 0`）给出 3 种轮换鼓励文案（"重写后变准了" / "改正了，越写越好" / "改好了，棒"）；≥4 笔重写时聚合为"还有 N 笔也成功改正了"。
- **新公共配置**（在 `mount({ artwork })` 内）：
  - `praiseCircles: true` 是否画红圈
  - `maxPraiseCircles: 3` 红圈数量上限（按 `final` 分降序选）
  - `retryPraise: true` 是否显示重写鼓励文案
- **15 个新单测**（`tests/test_circles.js`）：覆盖 `_strokeBoundingCircle` 几何、`_pickPraiseStrokes` 筛选/排序/上限、`_buildRetryPraises` 文案/聚合/开关。

### 视觉反馈语义边界（清晰区分三种红色元素）

| 反馈 | 视觉 | 时机 | 含义 |
|---|---|---|---|
| 红笔标注 | 半透明红色覆盖在错笔上 | 当前笔写错的瞬间，停留 `failHoldMs` 后清除 | 当前错笔提示 |
| **红圈（v1.7）** | 红色手绘椭圆环 | 整字完成作品态 | 最终优秀表扬 |
| **重写鼓励（v1.7）** | 白底 ✅ 胶囊文字 | 作品态点评区 | "改正成功" |

**红笔错误标注绝不残留到作品态**（保留期到点后已 `tracer.clearCurrent()` 清干净）。

### 状态隔离

以下操作均会清空圈点系统所有状态（红圈 SVG 节点 + 重写计数 + 鼓励文案）：

- `handle.reset()`
- `handle.setChar(...)`
- 点击作品态的「再写一次 ↻」按钮
- `handle.destroy()`

### 改动

- `src/stroke-trace.js`：
  - 构造器新增 `this._strokeRetries = []`
  - `_onStrokeEnd` 失败分支累加 `_strokeRetries[curStroke]++`
  - `_loadAndStart` / `reset` 清空 `_strokeRetries`
  - `_enterArtworkMode` 拼接重写鼓励文案 + 调用 `_drawPraiseCircles()`
  - `_exitArtworkMode` / `destroy` 调用 `_clearPraiseCircles()`
  - 新增方法：`_strokeBoundingCircle` / `_pickPraiseStrokes` / `_wigglyEllipsePath` / `_drawPraiseCircles` / `_clearPraiseCircles` / `_buildRetryPraises`
  - 新增 CSS：`.st-circles` 手绘动画 + `.st-retry-praise` 贴纸样式
  - 新增 `__test__` 出口（仅供单测访问 TraceInstance 原型，注明私有不稳定）
  - bootstrap `loadAll()` 加 `.catch` 防止未处理 promise rejection
- `tests/test_circles.js`：15 个新单测
- `SKILL.md`：补 v1.7 配置说明 + 三种视觉反馈语义边界表
- `教研测试指南.md`：新增 §5.2.1 圈点系统观察点
- `templates/animate-demo.html`：升级版本号 + cache buster

### 兼容性

- ✅ `animate()` 完全不受影响
- ✅ v1.6 错笔强制重写逻辑不变
- ✅ 烟花 / 星级 / 连击 / 进度条等正反馈保持
- ✅ `artwork.enabled: false` 时整套圈点系统降级隐藏，不报错
- ✅ stroke-order 数据未触碰
- ✅ 旧测试 93 个 + 新测试 15 个 = **108 个单测全部通过**

### 体积

- Loader: `117 KB → 127 KB`（+10 KB raw）/ `33 KB → 36 KB`（+3 KB gzip）
- Skill zip: `6.1 MB → 6.1 MB`（≈0）

---

## v1.6.1 · 32 笔画提示语硬笔化（2026-05-06）

将 32 条笔画提示语从毛笔书法术语全部替换为小学语文硬笔写字版本。

- 旧："侧锋顿入，瞬时收笔" / "起笔轻顿，平稳行笔，收笔回锋"
- 新："轻轻点下，方向要准，不要写成长线" / "从左往右写，基本写平，可微微上斜"

文档对齐："金色虚拟毛笔" → "金色虚拟笔尖"；"真实毛笔节奏" → "硬笔书写节奏"。

---

## v1.6 · 错笔强制重写 + 整字"作品感"（2026-04-29）

### 错笔不保留 · 必须写对再前进

- 新增 `scoring.passStars`（默认 2，可设 1/2/3）：当前笔达到此星数才算"写对"。
- 新增 `scoring.failHoldMs`（默认 1000）：错笔停留显示红笔的时长。
- 行为：未达通过门槛时 → 红笔标注 + 短暂停留 → 自动清除该笔笔迹 → 强制重写当前笔。
- 未通过时**不**更新进度、**不**计入 combo、**不**启用「下一笔」、手动点「下一笔」会被温和拒绝。
- 前面已通过的笔不受影响。

### 整字完成"作品感"

- 新增 `artwork.enabled`（默认 true）+ `artwork.message`。
- 整字通过后：标准衬底以 0.8s CSS 渐变淡出（仅留田字格 + 学生笔迹）；提示语高亮"🎉 这是你写出来的字！"；「下一笔」按钮变身「再写一次 ↻」。
- 视觉与 v1.3 烟花/星级/连击共存。

---

## v1.5 · 双模式（笔顺动画 + 跟练游戏）（2026-04-23）

新增 `StrokeTrace.animate()` 仅观看模式（自动连播 + ✍️ 握笔 + 调速控件），与 `mount()` 完全独立。

---

## v1.4.1 · 按需教学 + 握笔手势（2026-04-22）

- `watchMode.autoPlay` 默认改为 `false`（按需点 📹 看示范）。
- 写示范时显示右手握笔 ✍️ emoji 跟随金色笔尖。

---

## v1.4 · 直观引导（2026-04-21）

Watch Mode 写前示范（金色虚拟笔尖 + "起笔慢-行笔快-收笔稳"自然曲线）+ 32 种笔画提示语 + 📹 按需示范按钮 + 失败自动加强（`watchMode.retryAfterFails`）。

---

## v1.3 · 正反馈四件套（2026-04-20）

进度条 + 完美笔金色闪光 + 连击徽章（🔥 连击 N）+ 完成烟花，默认全开，细粒度开关。

---

## v1.2 · LLM 输入校验（2026-04-19）

新增 `validate()` / `validateAll()` API，结构化返回 `ok / reason / tier / suggestion`。SKILL.md 新增 Prompt 路由表。

---

## v1.1 · 顺滑书写 + 对齐 stroke-order v57（2026-04-17）

`autoAdvance` 写完一笔自动跳 700ms · `stroke-anim-ready` 全局只派发一次 · 对齐 stroke-order v57（data v56-2026-04-15）。

---

## v1.0 · 生产级 loader（2026-04-16）

2,842 字全覆盖 · 单文件 53KB · 完整 mount API · 32 算法层单测全过。
