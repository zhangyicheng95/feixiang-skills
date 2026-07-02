---
name: test-html
description: 指导如何用 test_html 工具对 HTML 文件做 Playwright 单测，含测试模板（渲染/响应式/LaTeX/拖拽/键盘/动画/资源加载）、playwrightCode 编写规范和失败处理流程。以下场景必须先加载本 skill 再操作：1) create_file 生成 HTML 后验证功能/布局；2) edit_file 修改 HTML 后回归验证；3) 用户反馈 HTML 功能/布局/渲染异常——先写复现测试确认问题，再动手修改（先测后改）；4) 准备调用 test_html 工具时。
---

# test_html 使用指南

## 何时触发

以下场景**应当**使用 `test_html` 工具：

1. **生成/编辑后验证**：通过 `create_file` 或 `edit_file` 工具生成/修改了 HTML 文件后（如有多次编辑，全部完成后再测试），验证页面功能和布局
2. **用户反馈诊断**：用户反馈 HTML 存在功能异常或布局问题时，先编写针对性测试复现问题，再修复

> 准备调用 `test_html` 之前，若本 skill 还未加载，请先加载（同一会话只需加载一次）。

### 用户反馈诊断适用范围

适合用测试诊断的反馈类型：
- 功能异常："按钮点不了"、"表单提交没反应"、"下拉菜单不工作"
- 布局问题："手机上显示乱了"、"文字被截断"、"有水平滚动条"
- 渲染异常："公式没显示"、"图片加载不出来"、"元素重叠了"

不适合用测试诊断的反馈（直接读代码分析）：
- 视觉审美："颜色不好看"、"风格不搭"
- 性能感受："加载太慢"、"动画卡顿"

处理流程：用户反馈 → 编写复现测试 → 确认问题 → 修复 HTML → 回归测试

## 前置条件

- 必须已拿到明确的 `resourceId`（来自 `create_file` 或 `edit_file` 的返回值，或用户提供）
- 不能在同一轮同时调用生成文件的工具和 `test_html`，必须等拿到 resourceId 后再调用
- 代码格式硬性要求（顶层语句执行、可用变量 page/context/browser/expect、等待与诊断方式）见 `test_html` 工具 `playwrightCode` 参数说明，此处不再重复
- **单次测试在云函数侧最长执行 60 秒，超时会失败**（下文提到"20s 等待预算"均指本条）：
  - 等待统一用 `page.wait_for_timeout(毫秒)`，不要写 `time.sleep` 或不必要的轮询
  - 不要在循环里堆砌长等待（如 3 视口 × `wait_for_timeout(2000)` 就 6s，再叠加渲染等待很容易超）
  - 多个独立检查可在一次调用中组合，但单条等待 ≤ 2000 毫秒，**总等待时间控制在 20 秒以内**（云函数还要做浏览器启动+页面加载，留出余量）
  - 复杂场景请拆成多次 `test_html` 调用，每次只测一个维度（基础渲染 / 响应式 / 交互 / LaTeX 等）

## 致命写法清单（每条都来自线上真实失败，写代码前过一遍）

下面 5 条是高频"一行没跑就挂"或"必然报错"的写法，违反任何一条都等于白白消耗一次测试轮次：

1. **代码是 Python，不是 JS**。正则一律 `import re` + `re.compile(r"...")`，**严禁 `/xxx/`、`/xxx/i` 这类 JS 正则字面量**（直接 SyntaxError，测试一行都不会执行）：

   ```python
   import re
   expect(page.locator("#info")).to_have_class(re.compile(r"\bactive\b"))   # ✅
   # expect(page.locator("#info")).to_have_class(/active/)                  # ❌ JS 写法 → SyntaxError
   ```

   判断"class 是否包含某值"也可以走 evaluate：`page.evaluate("document.querySelector('#info').classList.contains('active')")`。

2. **往 `evaluate` 传动态值必须用参数，禁止 f-string 拼 JS**。页面文本里的引号/反斜杠/换行会把 JS 炸出 `missing ) after argument list` 之类的语法错误：

   ```python
   page.evaluate("(x) => console.log('DEBUG:', x)", html_snippet)    # ✅ 参数传递
   # page.evaluate(f"console.log('DEBUG: {html_snippet}')")          # ❌ 引号注入 → JS SyntaxError
   ```

3. **选择器可能匹配多个元素时**（如多页文档每页都有同 class 按钮），`to_be_visible()` / `click()` 会报 strict mode violation。用 `.first` 或改断数量：

   ```python
   expect(page.locator(".print-btn").first).to_be_visible()   # ✅
   expect(page.locator(".print-btn")).to_have_count(3)        # ✅ 更强：顺带验证个数
   ```

4. **range 滑块禁止 `fill()`**。浏览器会把 `"2.0"` 规范化成 `"2"`，Playwright 回读校验不一致直接报 `Malformed value`。用 JS 赋值 + 触发 input 事件：

   ```python
   page.evaluate("document.querySelector('#slider').value = '2'")
   page.dispatch_event("#slider", "input")
   ```

5. **只有 page / context / browser / expect 免 import**。用到 `re`、`json`、`math` 等标准库必须显式 `import`，否则 NameError。

## 关键：先列 must-cover 清单，再写测试

**测试不是机械套模板，必须针对当前任务的真实需求**。

### 强制格式（不是建议）

**清单依据**：依据本次会话中**所有用户消息**（含初始需求 + 后续每一次"再改一下…"的追加修订）；
不要只看最近一条消息，否则会漏掉早期需求或老师的累积修订。

**完备性硬规则**：用户消息里出现的每个"动词 + 名词"组合（如"拖动火柴"、"显示提示"、"点击重置"）
都**必须**进清单；如果你判断某条不重要不放，请在该条下方写 `# skipped: <一行理由>`，**不允许默默省略**。

**每段 `playwrightCode` 的第一段必须是 must-cover 清单**，否则视为不合规。清单写成下面这种
注释格式，紧跟在测试代码最顶部，**不能写在心里、不能省略、不能写在思考里再交付不带清单的代码**：

```python
# must-cover from user request:
# [1] 横向/竖向火柴可拖拽          (-> 用 mouse.down/move/up 触发, 断言 .placed-match 数量)
# [2] 摆出正确数字 → √ 出现        (-> evaluate 调 checkAnswer, 断言 .check-mark 可见)
# [3] 表扬语言出现                 (-> 断言 .praise-text 文本不为空)
# [4] 摆错 → "想一想" 提示         (-> evaluate 模拟错误状态, 断言 .hint 含"想一想")
# [5] 返回上一步功能               (-> 比较点击前后 placed-match 数量)
# [6] 重新开始清屏                 (-> 断言点击后 placed-match 数量为 0)
# 通用项: 基础渲染、响应式 (375px 无水平滚动条)
```

清单里**每个 [N] 都必须有对应断言**；若用 `evaluate` / `wait_for_function` 等替代，
请在该条尾部注明 `(-> 对应到 [N])`。

### 怎么从用户需求映射到断言（三步法）

不要只对"形态相似"的需求复用范例，按下面三步**逐项**推断：

1. **名词** → 用 `locator` + `to_be_visible` / `to_have_count` 验证存在与个数
   - "5 种四连方" → `expect(page.locator(".tetromino")).to_have_count(5)`
   - "工具栏 / drop-zone" → `expect(page.locator("#toolbar")).to_be_visible()`

2. **动词** → 用 `mouse` / `keyboard` / `click` 触发动作，**触发前后用 `evaluate` 比对状态**
   - "可拖拽" → `mouse.down → move(steps=10) → up`，比对 DOM 结构变化
   - "可点击切换模式" → `click` 后 `evaluate` 读 `state.mode` 或元素 class

3. **状态变化** → 等"状态确实变了"再断言，按以下优先级选等待方式
   1. `wait_for_function("window.__done === true", timeout=5000)` —— 最稳
   2. `expect(...).to_have_class(re.compile(r"done"), timeout=5000)` —— 次之（需 `import re`，严禁写成 JS 的 `/done/`）
   3. `wait_for_timeout(≤2000ms)` —— 最后兜底（计入前置条件的 20s 总等待预算）

组合需求示例：
- "反馈层显示后 1.5s 自动消失" → 触发(`click`) → 立刻 `to_be_visible()` → `wait_for_function("!document.querySelector('#feedback').classList.contains('show')", timeout=2500)` → `not_to_be_visible()`
- "按钮置灰直到答案完整填入" → 初始 `to_be_disabled()` → `fill` 输入 → `to_be_enabled()`

### 高频品类常漏项（提示，非穷举）

按页面类型，下面这些项是**容易被用户消息一笔带过却必须进清单**的隐性需求，看到对应关键词时**主动检查是否漏了**：

- **教学游戏 / 答题闯关**：答对反馈 / 答错反馈（"想一想"/"再试试"等） / 重置 / 计分 / 难度递进或下一题
- **拖拽放置**：拖拽生效（DOM 实际变化） / 错位回弹或拒绝 / 命中判定 / 数量上限或下限
- **单页动画 / 演示**：进度滑块或步骤切换 / 自动播放完成信号 / 状态可重置
- **课件单页**：960×540 主画布无溢出 / 主交互可触发 / 跨视口（如 375px）不破版
- **错题诊断 / 多步状态机**：上传或输入触发渲染 / 各状态切换 / 兜底文案出现

这些只是补盲提示，不要机械搬运——用户没要求的项不必硬塞，但**用户提到了的项一项都不能漏**。

### 反面教材

用户需求："火柴可拖拽 / 摆对数字 √ 出现 / 表扬语言 / 摆错时'想一想'提示 / 重置和返回按钮"。

下面这种测试**不合规**，通过了也不算交付完成：

```python
# ❌ 没有 must-cover 清单
expect(page.locator("h1")).to_be_visible()
expect(page.locator("#drop-zone")).to_be_visible()
expect(page.locator(".controls")).to_be_visible()
expect(page.locator("button:has-text('检查答案')")).to_be_enabled()
page.click("button:has-text('检查答案')")
expect(page.locator("#feedback-overlay")).to_be_visible()
```

虽然 `pass=true`，但用户提到的拖拽 / 数字识别 / √ / 表扬 / "想一想" 一项都没真正验证，
等于在没确认核心功能能用的情况下就交付了。务必按上面"强制格式"的规范写。

### 完整正确示例

```python
# must-cover from user request:
# [1]火柴可拖拽 [2]摆对→√ [3]表扬语 [4]摆错→"想一想" [5]返回上一步 [6]重新开始清屏

# [1] 拖一根横向火柴到操作区
src = page.locator(".match-h").first
src_box = src.bounding_box()
target_box = page.locator("#drop-zone").bounding_box()
page.mouse.move(src_box['x']+src_box['width']/2, src_box['y']+src_box['height']/2)
page.mouse.down()
page.mouse.move(target_box['x']+200, target_box['y']+150, steps=10)
page.mouse.up()
assert page.locator("#drop-zone .placed-match").count() > 0, "[1] 拖拽未生效"

# [2][3] 通过 evaluate 直接触发业务函数，验证识别逻辑 + 表扬文本
result = page.evaluate("typeof checkAnswer === 'function' ? checkAnswer('1') : null")
assert result is not None, "[2] 缺少 checkAnswer 实现"
expect(page.locator(".check-mark")).to_be_visible()
praise = page.locator(".praise-text").text_content() or ""
assert len(praise.strip()) > 0, f"[3] 表扬语言为空: {praise!r}"

# [4] 摆错触发"想一想"
page.evaluate("checkAnswer('错误状态')")
assert "想一想" in (page.locator(".hint").text_content() or ""), "[4] 错误提示缺失"

# [5][6] 按钮副作用
page.evaluate("placeMatch(100, 100, 'h')")
initial = page.locator("#drop-zone .placed-match").count()
page.click("button:has-text('返回上一步')")
assert page.locator("#drop-zone .placed-match").count() < initial, "[5] 返回未生效"
page.click("button:has-text('重新开始')")
assert page.locator("#drop-zone .placed-match").count() == 0, "[6] 重置未清屏"
```

## 测试模板

根据 HTML 内容特征，选择合适的测试组合：

### 1. 基础渲染验证（每次必测）

```python
# 关键元素存在且可见
expect(page.locator("h1")).to_be_visible()
expect(page.locator(".main-content")).to_be_visible()
```

### 2. 响应式布局检测（有 CSS 布局时必测）

```python
VIEWPORTS = [
    {"width": 375, "height": 667, "name": "iPhone SE"},
    {"width": 768, "height": 1024, "name": "iPad"},
    {"width": 1280, "height": 720, "name": "Laptop"},
]

failures = []

for vp in VIEWPORTS:
    label = f"[{vp['name']} {vp['width']}x{vp['height']}]"
    page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
    page.wait_for_timeout(300)

    scroll_w = page.evaluate("document.documentElement.scrollWidth")
    client_w = page.evaluate("document.documentElement.clientWidth")
    if scroll_w > client_w:
        failures.append(f"{label} 水平滚动条: scrollWidth={scroll_w}px > clientWidth={client_w}px")

    overflow_els = page.evaluate("""() => {
        const results = [];
        document.querySelectorAll('body *').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.right > window.innerWidth) {
                results.push({
                    tag: el.tagName.toLowerCase(),
                    cls: el.className || '',
                    right: Math.round(rect.right),
                    vw: window.innerWidth
                });
            }
        });
        return results;
    }""")
    for el in overflow_els:
        failures.append(f"{label} 元素溢出: <{el['tag']}> class=\"{el['cls']}\" right={el['right']}px > viewport={el['vw']}px")

assert len(failures) == 0, f"发现 {len(failures)} 个布局问题:\n\n" + "\n".join(failures)
```

### 3. LaTeX / 数学公式渲染（有公式时必测）

```python
# 等待渲染引擎完成
page.wait_for_timeout(3000)

mathjax_rendered = page.evaluate("""() => {
    if (window.MathJax && MathJax.startup) {
        const jax = document.querySelectorAll('mjx-container');
        return { engine: 'MathJax3', count: jax.length, ok: jax.length > 0 };
    }
    if (window.MathJax && MathJax.Hub) {
        const jax = document.querySelectorAll('.MathJax');
        return { engine: 'MathJax2', count: jax.length, ok: jax.length > 0 };
    }
    const katex = document.querySelectorAll('.katex');
    if (katex.length > 0) {
        return { engine: 'KaTeX', count: katex.length, ok: true };
    }
    return { engine: 'none', count: 0, ok: false };
}""")

assert mathjax_rendered['ok'], f"数学公式未渲染: engine={mathjax_rendered['engine']}, count={mathjax_rendered['count']}"

# 检查渲染错误
errors = page.evaluate("""() => {
    const katexErrors = document.querySelectorAll('.katex-error');
    const mjxErrors = document.querySelectorAll('mjx-merror, .MathJax_Error');
    return {
        total: katexErrors.length + mjxErrors.length,
        details: [...katexErrors, ...mjxErrors].map(el => el.textContent.substring(0, 100))
    };
}""")

assert errors['total'] == 0, f"发现 {errors['total']} 个公式渲染错误: {errors['details']}"

# 公式元素尺寸非零
zero_size = page.evaluate("""() => {
    const formulas = document.querySelectorAll('mjx-container, .katex, .MathJax');
    const issues = [];
    formulas.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            issues.push('公式#' + i + ': ' + rect.width + 'x' + rect.height);
        }
    });
    return issues;
}""")

assert len(zero_size) == 0, f"有公式尺寸为零（未渲染）: {zero_size}"
```

### 4. 复杂交互范本（拖拽 / 键盘 / 动画 / 诊断）

按钮点击、表单输入这类简单交互直接按"三步法"写断言即可；拖拽、键盘、动画**不能用简单 click 替代**，按下面范本写。

#### 4.1 真实拖拽（mouse.down/move/up）

```python
# 把 .draggable 拖到 #drop-zone
src = page.locator(".draggable").first
dst = page.locator("#drop-zone")
src_box = src.bounding_box()
dst_box = dst.bounding_box()
assert src_box and dst_box, "源或目标元素不可见，无法获取坐标"

# 模拟人手：按下→分多步移动→释放
page.mouse.move(src_box['x'] + src_box['width']/2, src_box['y'] + src_box['height']/2)
page.mouse.down()
# 中间至少加 2 步，避免被识别为瞬移
page.mouse.move(src_box['x'] + 100, src_box['y'] + 100, steps=10)
page.mouse.move(dst_box['x'] + dst_box['width']/2, dst_box['y'] + dst_box['height']/2, steps=10)
page.mouse.up()

# 验证拖拽产生了实际效果（DOM 多了一个、或元素挪到 zone 内部）
expect(page.locator("#drop-zone .item")).to_have_count(1)
```

> Playwright 自带的 `source.drag_to(target)` 对原生 HTML5 拖拽（dragstart/dragover/drop）才生效，
> 对自定义 `pointerdown/pointermove/pointerup` 实现的拖拽**无效**——必须用 `mouse.*` API。

#### 4.2 键盘操作

```python
# 输入框打字
page.fill("#answer-input", "")              # 先清空
page.locator("#answer-input").press_sequentially("123", delay=50)
expect(page.locator("#answer-input")).to_have_value("123")

# 组合键 / 方向键 / 回车
page.keyboard.press("Enter")
page.keyboard.press("Control+Z")
page.keyboard.press("ArrowRight")
```

#### 4.3 动画 / 异步状态变化

```python
# 触发动画
page.click("#play-btn")

# 等"动画完成"信号比硬等 wait_for_timeout 更稳：
# (a) 等某个 class 出现（如 .animation-done）
expect(page.locator(".result")).to_have_class("result animation-done", timeout=5000)
# (b) 或等内部 state 变化
page.wait_for_function("window.__animationDone === true", timeout=5000)
# (c) 实在没信号时，再用 wait_for_timeout 兜底，但不要超过 2000ms
page.wait_for_timeout(1500)
```

> (a)(b)(c) 的等待全部计入前置条件的 20s 总等待预算；累计逼近 20s 时，拆分到下一次 `test_html` 调用，不要硬塞进一次。

#### 4.4 通过 evaluate 直接调底层 API（最稳）

UI 模拟有时不可靠，可以**直接调暴露在 window 上的核心函数**：

```python
# 校验业务逻辑而不是 UI 表现
result = page.evaluate("typeof checkAnswer === 'function' ? checkAnswer('123') : null")
assert result == True, f"checkAnswer 业务逻辑错误: {result}"

# 读内部 state 验证状态
state = page.evaluate("typeof state !== 'undefined' ? JSON.parse(JSON.stringify(state)) : null")
assert state and state.get("step") == 2, f"state 异常: {state}"
```

#### 4.5 诊断打印（先看再断言）

**唯一推荐的诊断模式，"测试结果处理"一节所有指向"诊断"的步骤都来这里**。

适用场景：
- 第一次测试某个新生成的 HTML，对实际 DOM 结构、文本内容、内部 state 不确定
- 测试反复失败、想"调宽断言"前——必须先来这里看实际值，不能拍脑袋改
- 失败处理中第 2 次同代码失败，强制切到这里

> ⚠️ 当前云函数响应里 `console` 字段**只承载 page 浏览器 console**，Python `print` 的 stdout
> **不会回传**。诊断必须用 `page.evaluate("console.log(...)")` 把可疑值灌进 page console，
> 否则下一轮决策时拿不到任何诊断信息，等于白跑一次。

```python
# 1. ✅ 推荐：用 page.evaluate + console.log 把值灌进 page console，结果会随响应回传
page.evaluate("""() => {
    console.log('DEBUG state =', JSON.stringify(window.state || null));
    console.log('DEBUG sun-lat =', document.querySelector('#sun-latitude')?.textContent);
    console.log('DEBUG btn-spring count =', document.querySelectorAll('#btn-spring').length);
}""")

# 2. ✅ Locator 数据先通过 evaluate 回灌到 page console（不要直接 print）
page.evaluate(
    "(texts) => console.log('DEBUG items =', JSON.stringify(texts))",
    page.locator(".item").all_inner_texts()
)

# 3. ✅ 用最弱断言让本次测试先通过，先拿到上面的诊断输出，再决定下一步精确断言或修 HTML
assert page.locator("#sun-latitude").count() > 0, "目标元素根本不存在 → HTML 没生成对应节点"

# 4. ❌ 反例：直接 print(...) 不会回传，诊断信息丢失
# texts = page.locator(".item").all_inner_texts()
# print("DEBUG items =", texts)   # ← stdout 不回传，下一轮看不到
```

### 5. 图片和资源加载（有外部资源时测试）

```python
broken_images = page.evaluate("""() => {
    const images = document.querySelectorAll('img');
    const broken = [];
    images.forEach(img => {
        if (!img.complete || img.naturalWidth === 0) {
            broken.push(img.src.substring(0, 100));
        }
    });
    return broken;
}""")

assert len(broken_images) == 0, f"有 {len(broken_images)} 张图片加载失败: {broken_images}"
```

## 测试组合决策

| HTML 特征 | 必选测试 |
|-----------|---------|
| 任何 HTML | 基础渲染验证（模板 1） |
| 有 CSS 布局、flex、grid | + 响应式布局检测（模板 2） |
| 有 `MathJax`、`KaTeX`、`\(`、`$$` | + LaTeX 公式渲染（模板 3） |
| 有 button、input、form、onclick | + 按"三步法"写交互断言 |
| 用户需求里出现"拖拽 / drag" | + 真实拖拽（4.1） |
| 用户需求里出现"键盘 / 输入 / 答案" | + 键盘操作（4.2） |
| 用户需求里出现"动画 / 播放 / 切换" | + 动画等待（4.3） |
| 业务逻辑暴露在 window（如 `state`、`checkAnswer`） | + evaluate 调底层 API（4.4） |
| 有 img、video、audio | + 资源加载检查（模板 5） |

根据页面内容组合多个测试片段到一次 `test_html` 调用中，减少调用次数。

## 测试结果处理

### 收尾产出格式（必填）

每次拿到测试结果后，在给用户的文本回复里**必须**输出下面这块结论卡片，给用户一个明确判定。
**不要用"测试通过了已修复"这种含糊句子糊弄过去**。注意：**写给用户看的内容不要出现内部工具名
和英文术语**，按下面的纯中文模板来：

```
## 验证结论
- 状态：✓ 完全通过 / ⚠ 部分通过 / ✗ 未通过
- 需求覆盖：N/M 项已验证
  - [1] <清单条目>：✓ 已验证 <一句话说明断言点> / ✗ 未覆盖 <原因>
  - [2] ...
- 主要原因（仅在 ⚠/✗ 时填）：页面实现问题 / 验证代码问题 / 执行超时（细分见下）
- 下一步：修复页面 / 调整验证代码后再次验证 / 拆分后再次验证 / 完成交付
- 仍需补测：<列出未覆盖的清单项；全覆盖时填"无">
```

只有当**状态 = ✓ 完全通过 且 N/M 全部命中**时，才视为可交付；否则按"下一步"继续推进。

### 通过（自检闭环：通过 ≠ 没问题）

`pass=true` 只代表"被写出来的断言全部满足"，不代表"用户需求被全部覆盖"。在标记任务完成之前必须做：

1. **回看顶部 must-cover 清单**：把刚才提交的 `playwrightCode` 顶部的 `# [1] / [2] / ...` 清单
   逐条与下方断言核对，只要存在某个 `[N]` 在断言区找不到对应代码 → **未真正通过**
2. **若清单里有未覆盖项**：本次"通过"是**部分通过**，不能视为交付完成。补一次 `test_html` 调用
   测掉漏项，或把漏项整合到下一次回归测试里，再继续后续流程
3. **若全部 `[N]` 都有断言且 pass**：才视为真正通过，可以推进后续步骤

> 这一步是必要的：只验"按钮存在 / 容器可见"等表层断言时，`pass=true` 完全可能掩盖
> 核心功能尚未实现的事实。回看清单是唯一的兜底。

### 未通过（重要）

**核心原则：先分析错误根因（读 `message`、`console`、`error` 字段），再决定修改 HTML 还是测试代码；默认假设 HTML 有问题。**

除非满足以下任一条件，否则**不允许把矛头指向测试代码**：

- (a) 错误来自 Playwright API 用法本身（如 `to_have_count_greater_than` 不存在、
  拼写错误 / 不存在的属性等纯语法/API 错误）
- (b) **已经用诊断模式（见 4.5 诊断打印）打印过实际 DOM**，证实 HTML 已正确渲染但选择器/期望值写错
- (c) 错误信息明确指向测试代码语法问题（NameError、SyntaxError 等）

**判定流程（必经路径）**：

```
失败
  │
  ├─ 错误是 (a) Playwright API/语法错误？
  │     是 → 测试代码问题，直接修
  │     否 ↓
  │
  ├─ 跑一次 [诊断版] (见 4.5)：只打印不断言 / 只断言最弱条件
  │     │
  │     ├─ 实际 DOM 没有相关元素 / state 为空 / 数值差距巨大
  │     │     → HTML 问题：edit_file 修复 HTML，测试代码不动
  │     │
  │     ├─ 实际 DOM 已正确渲染、值合理，只是断言写错
  │     │     → 测试代码问题：用诊断到的实际值收紧断言
  │     │       （绝不允许只是"放宽断言让它过"）
  │     │
  │     └─ 出现执行超时（含 `timeout`、`Read timed out`、`调用 Playwright 测试云函数失败`）
  │           ├─ console 有页面级错误 / 长时间无输出 / requestAnimationFrame 被刷爆
  │           │   → HTML 侧死循环或同步重计算：edit_file 拆任务 / 节流 / 异步化
  │           └─ console 正常，主要是测试自身在等
  │               → 测试侧太慢：拆调用 / 削减视口循环 / 缩短 wait_for_timeout，HTML 不动
  │
  └─ 把诊断结果作为修复决策依据
```

**执行修复**：按判定流程的方向，用 `edit_file` 修改对应文件，拿到新 resourceId 后重新测试。
修测试代码时必须明确写出"原断言 vs 收紧后断言"，便于评估是否是合理收紧而非无理由放宽。

### 测试设施异常时的收尾（不许静默放弃）

若 `test_html` 连续 ≥3 次返回"调用 Playwright 测试云函数失败"或同类基础设施错误（非断言失败、console 为空），说明测试设施暂不可用，而不是页面有问题：

- 停止重试，不要再消耗轮次
- 收尾**仍必须**输出"验证结论"卡片：状态填 ✗ 未通过，主要原因填"执行超时/测试设施异常"
- 交付说明中必须明确告知用户：本次交付**未经自动化验证**，建议人工检查核心交互
- **禁止**假装测试通过，**禁止**在交付文案中对测试只字不提

### 严禁：用同一段测试代码反复测试不同 HTML 版本

**反面教材**：模型连续多轮用**字节级完全相同的测试代码**去测被反复修改的 HTML，每次都失败。
这是典型的"修复策略陷入局部最优"——HTML 改了但测试逻辑没变，等于在用同一把尺子量同一段
错误代码，结果不会变。每次出现失败都应当先回到 4.5 诊断打印看实际值，再决定下一步动作。

**强制规则**：

- 如果**第 2 次测试用了和第 1 次相同的代码**（仅改 HTML 没改测试），且**结果仍是失败**，
  立刻停止"改 HTML+重测"循环，**切到 4.5 诊断打印**：跑一次诊断版
  拿到实际值（弱断言 + `page.evaluate("console.log(...)")` 灌 page console），再回头精确断言或修 HTML。

- **每轮测试代码必须发生有意义的变化**：要么换断言、要么换选择器、要么拆分粒度、要么加诊断打印。
  如果一定要复用代码，至少把上次失败的具体值写进断言里（例如把 `assert lat ≈ 0` 改成
  `assert lat == 0, f"实际 {lat}"`，让下一次失败时能看到当前值）。

- **同一思路连续失败 ≥ 3 次**：必须切换到其它修复策略：
  - 换一种 CSS 布局方案（flex → grid，固定宽度 → 百分比）
  - 换一种 JavaScript 实现方式（事件监听 → 直接修改 DOM）
  - 调整测试中的选择器以匹配实际 DOM 结构
  - 检查是否遗漏了必要的依赖（CDN 库、字体等）
  - 暂停：把诊断结果汇总后，向用户说明当前进展并询问期望

- **持续尝试**：直到测试通过或已尝试 3 种以上不同的修复策略

**优先级**：优先考虑修复 HTML，仅当确认测试代码本身有明显错误时才修改测试。

**禁止以下行为**：
- 为了让测试通过而无理由地放宽断言条件
- 连续失败后直接放弃，不尝试其他修复策略
- 删除或跳过失败的测试用例
