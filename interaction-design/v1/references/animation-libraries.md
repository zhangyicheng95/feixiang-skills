# Animation Libraries Reference (Vanilla JS)

## Anime.js

Lightweight and flexible animation library for vanilla JS.

> CDN: `https://metis-online.fbcontent.cn/metis-misc/zZZY40t7WJC7UdQCPACm.js`

### Basic Animations

```html
<!-- Fade in -->
<div id="fadeBox" style="opacity:0; padding:20px; background:#3b82f6; color:white; border-radius:8px;">
  Hello World
</div>

<script>
anime({
  targets: '#fadeBox',
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 500,
  easing: 'cubicBezier(0.16, 1, 0.3, 1)'
});
</script>
```

```html
<!-- Gesture-style hover (use CSS for hover, Anime for click) -->
<style>
  .interactive-card {
    padding: 24px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.2s ease;
  }
  .interactive-card:hover {
    transform: scale(1.02) translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
</style>

<div class="interactive-card" onclick="anime({targets:this,scale:[0.96,1],duration:300,easing:'easeOutElastic(1,.5)'})">
  Hover or tap me
</div>
```

```html
<!-- Keyframe / Pulse animation -->
<button id="pulseBtn" style="padding:8px 20px;background:#2563eb;color:white;border:none;border-radius:8px;">
  Click me
</button>

<script>
anime({
  targets: '#pulseBtn',
  scale: [1, 1.05, 1],
  boxShadow: [
    '0 0 0 0 rgba(59, 130, 246, 0.5)',
    '0 0 0 10px rgba(59, 130, 246, 0)',
    '0 0 0 0 rgba(59, 130, 246, 0)'
  ],
  duration: 2000,
  loop: true,
  easing: 'easeInOutSine'
});
</script>
```

### Staggered Children

```html
<ul id="staggerList">
  <li style="opacity:0">Item 1</li>
  <li style="opacity:0">Item 2</li>
  <li style="opacity:0">Item 3</li>
  <li style="opacity:0">Item 4</li>
  <li style="opacity:0">Item 5</li>
</ul>

<script>
anime({
  targets: '#staggerList li',
  opacity: [0, 1],
  translateY: [20, 0],
  delay: anime.stagger(100, { start: 200 }),
  duration: 400,
  easing: 'cubicBezier(0.16, 1, 0.3, 1)'
});
</script>
```

### Timeline (Sequential Animations)

```html
<div id="heroSection">
  <h1 id="heroTitle" style="opacity:0">Welcome</h1>
  <p id="heroSubtitle" style="opacity:0">Discover amazing things</p>
  <button id="heroCta" style="opacity:0">Get Started</button>
</div>

<script>
const tl = anime.timeline({
  easing: 'cubicBezier(0.16, 1, 0.3, 1)'
});

tl.add({
  targets: '#heroTitle',
  opacity: [0, 1],
  translateY: [40, 0],
  duration: 700
})
.add({
  targets: '#heroSubtitle',
  opacity: [0, 1],
  translateY: [30, 0],
  duration: 500
}, '-=300')
.add({
  targets: '#heroCta',
  opacity: [0, 1],
  scale: [0.8, 1],
  duration: 400
}, '-=200');
</script>
```

### Number / Value Animation

```html
<span id="animNumber">0</span>

<script>
anime({
  targets: { val: 0 },
  val: 2500,
  round: 1,
  duration: 1800,
  easing: 'easeOutExpo',
  update: function(anim) {
    document.getElementById('animNumber').textContent =
      anim.animations[0].currentValue.toLocaleString();
  }
});
</script>
```

### SVG Path Animation

```html
<svg width="200" height="200" viewBox="0 0 200 200">
  <path id="svgPath" d="M10,80 Q52.5,10 95,80 T180,80"
    fill="none" stroke="#3b82f6" stroke-width="3"
    stroke-dasharray="300" stroke-dashoffset="300" />
</svg>

<script>
anime({
  targets: '#svgPath',
  strokeDashoffset: [anime.setDashoffset, 0],
  duration: 1500,
  easing: 'easeInOutSine'
});
</script>
```

### Common Easing Reference

| Anime.js Easing | CSS Equivalent | Use Case |
|-----------------|---------------|----------|
| `'cubicBezier(0.16, 1, 0.3, 1)'` | `var(--ease-out)` | Elements entering |
| `'cubicBezier(0.55, 0, 1, 0.45)'` | `var(--ease-in)` | Elements exiting |
| `'cubicBezier(0.65, 0, 0.35, 1)'` | `var(--ease-in-out)` | Repositioning |
| `'easeOutElastic(1, .5)'` | `var(--spring)` (approx) | Playful bounce |
| `'easeOutExpo'` | N/A | Fast start, slow end |
| `'spring(1, 80, 10, 0)'` | N/A | Physics-based spring |
| `'linear'` | `linear` | Continuous rotation |

---

## GSAP (GreenSock)

Industry-standard animation library for complex, performant animations.

> CDN: `https://metis-online.fbcontent.cn/metis-misc/OttLWDhjhTYFN64hB5VKG.js`

### Basic Timeline

```html
<div id="gsapHero">
  <h1 id="gsapTitle">Welcome</h1>
  <p id="gsapSubtitle">Discover amazing things</p>
  <button class="gsap-cta">Get Started</button>
</div>

<script>
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

tl.from('#gsapTitle', {
    y: 50,
    opacity: 0,
    duration: 0.8
  })
  .from('#gsapSubtitle', {
    y: 30,
    opacity: 0,
    duration: 0.6
  }, '-=0.4')
  .from('.gsap-cta', {
    scale: 0.8,
    opacity: 0,
    duration: 0.4
  });
</script>
```

### Stagger

```html
<div class="card-grid">
  <div class="card-item">Card 1</div>
  <div class="card-item">Card 2</div>
  <div class="card-item">Card 3</div>
  <div class="card-item">Card 4</div>
</div>

<script>
gsap.from('.card-item', {
  y: 40,
  opacity: 0,
  duration: 0.6,
  stagger: 0.12,
  ease: 'power2.out'
});
</script>
```

### ScrollTrigger

```html
<section id="parallaxSection" style="position:relative;overflow:hidden;height:100vh;">
  <img id="parallaxImg" src="bg.jpg" style="position:absolute;inset:0;width:100%;height:120%;object-fit:cover;" />
  <div style="position:relative;z-index:1;padding:100px 40px;">
    <div class="content-block" style="margin-bottom:40px;">Block 1</div>
    <div class="content-block">Block 2</div>
  </div>
</section>

<script>
gsap.registerPlugin(ScrollTrigger);

gsap.to('#parallaxImg', {
  yPercent: -20,
  ease: 'none',
  scrollTrigger: {
    trigger: '#parallaxSection',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
});

gsap.from('.content-block', {
  opacity: 0,
  y: 50,
  stagger: 0.2,
  scrollTrigger: {
    trigger: '#parallaxSection',
    start: 'top 80%',
    end: 'top 20%',
    scrub: 1
  }
});
</script>
```

### Text Split Animation

```html
<h1 id="splitHeadline">Hello Beautiful World</h1>

<script>
const heading = document.getElementById('splitHeadline');
const text = heading.textContent;
heading.innerHTML = '';

text.split('').forEach((char, i) => {
  const span = document.createElement('span');
  span.textContent = char === ' ' ? '\u00A0' : char;
  span.style.display = 'inline-block';
  span.style.opacity = '0';
  heading.appendChild(span);
});

gsap.to('#splitHeadline span', {
  opacity: 1,
  y: 0,
  rotateX: 0,
  stagger: 0.03,
  duration: 0.6,
  ease: 'back.out(1.7)',
  from: { y: 40, rotateX: -90 }
});
</script>
```

### GSAP Easing Reference

| GSAP Easing | Description | Use Case |
|-------------|------------|----------|
| `'power1.out'` | Gentle decelerate | Subtle fade-in |
| `'power2.out'` | Medium decelerate | Standard entrance |
| `'power3.out'` | Strong decelerate | Dramatic entrance |
| `'power4.out'` | Very strong decelerate | Hero animations |
| `'back.out(1.7)'` | Overshoot | Playful bounce-in |
| `'elastic.out(1, 0.5)'` | Elastic | Rubber-band effect |
| `'bounce.out'` | Bouncing ball | Gravity-based motion |
| `'expo.out'` | Exponential decelerate | Fast start, very slow end |
| `'none'` | Linear | Scrub/scroll-linked |

---

## CSS Transitions & Keyframes (No Library Needed)

For simple interactions, pure CSS is enough — no JS library required.

### Transitions

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hover lift */
.hover-lift {
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

/* Active press */
.press:active {
  transform: scale(0.96);
  transition: transform 0.1s ease;
}

/* Focus glow */
.focus-glow:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
  transition: box-shadow 0.15s ease;
}

/* Smooth background color */
.color-shift {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

### Keyframes Library

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes slideDown {
  from { max-height: 0; opacity: 0; }
  to   { max-height: 500px; opacity: 1; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-8px); }
  40%      { transform: translateX(8px); }
  60%      { transform: translateX(-6px); }
  80%      { transform: translateX(6px); }
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Utility Classes

```css
.anim-fadeIn      { animation: fadeIn 0.3s ease forwards; }
.anim-fadeInUp    { animation: fadeInUp 0.4s var(--ease-out) forwards; }
.anim-fadeInDown  { animation: fadeInDown 0.4s var(--ease-out) forwards; }
.anim-fadeInLeft  { animation: fadeInLeft 0.4s var(--ease-out) forwards; }
.anim-fadeInRight { animation: fadeInRight 0.4s var(--ease-out) forwards; }
.anim-scaleIn     { animation: scaleIn 0.3s var(--spring) forwards; }
.anim-pulse       { animation: pulse 2s ease-in-out infinite; }
.anim-spin        { animation: spin 1s linear infinite; }
.anim-bounce      { animation: bounce 1s ease-in-out infinite; }
.anim-shake       { animation: shake 0.4s ease-out; }
```

---

## Web Animations API (Native Browser)

For programmatic control without external libraries.

```html
<div id="wapiBox" style="width:80px;height:80px;background:#8b5cf6;border-radius:8px;"></div>

<script>
const box = document.getElementById('wapiBox');

box.animate([
  { transform: 'translateX(0) scale(1)', opacity: 0 },
  { transform: 'translateX(0) scale(1)', opacity: 1, offset: 0.3 },
  { transform: 'translateX(200px) scale(1.1)', opacity: 1 }
], {
  duration: 800,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fill: 'forwards'
});
</script>
```

```html
<!-- Reusable helper function -->
<script>
function animateElement(el, keyframes, options = {}) {
  const defaults = {
    duration: 300,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fill: 'forwards'
  };
  return el.animate(keyframes, { ...defaults, ...options });
}

animateElement(
  document.getElementById('wapiBox'),
  [
    { transform: 'translateX(-100%)', opacity: 0 },
    { transform: 'translateX(0)', opacity: 1 }
  ],
  { duration: 400 }
);
</script>
```

---

## Spring Physics Approximation

CSS cannot do true spring physics, but these `cubic-bezier` approximations produce similar feels:

| Spring Type | cubic-bezier | Feel |
|-------------|-------------|------|
| **Default** | `(0.25, 0.1, 0.25, 1)` | Standard smooth |
| **Gentle** | `(0.2, 0.8, 0.3, 1)` | Soft deceleration |
| **Wobbly** | `(0.34, 1.8, 0.64, 1)` | Strong overshoot |
| **Stiff** | `(0.34, 1.56, 0.64, 1)` | Moderate overshoot |
| **Slow** | `(0.4, 0, 0.2, 1)` | Material-like |
| **Snappy** | `(0.5, 1.8, 0.4, 0.8)` | Quick with bounce |

For true spring physics, use Anime.js `spring()`:

```js
anime({
  targets: '.element',
  translateX: 250,
  easing: 'spring(1, 80, 10, 0)'
  // spring(mass, stiffness, damping, velocity)
});
```

---

## Performance Tips

```css
/* Only animate transform + opacity (GPU-composited, no reflow) */
.performant {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform; /* Use sparingly, remove after animation */
}

/* ❌ Avoid: causes layout recalculation */
.slow {
  transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s, margin 0.3s;
}
```

```js
// Remove will-change after animation completes
anime({
  targets: '.element',
  translateY: [30, 0],
  opacity: [0, 1],
  duration: 500,
  begin: (anim) => {
    anim.animatables.forEach(a => a.target.style.willChange = 'transform, opacity');
  },
  complete: (anim) => {
    anim.animatables.forEach(a => a.target.style.willChange = 'auto');
  }
});
```

---

## Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeAnimate(targets, props) {
  if (prefersReducedMotion) {
    props.duration = 0;
    delete props.delay;
  }
  return anime({ targets, ...props });
}
```
