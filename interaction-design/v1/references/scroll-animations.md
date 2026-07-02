# Scroll Animations Reference (Vanilla JS)

## IntersectionObserver — Viewport Reveal

The browser-native API for detecting when elements enter/leave the viewport. No library needed.

### Basic Reveal on Scroll

```html
<style>
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>

<div class="reveal">Section 1 Content</div>
<div class="reveal">Section 2 Content</div>
<div class="reveal">Section 3 Content</div>

<script>
function initReveal(selector = '.reveal', options = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -60px 0px',
    triggerOnce = true
  } = options;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (triggerOnce) observer.unobserve(entry.target);
      } else if (!triggerOnce) {
        entry.target.classList.remove('visible');
      }
    });
  }, { threshold, rootMargin });

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
  return observer;
}

initReveal();
</script>
```

### Staggered List Reveal

```html
<style>
  .stagger-item {
    opacity: 0;
    transform: translateX(-20px);
    transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .stagger-item.visible {
    opacity: 1;
    transform: translateX(0);
  }
</style>

<ul id="scrollList">
  <li class="stagger-item">Item 1</li>
  <li class="stagger-item">Item 2</li>
  <li class="stagger-item">Item 3</li>
  <li class="stagger-item">Item 4</li>
  <li class="stagger-item">Item 5</li>
</ul>

<script>
function initStaggerReveal(containerSelector, itemSelector) {
  const container = document.querySelector(containerSelector);
  const items = container.querySelectorAll(itemSelector);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        items.forEach((item, i) => {
          setTimeout(() => item.classList.add('visible'), i * 100);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(container);
}

initStaggerReveal('#scrollList', '.stagger-item');
</script>
```

### Text Word-by-Word Reveal

```html
<style>
  .word-reveal .word {
    display: inline-block;
    margin-right: 6px;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .word-reveal.visible .word {
    opacity: 1;
    transform: translateY(0);
  }
</style>

<p class="word-reveal" id="textReveal" data-text="This is a beautiful animated sentence">
</p>

<script>
function initTextReveal(selector) {
  const el = document.querySelector(selector);
  const text = el.dataset.text;
  el.innerHTML = text.split(' ')
    .map((w, i) => `<span class="word" style="transition-delay:${i * 50}ms">${w}</span>`)
    .join('');

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      el.classList.add('visible');
      observer.unobserve(el);
    }
  }, { threshold: 0.5 });

  observer.observe(el);
}

initTextReveal('#textReveal');
</script>
```

### Clip-Path Reveal

```html
<style>
  .clip-reveal {
    clip-path: inset(0 100% 0 0);
    transition: clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .clip-reveal.visible {
    clip-path: inset(0 0% 0 0);
  }
</style>

<div class="clip-reveal">
  <img src="photo.jpg" alt="" style="width:100%;border-radius:12px;" />
</div>

<script>
initReveal('.clip-reveal');
</script>
```

---

## Scroll Progress Indicator

```html
<style>
  .scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: #2563eb;
    z-index: 9999;
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 0.1s linear;
  }
</style>

<div class="scroll-progress" id="scrollProgress"></div>

<script>
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    bar.style.transform = `scaleX(${progress})`;
  }, { passive: true });
}

initScrollProgress();
</script>
```

---

## Parallax Scrolling

### Pure CSS Parallax

```html
<style>
  .parallax-container {
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
    perspective: 10px;
  }
  .parallax-bg {
    position: absolute;
    inset: 0;
    transform: translateZ(-10px) scale(2);
    z-index: -1;
  }
  .parallax-content {
    position: relative;
    transform: translateZ(0);
    z-index: 1;
  }
</style>

<div class="parallax-container">
  <img class="parallax-bg" src="bg.jpg" alt="" />
  <div class="parallax-content">
    <h1>Content on top</h1>
  </div>
</div>
```

### JS Parallax (Simple)

```html
<style>
  .parallax-section {
    position: relative;
    height: 100vh;
    overflow: hidden;
  }
  .parallax-image {
    position: absolute;
    inset: -20% 0;
    width: 100%;
    height: 140%;
    object-fit: cover;
  }
</style>

<section class="parallax-section" id="parallaxSec">
  <img class="parallax-image" id="parallaxImage" src="bg.jpg" alt="" />
  <div style="position:relative;z-index:1;padding:100px 40px;">
    <h1>Welcome</h1>
  </div>
</section>

<script>
function initSimpleParallax(imageId, speed = 0.3) {
  const img = document.getElementById(imageId);

  window.addEventListener('scroll', () => {
    const rect = img.parentElement.getBoundingClientRect();
    const scrolled = -rect.top * speed;
    img.style.transform = `translateY(${scrolled}px)`;
  }, { passive: true });
}

initSimpleParallax('parallaxImage', 0.3);
</script>
```

### GSAP ScrollTrigger Parallax

```html
<section id="gsapParallax" style="position:relative;overflow:hidden;height:100vh;">
  <img id="gsapParaBg" src="bg.jpg" style="position:absolute;inset:0;width:100%;height:130%;object-fit:cover;" />
  <div style="position:relative;z-index:1;padding:80px 40px;">
    <h2 class="para-content">Fade in block 1</h2>
    <p class="para-content">Fade in block 2</p>
  </div>
</section>

<script>
gsap.registerPlugin(ScrollTrigger);

gsap.to('#gsapParaBg', {
  yPercent: -15,
  ease: 'none',
  scrollTrigger: {
    trigger: '#gsapParallax',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
});

gsap.from('.para-content', {
  opacity: 0,
  y: 40,
  stagger: 0.15,
  duration: 0.8,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#gsapParallax',
    start: 'top 75%',
    toggleActions: 'play none none reverse'
  }
});
</script>
```

---

## Scroll-Linked Animations (with Anime.js)

### Progress-Mapped Animation

```html
<div id="scrollAnimContainer" style="height:200vh;padding:100px 40px;">
  <div style="position:sticky;top:50%;display:flex;justify-content:center;">
    <div id="scrollBox" style="width:80px;height:80px;background:#3b82f6;border-radius:12px;"></div>
  </div>
</div>

<script>
function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

window.addEventListener('scroll', () => {
  const container = document.getElementById('scrollAnimContainer');
  const box = document.getElementById('scrollBox');
  const rect = container.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1,
    -rect.top / (rect.height - window.innerHeight)
  ));

  const x = mapRange(progress, 0, 1, -150, 150);
  const rotate = mapRange(progress, 0, 1, 0, 360);
  const hue = mapRange(progress, 0, 1, 217, 330);

  box.style.transform = `translateX(${x}px) rotate(${rotate}deg)`;
  box.style.background = `hsl(${hue}, 80%, 55%)`;
}, { passive: true });
</script>
```

---

## Horizontal Scroll Section

```html
<style>
  .hscroll-wrapper {
    height: 300vh;
    position: relative;
  }
  .hscroll-sticky {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
  }
  .hscroll-track {
    display: flex;
    height: 100%;
    width: max-content;
  }
  .hscroll-panel {
    width: 100vw;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
  }
</style>

<div class="hscroll-wrapper" id="hscrollWrap">
  <div class="hscroll-sticky">
    <div class="hscroll-track" id="hscrollTrack">
      <div class="hscroll-panel" style="background:#dbeafe;">Panel 1</div>
      <div class="hscroll-panel" style="background:#dcfce7;">Panel 2</div>
      <div class="hscroll-panel" style="background:#fef9c3;">Panel 3</div>
    </div>
  </div>
</div>

<script>
function initHorizontalScroll() {
  const wrapper = document.getElementById('hscrollWrap');
  const track = document.getElementById('hscrollTrack');
  const panels = track.querySelectorAll('.hscroll-panel');
  const totalWidth = (panels.length - 1) * window.innerWidth;

  window.addEventListener('scroll', () => {
    const rect = wrapper.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1,
      -rect.top / (wrapper.offsetHeight - window.innerHeight)
    ));
    track.style.transform = `translateX(${-progress * totalWidth}px)`;
  }, { passive: true });
}

initHorizontalScroll();
</script>
```

---

## Sticky Scroll Sections

```html
<style>
  .sticky-section {
    height: 200vh;
    position: relative;
  }
  .sticky-content {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.1s ease, transform 0.1s ease;
  }
</style>

<section class="sticky-section" id="stickySection">
  <div class="sticky-content" id="stickyContent">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:960px;padding:40px;">
      <div>
        <h2>Title</h2>
        <p>Description text</p>
      </div>
      <div>
        <img src="image.jpg" alt="" style="border-radius:12px;width:100%;" />
      </div>
    </div>
  </div>
</section>

<script>
function initStickyFade(sectionId, contentId) {
  const section = document.getElementById(sectionId);
  const content = document.getElementById(contentId);

  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1,
      -rect.top / (section.offsetHeight - window.innerHeight)
    ));

    if (progress > 0.6) {
      const fade = 1 - (progress - 0.6) / 0.4;
      content.style.opacity = Math.max(0, fade);
      content.style.transform = `scale(${0.8 + 0.2 * fade})`;
    } else {
      content.style.opacity = 1;
      content.style.transform = 'scale(1)';
    }
  }, { passive: true });
}

initStickyFade('stickySection', 'stickyContent');
</script>
```

---

## Scroll Snap

```html
<style>
  .snap-container {
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
    height: 100vh;
    scroll-behavior: smooth;
  }
  .snap-page {
    scroll-snap-align: start;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: bold;
  }
</style>

<div class="snap-container">
  <section class="snap-page" style="background:#dbeafe;">Page 1</section>
  <section class="snap-page" style="background:#dcfce7;">Page 2</section>
  <section class="snap-page" style="background:#fef9c3;">Page 3</section>
</div>
```

---

## Performance Best Practices

1. **Always add `{ passive: true }`** to `scroll` / `touchmove` event listeners
2. **Throttle scroll handlers** — browser fires scroll events at ~60fps; use `requestAnimationFrame` to batch updates:

```js
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      // do scroll work here
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

3. **Prefer IntersectionObserver** over scroll-position checks — it's off-main-thread and more efficient
4. **Use `transform` only** — never animate `top`, `left`, `width`, `height` during scroll
5. **Use `will-change: transform`** sparingly — add before animation, remove after
6. **GSAP ScrollTrigger** automatically batches and throttles — prefer it for complex scroll animations
7. **Test on low-end devices** — scroll animations are the most common source of jank

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .stagger-item, .clip-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    clip-path: none !important;
  }
  .scroll-progress { display: none; }
  .parallax-image { transform: none !important; }
}
```
