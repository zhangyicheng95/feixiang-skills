/**
 * stroke-loader · 飞象老师汉字笔顺数据加载器 (v10.0.0)
 * ─────────────────────────────────────────────
 * 作用：
 *   1. 异步从 CDN 加载 stroke-data.json（2838 字教研校验版）
 *   2. 暴露全局 getStrokeData(char) 查询接口
 *   3. 加载完成后派发 stroke-data-ready 事件
 *
 * 引入方式：
 *   <script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-loader.js"></script>
 *
 * 使用方式：
 *   window.addEventListener('stroke-data-ready', function() {
 *     var d = window.getStrokeData('学');
 *     // d = { char:'学', count:8, strokes:['点',...,'横'], source:'db' }
 *   });
 *
 * 数据源：
 *   飞象老师 2838 字教研校验版（stroke_data_v2.json，2026-04-20）
 *   已修正穴字头/阝/殳/朵/学字族/铅 等 6 类数据集共性错误
 */
(function (global) {
  'use strict';

  // 动态推断 DATA_URL：从自身 script src 得到版本号，确保 loader 与 stroke-data.json 始终同版本
  // 这样 skill 升级时无需手动同步两处版本号
  var DATA_URL = (function () {
    var fallback = 'https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/assets/stroke-data.json';
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || '';
        if (src.indexOf('/stroke-order/') !== -1 && src.indexOf('stroke-loader.js') !== -1) {
          return src.replace(/templates\/stroke-loader\.js.*$/, 'assets/stroke-data.json');
        }
      }
    } catch (e) {}
    return fallback;
  })();

  // 32 种标准笔画名称（白名单校验用）
  var STD32 = [
    '点','横','竖','撇','捺','提',
    '横折','竖折','撇折','横撇','撇点',
    '竖钩','弯钩','斜钩','卧钩','竖弯钩','横钩','横折钩','横折弯钩',
    '横撇弯钩','横折折折钩','竖折折钩','横斜钩',
    '竖提','横折提',
    '竖弯','横折弯','横折折撇','竖折撇','竖折折','横折折','横折折折'
  ];
  var STD32_SET = {};
  for (var i = 0; i < STD32.length; i++) STD32_SET[STD32[i]] = true;

  var strokeDatabase = null;  // { "字": ["笔","画","名"] }
  var textbookSet = null;     // Set: 小学教材字 2842 字
  var loadStatus = 'pending';  // pending / loading / ready / error
  var loadError = null;

  function setStatus(status, err) {
    loadStatus = status;
    if (err) loadError = err;
    if (status === 'ready' || status === 'error') {
      var ev;
      try {
        ev = new Event('stroke-data-ready');
      } catch (e) {
        ev = document.createEvent('Event');
        ev.initEvent('stroke-data-ready', false, false);
      }
      ev.detail = { status: status, error: err, total: strokeDatabase ? Object.keys(strokeDatabase).length : 0 };
      global.dispatchEvent(ev);
    }
  }

  function loadData() {
    if (loadStatus !== 'pending') return;
    loadStatus = 'loading';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', DATA_URL, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        var resp = xhr.response;
        // 兼容某些 UA 不解析 JSON 的情况
        if (typeof resp === 'string') {
          try { resp = JSON.parse(resp); } catch (e) { setStatus('error', 'JSON 解析失败'); return; }
        }
        if (!resp || !resp.data) {
          setStatus('error', '数据格式错误');
          return;
        }
        strokeDatabase = resp.data;
        // 构建小学教材字索引
        if (resp.textbook_chars && typeof resp.textbook_chars === 'string') {
          textbookSet = new Set();
          for (var k = 0; k < resp.textbook_chars.length; k++) {
            textbookSet.add(resp.textbook_chars[k]);
          }
        }
        try {
          if (global.console && global.console.debug) {
            var totalN = Object.keys(strokeDatabase).length;
            var textbookN = textbookSet ? textbookSet.size : 0;
            global.console.debug('[stroke-loader] 已加载 ' + totalN + ' 字 ('
              + '教材 ' + textbookN + ' + 范围外 ' + (totalN - textbookN) + ')');
          }
        } catch (e) {}
        setStatus('ready');
      } else {
        setStatus('error', 'HTTP ' + xhr.status);
      }
    };
    xhr.onerror = function () {
      setStatus('error', '网络错误');
    };
    xhr.send();
  }

  /**
   * 查询字的笔顺数据
   * @param {string} char 单个汉字
   * @returns {object} 标准结果对象，永不抛异常
   *   正常: { char, count:N, strokes:[...], source:'db', tier:'textbook'|'extended' }
   *   未加载: { char, count:0, strokes:[], source:'loading' }
   *   加载失败: { char, count:0, strokes:[], source:'error', error:'...' }
   *   数据库未收录: { char, count:0, strokes:[], source:'missing' }
   *   含非标准笔画（理论不会发生，兜底）: source:'invalid'
   *
   * tier 字段说明（v10.6+）：
   *   - 'textbook': 小学语文教材字（2842），3 轮教研审核，100% 可靠
   *   - 'extended': 字典扩展字（4976），自动映射 + 启发式，质量 >= 98% 但未完全审核
   *
   * LLM / UI 端策略建议：
   *   - 小学语文教学场景：只使用 tier='textbook' 的字；遇到 extended 字建议"暂无权威数据"降级
   *   - 通用笔顺查询：都可用，extended 字建议 UI 标注"待验证"
   */
  function getStrokeData(char) {
    if (typeof char !== 'string' || char.length === 0) {
      return { char: String(char), count: 0, strokes: [], source: 'invalid', error: '输入非字符串' };
    }

    if (loadStatus === 'pending' || loadStatus === 'loading') {
      return { char: char, count: 0, strokes: [], source: 'loading' };
    }
    if (loadStatus === 'error') {
      return { char: char, count: 0, strokes: [], source: 'error', error: loadError || '加载失败' };
    }

    var strokes = strokeDatabase[char];
    if (!strokes || strokes.length === 0) {
      return { char: char, count: 0, strokes: [], source: 'missing' };
    }

    // 白名单二次校验（兜底）
    for (var j = 0; j < strokes.length; j++) {
      if (!STD32_SET[strokes[j]]) {
        return {
          char: char, count: 0, strokes: [],
          source: 'invalid',
          error: '第 ' + (j + 1) + ' 笔「' + strokes[j] + '」不在 32 标准之内'
        };
      }
    }

    // v11: 两级分层 — 小学教材字 / 小学范围外
    var tier = (textbookSet && textbookSet.has(char)) ? 'textbook' : 'extended';
    // v10.7: strokes 元素升级为 String 实例，同时附带 .name/.index/.path 字段
    // 这样 LLM 三种常见写法都能工作：
    //   - ${s}               → "撇"（原生 toString）
    //   - s.name             → "撇"（附加字段）
    //   - s.index            → 1（1-based 序号）
    //   - strokes[i] === '撇' 仍成立（原生 String 比较需 ==）
    //   - strokes.join('/')  → "撇/横/横/弯钩"
    var enhanced = [];
    var detail = [];
    for (var k = 0; k < strokes.length; k++) {
      var name = strokes[k];
      /* eslint-disable no-new-wrappers */
      var s = new String(name);
      s.name = name;
      s.index = k + 1;
      s.path = '';
      enhanced.push(s);
      detail.push({ index: k + 1, name: name, path: '' });
    }
    return {
      char: char,
      count: strokes.length,
      strokes: enhanced,                  // 增强版（兼容 s.name 写法）
      strokes_detail: detail,             // 纯对象数组（推荐）
      source: 'db',
      tier: tier                          // 'textbook'（小学范围内）/ 'extended'（小学范围外）
    };
  }

  /**
   * 判断一个字是否是教材字（小学语文会写/认读）
   * @param {string} char
   * @returns {boolean|null} true/false，如数据库未加载返回 null
   */
  function isTextbookChar(char) {
    if (loadStatus !== 'ready' || !textbookSet) return null;
    return textbookSet.has(char);
  }

  // 曝光全局 API
  global.getStrokeData = getStrokeData;
  global.isTextbookChar = isTextbookChar;
  global._strokeLoader = {
    getStatus: function () { return loadStatus; },
    getError: function () { return loadError; },
    getStd32: function () { return STD32.slice(); },
    getDataURL: function () { return DATA_URL; },
    getTextbookTotal: function () { return textbookSet ? textbookSet.size : 0; },
    getExtendedTotal: function () { return strokeDatabase ? Object.keys(strokeDatabase).length - (textbookSet ? textbookSet.size : 0) : 0; },
    reload: function () {
      loadStatus = 'pending';
      loadError = null;
      strokeDatabase = null;
      textbookSet = null;
      loadData();
    }
  };

  // 自动触发加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
  } else {
    loadData();
  }
})(typeof window !== 'undefined' ? window : this);
