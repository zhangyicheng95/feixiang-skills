/**
 * stroke-card · 一行标签即用的笔顺展示组件（Web Component）
 * ─────────────────────────────────────────────
 * 目的：**根治 LLM 生成 HTML 时使用两套数据源的问题**
 *       — LLM 只需要写 <stroke-card char="学"></stroke-card>
 *       — 所有笔画名称展示（字头/画数/逐笔/tier 徽章/提示文本）
 *         **全部从 window.getStrokeData 统一读取**
 *       — LLM 不必也不应在 HTML 任何位置硬写笔画名
 *
 * 引入（必须与 stroke-loader.js 同页加载）：
 *   <script src=".../v42/templates/stroke-loader.js"></script>
 *   <script src=".../v42/templates/stroke-card.js"></script>
 *
 * 使用：
 *   <stroke-card char="学"></stroke-card>
 *   <stroke-card char="曼" size="large"></stroke-card>
 *   <stroke-card char="写" layout="horizontal" show-tips="false"></stroke-card>
 *
 * 属性（可选）：
 *   char         （必填）：要展示的汉字
 *   size         "small" | "default" | "large"
 *   layout       "vertical"（默认，上字头下笔顺） | "horizontal"（左字头右笔顺）
 *   show-tips    "true"（默认） | "false" —— 是否显示"第 N 笔"徽章
 *   show-tier    "true"（默认） | "false" —— 是否显示"教材权威/待验证"徽章
 *   show-strict  "true" —— 严格模式：非 tier=textbook 不展示
 *   show-missing "true"（默认）—— 字表外字显示"暂无数据"
 */
(function (global) {
  'use strict';

  const STYLE = `
    :host { display: inline-block; vertical-align: top; }
    .card { display: inline-flex; flex-direction: column; align-items: center;
            padding: 16px; background: #fff; border: 1px solid #e5e7eb;
            border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    .card.extended { border: 1px dashed #bdc3c7; }
    .card.missing { color: #9ca3af; font-style: italic; }
    .ch { font-size: 64px; line-height: 1; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
    .meta { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
    .count { color: #e74c3c; font-size: 14px; font-weight: 600; }
    .count.dim { color: #6b7280; }
    /* v11 两级徽章 */
    .tier { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
    .tier.textbook { background: #d1fae5; color: #047857; }     /* 小学范围内 */
    .tier.extended { background: #fef3c7; color: #92400e; }     /* 小学范围外 */
    .strokes { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
               max-width: 420px; }
    .step { display: inline-flex; align-items: center; padding: 4px 10px;
            background: #f3f4f6; border-radius: 6px; font-size: 13px; color: #374151; }
    .step .idx { color: #9ca3af; margin-right: 4px; font-size: 11px; }
    :host([size="small"]) .ch { font-size: 40px; }
    :host([size="small"]) .step { font-size: 11px; padding: 2px 6px; }
    :host([size="large"]) .ch { font-size: 96px; }
    :host([size="large"]) .step { font-size: 15px; padding: 6px 12px; }
    :host([layout="horizontal"]) .card { flex-direction: row; gap: 20px; align-items: flex-start; }
    :host([layout="horizontal"]) .left { display: flex; flex-direction: column; align-items: center; }
  `;

  class StrokeCard extends HTMLElement {
    static get observedAttributes() {
      return ['char', 'size', 'layout', 'show-tips', 'show-tier', 'show-strict', 'show-missing'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._rendered = false;
    }

    connectedCallback() {
      if (global._strokeLoader && global._strokeLoader.getStatus() === 'ready') {
        this._render();
      } else {
        global.addEventListener('stroke-data-ready', () => this._render(), { once: true });
        this._renderLoading();
      }
    }

    attributeChangedCallback() {
      if (this._rendered && global._strokeLoader &&
          global._strokeLoader.getStatus() === 'ready') {
        this._render();
      }
    }

    _renderLoading() {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="card missing">加载中...</div>`;
    }

    _render() {
      const ch = (this.getAttribute('char') || '').trim();
      if (!ch) {
        this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="card missing">未指定 char 属性</div>`;
        return;
      }

      const d = global.getStrokeData(ch);
      const showTips = this.getAttribute('show-tips') !== 'false';
      const showTier = this.getAttribute('show-tier') !== 'false';
      const showStrict = this.getAttribute('show-strict') === 'true';
      const showMissing = this.getAttribute('show-missing') !== 'false';

      // 严格模式：非教材字拒绝展示
      if (showStrict && d.source === 'db' && d.tier !== 'textbook') {
        this.shadowRoot.innerHTML = `
          <style>${STYLE}</style>
          <div class="card missing">
            <div class="ch">${ch}</div>
            <div>不在小学教材字表</div>
          </div>`;
        this._rendered = true;
        return;
      }

      if (d.source !== 'db') {
        const msg = d.source === 'missing' ? '暂无该字笔顺数据'
                  : d.source === 'loading' ? '加载中...'
                  : '数据异常';
        this.shadowRoot.innerHTML = showMissing
          ? `<style>${STYLE}</style><div class="card missing"><div class="ch">${ch}</div><div>${msg}</div></div>`
          : '';
        this._rendered = true;
        return;
      }

      // 正常渲染：所有笔画名称从 d.strokes 统一读取
      // v11 两级徽章：小学范围内 / 小学范围外
      let tierHtml = '';
      if (showTier) {
        tierHtml = d.tier === 'textbook'
          ? '<span class="tier textbook">✓ 小学范围内</span>'
          : '<span class="tier extended">⚠ 小学范围外</span>';
      }

      const stepsHtml = showTips
        ? d.strokes.map((s, i) =>
            `<span class="step"><span class="idx">${i + 1}.</span>${s}</span>`
          ).join('')
        : '';

      const layout = this.getAttribute('layout') === 'horizontal' ? 'horizontal' : 'vertical';

      this.shadowRoot.innerHTML = `
        <style>${STYLE}</style>
        <div class="card ${d.tier}">
          <div class="left">
            <div class="ch">${ch}</div>
            <div class="meta">
              <span class="count ${d.tier === 'extended' ? 'dim' : ''}">${d.count} 画</span>
              ${tierHtml}
            </div>
          </div>
          <div class="strokes">${stepsHtml}</div>
        </div>
      `;

      this._rendered = true;
    }
  }

  if (!global.customElements.get('stroke-card')) {
    global.customElements.define('stroke-card', StrokeCard);
  }

  // ─────────────────────────────────────────
  // <stroke-tier char="X"> 独立徽章组件
  // 场景：LLM 想在页面**组件外**（如标题、说明、列表项）显示"小学范围内/外"标签
  // 用法：<stroke-tier char="讯"></stroke-tier>
  //       → 自动调用 isTextbookChar，显示统一徽章
  // 严禁 LLM 自己在页面上写 "✓ 小学范围内" 或 "⚠ 小学范围外" 文本
  // ─────────────────────────────────────────
  class StrokeTier extends HTMLElement {
    static get observedAttributes() { return ['char']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() {
      if (global._strokeLoader && global._strokeLoader.getStatus() === 'ready') this._render();
      else global.addEventListener('stroke-data-ready', () => this._render(), { once: true });
    }
    attributeChangedCallback() {
      if (global._strokeLoader && global._strokeLoader.getStatus() === 'ready') this._render();
    }
    _render() {
      const ch = (this.getAttribute('char') || '').trim();
      if (!ch) { this.shadowRoot.innerHTML = ''; return; }
      const isTB = global.isTextbookChar(ch);
      const style = `
        :host { display: inline-block; }
        .b { font-size: 11px; padding: 2px 8px; border-radius: 10px;
             font-family: 'PingFang SC', sans-serif; vertical-align: middle; }
        .b.textbook { background: #d1fae5; color: #047857; }
        .b.extended { background: #fef3c7; color: #92400e; }
        .b.unknown  { background: #f3f4f6; color: #6b7280; }
      `;
      if (isTB === null) {
        this.shadowRoot.innerHTML = `<style>${style}</style><span class="b unknown">· 加载中</span>`;
        return;
      }
      const cls = isTB ? 'textbook' : 'extended';
      const text = isTB ? '✓ 小学范围内' : '⚠ 小学范围外';
      this.shadowRoot.innerHTML = `<style>${style}</style><span class="b ${cls}">${text}</span>`;
    }
  }
  if (!global.customElements.get('stroke-tier')) {
    global.customElements.define('stroke-tier', StrokeTier);
  }

  global._strokeCard = { version: '1.1.0' };
})(typeof window !== 'undefined' ? window : this);
