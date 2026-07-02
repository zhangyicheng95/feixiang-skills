# 物理公式 MathJax3 代码规范

> 供 `physics-formula-typography` 在写 HTML / 修 HTML 时读取。

## 1. 标准 MathJax3 引入

`window.MathJax` 必须出现在 CDN 之前：

```html
<script>
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true
  },
  startup: { typeset: true }
};
</script>
<script src="https://metis-online.fbcontent.cn/metis-misc/blER0Bn7vsa2JER9IEssf8.js"></script>
```

不要使用 `$...$`，不要加载其他 MathJax CDN。

## 2. 动态公式 helper

所有动态读数和动态公式都走以下 helper，不要散落 `innerHTML = 'vm...'`：

```html
<script>
async function typesetMath(root = document.body) {
  if (!window.MathJax) return;
  if (MathJax.typesetClear) MathJax.typesetClear([root]);
  if (MathJax.typesetPromise) {
    await MathJax.typesetPromise([root]);
  } else if (MathJax.typeset) {
    MathJax.typeset([root]);
  }
}

async function setFormula(el, latex, display = false) {
  if (!el) return;
  el.textContent = display ? `\\[${latex}\\]` : `\\(${latex}\\)`;
  await typesetMath(el);
}

async function setPhysicsValue(el, value, unitLatex) {
  await setFormula(el, `${value}\\,\\mathrm{${unitLatex}}`);
}

async function setDensityValue(el, value, unit = 'g/cm^3') {
  await setPhysicsValue(el, value, unit);
}

async function setMixedMathText(el, htmlWithMathDelimiters) {
  if (!el) return;
  el.innerHTML = htmlWithMathDelimiters;
  await typesetMath(el);
}
</script>
```

示例：

```js
await setFormula(document.querySelector('#label-vm'), 'v_{m}');
await setPhysicsValue(document.querySelector('#value-vm'), vm.toFixed(2), 'm/s');
await setFormula(document.querySelector('#momentum'), `m v_{m}+M v_{M}=0`, true);
await setMixedMathText(document.querySelector('#step-tip'), '步骤 A：测量 \\(V_{1}\\)');
await setDensityValue(document.querySelector('#rho-object'), rho.toFixed(2), 'g/cm^3');
```

## 3. 动画循环写法

动画帧里不要每一帧都 typeset 整页，性能会差。推荐：

```js
let lastVmText = '';

async function updateReadouts(vm, vM, px) {
  const nextVm = vm.toFixed(2);
  if (nextVm !== lastVmText) {
    lastVmText = nextVm;
    await setPhysicsValue(document.getElementById('vm-value'), nextVm, 'm/s');
  }
  await setPhysicsValue(document.getElementById('vM-value'), vM.toFixed(2), 'm/s');
  await setPhysicsValue(document.getElementById('px-value'), px.toFixed(2), 'kg\\,m/s');
}
```

若更新频率很高，可以只在数值变化超过阈值或每 100-200 ms 更新一次公式 DOM。

## 4. 静态 HTML 示例

```html
<section class="panel">
  <h2>动量守恒</h2>
  <p>小球质量 \(m\)，半圆槽质量 \(M\)。</p>
  <p>小球速度 <span id="label-vm">\(v_{m}\)</span>：
    <span id="vm-value">\(0.00\,\mathrm{m/s}\)</span>
  </p>
  <p>半圆槽速度 <span id="label-vM">\(v_{M}\)</span>：
    <span id="vM-value">\(0.00\,\mathrm{m/s}\)</span>
  </p>
  <div class="formula">\[m v_{m}+M v_{M}=0\]</div>
</section>
```

## 5. SVG 标注

SVG 物理图可以保留，但公式标签要用 `foreignObject`：

```html
<svg viewBox="0 0 600 300">
  <path d="M80 220 H520" stroke="#334155" />
  <foreignObject x="350" y="80" width="90" height="40">
    <div xmlns="http://www.w3.org/1999/xhtml" class="math-label">\(v_{M}\)</div>
  </foreignObject>
</svg>
```

显示/更新后对 SVG 容器执行：

```js
await typesetMath(document.querySelector('svg').parentElement);
```

## 6. Canvas 标注

Canvas 只画图形、轨迹、箭头，不画公式文字：

```html
<div class="sim-stage">
  <canvas id="scene"></canvas>
  <div class="formula-overlay" id="ball-velocity-label">\(v_{m}\)</div>
  <div class="formula-overlay" id="trough-velocity-label">\(v_{M}\)</div>
</div>
```

用 CSS/JS 调整 overlay 的 `left/top`，不要用 `ctx.fillText('vM')`。

## 7. 源码扫描自检

交付前至少扫描以下反模式：

```js
function scanFormulaTypographySource(html) {
  return {
    hasDollarMath: /(^|[^\\])\$[^$]+\$/.test(html),
    hasUnicodeSuperSub: /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]/.test(html),
    hasSubSupTags: /<(sub|sup)\b/i.test(html),
    hasCanvasFormulaText: /fillText\s*\(\s*['\"`](v[mM]|v0|P_x|p[mM]|m\/s|kg\/m)/.test(html),
    hasBareVmInVisibleTemplate: />[^<]*(vm|vM|v0|m\/s|kg\/m3|kg\/m³)[^<]*</.test(html)
  };
}
```

这只是初筛，最终还必须做交互 smoke。

动态步骤提示也要扫描。以下写法是失败项：

```js
tip.innerText = '读取 V₁';
tip.textContent = '测量 V₂';
```

应改成：

```js
await setMixedMathText(tip, '读取 \\(V_{1}\\)');
```

密度读数也不要拼 Unicode 单位：

```js
// Bad
rhoLabel.textContent = `${rho.toFixed(2)} g/cm³`;

// Good
await setDensityValue(rhoLabel, rho.toFixed(2), 'g/cm^3');
```

静态图例端点也一样：

```html
<!-- Bad -->
<span>1.2 g/cm³</span>
<span>8.0 g/cm³</span>

<!-- Good -->
<span>\(1.2\,\mathrm{g/cm^3}\)</span>
<span>\(8.0\,\mathrm{g/cm^3}\)</span>
```

## 8. 不过度约束扫描

公式排版只接管物理语义内容。普通 UI 文案、选项编号、英文缩写不应被包成 MathJax。

```js
function stripScriptStyle(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
}

function scanNonOverconstraint(html) {
  const visibleHtml = stripScriptStyle(html);
  return {
    optionLettersMathJax: /\\\(\s*[ABCD]\s*\\\)/.test(visibleHtml),
    uiWordsMathJax: /\\\(\s*(Start|Reset|AI|HTML|CSS|SVG|Canvas)\s*\\\)/i.test(visibleHtml),
    sourceOnlyIdentifiersOk: /\b(val-vm|label-vM|const vM|vmx)\b/.test(html)
  };
}
```

如果源码里出现 `vm/vM` 但只在 CSS class、DOM id、JS 变量名中出现，不算失败。失败只针对用户画面可见的裸变量、裸单位，或把非物理 UI 文案错误包成公式。
