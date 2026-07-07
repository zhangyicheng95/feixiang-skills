/**
 * 飞象风课件预览壳 — 对齐飞象老师产物预览 UI
 * 外框 100%（顶栏 + 缩略图栏 + 浅灰舞台）；主区居中固定 960×540 画布
 */
(function () {
  'use strict';

  var CANVAS_W = 960;
  var CANVAS_H = 540;
  var STAGE_BG = '#eef1f5';
  var THUMB_SCALE = 120 / CANVAS_W;

  function parseShared() {
    var el = document.querySelector('template.page-shared');
    return el ? el.innerHTML.trim() : '';
  }

  function parsePages() {
    return Array.prototype.slice
      .call(document.querySelectorAll('template.page-data'))
      .map(function (el) {
        return {
          id: Number(el.getAttribute('data-id')) || 0,
          name: el.getAttribute('data-name') || '',
          body: el.innerHTML,
        };
      })
      .sort(function (a, b) {
        return a.id - b.id;
      });
  }

  function buildSrcdoc(page, sharedHead, mode, index, total) {
    var meta =
      'window.__CW_MODE__=' +
      JSON.stringify(mode || 'main') +
      ';window.__CW_PAGE__={id:' +
      (page.id || 0) +
      ',index:' +
      (index || 0) +
      ',total:' +
      (total || 0) +
      ',name:' +
      JSON.stringify(page.name || '') +
      '};';

    var frameFill =
      'document.addEventListener("DOMContentLoaded",function(){var p=window.__CW_PAGE__||{};' +
      'document.querySelectorAll("[data-fx-pageno]").forEach(function(el){el.textContent=(p.index!=null?p.index+1:"")+" / "+(p.total||"");});' +
      'document.querySelectorAll("[data-fx-pagename]").forEach(function(el){if(!el.textContent.trim())el.textContent=p.name||"";});' +
      'document.querySelectorAll("[data-fx-progress]").forEach(function(h){if(h.children.length)return;for(var i=0;i<(p.total||0);i++){var d=document.createElement("i");d.className="fx-dot"+(i===p.index?" fx-dot--on":"");h.appendChild(d);}});' +
      '});';

    var ready =
      'window.addEventListener("load",function(){window.parent.postMessage({type:"pageReady",mode:' +
      JSON.stringify(mode || 'main') +
      ',index:' +
      (index || 0) +
      '},"*");});';

    var navKeys =
      'document.addEventListener("keydown",function(e){' +
      'if(window.__CW_MODE__!=="main")return;' +
      'var t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable))return;' +
      'if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){' +
      'e.preventDefault();window.parent.postMessage({type:"cwNav",dir:"next"},"*");' +
      '}else if(e.key==="ArrowLeft"||e.key==="PageUp"){' +
      'e.preventDefault();window.parent.postMessage({type:"cwNav",dir:"prev"},"*");' +
      '}});';

    var pageFix =
      '<style id="cw-page">' +
      'html,body{background:' +
      STAGE_BG +
      '}' +
      '.page-container{height:100%;max-height:100%;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}' +
      '</style>';

    return (
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
      '<style>*{box-sizing:border-box}html,body{margin:0;padding:0;width:' +
      CANVAS_W +
      'px;height:' +
      CANVAS_H +
      'px;overflow:hidden;background:' +
      STAGE_BG +
      '}</style>' +
      sharedHead +
      pageFix +
      '<script>' +
      meta +
      frameFill +
      '<\/script></head><body>' +
      page.body +
      '<script>' +
      ready +
      navKeys +
      '<\/script></body></html>'
    );
  }

  function CoursewareShell(pages, sharedHead) {
    this.pages = pages;
    this.sharedHead = sharedHead;
    this.index = 0;
    this.pageStates = {};
    this.mainIframe = null;
    this.frameWrap = null;
    this.bodyEl = null;
    this.stageEl = null;
    this.thumbList = null;
    this.titleEl = null;
    this.pageLabel = null;
    this.thumbIframes = [];
  }

  CoursewareShell.prototype._handleNavKey = function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      this.prev();
    }
  };

  CoursewareShell.prototype._focusFs = function () {
    if (!this.bodyEl) return;
    this.bodyEl.setAttribute('tabindex', '-1');
    try {
      this.bodyEl.focus({ preventScroll: true });
    } catch (err) {
      this.bodyEl.focus();
    }
  };

  CoursewareShell.prototype.mount = function () {
    var loading = document.getElementById('cw-loading');
    if (loading) loading.remove();

    document.body.innerHTML = '';
    document.head.appendChild(this._shellStyles());

    var root = document.createElement('div');
    root.className = 'cw-root';

    var header = document.createElement('header');
    header.className = 'cw-header';
    header.innerHTML =
      '<div class="cw-header-left">' +
      '<span class="cw-file-icon" aria-hidden="true"></span>' +
      '<span class="cw-title"></span>' +
      '</div>' +
      '<div class="cw-header-actions">' +
      '<button type="button" class="cw-action" data-action="edit">编辑</button>' +
      '<button type="button" class="cw-action" data-action="fullscreen">全屏预览</button>' +
      '<button type="button" class="cw-action" data-action="download">下载</button>' +
      '<button type="button" class="cw-action cw-action--icon" data-action="close" aria-label="关闭">×</button>' +
      '</div>';
    this.titleEl = header.querySelector('.cw-title');

    var body = document.createElement('div');
    body.className = 'cw-body';
    this.bodyEl = body;

    this.thumbList = document.createElement('aside');
    this.thumbList.className = 'cw-thumbs';
    this.thumbList.id = 'cw-thumb-list';

    this.stageEl = document.createElement('main');
    this.stageEl.className = 'cw-stage';

    this.frameWrap = document.createElement('div');
    this.frameWrap.className = 'cw-stage-frame';

    this.mainIframe = document.createElement('iframe');
    this.mainIframe.className = 'cw-main-iframe';
    this.mainIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    this.frameWrap.appendChild(this.mainIframe);
    this.stageEl.appendChild(this.frameWrap);

    body.appendChild(this.thumbList);
    body.appendChild(this.stageEl);

    var footer = document.createElement('footer');
    footer.className = 'cw-footer';
    this.pageLabel = document.createElement('span');
    this.pageLabel.className = 'cw-footer-label';
    footer.appendChild(this.pageLabel);

    root.appendChild(header);
    root.appendChild(body);
    root.appendChild(footer);
    document.body.appendChild(root);

    var self = this;
    header.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'fullscreen') self._toggleFullscreen();
      else if (action === 'download') self._download();
      else if (action === 'close') window.history.length > 1 ? window.history.back() : null;
    });

    window.addEventListener('message', function (e) {
      if (!e.data || !e.data.type) return;
      if (e.data.type === 'cwNav') {
        if (e.data.dir === 'next') self.next();
        else if (e.data.dir === 'prev') self.prev();
      } else if (e.data.type === 'saveState') {
        var page = self.pages[self.index];
        if (page) self.pageStates[page.id] = e.data.state;
      }
    });

    window.addEventListener('resize', function () {
      self._fitMain();
    });

    var onKey = function (e) {
      self._handleNavKey(e);
    };
    document.addEventListener('keydown', onKey);

    document.addEventListener('fullscreenchange', function () {
      if (self._isFullscreen()) self._focusFs();
      self._fitMain();
    });
    document.addEventListener('webkitfullscreenchange', function () {
      if (self._isFullscreen()) self._focusFs();
      self._fitMain();
    });

    this._renderThumbs();
    this.show(0, 'forward');
  };

  CoursewareShell.prototype._shellStyles = function () {
    var style = document.createElement('style');
    style.textContent =
      'html,body{margin:0;height:100%;overflow:hidden}' +
      '.cw-root{height:100vh;display:flex;flex-direction:column;background:#fff;' +
      'font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#1e293b}' +
      '.cw-header{height:52px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;' +
      'padding:0 20px;border-bottom:1px solid #e5e7eb;background:#fff}' +
      '.cw-header-left{display:flex;align-items:center;gap:10px;min-width:0}' +
      '.cw-file-icon{width:22px;height:22px;border-radius:4px;background:linear-gradient(135deg,#34d399,#10b981);' +
      'position:relative;flex-shrink:0}' +
      '.cw-file-icon::after{content:"";position:absolute;left:5px;top:6px;width:12px;height:2px;background:#fff;' +
      'box-shadow:0 4px 0 #fff,0 8px 0 #fff;border-radius:1px}' +
      '.cw-title{font-size:14px;font-weight:600;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.cw-header-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}' +
      '.cw-action{border:1px solid #e2e8f0;background:#fff;color:#475569;font-size:13px;padding:6px 14px;' +
      'border-radius:8px;cursor:pointer;line-height:1}' +
      '.cw-action:hover{background:#f8fafc;border-color:#cbd5e1}' +
      '.cw-action--icon{width:32px;height:32px;padding:0;font-size:18px;color:#94a3b8}' +
      '.cw-body{flex:1;display:flex;min-height:0;background:' +
      STAGE_BG +
      ';outline:none}' +
      '.cw-body:fullscreen,.cw-body:-webkit-full-screen{width:100%;height:100%;display:flex;min-height:0;' +
      'background:' +
      STAGE_BG +
      '}' +
      '.cw-body:fullscreen .cw-thumbs,.cw-body:-webkit-full-screen .cw-thumbs{height:100%}' +
      '.cw-thumbs{width:136px;flex-shrink:0;padding:12px 10px;overflow-y:auto;background:#fff;' +
      'border-right:1px solid #e5e7eb}' +
      '#cw-thumb-list{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}' +
      '#cw-thumb-list::-webkit-scrollbar{width:4px}' +
      '#cw-thumb-list::-webkit-scrollbar-track{background:transparent}' +
      '#cw-thumb-list::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}' +
      '#cw-thumb-list::-webkit-scrollbar-thumb:hover{background:#94a3b8}' +
      '.cw-thumb{position:relative;width:116px;height:' +
      Math.round(CANVAS_H * THUMB_SCALE) +
      'px;margin:0 auto 10px;border:2px solid #e5e7eb;border-radius:8px;overflow:hidden;' +
      'cursor:pointer;background:#f8fafc;transition:border-color .15s,box-shadow .15s}' +
      '.cw-thumb:hover{border-color:#86efac}' +
      '.cw-thumb--on{border-color:#10b981;box-shadow:0 0 0 1px #10b981}' +
      '.cw-thumb-inner{width:' +
      CANVAS_W +
      'px;height:' +
      CANVAS_H +
      'px;transform:scale(' +
      THUMB_SCALE +
      ');transform-origin:top left;pointer-events:none}' +
      '.cw-thumb iframe{width:100%;height:100%;border:none;display:block}' +
      '.cw-thumb-no{position:absolute;right:4px;bottom:4px;min-width:18px;height:18px;padding:0 4px;' +
      'border-radius:999px;background:#64748b;color:#fff;font-size:11px;font-weight:700;' +
      'display:flex;align-items:center;justify-content:center;z-index:2;line-height:1}' +
      '.cw-thumb--on .cw-thumb-no{background:#10b981}' +
      '.cw-body:fullscreen .cw-stage,.cw-body:-webkit-full-screen .cw-stage{background:' +
      STAGE_BG +
      ';padding:0}' +
      '.cw-stage{flex:1;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;' +
      'padding:24px;background:' +
      STAGE_BG +
      ';outline:none}' +
      '.cw-stage-frame{width:' +
      CANVAS_W +
      'px;height:' +
      CANVAS_H +
      'px;overflow:hidden;background:transparent;border:none;border-radius:0;box-shadow:none;' +
      'transform-origin:center center;flex-shrink:0}' +
      '.cw-main-iframe{width:100%;height:100%;border:none;display:block}' +
      '.cw-footer{height:40px;flex-shrink:0;display:flex;align-items:center;padding:0 20px;' +
      'border-top:1px solid #e5e7eb;background:#fff;font-size:12px;color:#64748b}';
    return style;
  };

  CoursewareShell.prototype._renderThumbs = function () {
    var self = this;
    this.thumbList.innerHTML = '';
    this.thumbIframes = [];

    this.pages.forEach(function (p, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'cw-thumb' + (i === self.index ? ' cw-thumb--on' : '');
      item.title = p.id + '. ' + p.name;
      item.dataset.index = String(i);

      var inner = document.createElement('div');
      inner.className = 'cw-thumb-inner';

      var iframe = document.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      iframe.srcdoc = buildSrcdoc(p, self.sharedHead, 'thumbnail', i, self.pages.length);

      var badge = document.createElement('span');
      badge.className = 'cw-thumb-no';
      badge.textContent = String(p.id);

      inner.appendChild(iframe);
      item.appendChild(inner);
      item.appendChild(badge);

      item.addEventListener('click', function () {
        self.show(i, i > self.index ? 'forward' : 'back');
      });

      self.thumbList.appendChild(item);
      self.thumbIframes.push(iframe);
    });
  };

  CoursewareShell.prototype._updateThumbActive = function () {
    var items = this.thumbList.querySelectorAll('.cw-thumb');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('cw-thumb--on', i === this.index);
    }
    var active = items[this.index];
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  CoursewareShell.prototype._isFullscreen = function () {
    var fs = document.fullscreenElement || document.webkitFullscreenElement;
    return fs === this.bodyEl;
  };

  CoursewareShell.prototype._toggleFullscreen = function () {
    var self = this;
    if (this._isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }
    var el = this.bodyEl;
    var req = el.requestFullscreen
      ? el.requestFullscreen()
      : el.webkitRequestFullscreen
        ? el.webkitRequestFullscreen()
        : null;
    if (req && req.then) {
      req.then(function () {
        self._focusFs();
        self._fitMain();
      });
    }
  };

  CoursewareShell.prototype._fitMain = function () {
    if (!this.stageEl || !this.frameWrap) return;
    var fs = this._isFullscreen();
    var pad = fs ? 0 : 48;
    var sw = this.stageEl.clientWidth - pad;
    var sh = this.stageEl.clientHeight - pad;
    var scale = Math.min(sw / CANVAS_W, sh / CANVAS_H);
    if (!fs) scale = Math.min(scale, 1);
    this.frameWrap.style.transform = Math.abs(scale - 1) < 0.001 ? '' : 'scale(' + scale + ')';
  };

  CoursewareShell.prototype._download = function () {
    var a = document.createElement('a');
    a.href = window.location.href;
    a.download = (document.title || 'courseware') + '.html';
    a.click();
  };

  CoursewareShell.prototype.show = function (index, direction) {
    if (index < 0 || index >= this.pages.length) return;
    this.index = index;
    var page = this.pages[index];
    var fileTitle = document.querySelector('title')?.textContent || '课件.html';
    document.title = page.name;
    this.titleEl.textContent = fileTitle.indexOf('.') > -1 ? fileTitle : fileTitle + '.html';
    this.pageLabel.textContent =
      '第 ' + (index + 1) + ' / ' + this.pages.length + ' 页 · ' + page.name;

    var saved = direction === 'back' ? this.pageStates[page.id] : undefined;
    this.mainIframe.srcdoc = buildSrcdoc(
      page,
      this.sharedHead,
      'main',
      index,
      this.pages.length
    );

    var self = this;
    var onReady = function (e) {
      if (!e.data || e.data.type !== 'pageReady' || e.data.mode !== 'main') return;
      if (e.data.index !== self.index) return;
      window.removeEventListener('message', onReady);
      if (saved !== undefined) {
        self.mainIframe.contentWindow.postMessage(
          { type: 'restoreState', state: saved },
          '*'
        );
      }
      self._fitMain();
    };
    window.addEventListener('message', onReady);
    this._updateThumbActive();
    this._fitMain();
  };

  CoursewareShell.prototype.next = function () {
    if (this.index < this.pages.length - 1) {
      this.show(this.index + 1, 'forward');
    }
  };

  CoursewareShell.prototype.prev = function () {
    if (this.index > 0) {
      this.show(this.index - 1, 'back');
    }
  };

  var pages = parsePages();
  if (!pages.length) {
    console.error('[courseware-shell] No template.page-data found');
    return;
  }

  new CoursewareShell(pages, parseShared()).mount();
})();
