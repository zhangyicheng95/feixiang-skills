---
name: interaction-design
description: Design and implement microinteractions, motion design, transitions, and user feedback patterns using vanilla HTML/CSS/JS + Anime.js/GSAP. Use when adding polish to UI interactions, implementing loading states, or creating delightful user experiences in static HTML pages.
---

# Interaction Design (Vanilla JS + Anime.js/GSAP)

Create engaging, intuitive interactions through motion, feedback, and thoughtful state transitions — using only vanilla HTML/CSS/JavaScript, Anime.js, and GSAP. No React, no frameworks.

## When to Use This Skill

- Adding microinteractions to enhance user feedback
- Implementing smooth page and component transitions
- Designing loading states and skeleton screens
- Creating gesture-based interactions (drag, swipe)
- Building notification and toast systems
- Implementing drag-and-drop interfaces
- Adding scroll-triggered animations
- Designing hover and focus states
- Enhancing educational courseware with interactive elements

## Technology Stack

| Technology | Role | CDN |
|-----------|------|-----|
| **Vanilla JS (ES6+)** | Core interaction logic | N/A |
| **CSS3** | Transitions, keyframes, hover/focus states | N/A |
| **Anime.js** | Lightweight animation (entry, stagger, number) | `https://metis-online.fbcontent.cn/metis-misc/zZZY40t7WJC7UdQCPACm.js` |
| **GSAP** | Complex timeline animations, ScrollTrigger | `https://metis-online.fbcontent.cn/metis-misc/OttLWDhjhTYFN64hB5VKG.js` |
| **p5.js** | Creative coding, math visualization | (按需引入) |

> ⚠️ **禁止使用** React、Vue、framer-motion 等框架。所有代码必须能在单个 HTML 文件的 `<script>` 标签中直接运行。

## Core Principles

### 1. Purposeful Motion

Motion should communicate, not decorate:

- **Feedback**: Confirm user actions occurred (button press → scale bounce)
- **Orientation**: Show where elements come from/go to (slide in from direction of trigger)
- **Focus**: Direct attention to important changes (pulse on new content)
- **Continuity**: Maintain context during transitions (shared element morph)

### 2. Timing Guidelines

| Duration | Use Case | Example |
|----------|----------|---------|
| 100–150ms | Micro-feedback (hovers, clicks) | Button scale on press |
| 200–300ms | Small transitions (toggles, dropdowns) | Answer reveal, tab switch |
| 300–500ms | Medium transitions (modals, page changes) | Card flip, panel slide |
| 500ms+ | Complex choreographed animations | Staggered list entry, step-by-step reveal |

### 3. Easing Functions

```css
/* Standard easings — copy into <style> */
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Decelerate — entering elements */
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);       /* Accelerate — exiting elements */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* Both — moving between positions */
  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);     /* Overshoot — playful bounce */
}
```

| Easing | When to Use |
|--------|------------|
| `--ease-out` | Elements entering the viewport, dropdowns opening |
| `--ease-in` | Elements leaving, modals closing |
| `--ease-in-out` | Elements moving from A to B (reposition) |
| `--spring` | Playful interactions: button bounce, card flip, drag release |

### 4. Performance Rules

```css
/* ✅ ONLY animate these two properties for smooth 60fps */
.animated {
  transition: transform 0.3s var(--ease-out),
              opacity 0.3s var(--ease-out);
}

/* ❌ NEVER animate these — they cause reflow/repaint */
/* width, height, top, left, right, bottom, margin, padding, border-width */
```

- Use `transform: translateY()` instead of `top`
- Use `transform: scale()` instead of `width/height`
- Use `opacity` instead of `visibility` for fade effects
- Add `will-change: transform` only on elements that will definitely animate, remove after animation

## Quick Start: Button Microinteraction

```html
<style>
  .btn-interactive {
    padding: 8px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s var(--spring),
                box-shadow 0.15s ease-out;
  }
  .btn-interactive:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  .btn-interactive:active {
    transform: scale(0.96);
    box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
  }
</style>

<button class="btn-interactive">Click Me</button>
```

## Interaction Patterns

### 1. Click-to-Reveal (点击展开/收起)

```html
<style>
  .reveal-content {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.4s var(--ease-out),
                opacity 0.3s var(--ease-out);
  }
  .reveal-content.active {
    max-height: 500px;
    opacity: 1;
  }
</style>

<button onclick="this.nextElementSibling.classList.toggle('active')">
  Show Answer ▼
</button>
<div class="reveal-content">
  <p>Answer content here...</p>
</div>
```

### 2. Staggered Entry (错位入场动画)

```html
<div class="stagger-container">
  <div class="stagger-item">Item 1</div>
  <div class="stagger-item">Item 2</div>
  <div class="stagger-item">Item 3</div>
</div>

<script>
anime({
  targets: '.stagger-item',
  translateY: [30, 0],
  opacity: [0, 1],
  delay: anime.stagger(100, { start: 200 }),
  duration: 500,
  easing: 'cubicBezier(0.16, 1, 0.3, 1)'
});
</script>
```

### 3. Step-by-Step Reveal (逐步展示)

```html
<style>
  .step { opacity: 0; transform: translateX(-20px); }
  .step.visible {
    opacity: 1;
    transform: translateX(0);
    transition: all 0.4s var(--ease-out);
  }
</style>

<div id="steps">
  <div class="step">Step 1: ...</div>
  <div class="step">Step 2: ...</div>
  <div class="step">Step 3: ...</div>
</div>
<button onclick="revealNextStep()">Next Step →</button>

<script>
let currentStep = 0;
function revealNextStep() {
  const steps = document.querySelectorAll('.step');
  if (currentStep < steps.length) {
    steps[currentStep].classList.add('visible');
    currentStep++;
  }
}
</script>
```

### 4. Shake on Error (错误抖动反馈)

```html
<style>
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
  .shake { animation: shake 0.4s ease-out; }
  .input-error { border-color: #ef4444 !important; }
</style>

<script>
function showError(inputEl) {
  inputEl.classList.add('shake', 'input-error');
  inputEl.addEventListener('animationend', () => {
    inputEl.classList.remove('shake');
  }, { once: true });
}
</script>
```

### 5. Success Feedback (成功反馈动画)

```html
<style>
  @keyframes checkmark {
    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
    50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  .success-icon {
    display: inline-block;
    color: #22c55e;
    animation: checkmark 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
</style>

<script>
function showSuccess(container) {
  container.innerHTML = '<span class="success-icon">✓ Correct!</span>';
}
</script>
```

### 6. Card Hover Effect (卡片悬浮效果)

```html
<style>
  .card {
    padding: 20px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: transform 0.25s var(--ease-out),
                box-shadow 0.25s var(--ease-out);
  }
  .card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  }
</style>
```

### 7. Number Counter Animation (数字滚动动画)

```html
<span id="counter">0</span>

<script>
anime({
  targets: { value: 0 },
  value: 100,
  round: 1,
  duration: 1500,
  easing: 'easeOutExpo',
  update: function(anim) {
    document.getElementById('counter').textContent = anim.animations[0].currentValue;
  }
});
</script>
```

### 8. Toast Notification (轻量提示)

```html
<style>
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #1e293b;
    color: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    transform: translateY(100px);
    opacity: 0;
    transition: transform 0.4s var(--spring),
                opacity 0.3s ease-out;
    z-index: 1000;
  }
  .toast.show {
    transform: translateY(0);
    opacity: 1;
  }
</style>

<script>
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}
</script>
```

### 9. Drag and Drop (拖拽排序)

```html
<style>
  .draggable {
    padding: 12px;
    margin: 8px 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: grab;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .draggable.dragging {
    opacity: 0.5;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    transform: scale(1.02);
  }
  .drop-zone {
    min-height: 48px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    transition: border-color 0.2s, background 0.2s;
  }
  .drop-zone.drag-over {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
</style>

<script>
document.querySelectorAll('.draggable').forEach(el => {
  el.draggable = true;
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', el.dataset.id);
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
});

document.querySelectorAll('.drop-zone').forEach(zone => {
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const dragged = document.querySelector(`[data-id="${id}"]`);
    if (dragged) zone.appendChild(dragged);
  });
});
</script>
```

### 10. Flip Card (翻转卡片)

```html
<style>
  .flip-card {
    width: 200px; height: 260px;
    perspective: 800px;
    cursor: pointer;
  }
  .flip-inner {
    width: 100%; height: 100%;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-style: preserve-3d;
    position: relative;
  }
  .flip-card.flipped .flip-inner { transform: rotateY(180deg); }
  .flip-front, .flip-back {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .flip-front { background: #3b82f6; color: white; }
  .flip-back {
    background: #f0f9ff; color: #1e40af;
    transform: rotateY(180deg);
  }
</style>

<div class="flip-card" onclick="this.classList.toggle('flipped')">
  <div class="flip-inner">
    <div class="flip-front">Question?</div>
    <div class="flip-back">Answer!</div>
  </div>
</div>
```

## CSS Animation Patterns

### Keyframe Animations

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes scaleIn {
  from { transform: scale(0.8); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.animate-fadeInUp  { animation: fadeInUp 0.4s var(--ease-out) forwards; }
.animate-pulse     { animation: pulse 2s ease-in-out infinite; }
.animate-spin      { animation: spin 1s linear infinite; }
.animate-bounce    { animation: bounce 1s ease-in-out infinite; }
.animate-scaleIn   { animation: scaleIn 0.3s var(--spring) forwards; }
```

### CSS Transitions Cookbook

```css
/* Hover lift */
.hover-lift {
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

/* Press shrink */
.press-shrink:active {
  transform: scale(0.96);
  transition: transform 0.1s ease;
}

/* Focus glow */
.focus-glow:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
  transition: box-shadow 0.15s ease;
}

/* Smooth color change */
.color-transition {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

## Accessibility

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

## Best Practices

1. **Performance First**: Only animate `transform` and `opacity` for smooth 60fps
2. **Reduced Motion**: Always include `prefers-reduced-motion` media query
3. **Consistent Timing**: Use the timing scale (100/200/300/500ms) consistently
4. **Natural Physics**: Prefer `--spring` easing for playful UI, `--ease-out` for functional UI
5. **Interruptible**: Allow users to cancel or skip long animations
6. **No Blocking**: Never prevent user input during animations
7. **Immediate Feedback**: Hover/active states must respond within 100ms
8. **Purposeful**: Every animation should serve feedback, orientation, focus, or continuity — not decoration

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Janky animation | Animating `width`/`height`/`top`/`left` | Use `transform` and `opacity` only |
| Animation fires on page load | CSS transition on initial render | Add class via JS after load, or use `anime.js` |
| Click-through during animation | Animated element blocks interaction | Set `pointer-events: none` during exit animation |
| Flicker on first hover | No initial transform value | Set `transform: translateY(0)` as default |
| Animation not smooth on mobile | Too many animated elements | Reduce count, use `will-change` sparingly |

## Reference Files

For detailed patterns and code templates, see:

- **[references/microinteraction-patterns.md](references/microinteraction-patterns.md)** — Button states, form feedback, toast, confirmation, progress indicators
- **[references/animation-libraries.md](references/animation-libraries.md)** — Anime.js and GSAP API reference with common usage patterns
- **[references/scroll-animations.md](references/scroll-animations.md)** — IntersectionObserver reveals, parallax, scroll-linked animations

</skill-content>

<skill-files>
以下是本 Skill 的附件文件列表。如需使用，请引用完整的 CDN URL。

| 文件路径 | CDN URL |
|---------|----------|
| references/animation-libraries.md | https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/interaction-design/v1/references/animation-libraries.md |
| references/microinteraction-patterns.md | https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/interaction-design/v1/references/microinteraction-patterns.md |
| references/scroll-animations.md | https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/interaction-design/v1/references/scroll-animations.md |
</skill-files>
