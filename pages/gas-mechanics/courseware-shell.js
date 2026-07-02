/**
 * Minimal courseware shell for Cursor teaching-page skill.
 * Parses template.page-shared + template.page-data, renders 960x540 slides.
 */
(function () {
  'use strict';

  var CANVAS_W = 960;
  var CANVAS_H = 540;

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

  function buildSrcdoc(page, sharedHead, state) {
    var stateScript = state
      ? 'window.addEventListener("load",function(){window.parent.postMessage({type:"pageReady"}, "*");});'
      : 'window.addEventListener("load",function(){window.parent.postMessage({type:"pageReady"}, "*");});';

    return (
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
      '<style>*{box-sizing:border-box}html,body{margin:0;padding:0;width:' +
      CANVAS_W +
      'px;min-height:' +
      CANVAS_H +
      'px;max-height:' +
      CANVAS_H +
      'px;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}</style>' +
      sharedHead +
      '<script>window.__CW_MODE__="main";<\/script></head><body>' +
      page.body +
      '<script>' +
      stateScript +
      '<\/script></body></html>'
    );
  }

  function CoursewareShell(pages, sharedHead) {
    this.pages = pages;
    this.sharedHead = sharedHead;
    this.index = 0;
    this.pageStates = {};
    this.root = null;
    this.iframe = null;
    this.titleEl = null;
    this.thumbList = null;
  }

  CoursewareShell.prototype.mount = function () {
    var loading = document.getElementById('cw-loading');
    if (loading) loading.remove();

    document.body.innerHTML = '';
    document.body.style.cssText =
      'margin:0;height:100vh;display:flex;flex-direction:column;font-family:system-ui,sans-serif;background:#0f172a;color:#fff';

    var toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display:flex;align-items:center;gap:12px;padding:8px 16px;background:#1e293b;flex-shrink:0';
    this.titleEl = document.createElement('span');
    this.titleEl.style.flex = '1';
    toolbar.appendChild(this.titleEl);

    var prevBtn = this._btn('上一页', this.prev.bind(this));
    var nextBtn = this._btn('下一页', this.next.bind(this));
    toolbar.appendChild(prevBtn);
    toolbar.appendChild(nextBtn);

    var main = document.createElement('div');
    main.style.cssText = 'flex:1;display:flex;min-height:0';

    this.thumbList = document.createElement('div');
    this.thumbList.style.cssText =
      'width:140px;overflow-y:auto;background:#1e293b;padding:8px;flex-shrink:0';
    this._renderThumbs();

    var stage = document.createElement('div');
    stage.style.cssText =
      'flex:1;display:flex;align-items:center;justify-content:center;background:#334155;position:relative';

    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin'
    );
    this.iframe.style.cssText =
      'border:none;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.3)';
    stage.appendChild(this.iframe);

    main.appendChild(this.thumbList);
    main.appendChild(stage);

    document.body.appendChild(toolbar);
    document.body.appendChild(main);

    var self = this;
    window.addEventListener('message', function (e) {
      if (!e.data || !e.data.type) return;
      if (e.data.type === 'saveState') {
        var page = self.pages[self.index];
        if (page) self.pageStates[page.id] = e.data.state;
      }
    });

    window.addEventListener('resize', function () {
      self._fitIframe();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        self.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        self.prev();
      }
    });

    this.show(0, 'forward');
  };

  CoursewareShell.prototype._btn = function (label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText =
      'padding:6px 14px;border:none;border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer;font-size:14px';
    b.addEventListener('click', onClick);
    return b;
  };

  CoursewareShell.prototype._renderThumbs = function () {
    var self = this;
    this.thumbList.innerHTML = '';
    this.pages.forEach(function (p, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.textContent = p.id + '. ' + p.name;
      item.style.cssText =
        'display:block;width:100%;text-align:left;margin:0 0 6px;padding:8px;border:none;border-radius:6px;background:#334155;color:#e2e8f0;font-size:12px;cursor:pointer';
      item.dataset.index = String(i);
      item.addEventListener('click', function () {
        self.show(i, i > self.index ? 'forward' : 'back');
      });
      if (i === self.index) item.style.background = '#3b82f6';
      self.thumbList.appendChild(item);
    });
  };

  CoursewareShell.prototype._fitIframe = function () {
    var stage = this.iframe.parentElement;
    if (!stage) return;
    var sw = stage.clientWidth - 32;
    var sh = stage.clientHeight - 32;
    var scale = Math.min(sw / CANVAS_W, sh / CANVAS_H, 1);
    this.iframe.style.width = CANVAS_W * scale + 'px';
    this.iframe.style.height = CANVAS_H * scale + 'px';
  };

  CoursewareShell.prototype.show = function (index, direction) {
    if (index < 0 || index >= this.pages.length) return;
    this.index = index;
    var page = this.pages[index];
    document.title = page.name;
    this.titleEl.textContent =
      document.querySelector('title')?.textContent ||
      page.name + ' (' + page.id + '/' + this.pages.length + ')';

    var saved =
      direction === 'back' ? this.pageStates[page.id] : undefined;
    this.iframe.srcdoc = buildSrcdoc(page, this.sharedHead, saved);

    var self = this;
    var onReady = function (e) {
      if (e.data && e.data.type === 'pageReady') {
        window.removeEventListener('message', onReady);
        if (saved !== undefined) {
          self.iframe.contentWindow.postMessage(
            { type: 'restoreState', state: saved },
            '*'
          );
        }
        self._fitIframe();
      }
    };
    window.addEventListener('message', onReady);
    this._renderThumbs();
    this._fitIframe();
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
