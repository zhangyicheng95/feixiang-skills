# test_html 代码模板与陷阱（按需 read_url）

> 本文是 SKILL.md 的附件库：致命写法、各类断言模板、完整示例、反面教材。
> 写 `playwrightCode` 前按"模板速查表"取对应片段，组合进一次调用。

## 致命写法清单（每条来自线上真实失败，写代码前过一遍）

1. **代码是 Python，不是 JS**。正则用 `import re` + `re.compile(r"...")`，严禁 `/xxx/i` JS 字面量（直接 SyntaxError）。
   `expect(page.locator("#i")).to_have_class(re.compile(r"\bactive\b"))` ✅
2. **往 `evaluate` 传动态值必须用参数，禁止 f-string 拼 JS**：`page.evaluate("(x)=>console.log(x)", val)` ✅，`page.evaluate(f"...{val}...")` ❌（引号注入 SyntaxError）。
3. **选择器可能匹配多个**时 `to_be_visible()/click()` 报 strict mode violation → 用 `.first` 或 `.to_have_count(n)`。
4. **range 滑块禁止 `fill()`**（`"2.0"`→`"2"` 报 Malformed value）→ `page.evaluate("el.value='2'")` + `page.dispatch_event("#s","input")`。
5. **只有 page/context/browser/expect 免 import**；用 `re/json/math` 必须显式 import，否则 NameError。

---

## 模板 1 · 基础渲染（每次必测）

```python
expect(page.locator("h1")).to_be_visible()
expect(page.locator(".main-content")).to_be_visible()
```

## 模板 2 · 响应式布局（有 CSS 布局时）

```python
VIEWPORTS = [{"width":375,"height":667,"name":"SE"},{"width":768,"height":1024,"name":"iPad"},{"width":1280,"height":720,"name":"Laptop"}]
failures = []
for vp in VIEWPORTS:
    page.set_viewport_size({"width":vp["width"],"height":vp["height"]}); page.wait_for_timeout(300)
    sw = page.evaluate("document.documentElement.scrollWidth"); cw = page.evaluate("document.documentElement.clientWidth")
    if sw > cw: failures.append(f"[{vp['name']}] 水平滚动条 {sw}>{cw}")
    over = page.evaluate("""()=>{const r=[];document.querySelectorAll('body *').forEach(el=>{const b=el.getBoundingClientRect();if(b.width>0&&b.right>window.innerWidth)r.push(el.tagName+'.'+el.className)});return r}""")
    failures += [f"[{vp['name']}] 溢出 {x}" for x in over]
assert not failures, "布局问题:\n" + "\n".join(failures)
```

## 模板 3 · LaTeX / 公式（有 MathJax/KaTeX 时）

```python
page.wait_for_timeout(3000)
r = page.evaluate("""()=>{
  if(window.MathJax&&MathJax.startup){const j=document.querySelectorAll('mjx-container');return{ok:j.length>0,n:j.length}}  // MathJax3
  if(window.MathJax&&MathJax.Hub){const j=document.querySelectorAll('.MathJax');return{ok:j.length>0,n:j.length}}           // MathJax2(CDN 老版仍常见)
  const k=document.querySelectorAll('.katex');return{ok:k.length>0,n:k.length}}""")
assert r['ok'], f"公式未渲染 n={r['n']}"
err = page.evaluate("()=>document.querySelectorAll('.katex-error,mjx-merror,.MathJax_Error').length")
assert err == 0, f"公式渲染错误 {err} 处"
# 零尺寸检测：治"容器存在但宽高=0(实际没渲染出来)"的 count>0 假阳性
zero = page.evaluate("""()=>{let z=0;document.querySelectorAll('mjx-container,.katex,.MathJax').forEach(e=>{if(e.offsetParent===null)return;const b=e.getBoundingClientRect();if(b.width===0||b.height===0)z++});return z}""")  # offsetParent===null 跳过 display:none(折叠/标签页)的合法隐藏公式，避免假阳性
assert zero == 0, f"有 {zero} 个可见公式尺寸为零(未真正渲染)"
```

## 模板 4 · 复杂交互

**4.1 真实拖拽**（自定义 pointer 拖拽必须用 `mouse.*`，`drag_to` 只对原生 HTML5 拖拽生效）
```python
src = page.locator(".draggable").first; dst = page.locator("#drop-zone")
sb = src.bounding_box(); db = dst.bounding_box(); assert sb and db, "源/目标不可见"
page.mouse.move(sb['x']+sb['width']/2, sb['y']+sb['height']/2); page.mouse.down()
page.mouse.move(sb['x']+100, sb['y']+100, steps=10)
page.mouse.move(db['x']+db['width']/2, db['y']+db['height']/2, steps=10); page.mouse.up()
expect(page.locator("#drop-zone .item")).to_have_count(1)
```
**4.2 键盘**：`page.locator("#in").press_sequentially("123",delay=50)` → `expect(...).to_have_value("123")`；`page.keyboard.press("Enter")`。
**4.3 动画/异步**：触发后**等信号**而非硬等——`page.wait_for_function("window.__done===true",timeout=5000)`，或 `to_have_class(re.compile(r"\bdone\b"),timeout=5000)`（`# 需 import re`；`\b` 防 `undone`/`predone` 这类字母粘连。注意它**仍会命中连字符派生名** `done-later`——若 class 这样命名，改用精确 token 匹配 `re.compile(r"(^|\s)done(\s|$)")`），兜底 `wait_for_timeout(≤2000)`（计入 20s 预算）。
**4.4 evaluate 调底层 API（最稳）**：`page.evaluate("typeof checkAnswer==='function'?checkAnswer('123'):null")` 验逻辑；`page.evaluate("JSON.parse(JSON.stringify(state))")` 读内部 state。
**4.5 诊断打印（先看再断言）**：第一次测新 HTML、或反复失败想放宽断言前，**必须先来这**。
```python
page.evaluate("""()=>{console.log('DEBUG state=',JSON.stringify(window.state||null));
  console.log('DEBUG nodes=',document.querySelectorAll('.item').length)}""")  # ✅ 灌 page console 才回传
assert page.locator("#target").count() > 0, "目标元素不存在 → HTML 没生成对应节点"
# ❌ Python print(...) 的 stdout 不回传，下一轮看不到
```

## 模板 5 · 资源加载（有外部资源时）

```python
broken = page.evaluate("""()=>{const b=[];document.querySelectorAll('img').forEach(i=>{if(!i.complete||i.naturalWidth===0)b.push(i.src.slice(0,80))});return b}""")
assert not broken, f"{len(broken)} 张图加载失败: {broken}"
```

## 模板 6 · 约束符合性（声明式约束：禁止/只准/全部/每个/固定为）

**这类断言廉价（一次 getComputedStyle 遍历、无需等待），永远放进首次调用。**

**6.1 否定式 · 禁止项全局扫**（禁阴影 / 禁蓝绿 / 调色板白名单）
```python
v = page.evaluate("""()=>{const bad={shadow:0,color:new Set()};
  const bg=c=>{const m=c.match(/\\d+/g);if(!m)return false;const[r,g,b]=m.map(Number);return(b>r+30&&b>g+10)||(g>r+30&&g>b+10)};
  document.querySelectorAll('body *').forEach(el=>{const s=getComputedStyle(el);
    if(s.boxShadow!=='none'||s.textShadow!=='none')bad.shadow++;[s.color,s.backgroundColor].forEach(c=>{if(bg(c))bad.color.add(c)})});
  return{shadow:bad.shadow,color:[...bad.color]}}""")
assert v['shadow']==0, f"违反禁阴影 {v['shadow']} 处"
assert len(v['color'])==0, f"违反禁蓝绿 {v['color']}"
```
> 注：上面同时扫了 `color`(文字色)，**默认链接蓝/继承文字色会误报**。若约束只针对**背景**配色，去掉 `s.color`、只留 `s.backgroundColor`。
**6.2 全称式 · 每一个都要**（每页水印/页码、全局禁英文）
```python
pages = page.locator(".page").count()
assert page.locator(".watermark").count()==pages, f"水印未覆盖每页 {page.locator('.watermark').count()}/{pages}"
bad_en = page.evaluate("()=>(document.body.innerText.match(/[A-Za-z]{2,}/g)||[]).length")
assert bad_en==0, f"违反禁英文 {bad_en} 个词"
```

## 模板 7 · 核心闭环 + 资源可达性（游戏/答题/多文件——must-cover 第一类）

**7.1 核心闭环端到端**（优先 evaluate 调底层，验"真能算/真能判"，而非按钮存在）
```python
# 例：24 点——选数字→选运算符→判定→反馈
assert page.evaluate("typeof applyOperator==='function'"), "核心闭环缺失：无运算符逻辑（连符号都点不了）"
assert page.evaluate("typeof checkResult==='function'?checkResult()!==undefined:false"), "核心闭环缺失：无判定逻辑"
# UI 链路：点数字→点运算符→点数字→判定，断言出现对/错反馈（选择器按实际 DOM）
before = page.locator("#display").text_content()
page.locator(".num").first.click(); page.click("button:has-text('+')")
assert page.locator("#display").text_content()!=before, "运算符交互未生效"
```
**7.2 资源可达性**（多文件 / index 大厅 / 跳转链接——治"点开 NoSuchKey 死链"）
```python
import re   # 需 import re
# "链接 <a> 存在" ≠ "目标能打开"。逐个真正导航过去，断言不 404 / 不是 OSS 错误页 / 核心元素已渲染。
index_url = page.url                       # ① 存原页，循环导航后必须回来
hrefs = page.evaluate("()=>Array.from(document.querySelectorAll('a[href]')).map(a=>a.href).filter(h=>h.split(/[?#]/)[0].endsWith('.html'))")  # 去掉 ?query/#hash 再判，别漏带参链接
assert len(hrefs) >= 1, "未发现子页面链接"
ERR = re.compile(r"NoSuchKey|NoSuchBucket|AccessDenied|does not exist", re.I)
dead = []
for h in hrefs:
    try:
        resp = page.goto(h, wait_until="domcontentloaded", timeout=10000)
    except Exception as e:
        # 注意：超时(页面慢)也会进这里。看 repr 区分"慢"与"真死链"，别把"慢"当"死"去改 HTML
        dead.append(f"{h} (导航失败: {repr(e)[:50]})"); continue
    src = page.content()                   # ② 用整页源文：OSS 死链常返回 200+XML，body.inner_text() 抓不到
    if (not resp) or (not resp.ok) or ERR.search(src):
        dead.append(h)                     # 404/403 或 OSS 错误码命中
    elif page.locator("h1, .game, canvas, #app").count() == 0:
        dead.append(f"{h} (空壳)")          # 能打开但核心元素没渲染
page.goto(index_url)                        # ③ 回到原页，避免后续针对 index 的断言错位
assert not dead, f"死链/不可达 {len(dead)}/{len(hrefs)}: {dead[:5]}"
```

---

## 完整正确示例（24 点拖拽火柴类，含顶部 must-cover）

```python
# must-cover:
# [1]核心闭环:数字可拖入->组合->判定=24->反馈 [2]摆对→√ [3]摆错→"想一想" [4]重置清屏
src = page.locator(".match-h").first; sb = src.bounding_box(); tb = page.locator("#drop-zone").bounding_box()
page.mouse.move(sb['x']+sb['width']/2, sb['y']+sb['height']/2); page.mouse.down()
page.mouse.move(tb['x']+200, tb['y']+150, steps=10); page.mouse.up()
assert page.locator("#drop-zone .placed").count() > 0, "[1] 拖拽未生效"
assert page.evaluate("typeof checkAnswer==='function'?checkAnswer('24'):null") is not None, "[1] 缺 checkAnswer"
expect(page.locator(".check-mark")).to_be_visible()                    # [2]
page.evaluate("checkAnswer('wrong')"); assert "想一想" in (page.locator(".hint").text_content() or "")  # [3]
page.click("button:has-text('重新开始')"); assert page.locator("#drop-zone .placed").count()==0  # [4]
```

## 反面教材（通过了也不算交付）

```python
# ❌ 没有 must-cover 清单；只验"存在/可见"，核心玩法一项没真正验
expect(page.locator("h1")).to_be_visible()
expect(page.locator("#drop-zone")).to_be_visible()
page.click("button:has-text('检查答案')")
expect(page.locator("#feedback")).to_be_visible()
# 虽 pass=true，但拖拽/数字识别/√/"想一想"/运算符闭环一项没验 → 等于没确认核心功能能用就交付。
```

```python
# ❌ 死链漏测：只验链接存在，没验目标能打开（线上 NoSuchKey 的根源）
expect(page.locator("a.game-card")).to_have_count(10)   # 链接在 ≠ 点开能用
# 正确做法见模板 7.2：逐个 page.goto 验不 404 + 渲染。
```


(End of file - total 175 lines)