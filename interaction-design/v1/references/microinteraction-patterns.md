# Microinteraction Patterns Reference (Vanilla JS)

## Button States

### Loading Button

```html
<style>
  .btn-stateful {
    position: relative;
    padding: 8px 20px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;
    min-width: 140px;
    transition: background-color 0.2s ease;
  }
  .btn-stateful:disabled {
    cursor: not-allowed;
    opacity: 0.85;
  }
  .btn-stateful .btn-text {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .btn-stateful .btn-text.hidden {
    opacity: 0;
    transform: translateY(-10px);
    position: absolute;
  }
  .btn-stateful .btn-text.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

<button class="btn-stateful" id="loadBtn" onclick="handleLoadClick()">
  <span class="btn-text visible" data-state="idle">Submit</span>
  <span class="btn-text hidden" data-state="loading">
    <span class="spinner"></span> Processing...
  </span>
</button>

<script>
function handleLoadClick() {
  const btn = document.getElementById('loadBtn');
  const idleText = btn.querySelector('[data-state="idle"]');
  const loadingText = btn.querySelector('[data-state="loading"]');

  btn.disabled = true;
  idleText.classList.replace('visible', 'hidden');
  loadingText.classList.replace('hidden', 'visible');

  setTimeout(() => {
    btn.disabled = false;
    loadingText.classList.replace('visible', 'hidden');
    idleText.classList.replace('hidden', 'visible');
  }, 2000);
}
</script>
```

### Success / Error State Button

```html
<style>
  .btn-submit {
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    min-width: 150px;
    font-size: 14px;
    transition: background-color 0.3s ease, transform 0.15s ease;
  }
  .btn-submit[data-state="idle"]    { background: #2563eb; }
  .btn-submit[data-state="loading"] { background: #2563eb; cursor: not-allowed; }
  .btn-submit[data-state="success"] { background: #16a34a; }
  .btn-submit[data-state="error"]   { background: #dc2626; }
</style>

<button class="btn-submit" data-state="idle" id="submitBtn" onclick="handleSubmit()">
  Submit
</button>

<script>
async function handleSubmit() {
  const btn = document.getElementById('submitBtn');
  if (btn.dataset.state === 'loading') return;

  btn.dataset.state = 'loading';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="display:inline-block;vertical-align:middle;margin-right:6px;"></span> Submitting...';

  const success = Math.random() > 0.3;
  await new Promise(r => setTimeout(r, 1500));

  if (success) {
    btn.dataset.state = 'success';
    btn.textContent = '✓ Done!';
    anime({ targets: btn, scale: [1, 1.05, 1], duration: 300, easing: 'easeOutElastic(1, .6)' });
  } else {
    btn.dataset.state = 'error';
    btn.textContent = '✕ Failed';
    anime({ targets: btn, scale: [1, 1.05, 1], duration: 300, easing: 'easeOutElastic(1, .6)' });
  }

  setTimeout(() => {
    btn.dataset.state = 'idle';
    btn.textContent = 'Submit';
    btn.disabled = false;
  }, 2000);
}
</script>
```

## Form Interactions

### Floating Label Input

```html
<style>
  .float-field {
    position: relative;
    margin: 20px 0;
  }
  .float-field input {
    width: 100%;
    padding: 14px 16px 6px;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background: transparent;
  }
  .float-field input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  .float-field label {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 14px;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    background: white;
    padding: 0 4px;
  }
  .float-field input:focus + label,
  .float-field input:not(:placeholder-shown) + label {
    top: 0;
    font-size: 11px;
    color: #2563eb;
  }
</style>

<div class="float-field">
  <input type="text" id="nameInput" placeholder=" " />
  <label for="nameInput">Your Name</label>
</div>
```

### Shake on Error

```html
<style>
  @keyframes shakeInput {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
  .input-wrap { position: relative; }
  .input-wrap.shake { animation: shakeInput 0.4s ease-out; }
  .input-wrap input.has-error {
    border-color: #ef4444;
  }
  .error-msg {
    color: #ef4444;
    font-size: 12px;
    margin-top: 4px;
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .error-msg.show {
    opacity: 1;
    transform: translateY(0);
  }
</style>

<div class="input-wrap" id="emailWrap">
  <input type="email" id="emailInput" placeholder="Email" />
  <div class="error-msg" id="emailError">Please enter a valid email</div>
</div>

<script>
function showInputError(wrapId, errorId) {
  const wrap = document.getElementById(wrapId);
  const input = wrap.querySelector('input');
  const error = document.getElementById(errorId);

  input.classList.add('has-error');
  wrap.classList.add('shake');
  error.classList.add('show');

  wrap.addEventListener('animationend', () => {
    wrap.classList.remove('shake');
  }, { once: true });
}

function clearInputError(wrapId, errorId) {
  const wrap = document.getElementById(wrapId);
  const input = wrap.querySelector('input');
  const error = document.getElementById(errorId);
  input.classList.remove('has-error');
  error.classList.remove('show');
}
</script>
```

### Character Count

```html
<style>
  .textarea-wrap {
    position: relative;
  }
  .textarea-wrap textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    resize: vertical;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease;
  }
  .textarea-wrap textarea:focus {
    border-color: #2563eb;
  }
  .char-count {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 12px;
    color: #9ca3af;
    transition: color 0.2s ease, transform 0.15s ease;
  }
  .char-count.warn  { color: #eab308; }
  .char-count.over  { color: #ef4444; }
</style>

<div class="textarea-wrap">
  <textarea id="msgArea" rows="4" maxlength="280"
    oninput="updateCount()"></textarea>
  <span class="char-count" id="charCount">280</span>
</div>

<script>
function updateCount() {
  const area = document.getElementById('msgArea');
  const counter = document.getElementById('charCount');
  const max = 280;
  const remaining = max - area.value.length;

  counter.textContent = remaining;
  counter.classList.remove('warn', 'over');
  if (remaining < 0) {
    counter.classList.add('over');
  } else if (remaining <= 20) {
    counter.classList.add('warn');
    anime({ targets: counter, scale: [1, 1.15, 1], duration: 200, easing: 'easeOutQuad' });
  }
}
</script>
```

## Feedback Patterns

### Toast Notifications

```html
<style>
  .toast-container {
    position: fixed;
    bottom: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 9999;
  }
  .toast {
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.25s ease;
  }
  .toast.show {
    transform: translateY(0);
    opacity: 1;
  }
  .toast.exit {
    transform: translateX(100px);
    opacity: 0;
    transition: transform 0.3s ease-in, opacity 0.25s ease;
  }
  .toast.success { background: #16a34a; }
  .toast.error   { background: #dc2626; }
  .toast.info    { background: #2563eb; }
</style>

<div class="toast-container" id="toastContainer"></div>

<script>
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.replace('show', 'exit');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}
</script>
```

### Confirmation Button (Double Click to Confirm)

```html
<style>
  .confirm-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  .confirm-btn.idle {
    background: #e5e7eb;
    color: #374151;
  }
  .confirm-btn.pending {
    background: #dc2626;
    color: white;
  }
</style>

<button class="confirm-btn idle" id="deleteBtn" onclick="handleConfirmClick()">
  Delete
</button>

<script>
let confirmTimer = null;

function handleConfirmClick() {
  const btn = document.getElementById('deleteBtn');

  if (btn.classList.contains('pending')) {
    btn.textContent = 'Deleted!';
    btn.disabled = true;
    clearTimeout(confirmTimer);
    anime({ targets: btn, scale: [1, 1.05, 1], duration: 250, easing: 'easeOutQuad' });
  } else {
    btn.classList.replace('idle', 'pending');
    btn.textContent = 'Click again to confirm';
    anime({ targets: btn, scale: [1, 1.03, 1], duration: 200, easing: 'easeOutQuad' });

    confirmTimer = setTimeout(() => {
      btn.classList.replace('pending', 'idle');
      btn.textContent = 'Delete';
    }, 3000);
  }
}
</script>
```

## Navigation Patterns

### Tab Indicator (Sliding Underline)

```html
<style>
  .tab-nav {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #f3f4f6;
    border-radius: 8px;
    position: relative;
  }
  .tab-btn {
    padding: 8px 20px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    position: relative;
    z-index: 1;
    transition: color 0.2s ease;
  }
  .tab-btn.active { color: white; }
  .tab-indicator {
    position: absolute;
    top: 4px;
    left: 0;
    height: calc(100% - 8px);
    background: #2563eb;
    border-radius: 6px;
    z-index: 0;
    transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
</style>

<div class="tab-nav" id="tabNav">
  <div class="tab-indicator" id="tabIndicator"></div>
  <button class="tab-btn active" onclick="switchTab(this, 0)">Tab 1</button>
  <button class="tab-btn" onclick="switchTab(this, 1)">Tab 2</button>
  <button class="tab-btn" onclick="switchTab(this, 2)">Tab 3</button>
</div>

<script>
function switchTab(btn, index) {
  const nav = document.getElementById('tabNav');
  const indicator = document.getElementById('tabIndicator');
  const buttons = nav.querySelectorAll('.tab-btn');

  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  indicator.style.left = btn.offsetLeft + 'px';
  indicator.style.width = btn.offsetWidth + 'px';
}

// Initialize indicator position
window.addEventListener('DOMContentLoaded', () => {
  const firstBtn = document.querySelector('.tab-btn.active');
  const indicator = document.getElementById('tabIndicator');
  indicator.style.left = firstBtn.offsetLeft + 'px';
  indicator.style.width = firstBtn.offsetWidth + 'px';
});
</script>
```

### Hamburger Menu Icon (CSS Transform)

```html
<style>
  .hamburger {
    width: 24px;
    height: 24px;
    position: relative;
    cursor: pointer;
    background: none;
    border: none;
  }
  .hamburger span {
    display: block;
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: currentColor;
    transition: all 0.25s ease;
  }
  .hamburger span:nth-child(1) { top: 25%; }
  .hamburger span:nth-child(2) { top: 50%; transform: translateY(-50%); }
  .hamburger span:nth-child(3) { bottom: 25%; }

  .hamburger.open span:nth-child(1) {
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
  }
  .hamburger.open span:nth-child(2) {
    opacity: 0;
    transform: scaleX(0);
  }
  .hamburger.open span:nth-child(3) {
    bottom: auto;
    top: 50%;
    transform: translateY(-50%) rotate(-45deg);
  }
</style>

<button class="hamburger" onclick="this.classList.toggle('open')" aria-label="Toggle menu">
  <span></span><span></span><span></span>
</button>
```

## Data Interactions

### Like Button with Optimistic Update

```html
<style>
  .like-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 6px 14px;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  .like-btn.liked {
    color: #ef4444;
    border-color: #fecaca;
  }
  .like-btn .heart { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .like-btn.liked .heart { transform: scale(1.2); }
</style>

<button class="like-btn" id="likeBtn" onclick="toggleLike()">
  <span class="heart" id="heartIcon">♡</span>
  <span id="likeCount">42</span>
</button>

<script>
let isLiked = false;
let likeCount = 42;

function toggleLike() {
  const btn = document.getElementById('likeBtn');
  const heart = document.getElementById('heartIcon');
  const countEl = document.getElementById('likeCount');

  isLiked = !isLiked;
  likeCount += isLiked ? 1 : -1;

  btn.classList.toggle('liked', isLiked);
  heart.textContent = isLiked ? '♥' : '♡';
  countEl.textContent = likeCount;

  anime({
    targets: heart,
    scale: [1, 1.4, 1],
    duration: 300,
    easing: 'easeOutElastic(1, .6)'
  });

  anime({
    targets: countEl,
    translateY: isLiked ? [-10, 0] : [10, 0],
    opacity: [0, 1],
    duration: 250,
    easing: 'easeOutQuad'
  });
}
</script>
```

### Progress Bar with Percentage

```html
<style>
  .progress-wrap {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    width: 0%;
    background: #2563eb;
    border-radius: 4px;
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .progress-label {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
  }
</style>

<div class="progress-wrap">
  <div class="progress-bar" id="progressBar"></div>
</div>
<div class="progress-label"><span id="progressLabel">0</span>%</div>

<script>
function setProgress(percent) {
  const bar = document.getElementById('progressBar');
  const label = document.getElementById('progressLabel');
  bar.style.width = percent + '%';

  anime({
    targets: { val: parseInt(label.textContent) },
    val: percent,
    round: 1,
    duration: 600,
    easing: 'easeOutExpo',
    update: (anim) => {
      label.textContent = anim.animations[0].currentValue;
    }
  });
}
</script>
```

### Skeleton Loading

```html
<style>
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 6px;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .skeleton-text    { height: 14px; margin-bottom: 8px; }
  .skeleton-title   { height: 20px; width: 60%; margin-bottom: 12px; }
  .skeleton-avatar  { width: 40px; height: 40px; border-radius: 50%; }
  .skeleton-image   { height: 160px; margin-bottom: 12px; }
</style>

<div style="max-width: 300px; padding: 16px;">
  <div class="skeleton skeleton-image"></div>
  <div class="skeleton skeleton-title"></div>
  <div class="skeleton skeleton-text" style="width:90%"></div>
  <div class="skeleton skeleton-text" style="width:75%"></div>
</div>
```

## Tooltip

```html
<style>
  .tooltip-wrap {
    position: relative;
    display: inline-block;
  }
  .tooltip-text {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: #1e293b;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .tooltip-text::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #1e293b;
  }
  .tooltip-wrap:hover .tooltip-text {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>

<span class="tooltip-wrap">
  Hover me
  <span class="tooltip-text">This is a tooltip</span>
</span>
```

## Modal / Dialog

```html
<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .modal-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }
  .modal-box {
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    transform: scale(0.9) translateY(20px);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.25s ease;
    opacity: 0;
  }
  .modal-overlay.open .modal-box {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
</style>

<div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal-box">
    <h3>Dialog Title</h3>
    <p>Dialog content goes here.</p>
    <button onclick="closeModal()" style="margin-top:12px;">Close</button>
  </div>
</div>

<script>
function openModal()  { document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }
</script>
```
