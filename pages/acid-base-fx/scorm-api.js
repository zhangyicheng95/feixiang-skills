/**
 * SCORM 2004 4th Edition API 适配器（API_1484_11）
 * 独立预览无 LMS 时自动降级为 standalone，不报错。
 */
(function (global) {
  'use strict';

  var API = null;
  var active = false;
  var lastError = '0';

  function findAPI(win) {
    var n = 0;
    while (win && n++ < 500) {
      if (win.API_1484_11) return win.API_1484_11;
      if (win.parent && win.parent !== win) win = win.parent;
      else break;
    }
    return null;
  }

  function ok(r) {
    return r === true || r === 'true';
  }

  function SCORM() {}

  SCORM.prototype.init = function () {
    API = findAPI(global);
    if (!API) return { ok: false, mode: 'standalone' };
    if (!ok(API.Initialize(''))) {
      lastError = API.GetLastError ? API.GetLastError() : '101';
      return { ok: false, mode: 'standalone', error: lastError };
    }
    active = true;
    var entry = this.get('cmi.entry') || '';
    return { ok: true, mode: 'lms', entry: entry };
  };

  SCORM.prototype.isActive = function () {
    return active && !!API;
  };

  SCORM.prototype.get = function (el) {
    if (!this.isActive()) return '';
    var v = API.GetValue(el);
    if (v === null || v === undefined) return '';
    var err = API.GetLastError ? API.GetLastError() : '0';
    if (err !== '0') lastError = err;
    return String(v);
  };

  SCORM.prototype.set = function (el, val) {
    if (!this.isActive()) return false;
    var r = API.SetValue(el, val == null ? '' : String(val));
    if (!ok(r)) {
      lastError = API.GetLastError ? API.GetLastError() : '101';
      return false;
    }
    return true;
  };

  SCORM.prototype.commit = function () {
    if (!this.isActive()) return false;
    return ok(API.Commit(''));
  };

  SCORM.prototype.finish = function (exitMode) {
    if (!this.isActive()) return false;
    this.set('cmi.exit', exitMode || 'suspend');
    var r = API.Terminate('');
    active = false;
    return ok(r);
  };

  SCORM.prototype.getLastError = function () {
    return lastError;
  };

  global.SCORM = new SCORM();
})(typeof window !== 'undefined' ? window : this);
