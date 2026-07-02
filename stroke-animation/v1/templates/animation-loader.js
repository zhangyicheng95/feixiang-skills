/*!
 * 飞象老师 · animation-loader.js (StrokeTrace) v1.7.5
 * Built: 2026-06-15
 *
 * 用途：在飞象老师 AI 互动课件中提供汉字笔顺动画与严格跟练能力。
 * 一行 <script> 引入即可使用，无外部依赖（自带 UI、SVG、Canvas、DTW 评分）。
 *
 * 最小用法：
 *   <div id="trace"></div>
 *   <script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-order/v1/templates/stroke-loader.js"></script>
 *   <script src="https://musk-online.fbcontent.cn/pub-musk-ai-studio/skills/stroke-animation/v1/templates/animation-loader.js"></script>
 *   <script>
 *     window.addEventListener('stroke-anim-ready', function() {
 *       window.StrokeTrace.mount({ target: '#trace', char: '学' });
 *     });
 *   </script>
 *
 * 数据来源：
 *   - 字形几何（strokes/medians）：MakeMeAHanzi（ARPHIC PUBLIC LICENSE，公版商用免费）
 *   - 笔画名来源：飞象老师 stroke-order v1 教研笔顺数据（发布时按目标环境引用当前 stroke-loader）
 *
 * 严禁（违反将污染数据源）：
 *   - 通过 LLM 直接读写 SVG path 数据（path 仅通过 StrokeTrace API 内部使用）
 *   - 引入 HanziWriter / cnchar-draw 等运行时笔顺库
 *   - 小学场景使用非 textbook 字（数据库以 textbook_chars 字段为准）
 */
(function (global) {
  'use strict';
  global._ST = global._ST || {};

/* ============================================================
 * src/dtw.js
 * ============================================================ */

/**
 * dtw.js · 动态时间规整（Dynamic Time Warping）
 *
 * 用途：
 *   - 比较两条 2D 点序列的"形状相似度"，对长度不等、速度不一致的轨迹友好
 *   - 跟练评分核心：用户手写轨迹 vs 标准 medians
 *
 * 性能：
 *   - 时间复杂度 O(n*m*window)；用 Sakoe-Chiba 约束窗 w=N/5 把退化的 O(N²) 控到约 O(N*N/5)
 *   - 50 vs 50 点约 50µs（M2 Mac），单笔评分场景完全够用
 *
 * 双重导出：
 *   - Node:   const { euclid, dtw } = require('./dtw.js')
 *   - 浏览器: window._ST.dtw.euclid(...) / window._ST.dtw.dtw(...)
 */
'use strict';

const _DTW = (function () {
  /** 欧氏距离 */
  function euclid(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * DTW 主算法
   * @param {Array<[number,number]>} seqA 用户轨迹（已 resample）
   * @param {Array<[number,number]>} seqB 标准轨迹（已 resample）
   * @param {number} windowRatio Sakoe-Chiba 窗口占总长比例（默认 0.2）
   * @returns {{ distance: number, alignment: Array<[number,number]> }}
   *   - distance: 平均对齐距离（已归一化到点对）
   *   - alignment: 对齐对（user_idx, std_idx），用于反推错误片段
   */
  function dtw(seqA, seqB, windowRatio) {
    if (!Array.isArray(seqA) || !Array.isArray(seqB)) {
      return { distance: Infinity, alignment: [] };
    }
    const n = seqA.length;
    const m = seqB.length;
    if (n === 0 || m === 0) return { distance: Infinity, alignment: [] };

    const ratio = (typeof windowRatio === 'number' && windowRatio > 0) ? windowRatio : 0.2;
    const w = Math.max(Math.floor(Math.max(n, m) * ratio), Math.abs(n - m));
    const INF = Number.POSITIVE_INFINITY;

    // dp[i][j] = 累积代价；用 Float64Array 减少 GC
    const dp = new Array(n + 1);
    for (let i = 0; i <= n; i++) dp[i] = new Float64Array(m + 1).fill(INF);
    dp[0][0] = 0;

    for (let i = 1; i <= n; i++) {
      const jStart = Math.max(1, i - w);
      const jEnd = Math.min(m, i + w);
      for (let j = jStart; j <= jEnd; j++) {
        const cost = euclid(seqA[i - 1], seqB[j - 1]);
        const a = dp[i - 1][j];
        const b = dp[i][j - 1];
        const c = dp[i - 1][j - 1];
        dp[i][j] = cost + (a < b ? (a < c ? a : c) : (b < c ? b : c));
      }
    }

    // 回溯对齐
    const alignment = [];
    let i = n, j = m;
    while (i > 0 && j > 0) {
      alignment.push([i - 1, j - 1]);
      const a = dp[i - 1][j - 1];
      const b = dp[i - 1][j];
      const c = dp[i][j - 1];
      if (a <= b && a <= c) { i--; j--; }
      else if (b <= c) { i--; }
      else { j--; }
    }
    alignment.reverse();

    return {
      distance: dp[n][m] / Math.max(n, m),
      alignment: alignment
    };
  }

  return { euclid: euclid, dtw: dtw };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _DTW;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.dtw = _DTW;
}

/* ============================================================
 * src/resample.js
 * ============================================================ */

/**
 * resample.js · 轨迹重采样 + 路径平滑
 *
 * 用途：
 *   - resamplePolyline: 把任意长度的折线 resample 到固定 N 点（DTW 前置处理）
 *   - smoothPath:       Catmull-Rom 转贝塞尔，把折线平滑为曲线（撇/捺等弧笔渲染）
 */
'use strict';

const _Resample = (function () {
  function _euclid(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 等弧长重采样
   * @param {Array<[number,number]>} pts 原始点序列
   * @param {number} count 目标点数（≥ 2）
   * @returns {Array<[number,number]>}
   */
  function resamplePolyline(pts, count) {
    if (!Array.isArray(pts) || pts.length === 0) return [];
    if (pts.length === 1 || count <= 1) return [pts[0].slice()];
    if (count === 2) return [pts[0].slice(), pts[pts.length - 1].slice()];

    let total = 0;
    const segLens = new Array(pts.length - 1);
    for (let i = 1; i < pts.length; i++) {
      const l = _euclid(pts[i - 1], pts[i]);
      segLens[i - 1] = l;
      total += l;
    }
    if (total === 0) {
      const out = new Array(count);
      for (let i = 0; i < count; i++) out[i] = pts[0].slice();
      return out;
    }

    const step = total / (count - 1);
    const result = new Array(count);
    result[0] = pts[0].slice();
    result[count - 1] = pts[pts.length - 1].slice();

    let acc = 0;
    let segIdx = 0;
    for (let k = 1; k < count - 1; k++) {
      const target = step * k;
      while (segIdx < segLens.length && acc + segLens[segIdx] < target) {
        acc += segLens[segIdx];
        segIdx++;
      }
      if (segIdx >= segLens.length) {
        result[k] = pts[pts.length - 1].slice();
        continue;
      }
      const segLen = segLens[segIdx];
      const ratio = segLen > 0 ? (target - acc) / segLen : 0;
      const p1 = pts[segIdx];
      const p2 = pts[segIdx + 1];
      result[k] = [
        p1[0] + (p2[0] - p1[0]) * ratio,
        p1[1] + (p2[1] - p1[1]) * ratio
      ];
    }
    return result;
  }

  /**
   * Catmull-Rom 转三次贝塞尔，输出 SVG path 字符串
   * @param {Array<[number,number]>} pts 控制点序列
   * @param {number} tension 张力（0~1，0.5 接近自然曲线）
   * @returns {string} SVG path d 属性
   */
  function smoothPath(pts, tension) {
    if (!Array.isArray(pts) || pts.length === 0) return '';
    if (pts.length === 1) return 'M ' + pts[0][0] + ' ' + pts[0][1];
    if (pts.length === 2) {
      return 'M ' + pts[0][0] + ' ' + pts[0][1] + ' L ' + pts[1][0] + ' ' + pts[1][1];
    }
    const t = (typeof tension === 'number') ? tension : 0.5;
    let d = 'M ' + pts[0][0] + ' ' + pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6 * t;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6 * t;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6 * t;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6 * t;
      d += ' C ' + c1x.toFixed(2) + ' ' + c1y.toFixed(2)
         + ' '   + c2x.toFixed(2) + ' ' + c2y.toFixed(2)
         + ' '   + p2[0]          + ' ' + p2[1];
    }
    return d;
  }

  /** 路径总长度（折线） */
  function polylineLength(pts) {
    if (!Array.isArray(pts) || pts.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += _euclid(pts[i - 1], pts[i]);
    return total;
  }

  return {
    resamplePolyline: resamplePolyline,
    smoothPath: smoothPath,
    polylineLength: polylineLength
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _Resample;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.resample = _Resample;
}

/* ============================================================
 * src/scoring.js
 * ============================================================ */

/**
 * scoring.js · 跟练评分核心
 *
 * 三维度评分：
 *   - start (起笔精度，权重 25%): 用户起点 vs 标准起点 的距离
 *   - end   (收笔精度，权重 25%): 用户终点 vs 标准终点
 *   - path  (运笔贴合度，权重 50%): DTW 平均距离
 *   每项映射到 [0, 1]：score = max(0, 1 - dist / D_TOL)
 *
 * 三星阈值：
 *   final ≥ 0.90 → ★★★（excellent）
 *   final ≥ 0.75 → ★★☆（good）
 *   final ≥ 0.60 → ★☆☆（pass）
 *   final <  0.60 → 0 ★（fail）
 *
 * 错误片段：
 *   - 沿 DTW 对齐路径找连续 ≥ MIN_SEG_LEN 个点偏差超过 D_SEGMENT 的片段
 *   - 输出片段在用户原点序列中的索引区间 + 中文化方向提示
 */
'use strict';

const _Scoring = (function () {
  // 在 Node 环境下需要显式 require；浏览器侧靠 build 时拼接顺序保证 _ST.dtw 已定义
  const dtwMod = (typeof require === 'function' && typeof module !== 'undefined')
    ? require('./dtw.js')
    : (typeof window !== 'undefined' ? window._ST.dtw : null);
  const resampleMod = (typeof require === 'function' && typeof module !== 'undefined')
    ? require('./resample.js')
    : (typeof window !== 'undefined' ? window._ST.resample : null);

  // 默认阈值（基于 1024×1024 viewBox；24px ≈ 田字格半格的 4.7%）
  const DEFAULTS = {
    DTW_TOL: 120,        // 三维度评分时 dist→score 的容差半径
    SEG_TOL: 100,        // 错误片段判定阈值（单点偏差 >此值 算偏差段）
    MIN_SEG_LEN: 3,      // 连续偏差点数 ≥ 此值才算一段错误
    RESAMPLE_N: 50,      // resample 后的点数
    THRESH_3: 0.90,
    THRESH_2: 0.75,
    THRESH_1: 0.60,
    WEIGHT_START: 0.25,
    WEIGHT_END:   0.25,
    WEIGHT_PATH:  0.50
  };

  function _starsOf(final, opts) {
    if (final >= opts.THRESH_3) return 3;
    if (final >= opts.THRESH_2) return 2;
    if (final >= opts.THRESH_1) return 1;
    return 0;
  }

  /**
   * 单笔评分
   * @param {Array<[number,number]>} userPts 用户原始采样点
   * @param {Array<[number,number]>} stdPts  标准 medians（已转 SVG 坐标）
   * @param {object} [options] 可覆盖 DEFAULTS 任意字段
   * @returns {{
   *   start, end, path, final: number,
   *   stars: 0|1|2|3,
   *   errors: Array<{ startUserIdx, endUserIdx, reason, hint, devPx }>,
   *   userResampled, stdResampled: Array<[number,number]>
   * }}
   */
  function scoreStroke(userPts, stdPts, options) {
    const opts = Object.assign({}, DEFAULTS, options || {});

    if (!Array.isArray(userPts) || userPts.length < 2) {
      return {
        start: 0, end: 0, path: 0, final: 0, stars: 0,
        errors: [{ startUserIdx: 0, endUserIdx: 0, reason: '笔画太短', hint: '请完整书写这一笔', devPx: 0 }],
        userResampled: [], stdResampled: []
      };
    }
    if (!Array.isArray(stdPts) || stdPts.length < 2) {
      return {
        start: 0, end: 0, path: 0, final: 0, stars: 0,
        errors: [{ startUserIdx: 0, endUserIdx: 0, reason: '无标准数据', hint: '该字暂无几何数据', devPx: 0 }],
        userResampled: userPts.slice(), stdResampled: []
      };
    }

    const N = opts.RESAMPLE_N;
    const user = resampleMod.resamplePolyline(userPts, N);
    const std  = resampleMod.resamplePolyline(stdPts, N);

    const startDev = dtwMod.euclid(user[0], std[0]);
    const endDev   = dtwMod.euclid(user[N - 1], std[N - 1]);
    const startScore = Math.max(0, 1 - startDev / opts.DTW_TOL);
    const endScore   = Math.max(0, 1 - endDev   / opts.DTW_TOL);

    const ret = dtwMod.dtw(user, std);
    const pathScore = Math.max(0, 1 - ret.distance / opts.DTW_TOL);

    const final = opts.WEIGHT_START * startScore
                + opts.WEIGHT_END   * endScore
                + opts.WEIGHT_PATH  * pathScore;

    const errors = _findErrorSegments(user, std, ret.alignment, userPts, opts);

    return {
      start: startScore,
      end: endScore,
      path: pathScore,
      final: final,
      stars: _starsOf(final, opts),
      errors: errors,
      userResampled: user,
      stdResampled: std
    };
  }

  function _findErrorSegments(user, std, alignment, originalUser, opts) {
    if (!alignment || alignment.length === 0) return [];
    const segs = [];
    let inErr = false;
    let startK = -1;
    let peakDev = 0;
    let peakK = -1;

    for (let k = 0; k < alignment.length; k++) {
      const ui = alignment[k][0];
      const si = alignment[k][1];
      const dev = dtwMod.euclid(user[ui], std[si]);
      if (dev > opts.SEG_TOL) {
        if (!inErr) { inErr = true; startK = k; peakDev = dev; peakK = k; }
        else if (dev > peakDev) { peakDev = dev; peakK = k; }
      } else {
        if (inErr && (k - startK) >= opts.MIN_SEG_LEN) {
          segs.push(_makeSeg(user, std, alignment, startK, k - 1, peakK, originalUser));
        }
        inErr = false;
      }
    }
    if (inErr && (alignment.length - startK) >= opts.MIN_SEG_LEN) {
      segs.push(_makeSeg(user, std, alignment, startK, alignment.length - 1, peakK, originalUser));
    }

    // 把 user(resample) 索引映射回 originalUser 索引（线性比例）
    const ratio = (originalUser.length - 1) / (user.length - 1);
    return segs.map(function (s) {
      return {
        startUserIdx: Math.max(0, Math.round(s.userStart * ratio)),
        endUserIdx:   Math.min(originalUser.length - 1, Math.round(s.userEnd * ratio)),
        reason: s.reason,
        hint:   s.hint,
        devPx:  s.devPx
      };
    });
  }

  function _makeSeg(user, std, alignment, startK, endK, peakK, originalUser) {
    const ui = alignment[peakK][0];
    const si = alignment[peakK][1];
    const dx = user[ui][0] - std[si][0];
    const dy = user[ui][1] - std[si][1];
    let hint;
    if (Math.abs(dx) > Math.abs(dy)) {
      hint = dx > 0 ? '这里偏右了' : '这里偏左了';
    } else {
      hint = dy > 0 ? '这里偏下了' : '这里偏上了';
    }
    const userIdxs = alignment.slice(startK, endK + 1).map(function (a) { return a[0]; });
    let lo = userIdxs[0], hi = userIdxs[0];
    for (let i = 1; i < userIdxs.length; i++) {
      if (userIdxs[i] < lo) lo = userIdxs[i];
      if (userIdxs[i] > hi) hi = userIdxs[i];
    }
    return {
      userStart: lo, userEnd: hi,
      reason: '轨迹偏差',
      hint: hint,
      devPx: Math.round(Math.sqrt(dx * dx + dy * dy))
    };
  }

  /** 整字综合评分（多笔平均） */
  function aggregateChar(strokeResults) {
    if (!Array.isArray(strokeResults) || strokeResults.length === 0) {
      return { final: 0, stars: 0 };
    }
    const valid = strokeResults.filter(function (r) { return r && typeof r.final === 'number'; });
    if (valid.length === 0) return { final: 0, stars: 0 };
    let sum = 0;
    for (let i = 0; i < valid.length; i++) sum += valid[i].final;
    const avg = sum / valid.length;
    return { final: avg, stars: _starsOf(avg, DEFAULTS) };
  }

  return {
    DEFAULTS: DEFAULTS,
    scoreStroke: scoreStroke,
    aggregateChar: aggregateChar
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _Scoring;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.scoring = _Scoring;
}

/* ============================================================
 * src/tracer.js
 * ============================================================ */

/**
 * tracer.js · Canvas 手写采样层
 *
 * 职责：
 *   - 监听 PointerEvent 采集用户书写轨迹（统一鼠标/触屏/触控笔）
 *   - 实时绘制墨迹到 Canvas
 *   - 红笔标注错误片段（半透明红色覆盖层）
 *   - 维护已完成笔的笔迹历史（清画板/重写时重绘）
 *
 * 不参与：
 *   - 评分（交给 _ST.scoring）
 *   - SVG 字形提示（交给 _ST.renderer）
 *
 * 坐标系：内部统一用 1024×1024 viewBox 坐标
 */
'use strict';

const _Tracer = (function () {
  function _euclid(a, b) {
    const dx = a[0] - b[0], dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Tracer 类（构造后调 mount，调用方在 destroy 时务必 unmount） */
  function Tracer(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = Object.assign({
      brushColor: '#2D3436',
      brushWidth: 22,
      sampleEpsilon: 4,        // 采样最小距离阈值
      errorColor: 'rgba(231, 76, 60, 0.55)',
      errorWidthMul: 1.8
    }, options || {});
    this.pts = [];              // 当前笔采样
    this.drawing = false;
    this.enabled = true;
    this.strokeHistory = [];    // 每笔已完成的采样 [[pts]...]
    this.onStart = null;
    this.onEnd = null;
    this._handlers = {};
    this._bind();
  }

  Tracer.prototype._bind = function () {
    const self = this;
    this._handlers.down   = function (e) { self._down(e); };
    this._handlers.move   = function (e) { self._move(e); };
    this._handlers.up     = function (e) { self._up(e); };
    this._handlers.cancel = function (e) { self._up(e); };
    this._handlers.leave  = function (e) { if (self.drawing) self._up(e); };
    const c = this.canvas;
    c.addEventListener('pointerdown',   this._handlers.down);
    c.addEventListener('pointermove',   this._handlers.move);
    c.addEventListener('pointerup',     this._handlers.up);
    c.addEventListener('pointercancel', this._handlers.cancel);
    c.addEventListener('pointerleave',  this._handlers.leave);
  };

  Tracer.prototype.unmount = function () {
    const c = this.canvas;
    c.removeEventListener('pointerdown',   this._handlers.down);
    c.removeEventListener('pointermove',   this._handlers.move);
    c.removeEventListener('pointerup',     this._handlers.up);
    c.removeEventListener('pointercancel', this._handlers.cancel);
    c.removeEventListener('pointerleave',  this._handlers.leave);
    this._handlers = {};
  };

  Tracer.prototype._toViewBox = function (e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * this.canvas.width;
    const y = (e.clientY - rect.top)  / rect.height * this.canvas.height;
    return [x, y];
  };

  Tracer.prototype._down = function (e) {
    if (!this.enabled) return;
    e.preventDefault();
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    this.drawing = true;
    const p = this._toViewBox(e);
    this.pts = [p];
    this._dot(p);
    if (this.onStart) this.onStart(p);
  };

  Tracer.prototype._move = function (e) {
    if (!this.drawing) return;
    e.preventDefault();
    const p = this._toViewBox(e);
    const last = this.pts[this.pts.length - 1];
    if (_euclid(last, p) < this.options.sampleEpsilon) return;
    this.pts.push(p);
    this._line(last, p);
  };

  Tracer.prototype._up = function (e) {
    if (!this.drawing) return;
    this.drawing = false;
    try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    const pts = this.pts;
    this.pts = [];
    if (pts.length >= 2) {
      if (this.onEnd) this.onEnd(pts);
    } else {
      // 单点视为无效，清掉
      this.clearCurrent();
      if (this.onEnd) this.onEnd(pts);
    }
  };

  Tracer.prototype._dot = function (p) {
    const ctx = this.ctx;
    ctx.fillStyle = this.options.brushColor;
    ctx.beginPath();
    ctx.arc(p[0], p[1], this.options.brushWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  Tracer.prototype._line = function (a, b) {
    const ctx = this.ctx;
    ctx.strokeStyle = this.options.brushColor;
    ctx.lineWidth = this.options.brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };

  Tracer.prototype.commitStroke = function (pts) {
    this.strokeHistory.push(pts);
  };

  Tracer.prototype._redrawStroke = function (pts) {
    if (pts.length < 2) return;
    const ctx = this.ctx;
    ctx.strokeStyle = this.options.brushColor;
    ctx.fillStyle = this.options.brushColor;
    ctx.lineWidth = this.options.brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  };

  /** 清当前 Canvas 但保留已完成笔（用于失败重写）*/
  Tracer.prototype.clearCurrent = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const s of this.strokeHistory) this._redrawStroke(s);
  };

  /** 清整个画板（切字/重新开始）*/
  Tracer.prototype.clearAll = function () {
    this.strokeHistory = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  /** 在已绘制墨迹上叠加红色错误片段 */
  Tracer.prototype.drawErrorOverlay = function (pts, startIdx, endIdx) {
    if (!pts || startIdx >= pts.length) return;
    const e = Math.min(endIdx, pts.length - 1);
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = this.options.errorColor;
    ctx.lineWidth = this.options.brushWidth * this.options.errorWidthMul;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[startIdx][0], pts[startIdx][1]);
    for (let i = startIdx + 1; i <= e; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  };

  /** 弹出最近一笔（用于"重写这笔"逻辑）*/
  Tracer.prototype.popLastStroke = function () {
    return this.strokeHistory.pop();
  };

  Tracer.prototype.setBrush = function (opts) {
    Object.assign(this.options, opts || {});
  };

  return { Tracer: Tracer };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _Tracer;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.tracer = _Tracer;
}

/* ============================================================
 * src/renderer.js
 * ============================================================ */

/**
 * renderer.js · SVG 字形提示层
 *
 * 渲染：
 *   - 田字格（tian / mi / nine / none）
 *   - 字形轮廓三色（待写=米驼 / 当前笔=橙高亮 / 已完成=绿）
 *   - 当前笔中线提示（蓝色 Catmull-Rom 平滑曲线 + 起点呼吸圆 + 末端方向箭头）
 *
 * 不参与：手写采样、评分（其他模块负责）
 *
 * 接口：
 *   const renderer = new Renderer(svgEl, options);
 *   renderer.render(charData, curStrokeIdx);
 */
'use strict';

const _Renderer = (function () {
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function Renderer(svg, options) {
    this.svg = svg;
    this.options = Object.assign({
      yFlipBase: 900,
      grid: { style: 'tian', color: '#E8C4A2', dashColor: '#D9B38A' },
      colors: {
        outlineDone:    '#66BB6A', outlineDoneOpacity:    0.45,
        outlineCurrent: '#FFB74D', outlineCurrentOpacity: 0.62,
        outlinePending: '#CBB89A', outlinePendingOpacity: 0.30,
        hintLine: '#2E86DE',
        startDot: '#2E86DE'
      },
      hints: {
        showOutline: true,
        showStrokeOrder: false,
        pulseNextStroke: true,
        showStrokeName: false,    // showStrokeName 由外层 UI 决定，此处仅渲染中线
        showHintLine: true,
        showArrow: true
      }
    }, options || {});
    this._smoothPathFn = (typeof _Resample !== 'undefined') ? _Resample.smoothPath
                       : (typeof require !== 'undefined' ? require('./resample.js').smoothPath
                       : (typeof window !== 'undefined' ? window._ST.resample.smoothPath : null));
    if (typeof this._smoothPathFn !== 'function') {
      throw new Error('renderer.js 依赖 resample.smoothPath 未就绪');
    }
  }

  Renderer.prototype._drawGrid = function () {
    const opts = this.options.grid;
    if (opts.style === 'none') return;
    this.svg.appendChild(el('rect', {
      x: 12, y: 12, width: 1000, height: 1000,
      fill: 'none', stroke: opts.color, 'stroke-width': 4, rx: 12
    }));
    if (opts.style === 'tian' || opts.style === 'mi') {
      this.svg.appendChild(el('line', {
        x1: 512, y1: 12, x2: 512, y2: 1012,
        stroke: opts.dashColor, 'stroke-width': 2, 'stroke-dasharray': '12 8'
      }));
      this.svg.appendChild(el('line', {
        x1: 12, y1: 512, x2: 1012, y2: 512,
        stroke: opts.dashColor, 'stroke-width': 2, 'stroke-dasharray': '12 8'
      }));
    }
    if (opts.style === 'mi') {
      this.svg.appendChild(el('line', {
        x1: 12, y1: 12, x2: 1012, y2: 1012,
        stroke: opts.dashColor, 'stroke-width': 2, 'stroke-dasharray': '12 8'
      }));
      this.svg.appendChild(el('line', {
        x1: 1012, y1: 12, x2: 12, y2: 1012,
        stroke: opts.dashColor, 'stroke-width': 2, 'stroke-dasharray': '12 8'
      }));
    }
    if (opts.style === 'nine') {
      const t = 1024 / 3;
      for (let i = 1; i <= 2; i++) {
        this.svg.appendChild(el('line', {
          x1: t * i, y1: 12, x2: t * i, y2: 1012,
          stroke: opts.dashColor, 'stroke-width': 2, 'stroke-dasharray': '12 8'
        }));
        this.svg.appendChild(el('line', {
          x1: 12, y1: t * i, x2: 1012, y2: t * i,
          stroke: opts.dashColor, 'stroke-width': 2, 'stroke-dasharray': '12 8'
        }));
      }
    }
  };

  Renderer.prototype._drawOutlines = function (charData, curStroke) {
    if (!this.options.hints.showOutline) return;
    const c = this.options.colors;
    // 翻转 y 轴显示原始数据
    // class="st-outlines" 用于 v1.6 作品感模式淡出整组衬底
    const grp = el('g', {
      class: 'st-outlines',
      transform: 'matrix(1 0 0 -1 0 ' + this.options.yFlipBase + ')'
    });
    // 先画"待写"和"已完成"的笔
    for (let i = 0; i < charData.outlines.length; i++) {
      if (i === curStroke) continue;
      const isDone = i < curStroke;
      grp.appendChild(el('path', {
        d: charData.outlines[i],
        fill: isDone ? c.outlineDone : c.outlinePending,
        opacity: isDone ? c.outlineDoneOpacity : c.outlinePendingOpacity
      }));
    }
    // 当前笔最后画（确保在最上层不被压住）
    if (curStroke < charData.outlines.length) {
      grp.appendChild(el('path', {
        d: charData.outlines[curStroke],
        fill: c.outlineCurrent,
        opacity: c.outlineCurrentOpacity
      }));
    }
    this.svg.appendChild(grp);
  };

  Renderer.prototype._drawHint = function (charData, curStroke) {
    if (curStroke >= charData.medians.length) return;
    if (!this.options.hints.showHintLine) return;
    const cur = charData.medians[curStroke];
    const c = this.options.colors;

    // 中线（Catmull-Rom 平滑）
    this.svg.appendChild(el('path', {
      d: this._smoothPathFn(cur),
      stroke: c.hintLine, 'stroke-width': 11, fill: 'none',
      'stroke-dasharray': '16 12',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      opacity: 0.80
    }));

    // 起点呼吸圆
    if (this.options.hints.pulseNextStroke) {
      const startPt = cur[0];
      const pulse = el('circle', {
        cx: startPt[0], cy: startPt[1], r: 24,
        fill: c.startDot, opacity: 0.6
      });
      pulse.appendChild(el('animate', {
        attributeName: 'r', values: '18; 34; 18', dur: '1.5s', repeatCount: 'indefinite'
      }));
      pulse.appendChild(el('animate', {
        attributeName: 'opacity', values: '0.7; 0.2; 0.7', dur: '1.5s', repeatCount: 'indefinite'
      }));
      this.svg.appendChild(pulse);
      this.svg.appendChild(el('circle', { cx: startPt[0], cy: startPt[1], r: 10, fill: c.startDot }));
    }

    // 方向箭头
    if (this.options.hints.showArrow && cur.length >= 2) {
      const endPt = cur[cur.length - 1];
      const penult = cur[cur.length - 2];
      const angle = Math.atan2(endPt[1] - penult[1], endPt[0] - penult[0]);
      const aLen = 40, aW = 15;
      const x1 = endPt[0] - Math.cos(angle) * aLen + Math.sin(angle) * aW;
      const y1 = endPt[1] - Math.sin(angle) * aLen - Math.cos(angle) * aW;
      const x2 = endPt[0] - Math.cos(angle) * aLen - Math.sin(angle) * aW;
      const y2 = endPt[1] - Math.sin(angle) * aLen + Math.cos(angle) * aW;
      this.svg.appendChild(el('path', {
        d: 'M ' + x1 + ' ' + y1 + ' L ' + endPt[0] + ' ' + endPt[1] + ' L ' + x2 + ' ' + y2,
        stroke: c.hintLine, 'stroke-width': 6, fill: 'none',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    }
  };

  Renderer.prototype._drawStrokeOrder = function (charData) {
    if (!this.options.hints.showStrokeOrder) return;
    const c = this.options.colors;
    for (let i = 0; i < charData.medians.length; i++) {
      const startPt = charData.medians[i][0];
      const grp = el('g');
      grp.appendChild(el('circle', {
        cx: startPt[0], cy: startPt[1], r: 32,
        fill: '#fff', stroke: c.startDot, 'stroke-width': 4
      }));
      const txt = el('text', {
        x: startPt[0], y: startPt[1] + 12,
        'text-anchor': 'middle', 'font-size': 36, 'font-weight': 'bold',
        fill: c.startDot
      });
      txt.textContent = String(i + 1);
      grp.appendChild(txt);
      this.svg.appendChild(grp);
    }
  };

  Renderer.prototype.render = function (charData, curStroke) {
    if (!charData) return;
    this.svg.innerHTML = '';
    this.svg.setAttribute('viewBox', '0 0 1024 1024');
    this._drawGrid();
    this._drawOutlines(charData, curStroke);
    this._drawHint(charData, curStroke);
    if (this.options.hints.showStrokeOrder && curStroke === 0) {
      this._drawStrokeOrder(charData);
    }
  };

  Renderer.prototype.clear = function () {
    this.svg.innerHTML = '';
  };

  Renderer.prototype.setOptions = function (patch) {
    if (!patch) return;
    if (patch.hints) Object.assign(this.options.hints, patch.hints);
    if (patch.colors) Object.assign(this.options.colors, patch.colors);
    if (patch.grid)   Object.assign(this.options.grid, patch.grid);
    if (typeof patch.yFlipBase === 'number') this.options.yFlipBase = patch.yFlipBase;
  };

  return { Renderer: Renderer, _el: el };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _Renderer;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.renderer = _Renderer;
}

/* ============================================================
 * src/data-loader.js
 * ============================================================ */

/**
 * data-loader.js · 异步加载 stroke-path.json + 笔画名兜底
 *
 * 设计：
 *   - 必备数据：stroke-path.json（几何 + 轮廓 + 中线，本 skill 内置）
 *   - 可选数据：stroke-data.json（笔画名，优先用 stroke-loader.js 暴露的 window.getStrokeData）
 *   - 数据 URL 优先级：
 *       1. window.STROKE_ANIM_PATH_URL / window.STROKE_DATA_URL
 *       2. 当前脚本标签的 data-stroke-path / data-stroke-data 属性
 *       3. 从当前 animation-loader.js / stroke-loader.js 的脚本 URL 推导同版本 assets
 *       4. 构建时兜底 CDN（发布脚本会按 TARGET_ENV 渲染）
 *
 * 加载完成后派发 'stroke-anim-ready' 事件
 */
'use strict';

const _DataLoader = (function () {
  const FALLBACK_CDN_ORIGIN = 'https://musk-online.fbcontent.cn';
  const FALLBACK_ANIMATION_VERSION = 'v1';
  const FALLBACK_ORDER_VERSION = 'v1';

  let pathDB = null;          // { chars: {...}, y_flip_base, ... }
  let namesDB = null;          // { char: [strokeName, ...] } 或 'external' 表示走 window.getStrokeData
  let pathPromise = null;
  let namesPromise = null;
  let ready = false;
  let _dispatched = false;     // stroke-anim-ready 只派发一次

  function _findScriptSrc(needle) {
    if (typeof document === 'undefined') return null;
    if (document.currentScript) {
      const currentSrc = document.currentScript.getAttribute('src') || '';
      if (!needle || currentSrc.indexOf(needle) >= 0) return currentSrc || null;
    }
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].getAttribute('src') || '';
      if (!needle || src.indexOf(needle) >= 0) return src || null;
    }
    return null;
  }

  function _stripQueryHash(url) {
    return (url || '').replace(/[?#].*$/, '');
  }

  function _replaceScriptAsset(url, scriptPath, assetPath) {
    const clean = _stripQueryHash(url);
    if (!clean || clean.slice(-scriptPath.length) !== scriptPath) return null;
    return clean.slice(0, clean.length - scriptPath.length) + assetPath;
  }

  function _inferAnimationAssetURL() {
    return _replaceScriptAsset(
      _findScriptSrc('animation-loader'),
      '/templates/animation-loader.js',
      '/assets/stroke-path.json'
    );
  }

  function _inferStrokeOrderDataURL() {
    return _replaceScriptAsset(
      _findScriptSrc('stroke-loader'),
      '/templates/stroke-loader.js',
      '/assets/stroke-data.json'
    );
  }

  function _fallbackAnimationAssetURL() {
    return FALLBACK_CDN_ORIGIN + '/pub-musk-ai-studio/skills/stroke-animation/'
      + FALLBACK_ANIMATION_VERSION + '/assets/stroke-path.json';
  }

  function _fallbackStrokeOrderDataURL() {
    return FALLBACK_CDN_ORIGIN + '/pub-musk-ai-studio/skills/stroke-order/'
      + FALLBACK_ORDER_VERSION + '/assets/stroke-data.json';
  }

  function _getCurrentScriptAttr(attr) {
    if (typeof document === 'undefined') return null;
    // 当前正在执行的 script
    if (document.currentScript) {
      const v = document.currentScript.getAttribute(attr);
      if (v) return v;
    }
    // 兜底：找含 'animation-loader' 的 script
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('animation-loader') >= 0) {
        const v = scripts[i].getAttribute(attr);
        if (v) return v;
      }
    }
    return null;
  }

  function _resolvePathURL() {
    if (typeof window !== 'undefined' && window.STROKE_ANIM_PATH_URL) return window.STROKE_ANIM_PATH_URL;
    const attr = _getCurrentScriptAttr('data-stroke-path');
    if (attr) return attr;
    return _inferAnimationAssetURL() || _fallbackAnimationAssetURL();
  }

  function _resolveNamesURL() {
    if (typeof window !== 'undefined' && window.STROKE_DATA_URL) return window.STROKE_DATA_URL;
    const attr = _getCurrentScriptAttr('data-stroke-data');
    if (attr) return attr;
    return _inferStrokeOrderDataURL() || _fallbackStrokeOrderDataURL();
  }

  function _fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }

  function loadPathDB() {
    if (pathPromise) return pathPromise;
    pathPromise = _fetchJSON(_resolvePathURL()).then(function (j) {
      if (!j || !j.chars) throw new Error('stroke-path.json 格式错误');
      pathDB = j;
      return j;
    });
    return pathPromise;
  }

  function loadNamesDB() {
    if (namesPromise) return namesPromise;
    // 优先用 stroke-loader 暴露的 window.getStrokeData
    if (typeof window !== 'undefined' && typeof window.getStrokeData === 'function') {
      namesDB = 'external';
      namesPromise = Promise.resolve('external');
      return namesPromise;
    }
    namesPromise = _fetchJSON(_resolveNamesURL()).then(function (j) {
      if (!j || !j.data) throw new Error('stroke-data.json 格式错误');
      namesDB = j.data;
      return j.data;
    }).catch(function (e) {
      // 笔画名加载失败不阻塞主流程，只是 hint 显示降级
      console.warn('[stroke-animation] 笔画名加载失败，将使用占位符：', e.message);
      namesDB = {};
      return {};
    });
    return namesPromise;
  }

  function loadAll() {
    return Promise.all([loadPathDB(), loadNamesDB()]).then(function () {
      ready = true;
      if (!_dispatched) {
        _dispatched = true;
        _dispatch('stroke-anim-ready', {
          chars: pathDB ? Object.keys(pathDB.chars).length : 0,
          names: namesDB === 'external' ? 'external' : Object.keys(namesDB || {}).length
        });
      }
      return true;
    }).catch(function (e) {
      if (!_dispatched) {
        _dispatched = true;
        _dispatch('stroke-anim-ready', { error: e && e.message ? e.message : String(e) });
      }
      throw e;
    });
  }

  function _dispatch(name, detail) {
    if (typeof window === 'undefined') return;
    var ev;
    try {
      ev = new CustomEvent(name, { detail: detail || {} });
    } catch (e1) {
      try {
        ev = document.createEvent('CustomEvent');
        ev.initCustomEvent(name, false, false, detail || {});
      } catch (e2) {
        ev = document.createEvent('Event');
        ev.initEvent(name, false, false);
        try { ev.detail = detail || {}; } catch (_) {}
      }
    }
    window.dispatchEvent(ev);
  }

  function getCharPath(char) {
    return pathDB && pathDB.chars[char] ? pathDB.chars[char] : null;
  }

  function getCharNames(char) {
    if (typeof window !== 'undefined' && typeof window.getStrokeData === 'function') {
      const d = window.getStrokeData(char);
      return (d && Array.isArray(d.strokes)) ? d.strokes : null;
    }
    return (namesDB && typeof namesDB === 'object' && namesDB !== 'external') ? (namesDB[char] || null) : null;
  }

  function getYFlipBase() {
    return pathDB && typeof pathDB.y_flip_base === 'number' ? pathDB.y_flip_base : 900;
  }

  function isReady() { return ready; }

  function listChars() { return pathDB ? Object.keys(pathDB.chars) : []; }

  function hasChar(char) { return !!(pathDB && pathDB.chars[char]); }

  // ===== Han 字符工具 =====
  // 只匹配 CJK 基本区 + 扩展 A（覆盖 7818 字库的全部字；扩展 B+ 本 skill 不支持）
  const HAN_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
  const HAN_RE_G = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;

  function _isHan(ch) { return typeof ch === 'string' && ch.length > 0 && HAN_RE.test(ch); }

  /** 提取字符串中所有 Han 字符（按出现顺序，去重） */
  function _extractHans(input) {
    if (typeof input !== 'string' || !input) return [];
    const matches = input.match(HAN_RE_G) || [];
    const seen = Object.create(null);
    const out = [];
    for (let i = 0; i < matches.length; i++) {
      const c = matches[i];
      if (!seen[c]) { seen[c] = true; out.push(c); }
    }
    return out;
  }

  /** 取首个 Han 字符，无则返回 null */
  function _firstHan(input) {
    if (typeof input !== 'string' || !input) return null;
    const m = input.match(HAN_RE);
    return m ? m[0] : null;
  }

  /**
   * 返回字的 tier：
   *   - 'textbook' : 在 path 库内（2865 字，几何 + 笔画名都有）
   *   - 'extended' : 不在 path 库但在 names 库（4953 小学范围外字，仅有笔画名）
   *   - null       : 不在任何库
   * 优先用 window.getStrokeData 暴露的 tier 字段（最权威），兜底走本地判断。
   */
  function getTier(char) {
    if (!char) return null;
    if (typeof window !== 'undefined' && typeof window.getStrokeData === 'function') {
      try {
        const d = window.getStrokeData(char);
        if (d && d.source === 'db' && d.tier) return d.tier;
      } catch (_) {}
    }
    if (hasChar(char)) return 'textbook';
    if (namesDB && typeof namesDB === 'object' && namesDB !== 'external' && namesDB[char]) {
      return 'extended';
    }
    return null;
  }

  function getStrokeCount(char) {
    const raw = getCharPath(char);
    if (raw) return raw.stroke_count || (raw.strokes && raw.strokes.length) || null;
    const names = getCharNames(char);
    if (Array.isArray(names)) return names.length;
    return null;
  }

  /** 一次性获取跟练所需的完整字数据（含 y 翻转后的 medians） */
  function getCharData(char) {
    const raw = getCharPath(char);
    if (!raw) return null;
    const yBase = getYFlipBase();
    const names = getCharNames(char) || raw.strokes.map(function (_, i) { return '\u7b14' + (i + 1); });
    return {
      char: char,
      stroke_count: raw.stroke_count || raw.strokes.length,
      strokeNames: names,
      outlines: raw.strokes,
      medians: raw.medians.map(function (s) {
        return s.map(function (p) { return [p[0], yBase - p[1]]; });
      })
    };
  }

  return {
    loadPathDB: loadPathDB,
    loadNamesDB: loadNamesDB,
    loadAll: loadAll,
    isReady: isReady,
    hasChar: hasChar,
    listChars: listChars,
    getCharPath: getCharPath,
    getCharNames: getCharNames,
    getYFlipBase: getYFlipBase,
    getCharData: getCharData,
    // v1.2 新增：validate 支持
    isHan: _isHan,
    extractHans: _extractHans,
    firstHan: _firstHan,
    getTier: getTier,
    getStrokeCount: getStrokeCount
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _DataLoader;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.dataLoader = _DataLoader;
}

/* ============================================================
 * src/stroke-trace.js
 * ============================================================ */

/**
 * stroke-trace.js · StrokeTrace 主控（对外 API 入口）
 *
 * 暴露：
 *   window.StrokeTrace.mount(options) → handle
 *   window.StrokeTrace.preload(chars?) → Promise
 *   window.StrokeTrace.isReady() → boolean
 *   window.StrokeTrace.hasChar(char) → boolean
 *   window.StrokeTrace.listChars() → string[]
 *
 * mount 自动渲染完整跟练 UI（田字格 + 当前笔提示 + 评分 + 控件）
 * LLM 只需 3 行 HTML：
 *   <script src=".../stroke-loader.js"></script>
 *   <script src=".../animation-loader.js"></script>
 *   <script>StrokeTrace.mount({ target: '#box', char: '学' });</script>
 */
'use strict';

const _StrokeTrace = (function () {
  // 模块依赖（浏览器侧由 build.sh 拼接顺序保证已就绪）
  const dataLoader = (typeof _DataLoader !== 'undefined') ? _DataLoader
                   : (typeof window !== 'undefined' ? window._ST.dataLoader : null);
  const TracerMod  = (typeof _Tracer !== 'undefined') ? _Tracer
                   : (typeof window !== 'undefined' ? window._ST.tracer : null);
  const RendererMod = (typeof _Renderer !== 'undefined') ? _Renderer
                    : (typeof window !== 'undefined' ? window._ST.renderer : null);
  const scoring   = (typeof _Scoring !== 'undefined') ? _Scoring
                  : (typeof window !== 'undefined' ? window._ST.scoring : null);

  /**
   * 32 种标准笔画硬笔提示语（v1.6.1 重写：面向小学语文）
   * 目标：适合小学语文识字写字场景，帮助学生写对、写清楚、写匀称。
   * 原则：不用传统书法笔法术语，重点提示方向、长短、斜正、折角和易错点。
   * 说明：这是通用 fallback；更高质量版本应使用"字内逐笔提示"覆盖具体汉字。
   */
  const STROKE_TIPS = {
    // 基本（6）
    '点':       '轻轻点下，方向要准，不要写成长线',
    '横':       '从左往右写，基本写平，可微微上斜',
    '竖':       '从上往下写，要写直，不要左右歪',
    '撇':       '从上往左下写，慢慢变轻，不要太弯',
    '捺':       '从上往右下写，写得舒展，末尾轻轻收住',
    '提':       '从左下往右上挑，短一些，不要挑太长',
    // 折类（5）
    '横折':     '先往右写横，再折向下，折角要方正',
    '竖折':     '先往下写竖，再向右转，转角不要圆',
    '撇折':     '先向左下写撇，再转向右上写短提',
    '横撇':     '先往右写横，再向左下撇出',
    '撇点':     '先向左下写撇，再向右下点出',
    // 钩类（12）
    '竖钩':     '先写直竖，到底后向左上轻轻钩',
    '弯钩':     '顺着弯线往下写，末尾向左上钩',
    '斜钩':     '从左上往右下斜写，末尾向右上钩',
    '卧钩':     '弯弯地向右下写，末尾向左上小钩',
    '竖弯钩':   '先写竖，再向右弯，末尾向上钩',
    '横钩':     '先往右写横，末尾向左下轻轻钩',
    '横折钩':   '先横再折向下，末尾向左上钩',
    '横折弯钩': '先横折，再顺势弯下，末尾钩起',
    '横撇弯钩': '先横再撇，接着弯下，最后钩起',
    '横折折折钩': '先横折，再连续转折，最后向上钩',
    '竖折折钩': '先竖再折，再转折，末尾向左上钩',
    '横斜钩':   '先写短横，再斜向右下，末尾向右上钩',
    // 提类（2）
    '竖提':     '先写竖，到底后向右上挑出',
    '横折提':   '先横再折向下，最后向右上挑出',
    // 弯折组合（7）
    '竖弯':     '先写竖，再向右平弯，弯处要自然',
    '横折弯':   '先横再折，再向右下弯，转弯别太急',
    '横折折撇': '先横折，再转折，最后向左下撇出',
    '竖折撇':   '先写竖，再向右折，最后向左下撇',
    '竖折折':   '先竖再折，再折一次，折角要清楚',
    '横折折':   '先横再折，再折一次，三段要分清',
    '横折折折': '先横后连续转折，每个折角要写清楚'
  };
  function _strokeTip(name) {
    if (!name) return '';
    return STROKE_TIPS[name] || '';
  }

  let stylesInjected = false;

  function _injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const css = [
      '.st-trace { position: relative; display: inline-block; max-width: 100%; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; color: #2D3436; }',
      '.st-trace .st-hint { display: flex; align-items: center; gap: 8px; padding: 8px 14px; margin-bottom: 10px; background: #fff; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 14px; }',
      '.st-trace .st-hint-num { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 6px; background: linear-gradient(135deg,#FF9F43,#FF7F50); color:#fff; border-radius: 12px; font-weight: 700; font-size: 13px; }',
      '.st-trace .st-hint-name { color: #2E86DE; font-weight: 600; }',
      '.st-trace .st-hint-prog { color: #95A5A6; font-size: 12px; margin-left: auto; }',
      '.st-trace .st-pad { position: relative; width: 320px; height: 320px; max-width: 100%; aspect-ratio: 1 / 1; background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding: 12px; }',
      '.st-trace .st-pad svg, .st-trace .st-pad canvas { position: absolute; left: 12px; top: 12px; right: 12px; bottom: 12px; width: calc(100% - 24px); height: calc(100% - 24px); }',
      '.st-trace .st-pad svg { pointer-events: none; }',
      '.st-trace .st-pad canvas.st-ink { touch-action: none; -ms-touch-action: none; user-select: none; -webkit-user-select: none; cursor: crosshair; }',
      '.st-trace .st-pad canvas.st-fx { pointer-events: none; touch-action: none; }',
      // 进度条
      '.st-trace .st-prog-wrap { height: 6px; background: #F4E6D4; border-radius: 3px; overflow: hidden; margin-bottom: 10px; }',
      '.st-trace .st-prog-bar { height: 100%; width: 0%; background: linear-gradient(90deg,#FF9F43,#FF7F50); transition: width 0.4s cubic-bezier(0.34,1.56,0.64,1); border-radius: 3px; box-shadow: 0 0 6px rgba(255,127,80,0.5); }',
      // 连击徽章（绝对定位浮在田字格上方）
      '.st-trace .st-combo-badge { position: absolute; top: 8px; right: 8px; padding: 6px 12px; background: linear-gradient(135deg,#FF6B6B,#FF4757); color: #fff; font-size: 13px; font-weight: 700; border-radius: 999px; box-shadow: 0 4px 12px rgba(255,75,87,0.45); z-index: 5; display: none; transform-origin: center; }',
      '.st-trace .st-combo-badge.show { display: inline-flex; align-items: center; gap: 4px; animation: st-combo-pop 0.5s cubic-bezier(0.34,1.56,0.64,1); }',
      '.st-trace .st-combo-badge.bump { animation: st-combo-bump 0.4s cubic-bezier(0.34,1.56,0.64,1); }',
      '.st-trace .st-combo-badge .st-combo-num { font-size: 16px; margin-left: 2px; }',
      '@keyframes st-combo-pop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 60% { transform: scale(1.15) rotate(4deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }',
      '@keyframes st-combo-bump { 0% { transform: scale(1); } 40% { transform: scale(1.2); } 100% { transform: scale(1); } }',
      // 星星弹出
      '.st-trace .st-stars .lit.st-flash { animation: st-star-flash 0.6s ease-out; }',
      '@keyframes st-star-flash { 0% { transform: scale(1); text-shadow: 0 0 6px rgba(243,156,18,0.4); } 50% { transform: scale(1.4); text-shadow: 0 0 16px rgba(255,215,0,0.9), 0 0 24px rgba(255,215,0,0.6); } 100% { transform: scale(1); text-shadow: 0 0 6px rgba(243,156,18,0.4); } }',
      '.st-trace .st-stars span { display: inline-block; transition: color 0.2s; }',
      '.st-trace .st-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 10px; }',
      '.st-trace .st-stars { font-size: 22px; letter-spacing: 2px; color: #E0E0E0; }',
      '.st-trace .st-stars .lit { color: #F39C12; text-shadow: 0 0 6px rgba(243,156,18,0.4); }',
      '.st-trace .st-btns { display: flex; gap: 6px; }',
      '.st-trace button.st-btn { padding: 6px 14px; border:none; border-radius: 8px; background: #fff; color: #2D3436; font-family: inherit; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.06); transition: all 0.15s; }',
      '.st-trace button.st-btn:hover { transform: translateY(-1px); }',
      '.st-trace button.st-btn:disabled { opacity: 0.4; cursor: not-allowed; }',
      '.st-trace button.st-btn.primary { background: linear-gradient(135deg,#FF9F43,#FF7F50); color:#fff; }',
      '.st-trace .st-msg { margin-top: 8px; padding: 8px 12px; background: #FAF6EE; border-radius: 8px; font-size: 13px; color: #5D6D7E; min-height: 18px; }',
      '.st-trace .st-msg.err   { background: #FDEDEC; color: #C0392B; }',
      '.st-trace .st-msg.ok    { background: #D5F5E3; color: #196F3D; }',
      '.st-trace .st-msg b { color: inherit; font-weight: 700; }',
      '.st-trace .st-load { display: flex; align-items: center; justify-content: center; height: 100%; color:#95A5A6; font-size: 13px; }',
      // v1.4 笔画口诀栏
      '.st-trace .st-tip { margin: -6px 0 10px; padding: 6px 12px 6px 14px; font-size: 12px; line-height: 1.5; color: #5D6D7E; background: #FFF8EE; border-radius: 8px; border-left: 3px solid #FF9F43; transition: opacity 0.3s ease; }',
      '.st-trace .st-tip:empty { display: none; }',
      '.st-trace .st-tip::before { content: "\u{1F4A1} "; }',
      // v1.4 看示范按钮
      '.st-trace button.st-btn.st-btn-watch { background: #FFF3E0; color: #B9770E; padding: 6px 10px; }',
      '.st-trace button.st-btn.st-btn-watch:hover { background: #FFE9B5; }',
      '.st-trace button.st-btn.st-btn-watch.playing { background: #FF9F43; color: #fff; animation: st-watch-pulse 1.2s ease-in-out infinite; }',
      '@keyframes st-watch-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); box-shadow: 0 0 12px rgba(255,159,67,0.6); } }',
      // ★ v1.6 作品感（整字完成态）：标准衬底淡出 + 鼓励文案高亮
      '.st-trace .st-pad svg .st-outlines { transition: opacity 0.8s ease-out; }',
      '.st-trace.st-finished .st-pad svg .st-outlines { opacity: 0 !important; }',
      '.st-trace .st-msg.st-finish { background: linear-gradient(135deg,#FFF3E0,#FFE0B2); color:#B9770E; font-size: 14px; line-height: 1.6; text-align: center; padding: 12px 16px; box-shadow: 0 4px 12px rgba(255,127,80,0.18); border-radius: 10px; animation: st-finish-pop 0.6s cubic-bezier(0.34,1.56,0.64,1); }',
      '.st-trace .st-msg.st-finish b { color: #D35400; }',
      '@keyframes st-finish-pop { 0% { transform: scale(0.92); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }',
      // ★ v1.7 / v1.7.1 圈点系统：作品态对三星笔画画红色手绘圈（仅在 .st-finished 时可见）
      '.st-trace .st-pad svg .st-circles { pointer-events: none; }',
      '.st-trace .st-pad svg .st-circles .st-circle { fill: none; stroke: #E74C3C; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 14 6; opacity: 0; filter: drop-shadow(0 1px 2px rgba(231,76,60,0.25)); }',
      '.st-trace.st-finished .st-pad svg .st-circles .st-circle { animation: st-circle-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards; }',
      '@keyframes st-circle-pop { 0% { opacity: 0; stroke-dashoffset: 240; } 60% { opacity: 1; } 100% { opacity: 0.92; stroke-dashoffset: 0; } }',
      // ★ v1.7.1 表扬章：在椭圆主轴一端打 ★ 红五角星，让"圈是表扬"的语义无歧义
      '.st-trace .st-pad svg .st-circles .st-praise-star { fill: #E74C3C; stroke: #FFFFFF; stroke-width: 4; stroke-linejoin: round; opacity: 0; filter: drop-shadow(0 2px 3px rgba(231,76,60,0.35)); transform-box: fill-box; transform-origin: center; }',
      '.st-trace.st-finished .st-pad svg .st-circles .st-praise-star { animation: st-star-pop 0.45s cubic-bezier(0.34,1.6,0.64,1) forwards; }',
      '@keyframes st-star-pop { 0% { opacity: 0; transform: scale(0.4) rotate(-30deg); } 60% { opacity: 1; transform: scale(1.15) rotate(8deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }',
      // ★ v1.7.1 文案首行说明红圈含义
      '.st-trace .st-msg.st-finish .st-praise-hint { margin-top: 8px; font-size: 12.5px; color: #C0392B; font-weight: 500; letter-spacing: 0.3px; }',
      '.st-trace .st-msg.st-finish .st-praise-hint b { color: #C0392B; font-size: 14px; }',
      // ★ v1.7 重写笔画"改正成功"鼓励文案（白底贴纸样式）
      '.st-trace .st-msg.st-finish .st-retry-praise { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(180,120,60,0.3); }',
      '.st-trace .st-msg.st-finish .st-retry-praise .st-retry-item { background: rgba(255,255,255,0.85); color: #16A085; font-size: 12.5px; line-height: 1.45; padding: 4px 10px; border-radius: 999px; box-shadow: 0 1px 3px rgba(22,160,133,0.15); white-space: nowrap; }'
    ].join('\n');
    const s = document.createElement('style');
    s.id = '_st-trace-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function _resolveTarget(target) {
    if (typeof target === 'string') return document.querySelector(target);
    if (target && target.nodeType === 1) return target;
    return null;
  }

  // ============= TraceInstance =============
  function TraceInstance(opts) {
    this.opts = Object.assign({
      target: null,
      char: null,
      mode: 'follow',                      // follow | free | test
      grid: { style: 'tian' },
      brush: { color: '#2D3436', width: 22 },
      scoring: {
        enabled: true,
        showStars: true,
        showSegmentErrors: true,
        combo: false,
        threshold: { excellent: 0.90, good: 0.75, pass: 0.60 },
        // ★ v1.6：通过门槛 — 当前笔达到此星数才算"写对"
        //   2 (默认) | 1（宽松，1 星即过）| 3（严格，必须 3 星）
        // 未达门槛时：保留 ~failHoldMs 毫秒红笔标注 → 自动清除该笔 + 强制重写
        passStars: 2,
        failHoldMs: 1000           // 错笔停留时长（让学生看清错在哪）
      },
      hints: {
        showOutline: true, showStrokeOrder: false,
        pulseNextStroke: true, showStrokeName: true,
        showStrokeTip: true                 // 在 hint 下方显示硬笔提示语
      },
      // v1.4 新增：写前示范（Watch Mode）
      // 金色虚拟笔尖沿标准 median 滑过，速度按"起笔稍慢-中段顺滑-收笔稳"自然曲线，
      // 留下蓝色发光墨迹 + 右手握笔 ✍️ emoji 跟随笔尖，1.1s 内播完，淡出后启用手写。
      watchMode: {
        enabled: true,
        // v1.4.1：默认按需触发（不自动播）。学生主动点「📹 看示范」时才播。
        // 取值：false（默认，按需）| 'first'（仅 mount 首笔自动）| true（每笔切换都自动）
        autoPlay: false,
        duration: 1100,                     // ms，正常播放
        retryDuration: 1700,                // ms，重写慢速时长
        retryAfterFails: 0,                 // v1.4.1：默认 0 = 关闭自动重试（避免打断）；老师场景可设 2
        showBrush: true,                    // 金色虚拟笔尖
        showHand: true,                     // v1.4.1：显示右手握笔 ✍️ emoji 跟随笔尖
        handEmoji: '\u270D\uFE0F',          // ✍️（U+270D + 选择符），可改 🖐️ / ✋ 等
        handSize: 80,                       // emoji 字号 px（基于 1024 viewBox）
        fadeOutDuration: 500,
        showButton: true                    // 控件栏显示「📹 看示范」按钮
      },
      // 写完一笔后自动推进到下一笔（顺滑书写）
      // true | 'on-pass' | false
      //   true     : 始终自动跳（最顺滑，默认）
      //   'on-pass': 仅当 stars >= 2 才自动跳，1 星/0 星停下来等用户决定
      //   false    : 必须点「下一笔」（兼容旧行为）
      autoAdvance: true,
      autoAdvanceDelay: 700,    // ms，给用户看星级反馈的时间
      // v1.3 新增：正反馈配置（默认全开，教室/家用场景直接得体验）
      celebration: {
        enabled: true,          // 总开关
        perfectStroke: true,    // 3 星笔完成瞬间金色闪光
        combo: true,            // 连续 3 星徽章（🔥 连击 N）
        comboMin: 2,            // 连击徽章最低触发数
        fireworks: true,        // 整字 ≥2 星时完成烟花
        fireworksDuration: 1800 // 烟花持续 ms
      },
      progress: {
        showBar: true           // 顶部进度条（1/N → N/N）
      },
      // ★ v1.6 / v1.7：整字完成"作品感" + 圈点系统
      //   作品感（v1.6）：标准衬底淡出，仅保留田字格 + 学生笔迹 + 鼓励文案
      //   圈点系统（v1.7）：作品态出现后，对 3 星笔画用红色手绘圈表扬；
      //                       对曾经写错重写过的笔画在点评区给"改正成功"鼓励文案。
      //   「下一笔」按钮自动变为「再写一次 ↻」
      artwork: {
        enabled: true,
        message: '🎉 这是你写出来的字！',
        praiseCircles: true,        // ★ v1.7：是否在作品态用红圈圈出三星笔画
        maxPraiseCircles: 2,        // ★ v1.7.1：默认 2（克制视觉，避免重叠占满字）
        praiseStartDelayMs: 800,    // ★ v1.7.1：衬底淡出后再画红圈的延时（先让学生看清自己的字）
        praiseStaggerMs: 220,       // ★ v1.7.1：多个圈错落出现的间隔
        praiseStar: true,           // ★ v1.7.1：在每个红圈一端附 ★ 五角星标识，让"表扬"语义无歧义
        retryPraise: true           // ★ v1.7：是否在点评区显示"改正成功"鼓励文案
      },
      onStrokeStart: null,
      onStrokeComplete: null,
      onFinish: null,
      onReset: null
    }, opts || {});

    this.container = _resolveTarget(this.opts.target);
    if (!this.container) throw new Error('StrokeTrace.mount: target 未找到');
    this.charData = null;
    this.curStroke = 0;
    this.strokeResults = [];
    this._strokeRetries = [];   // ★ v1.7：每笔曾失败次数（>0 即"重写过"，仅失败分支累加）
    this.combo = 0;
    this._advanceTimer = null;
    this._failHoldTimer = null;  // v1.6：错笔保留期 timer
    this._artworkTimer = null;   // ★ v1.7.1：作品态延迟画红圈的 timer（衬底淡出后再出现）
    this._fxRaf = null;
    this._fireworks = null;     // { particles, t0, until }
    this._watch = null;         // v1.4 watch mode 状态
    this._consecutiveFails = 0; // v1.4 连续未达标计数（触发 slow 播放）
    this._finished = false;     // v1.6：整字完成进入作品感态
    this._destroyed = false;
    this._renderUI();
  }

  TraceInstance.prototype._renderUI = function () {
    _injectStyles();
    this.container.innerHTML = '';
    this.container.classList.add('st-trace');
    const showProgBar = this.opts.progress && this.opts.progress.showBar !== false;
    const showTip = !this.opts.hints || this.opts.hints.showStrokeTip !== false;
    const showWatchBtn = !this.opts.watchMode || this.opts.watchMode.showButton !== false;
    this.container.innerHTML = ''
      + '<div class="st-hint">'
      + '  <span class="st-hint-num">·</span>'
      + '  <span>当前笔：<span class="st-hint-name">—</span></span>'
      + '  <span class="st-hint-prog">（— / —）</span>'
      + '</div>'
      + (showTip ? '<div class="st-tip"></div>' : '')
      + (showProgBar ? '<div class="st-prog-wrap"><div class="st-prog-bar"></div></div>' : '')
      + '<div class="st-pad">'
      + '  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"></svg>'
      + '  <canvas class="st-ink" width="1024" height="1024"></canvas>'
      + '  <canvas class="st-fx" width="1024" height="1024"></canvas>'
      + '  <div class="st-combo-badge" aria-hidden="true"><span class="st-combo-icon">\ud83d\udd25</span>连击 <span class="st-combo-num">0</span></div>'
      + '</div>'
      + '<div class="st-bar">'
      + '  <div class="st-stars">☆ ☆ ☆</div>'
      + '  <div class="st-btns">'
      + (showWatchBtn ? '    <button class="st-btn st-btn-watch" data-act="watch" title="看一遍标准写法">📹 看示范</button>' : '')
      + '    <button class="st-btn" data-act="redo">重写</button>'
      + '    <button class="st-btn primary" data-act="next" disabled>下一笔</button>'
      + '    <button class="st-btn" data-act="reset">重新开始</button>'
      + '  </div>'
      + '</div>'
      + '<div class="st-msg">加载中…</div>';
    this._dom = {
      hintNum:  this.container.querySelector('.st-hint-num'),
      hintName: this.container.querySelector('.st-hint-name'),
      hintProg: this.container.querySelector('.st-hint-prog'),
      tipText:  this.container.querySelector('.st-tip'),
      progBar:  this.container.querySelector('.st-prog-bar'),
      svg:      this.container.querySelector('svg'),
      canvas:   this.container.querySelector('canvas.st-ink'),
      fxCanvas: this.container.querySelector('canvas.st-fx'),
      comboBadge: this.container.querySelector('.st-combo-badge'),
      comboNum:   this.container.querySelector('.st-combo-num'),
      stars:    this.container.querySelector('.st-stars'),
      btnWatch: this.container.querySelector('[data-act="watch"]'),
      btnRedo:  this.container.querySelector('[data-act="redo"]'),
      btnNext:  this.container.querySelector('[data-act="next"]'),
      btnReset: this.container.querySelector('[data-act="reset"]'),
      msg:      this.container.querySelector('.st-msg')
    };

    const self = this;
    if (this._dom.btnWatch) {
      this._dom.btnWatch.addEventListener('click', function () { self.playDemo(); });
    }
    this._dom.btnRedo.addEventListener('click', function () { self.redoStroke(); });
    this._dom.btnNext.addEventListener('click', function () { self.nextStroke(); });
    this._dom.btnReset.addEventListener('click', function () { self.reset(); });

    this.tracer = new TracerMod.Tracer(this._dom.canvas, this.opts.brush);
    this.tracer.onEnd = function (pts) { self._onStrokeEnd(pts); };
    this.tracer.onStart = function (p) {
      // 顺滑书写：用户在「自动跳转」生效前提前起笔 → 立即推进当前笔，
      // 这样新画的笔会被识别为下一笔而不是当前笔的"重写"。
      if (self._advanceTimer) {
        self._cancelAutoAdvance();
        self.nextStroke();
      }
      if (self.opts.onStrokeStart) {
        self.opts.onStrokeStart({
          index: self.curStroke + 1,
          strokeIndex: self.curStroke,
          strokeNo: self.curStroke + 1,
          name: self._strokeName(self.curStroke),
          startPoint: p
        });
      }
    };
    this.renderer = new RendererMod.Renderer(this._dom.svg, {
      yFlipBase: dataLoader.getYFlipBase(),
      grid: { style: this.opts.grid.style || 'tian',
              color: '#E8C4A2', dashColor: '#D9B38A' },
      hints: Object.assign({ showHintLine: true, showArrow: true }, this.opts.hints)
    });

    this._loadAndStart();
  };

  TraceInstance.prototype._loadAndStart = function () {
    this._cancelAutoAdvance();
    this._cancelFailClear();
    this._exitArtworkMode();
    this._clearFx();
    this._hideCombo();
    this.combo = 0;
    const self = this;
    dataLoader.loadAll().then(function () {
      const data = dataLoader.getCharData(self.opts.char);
      if (!data) {
        self._setMsg('「' + self.opts.char + '」不在字库内（仅支持 2,865 教材字）', 'err');
        self._dom.btnRedo.disabled = true;
        self._dom.btnNext.disabled = true;
        return;
      }
      self.charData = data;
      self.curStroke = 0;
      self.strokeResults = [];
      self._strokeRetries = [];      // ★ v1.7：切字/重新加载时清空重写历史
      self.tracer.clearAll();
      self._refreshHint();
      self.renderer.render(data, 0);
      self._resetStars();
      self._setMsg('按 <b>蓝色提示</b> 书写第 1 笔：<b>' + self._strokeName(0) + '</b>', 'ok');
      // v1.4.1 仅当 watchMode.autoPlay === true / 'first' 时才自动播；默认按需点击
      self._maybePlayWatch(0, 'first');
    }, function (e) {
      self._setMsg('数据加载失败：' + (e && e.message ? e.message : e), 'err');
    });
  };

  TraceInstance.prototype._strokeName = function (i) {
    return (this.charData && this.charData.strokeNames && this.charData.strokeNames[i]) || ('笔' + (i + 1));
  };

  TraceInstance.prototype._refreshHint = function () {
    if (!this.charData) return;
    const total = this.charData.outlines.length;
    let strokeName = '';
    if (this.curStroke >= total) {
      this._dom.hintNum.textContent = '✓';
      this._dom.hintName.textContent = '已完成';
      this._dom.hintProg.textContent = '（' + total + ' / ' + total + '）';
    } else {
      strokeName = this._strokeName(this.curStroke);
      this._dom.hintNum.textContent = (this.curStroke + 1);
      this._dom.hintName.textContent = strokeName;
      this._dom.hintProg.textContent = '（' + (this.curStroke + 1) + ' / ' + total + '）';
    }
    // v1.4 同步口诀
    if (this._dom.tipText) {
      const tip = (this.curStroke >= total) ? '' : _strokeTip(strokeName);
      this._dom.tipText.textContent = tip;
    }
    this._updateProgress();
  };

  TraceInstance.prototype._updateProgress = function () {
    if (!this._dom.progBar || !this.charData) return;
    const total = this.charData.outlines.length;
    // 完成笔数 = 已有评分的笔数（0-based curStroke + 已完成本笔？）
    // 简化：进度 = curStroke / total（进到第 N 笔时进度条表示"前 N-1 笔已完成"）
    // 写完最后一笔调用 _finish，此处 curStroke 还未 ++
    const done = this.strokeResults.filter(function (r) { return r; }).length;
    const pct = Math.max(0, Math.min(100, (done / total) * 100));
    this._dom.progBar.style.width = pct.toFixed(1) + '%';
  };

  TraceInstance.prototype._onStrokeEnd = function (userPts) {
    if (!this.charData || this.curStroke >= this.charData.medians.length) return;
    // 失败保留期内不接受新笔（tracer 已 enabled=false，这里再防一道）
    if (this._failHoldTimer) return;
    if (this._finished) return;

    const std = this.charData.medians[this.curStroke];
    const result = scoring.scoreStroke(userPts, std);
    result.userPts = userPts.slice();
    result.strokeName = this._strokeName(this.curStroke);
    result.index = this.curStroke + 1;
    result.strokeIndex = this.curStroke;
    result.strokeNo = this.curStroke + 1;

    const passStars = this._passStars();
    const passed = result.stars >= passStars;
    result.passed = passed;

    if (this.opts.scoring.showStars) this._showStars(result.stars);
    this._showFeedback(result, passed);

    // ★ v1.6：未通过分支 —— 笔迹不进历史，红笔标注短暂保留后清除，强制重写
    if (!passed) {
      if (this.opts.scoring.showSegmentErrors && result.errors && result.errors.length) {
        // 此时 commitStroke 还没调用，redrawStroke 不会重绘这一笔；
        // 直接在当前 canvas 已绘制的笔迹上叠加红笔即可。
        for (const seg of result.errors) {
          this.tracer.drawErrorOverlay(userPts, seg.startUserIdx, seg.endUserIdx);
        }
      }
      // 未通过：不进 strokeResults / 不更新进度 / 不触发 combo / 不启用下一笔 / 不自动跳
      this._dom.btnNext.disabled = true;
      this._consecutiveFails++;
      // ★ v1.7：累加该笔的失败次数（作品态用于"改正成功"鼓励文案）
      this._strokeRetries[this.curStroke] = (this._strokeRetries[this.curStroke] || 0) + 1;
      if (this.opts.onStrokeComplete) this.opts.onStrokeComplete(result);
      this._scheduleFailClear();
      this._maybeRetryWatch();
      return;
    }

    // 通过分支：保留笔迹 + 记录评分 + 推进
    this.strokeResults[this.curStroke] = result;
    this.tracer.commitStroke(userPts);
    this._consecutiveFails = 0;

    this._updateCombo(result.stars);
    this._updateProgress();

    if (result.stars === 3 && this._celeb('perfectStroke')) {
      this._flashPerfectStroke(userPts);
    }

    if (this.opts.onStrokeComplete) this.opts.onStrokeComplete(result);

    const total = this.charData.outlines.length;
    if (this.curStroke >= total - 1) {
      this._finish();
    } else {
      this._dom.btnNext.disabled = false;
      this._scheduleAutoAdvance(result.stars);
    }
  };

  // ★ v1.6：通过门槛取值，默认 2 星
  TraceInstance.prototype._passStars = function () {
    const s = this.opts.scoring;
    if (s && typeof s.passStars === 'number') return Math.max(0, Math.min(3, s.passStars));
    return 2;
  };

  // ★ v1.6：错笔保留期定时清理
  TraceInstance.prototype._scheduleFailClear = function () {
    this._cancelFailClear();
    this.tracer.enabled = false;          // 保留期间禁止学生再画
    const self = this;
    const ms = (this.opts.scoring && typeof this.opts.scoring.failHoldMs === 'number')
      ? this.opts.scoring.failHoldMs : 1000;
    this._failHoldTimer = setTimeout(function () {
      self._failHoldTimer = null;
      if (self._destroyed) return;
      self.tracer.enabled = true;
      self.tracer.clearCurrent();         // 清错笔 + 红笔，前面已通过的笔保留
      self._resetStars();
      self._setMsg('再来一次：请按蓝色提示书写第 '
        + (self.curStroke + 1) + ' 笔 <b>' + self._strokeName(self.curStroke) + '</b>', 'ok');
    }, ms);
  };

  TraceInstance.prototype._cancelFailClear = function () {
    if (this._failHoldTimer) {
      clearTimeout(this._failHoldTimer);
      this._failHoldTimer = null;
      if (this.tracer) this.tracer.enabled = true;
    }
  };

  // ★ v1.6：连续失败到达阈值后，等保留期结束再播慢速示范，避免打断
  TraceInstance.prototype._maybeRetryWatch = function () {
    const w = this.opts.watchMode || {};
    const retryAfter = (typeof w.retryAfterFails === 'number') ? w.retryAfterFails : 0;
    if (w.enabled === false || retryAfter <= 0) return;
    if (this._consecutiveFails < retryAfter) return;
    const self = this;
    const wait = ((this.opts.scoring && this.opts.scoring.failHoldMs) || 1000) + 100;
    setTimeout(function () {
      if (self._destroyed || self._failHoldTimer) return;
      self._maybePlayWatch(self.curStroke, 'retry', true);
    }, wait);
  };

  TraceInstance.prototype._scheduleAutoAdvance = function (stars) {
    this._cancelAutoAdvance();
    const mode = this.opts.autoAdvance;
    if (mode === false) return;
    if (mode === 'on-pass' && stars < 2) return;
    const self = this;
    const delay = (typeof this.opts.autoAdvanceDelay === 'number' && this.opts.autoAdvanceDelay >= 0)
      ? this.opts.autoAdvanceDelay : 700;
    this._advanceTimer = setTimeout(function () {
      self._advanceTimer = null;
      if (!self._destroyed) self.nextStroke();
    }, delay);
  };

  TraceInstance.prototype._cancelAutoAdvance = function () {
    if (this._advanceTimer) {
      clearTimeout(this._advanceTimer);
      this._advanceTimer = null;
    }
  };

  TraceInstance.prototype._showStars = function (n) {
    let html = '';
    for (let i = 0; i < 3; i++) {
      // 新点亮的最后一颗星加 st-flash class 触发一次脉冲动画（由 CSS 处理，无 JS 开销）
      const cls = (i < n) ? ('lit' + (i === n - 1 ? ' st-flash' : '')) : '';
      html += '<span class="' + cls + '">★</span>';
    }
    this._dom.stars.innerHTML = html;
  };

  TraceInstance.prototype._resetStars = function () {
    this._dom.stars.innerHTML = '<span>☆</span><span>☆</span><span>☆</span>';
  };

  // ★ v1.6：passed 决定提示语调；未通过明确提示"再写一遍同一笔"
  TraceInstance.prototype._showFeedback = function (result, passed) {
    const hint = (result.errors && result.errors[0] && result.errors[0].hint) || '';
    if (passed) {
      if (result.stars === 3) {
        this._setMsg('完美！第 ' + result.index + ' 笔「<b>' + result.strokeName + '</b>」收笔到位。', 'ok');
      } else if (result.stars === 2) {
        this._setMsg('过关！再稳一些就是三星了。', 'ok');
      } else {
        this._setMsg('过关：第 ' + result.index + ' 笔可以更准，下次试试。', 'ok');
      }
    } else {
      const tip = hint || '与标准差距较大';
      this._setMsg('再写一遍 ✏️：<b>' + tip + '</b>，先把第 '
        + result.index + ' 笔写对再继续', 'err');
    }
  };

  TraceInstance.prototype._setMsg = function (html, cls) {
    this._dom.msg.innerHTML = html;
    this._dom.msg.className = 'st-msg' + (cls ? ' ' + cls : '');
  };

  TraceInstance.prototype._updateCombo = function (stars) {
    const prev = this.combo;
    if (stars === 3) this.combo++;
    else this.combo = 0;
    // v1.3 视觉：连续 N 笔三星显示徽章
    if (!this._celeb('combo')) return;
    const badge = this._dom.comboBadge;
    const numEl = this._dom.comboNum;
    if (!badge || !numEl) return;
    const minN = this.opts.celebration && typeof this.opts.celebration.comboMin === 'number'
      ? this.opts.celebration.comboMin : 2;
    if (this.combo >= minN) {
      numEl.textContent = this.combo;
      if (prev < minN) {
        badge.classList.remove('bump');
        badge.classList.add('show');
      } else {
        // 已显示 → 触发 bump 动画（重置+重加 class 强制重播）
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
    } else {
      badge.classList.remove('show', 'bump');
    }
  };

  TraceInstance.prototype._finish = function () {
    const agg = scoring.aggregateChar(this.strokeResults);
    this._showStars(agg.stars);
    this._updateProgress();
    this._finished = true;

    // ★ v1.6：进入作品感模式 — 标准衬底淡出，鼓励文案，「下一笔」变「再写一次」
    this._enterArtworkMode(agg);

    // v1.3 正反馈：整字烟花（≥2 星才放，0/1 星不放，避免错误反馈）
    if (agg.stars >= 2 && this._celeb('fireworks')) {
      this._runFireworks(agg.stars);
    }

    if (this.opts.onFinish) {
      this.opts.onFinish({
        char: this.opts.char,
        strokes: this.strokeResults,
        finalScore: agg.final,
        finalStars: agg.stars,
        combo: this.combo
      });
    }
  };

  // ★ v1.6：作品感 — 隐藏标准衬底，仅保留田字格 + 学生笔迹 + 鼓励文案
  TraceInstance.prototype._enterArtworkMode = function (agg) {
    if (this.opts.artwork && this.opts.artwork.enabled === false) {
      // 关闭作品感：保持旧行为
      this._dom.btnNext.disabled = true;
      this._setMsg('「<b>' + this.opts.char + '</b>」完成，综合 <b>'
        + Math.round(agg.final * 100) + '</b> 分。点「重新开始」再试一次。',
        agg.stars >= 2 ? 'ok' : 'err');
      return;
    }
    this.container.classList.add('st-finished');
    // 重新渲染：仅保留田字格 + 已写完的笔迹（在 ink canvas 上）
    if (this.renderer && this.renderer.setOptions) {
      this.renderer.setOptions({ hints: { showOutline: false } });
    }
    this.renderer.render(this.charData, this.charData.outlines.length);

    // 「下一笔」按钮变身「再写一次」（点击会触发 reset）
    if (this._dom.btnNext) {
      this._dom.btnNext.textContent = '再写一次 \u21bb';
      this._dom.btnNext.disabled = false;
    }
    if (this._dom.btnRedo) this._dom.btnRedo.disabled = true;

    const msg = (this.opts.artwork && this.opts.artwork.message) || '\ud83c\udf89 这是你写出来的字！';
    const score = Math.round(agg.final * 100);
    const tail = agg.stars >= 2 ? '太棒了！' : '再练一遍会更稳。';

    // ★ v1.7.1：先预选要圈的笔，文案首行说明红圈含义（消除歧义）
    const picks = this._pickPraiseStrokes();
    let praiseHeader = '';
    if (picks.length > 0 && (!this.opts.artwork || this.opts.artwork.praiseCircles !== false)) {
      praiseHeader = '<div class="st-praise-hint">\u2728 老师圈出 <b>'
        + picks.length + '</b> 笔写得最好的</div>';
    }

    // ★ v1.7：完成点评 — 重写笔画"改正成功"鼓励文案（不显示旧错误轨迹）
    let retryHtml = '';
    const retryLines = this._buildRetryPraises();
    if (retryLines.length > 0) {
      retryHtml = '<div class="st-retry-praise">'
        + retryLines.map(function (l) { return '<span class="st-retry-item">\u2705 ' + l + '</span>'; }).join('')
        + '</div>';
    }

    this._setMsg('<b>' + msg + '</b><br>「' + this.opts.char + '」综合 <b>'
      + score + '</b> 分，' + tail + praiseHeader + retryHtml, 'ok st-finish');

    // ★ v1.7.1：圈点系统延迟出现 —— 衬底淡出 ~800ms 后再画红圈，
    //   让学生先看清自己写出来的字再被老师"圈出来"。
    const delay = (this.opts.artwork && typeof this.opts.artwork.praiseStartDelayMs === 'number')
      ? this.opts.artwork.praiseStartDelayMs : 800;
    if (this._artworkTimer) { clearTimeout(this._artworkTimer); this._artworkTimer = null; }
    if (picks.length > 0 && (!this.opts.artwork || this.opts.artwork.praiseCircles !== false)) {
      const self = this;
      this._artworkTimer = setTimeout(function () {
        self._artworkTimer = null;
        if (self._destroyed || !self._finished) return;
        self._drawPraiseCircles();
      }, Math.max(0, delay));
    }
  };

  TraceInstance.prototype._exitArtworkMode = function () {
    this.container.classList.remove('st-finished');
    this._finished = false;
    if (this._dom && this._dom.btnNext) {
      this._dom.btnNext.textContent = '下一笔';
    }
    if (this._dom && this._dom.btnRedo) {
      this._dom.btnRedo.disabled = false;
    }
    // ★ v1.7：清空圈点系统（红圈 SVG 节点 + 待触发的延迟 timer）
    if (this._artworkTimer) { clearTimeout(this._artworkTimer); this._artworkTimer = null; }
    this._clearPraiseCircles();
    // 还原 outline 显示偏好（依据 opts.hints.showOutline 而非强制 true）
    if (this.renderer && this.renderer.setOptions) {
      const showOutline = !this.opts.hints || this.opts.hints.showOutline !== false;
      this.renderer.setOptions({ hints: { showOutline: showOutline } });
    }
  };

  // ============= 圈点系统（v1.7 / v1.7.1） =============

  /**
   * v1.7 旧版：几何中心 + 最远点距离的"正圆"包围。
   * 缺陷：横/竖/折等长笔画的圆很大且互相重叠，看不出"圈了哪一笔"。
   * 现仅作 fallback / 单测保留；主路径用 _strokeOrientedEllipse。
   */
  TraceInstance.prototype._strokeBoundingCircle = function (userPts) {
    if (!userPts || userPts.length === 0) return null;
    let sx = 0, sy = 0;
    for (let i = 0; i < userPts.length; i++) { sx += userPts[i][0]; sy += userPts[i][1]; }
    const cx = sx / userPts.length;
    const cy = sy / userPts.length;
    let maxR = 0;
    for (let i = 0; i < userPts.length; i++) {
      const dx = userPts[i][0] - cx, dy = userPts[i][1] - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > maxR) maxR = r;
    }
    return { cx: cx, cy: cy, r: maxR };
  };

  /**
   * ★ v1.7.1：PCA 定向椭圆 — 让红圈贴合笔画走向。
   *   - 横笔 → 扁长椭圆，主轴水平
   *   - 竖笔 → 细高椭圆，主轴垂直
   *   - 撇/捺 → 斜倾椭圆
   *   - 横折 → 主轴沿对角，副轴扩展覆盖弯折
   * 协方差矩阵 [[a,b],[b,c]] 的特征值/特征向量解析解（2D 闭式）。
   */
  TraceInstance.prototype._strokeOrientedEllipse = function (userPts) {
    if (!userPts || userPts.length < 2) return null;
    const n = userPts.length;
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sx += userPts[i][0]; sy += userPts[i][1]; }
    const cx = sx / n, cy = sy / n;
    let a = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) {
      const dx = userPts[i][0] - cx, dy = userPts[i][1] - cy;
      a += dx * dx; b += dx * dy; c += dy * dy;
    }
    a /= n; b /= n; c /= n;
    const tr = (a + c) / 2;
    const dt = Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b);
    const lam1 = Math.max(tr + dt, 0);  // 主特征值（大方差方向）
    const lam2 = Math.max(tr - dt, 0);  // 副特征值
    let theta;
    if (Math.abs(b) < 1e-9) {
      theta = a >= c ? 0 : Math.PI / 2;
    } else {
      // 主特征向量 v 满足 (a-lam1)*vx + b*vy = 0 → v = (b, lam1-a)
      theta = Math.atan2(lam1 - a, b);
    }
    // 椭圆半径 = k * sqrt(lam) + pad
    // k=2.0 大致包含 95% 均匀线段点；pad 让圈不挤压笔触（笔触本身约 22 px）
    const K = 2.0;
    const PAD_MAJOR = 32;
    const PAD_MINOR = 26;
    let rx = K * Math.sqrt(lam1) + PAD_MAJOR;
    let ry = K * Math.sqrt(lam2) + PAD_MINOR;
    // 保底：避免一根直线笔的椭圆变成一条线（ry=0）
    const RY_MIN = 42;
    if (ry < RY_MIN) ry = RY_MIN;
    // 上限：避免超长笔的圈占满画布
    const RX_MAX = 380;
    if (rx > RX_MAX) rx = RX_MAX;
    return { cx: cx, cy: cy, rx: rx, ry: ry, theta: theta };
  };

  /**
   * 选要圈出来表扬的笔（仅 3 星且通过的笔）。
   * 当 3 星笔画过多时，按 final 分降序取前 maxPraiseCircles 笔，避免画面太乱。
   * 仅作用于学生笔迹（this.strokeResults[i].userPts），不会触碰已淡出的标准衬底。
   */
  TraceInstance.prototype._pickPraiseStrokes = function () {
    if (!this.strokeResults) return [];
    const cands = [];
    for (let i = 0; i < this.strokeResults.length; i++) {
      const r = this.strokeResults[i];
      if (r && r.stars === 3 && r.userPts && r.userPts.length >= 2) {
        cands.push({ index: i, result: r });
      }
    }
    const aw = this.opts.artwork || {};
    const max = (typeof aw.maxPraiseCircles === 'number' && aw.maxPraiseCircles >= 0)
      ? aw.maxPraiseCircles : 2;
    if (max === 0) return [];
    if (cands.length <= max) return cands;
    cands.sort(function (a, b) {
      return (b.result.final || 0) - (a.result.final || 0);
    });
    return cands.slice(0, max);
  };

  /**
   * 生成"手绘风"定向椭圆 path：36 段折线 + 抖动 + 主轴旋转。
   * theta=0 表示主轴沿 +x；正值顺时针旋转。
   */
  TraceInstance.prototype._wigglyOrientedPath = function (cx, cy, rx, ry, theta, jitter) {
    const segs = 36;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      const lx = Math.cos(t) * rx + (Math.random() - 0.5) * jitter;
      const ly = Math.sin(t) * ry + (Math.random() - 0.5) * jitter;
      const x = cx + lx * cosT - ly * sinT;
      const y = cy + lx * sinT + ly * cosT;
      pts.push([x, y]);
    }
    let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) {
      d += ' L ' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    }
    return d + ' Z';
  };

  /**
   * 五角星 SVG path（半径 r，向上一角，中心在原点）。
   * 用于在红圈一端打"表扬章"，消除"圈是什么意思"的歧义。
   */
  function _starPath(cx, cy, r) {
    const inner = r * 0.42;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const rr = (i % 2 === 0) ? r : inner;
      pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
    }
    let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) {
      d += ' L ' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    }
    return d + ' Z';
  }

  /**
   * 在 SVG 田字格层上画红色手绘圈 + ★ 表扬章，仅作用于通过的学生笔迹。
   * 注：调用时机由 _enterArtworkMode 用 setTimeout 延迟到衬底淡出之后，
   *     让学生先看清自己的笔迹再看到老师圈出来的笔。
   */
  TraceInstance.prototype._drawPraiseCircles = function () {
    const aw = this.opts.artwork || {};
    if (aw.enabled === false) return;
    if (aw.praiseCircles === false) return;
    if (!this._dom || !this._dom.svg) return;
    const svg = this._dom.svg;
    this._clearPraiseCircles();
    const picks = this._pickPraiseStrokes();
    if (!picks.length) return;
    const NS = 'http://www.w3.org/2000/svg';
    const grp = document.createElementNS(NS, 'g');
    grp.setAttribute('class', 'st-circles');
    const stagger = (typeof aw.praiseStaggerMs === 'number') ? aw.praiseStaggerMs : 220;
    for (let k = 0; k < picks.length; k++) {
      const e = this._strokeOrientedEllipse(picks[k].result.userPts);
      if (!e) continue;
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', this._wigglyOrientedPath(e.cx, e.cy, e.rx, e.ry, e.theta, 6));
      path.setAttribute('class', 'st-circle');
      path.setAttribute('style', 'animation-delay: ' + (k * stagger / 1000).toFixed(3) + 's');
      grp.appendChild(path);
      // ★ 表扬章：放在椭圆主轴一端的右上方（沿 theta 方向偏移 rx，副轴上抬 ry）
      if (aw.praiseStar !== false) {
        const sx = e.cx + Math.cos(e.theta) * e.rx + Math.cos(e.theta - Math.PI / 2) * (e.ry * 0.55);
        const sy = e.cy + Math.sin(e.theta) * e.rx + Math.sin(e.theta - Math.PI / 2) * (e.ry * 0.55);
        const star = document.createElementNS(NS, 'path');
        star.setAttribute('d', _starPath(sx, sy, 36));
        star.setAttribute('class', 'st-praise-star');
        // ★ 比椭圆稍晚一点出现：圈先成形，再"啪"地盖章
        star.setAttribute('style',
          'animation-delay: ' + ((k * stagger + 350) / 1000).toFixed(3) + 's');
        grp.appendChild(star);
      }
    }
    svg.appendChild(grp);
  };

  /** 清掉红圈 SVG 节点（reset / setChar / 切字） */
  TraceInstance.prototype._clearPraiseCircles = function () {
    if (!this._dom || !this._dom.svg) return;
    const old = this._dom.svg.querySelectorAll('.st-circles');
    for (let i = 0; i < old.length; i++) {
      old[i].parentNode.removeChild(old[i]);
    }
  };

  /**
   * 生成"改正成功"鼓励文案：仅针对最终通过 + 曾经至少失败一次的笔。
   * 文案聚焦"改正了"，不强调"错过"。
   */
  TraceInstance.prototype._buildRetryPraises = function () {
    const aw = this.opts.artwork || {};
    if (aw.retryPraise === false) return [];
    if (!this.strokeResults || !this._strokeRetries) return [];
    const lines = [];
    const variants = [
      function (i, name) { return '第 ' + (i + 1) + ' 笔「' + name + '」重写后变准了，继续保持'; },
      function (i, name) { return '你把第 ' + (i + 1) + ' 笔「' + name + '」改正了，越写越好'; },
      function (i, name) { return '第 ' + (i + 1) + ' 笔「' + name + '」改好了，棒'; }
    ];
    let pickIdx = 0;
    for (let i = 0; i < this.strokeResults.length; i++) {
      const r = this.strokeResults[i];
      const retries = (this._strokeRetries[i] || 0);
      if (r && retries > 0) {
        const name = r.strokeName || ('第 ' + (i + 1) + ' 笔');
        lines.push(variants[pickIdx % variants.length](i, name));
        pickIdx++;
      }
    }
    // 数量上限：避免文案过长（≥4 笔重写时聚合一句）
    if (lines.length >= 4) {
      const head = lines.slice(0, 2);
      head.push('还有 ' + (lines.length - 2) + ' 笔也成功改正了，做得好');
      return head;
    }
    return lines;
  };

  // ============= 正反馈（v1.3） =============

  /** 检查 celebration 的某个子开关是否启用 */
  TraceInstance.prototype._celeb = function (key) {
    const c = this.opts.celebration;
    if (!c || c.enabled === false) return false;
    return c[key] !== false;
  };

  /** 清空 fx canvas（特效层） */
  TraceInstance.prototype._clearFx = function () {
    this._stopFxLoop();
    const cv = this._dom && this._dom.fxCanvas;
    if (!cv) return;
    const ctx = cv.getContext && cv.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
  };

  TraceInstance.prototype._stopFxLoop = function () {
    if (this._fxRaf) {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._fxRaf);
      this._fxRaf = null;
    }
    this._fireworks = null;
    this._flash = null;
    // v1.4: 取消 watch 也要恢复 tracer
    if (this._watch) {
      this._watch = null;
      if (this.tracer) this.tracer.enabled = true;
      if (this._dom && this._dom.btnWatch) this._dom.btnWatch.classList.remove('playing');
    }
  };

  TraceInstance.prototype._hideCombo = function () {
    const b = this._dom && this._dom.comboBadge;
    if (b) b.classList.remove('show', 'bump');
  };

  /** 用户用户笔触坐标在 canvas 本身坐标系（1024x1024），fx canvas 同坐标系 */
  TraceInstance.prototype._flashPerfectStroke = function (userPts) {
    const cv = this._dom.fxCanvas;
    if (!cv || !Array.isArray(userPts) || userPts.length < 2) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    this._flash = { pts: userPts, t0: (typeof performance !== 'undefined' ? performance.now() : Date.now()), dur: 500 };
    this._startFxLoop();
  };

  /** 绘制完美笔闪光帧 */
  TraceInstance.prototype._drawFlashFrame = function (now) {
    const f = this._flash;
    if (!f) return false;
    const cv = this._dom.fxCanvas;
    const ctx = cv.getContext('2d');
    const t = (now - f.t0) / f.dur;          // 0 → 1
    if (t >= 1) { this._flash = null; return false; }
    // 双层绘制：底层宽的金色光晕（透明度随时间变化），上层细的亮白高光
    const fade = t < 0.3 ? (t / 0.3) : (1 - (t - 0.3) / 0.7);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowBlur = 24; ctx.shadowColor = '#FFD700';
    ctx.strokeStyle = 'rgba(255,215,0,' + (0.55 * fade).toFixed(3) + ')';
    ctx.lineWidth = 44;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]);
    ctx.stroke();
    // 亮白高光层
    ctx.shadowBlur = 12; ctx.shadowColor = '#FFFFFF';
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();
    return true;
  };

  /** 烟花粒子初始化 + 启动 RAF */
  TraceInstance.prototype._runFireworks = function (stars) {
    const cv = this._dom.fxCanvas;
    if (!cv) return;
    const W = cv.width, H = cv.height;
    const palette = stars >= 3
      ? ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF', '#FFECB3']
      : ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38BA8'];
    const dur = (this.opts.celebration && this.opts.celebration.fireworksDuration) || 1800;
    const particles = [];
    const bursts = stars >= 3 ? 3 : 2;
    // 多个爆发点（给"整字三星"更饱满的感觉）
    for (let b = 0; b < bursts; b++) {
      const cx = W * (0.25 + 0.5 * ((b + 1) / (bursts + 1)));
      const cy = H * (0.42 + (b % 2) * 0.08);
      const count = stars >= 3 ? 28 : 22;
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = 260 + Math.random() * 200;   // px/s
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 60,          // 轻微上扬
          color: palette[(Math.random() * palette.length) | 0],
          size: 6 + Math.random() * 8,
          life: (dur / 1000) * (0.7 + Math.random() * 0.3),
          t0: 0,
          delay: b * 0.18                          // 阶梯爆发
        });
      }
    }
    this._fireworks = {
      particles: particles,
      t0: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      dur: dur
    };
    this._startFxLoop();
  };

  TraceInstance.prototype._drawFireworksFrame = function (now) {
    const fw = this._fireworks;
    if (!fw) return false;
    const cv = this._dom.fxCanvas;
    const ctx = cv.getContext('2d');
    const dt = 16 / 1000; // 近似帧间隔，用于速度衰减
    const elapsed = (now - fw.t0) / 1000;
    const W = cv.width, H = cv.height;
    // 整个 fx canvas 清一次；如果 flash 同时在进行则 flash 帧会重绘自己
    ctx.clearRect(0, 0, W, H);

    let alive = 0;
    for (let i = 0; i < fw.particles.length; i++) {
      const p = fw.particles[i];
      if (elapsed < p.delay) { alive++; continue; }
      const t = elapsed - p.delay;
      if (t >= p.life) continue;
      // 物理：重力 + 空气阻力
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 680 * dt;    // 重力
      const fade = 1 - (t / p.life);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, fade * fade));
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10 * fade;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * fade), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      alive++;
    }
    if (elapsed > fw.dur / 1000 || alive === 0) {
      this._fireworks = null;
      ctx.clearRect(0, 0, W, H);
      return false;
    }
    return true;
  };

  /** 统一 RAF 循环：同时容纳 watch / fireworks / flash 三种 fx */
  TraceInstance.prototype._startFxLoop = function () {
    if (this._fxRaf) return;
    const self = this;
    const raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); };
    function tick(now) {
      if (self._destroyed) { self._fxRaf = null; return; }
      const cv = self._dom.fxCanvas;
      const ctx = cv && cv.getContext && cv.getContext('2d');
      if (!ctx) { self._fxRaf = null; return; }
      let active = false;
      // watch 优先（写之前），watch / fireworks 不会同时存在
      if (self._watch) {
        active = self._drawWatchFrame(now) || active;
      } else {
        let hasFw = false, hasFlash = false;
        if (self._fireworks) hasFw = self._drawFireworksFrame(now);
        if (!hasFw) ctx.clearRect(0, 0, cv.width, cv.height);
        if (self._flash) hasFlash = self._drawFlashFrame(now);
        active = hasFw || hasFlash;
      }
      if (active) self._fxRaf = raf(tick);
      else self._fxRaf = null;
    }
    self._fxRaf = raf(tick);
  };

  // ============= Watch Mode（v1.4） =============

  /**
   * 写前示范：虚拟笔尖沿标准 median 滑过，速度按"起笔稍慢-中段顺滑-收笔稳"自然曲线。
   * v1.4.1：默认不自动播，按 autoPlay 字段决定，向后兼容旧 autoPlayOnStrokeStart
   * @param {number} strokeIdx 0-based 笔画索引
   * @param {string} reason   'first' | 'next' | 'reset' | 'retry'
   * @param {boolean} slow    是否慢速（仅 retry 默认 true）
   */
  TraceInstance.prototype._maybePlayWatch = function (strokeIdx, reason, slow) {
    const w = this.opts.watchMode;
    if (!w || w.enabled === false) return;
    // 兼容 v1.4 旧字段：传了 autoPlayOnStrokeStart 时按它工作
    let autoPlay = w.autoPlay;
    if (typeof autoPlay === 'undefined') {
      autoPlay = (w.autoPlayOnStrokeStart === true) ? true : false;
    }
    let shouldPlay = false;
    if (reason === 'retry') shouldPlay = true;            // 失败重试由调用方控制（默认 retryAfterFails=0 不会到这）
    else if (autoPlay === true) shouldPlay = true;
    else if (autoPlay === 'first' && reason === 'first') shouldPlay = true;
    else shouldPlay = false;
    if (!shouldPlay) return;
    this._playWatchDemo(strokeIdx, !!slow);
  };

  TraceInstance.prototype._playWatchDemo = function (strokeIdx, slow) {
    if (!this.charData) return;
    const median = this.charData.medians[strokeIdx];
    if (!median || median.length < 2) return;
    // 取消可能的旧 fx
    this._cancelAutoAdvance();
    this._flash = null;
    this._fireworks = null;
    // 计算累计弧长（用于按时间映射到位置）
    const accLen = [0];
    let total = 0;
    for (let i = 1; i < median.length; i++) {
      total += Math.hypot(median[i][0] - median[i-1][0], median[i][1] - median[i-1][1]);
      accLen.push(total);
    }
    if (total <= 0) return;
    const w = this.opts.watchMode || {};
    const dur = slow ? (w.retryDuration || 1700) : (w.duration || 1100);
    this._watch = {
      median: median,
      accLen: accLen,
      total: total,
      t0: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      duration: dur,
      fadeOutDuration: w.fadeOutDuration || 500,
      showBrush: w.showBrush !== false
    };
    // 示范期间禁用手写，避免学生过早下笔
    if (this.tracer) this.tracer.enabled = false;
    if (this._dom.btnWatch) this._dom.btnWatch.classList.add('playing');
    this._startFxLoop();
  };

  /**
   * 速度曲线：起笔（前 15% 时间走 8% 长度）+ 中段（70% 时间走 80%）+ 收笔（15% 时间走 12%）
   * 即起笔 0.53x, 中段 1.14x, 收笔 0.8x，模拟适合硬笔教学的观察节奏
   */
  function _watchSpeedCurve(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    if (t < 0.15) return (t / 0.15) * 0.08;
    if (t < 0.85) return 0.08 + ((t - 0.15) / 0.70) * 0.80;
    return 0.88 + ((t - 0.85) / 0.15) * 0.12;
  }

  TraceInstance.prototype._drawWatchFrame = function (now) {
    const w = this._watch;
    if (!w) return false;
    const cv = this._dom.fxCanvas;
    const ctx = cv.getContext('2d');
    const elapsed = now - w.t0;
    const fadeStart = w.duration;
    const fadeEnd = fadeStart + w.fadeOutDuration;
    if (elapsed >= fadeEnd) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      this._watch = null;
      if (this.tracer) this.tracer.enabled = true;
      if (this._dom.btnWatch) this._dom.btnWatch.classList.remove('playing');
      return false;
    }
    ctx.clearRect(0, 0, cv.width, cv.height);
    let opacity = 1;
    if (elapsed >= fadeStart) opacity = 1 - (elapsed - fadeStart) / w.fadeOutDuration;
    const t = Math.min(1, elapsed / w.duration);
    const targetLen = _watchSpeedCurve(t) * w.total;
    // 找当前位置（在哪个 segment 上）
    let segIdx = 0;
    while (segIdx < w.accLen.length - 1 && w.accLen[segIdx + 1] < targetLen) segIdx++;
    const seg0 = w.median[segIdx];
    const seg1 = w.median[Math.min(segIdx + 1, w.median.length - 1)];
    const segLen = w.accLen[segIdx + 1] - w.accLen[segIdx];
    const segT = segLen > 0 ? (targetLen - w.accLen[segIdx]) / segLen : 0;
    const curX = seg0[0] + (seg1[0] - seg0[0]) * segT;
    const curY = seg0[1] + (seg1[1] - seg0[1]) * segT;
    // 已走过的轨迹（蓝色发光）
    ctx.save();
    ctx.globalAlpha = opacity * 0.85;
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(52,152,219,0.7)';
    ctx.beginPath();
    ctx.moveTo(w.median[0][0], w.median[0][1]);
    for (let i = 1; i <= segIdx; i++) ctx.lineTo(w.median[i][0], w.median[i][1]);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.restore();

    // v1.4.1 右手握笔 emoji ✍️（教学正确握笔手势）
    // 先画 emoji（底层，遮住部分轨迹），再画金色笔尖（上层，精确指示位置）
    const wm = this.opts.watchMode || {};
    if (wm.showHand !== false) {
      const handEmoji = wm.handEmoji || '\u270D\uFE0F';
      const handSize = wm.handSize || 80;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = handSize + 'px -apple-system, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textBaseline = 'top';
      // ✍️ emoji 内笔尖大约位于左下区（约 20% X, 78% Y），把这个锚点对齐 (curX, curY)
      const ax = handSize * 0.20;
      const ay = handSize * 0.78;
      ctx.fillText(handEmoji, curX - ax, curY - ay);
      ctx.restore();
    }

    // 虚拟笔尖（金色发光圆点；起笔/收笔时半径轻微放大表示节奏）
    if (w.showBrush) {
      let r = 14;
      if (t < 0.12) r = 14 + (1 - t / 0.12) * 8;       // 起笔放大
      else if (t > 0.88) r = 14 + ((t - 0.88) / 0.12) * 8; // 收笔放大
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#FFD700';
      ctx.shadowBlur = 18; ctx.shadowColor = '#FFA500';
      ctx.beginPath();
      ctx.arc(curX, curY, r, 0, Math.PI * 2);
      ctx.fill();
      // 内核高光
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(curX, curY, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return true;
  };

  // ============= 公共方法 =============

  TraceInstance.prototype.redoStroke = function () {
    this._cancelAutoAdvance();
    this._cancelFailClear();    // ★ v1.6 兼容失败保留期：用户主动重写时立即清掉红笔
    if (this._finished) { this.reset(); return; }
    if (!this.charData) return;
    const lastResult = this.strokeResults[this.curStroke];
    const passStars = this._passStars();
    const lastStars = lastResult ? lastResult.stars : 0;
    if (lastResult) {
      // 当前笔已经通过过：把它从历史中弹出
      this.strokeResults[this.curStroke] = undefined;
      this.tracer.popLastStroke();
    }
    this.tracer.clearCurrent();
    this._clearFx();
    this._resetStars();
    this._updateProgress();
    this._setMsg('请重新书写第 ' + (this.curStroke + 1) + ' 笔：<b>' + this._strokeName(this.curStroke) + '</b>', 'ok');
    this._dom.btnNext.disabled = true;
    if (lastStars < passStars) this._consecutiveFails++;
    else this._consecutiveFails = 0;
    const w = this.opts.watchMode || {};
    const retryAfter = (typeof w.retryAfterFails === 'number') ? w.retryAfterFails : 0;
    if (w.enabled !== false && retryAfter > 0 && this._consecutiveFails >= retryAfter) {
      this._maybePlayWatch(this.curStroke, 'retry', true);
    }
  };

  TraceInstance.prototype.nextStroke = function () {
    this._cancelAutoAdvance();
    if (!this.charData) return;
    // ★ v1.6 完成态：「下一笔」按钮已变成「再写一次」，直接走 reset
    if (this._finished) { this.reset(); return; }
    // ★ v1.6 防跳过：当前笔未通过则不允许进入下一笔
    const passStars = this._passStars();
    const cur = this.strokeResults[this.curStroke];
    if (!cur || cur.stars < passStars) {
      this._setMsg('先把第 ' + (this.curStroke + 1) + ' 笔「<b>'
        + this._strokeName(this.curStroke) + '</b>」写对再继续 ✏️', 'err');
      return;
    }
    const total = this.charData.outlines.length;
    if (this.curStroke >= total - 1) { this._finish(); return; }
    this.curStroke++;
    this._consecutiveFails = 0;
    this._refreshHint();
    this.renderer.render(this.charData, this.curStroke);
    this._resetStars();
    this._setMsg('继续：第 ' + (this.curStroke + 1) + ' 笔 <b>' + this._strokeName(this.curStroke) + '</b>', 'ok');
    this._dom.btnNext.disabled = true;
    this._maybePlayWatch(this.curStroke, 'next');
  };

  TraceInstance.prototype.reset = function () {
    this._cancelAutoAdvance();
    this._cancelFailClear();
    this._exitArtworkMode();
    if (!this.charData) return;
    this.combo = 0;
    this.curStroke = 0;
    this.strokeResults = [];
    this._strokeRetries = [];      // ★ v1.7：reset / "再写一次" 清空圈点系统状态
    this._consecutiveFails = 0;
    this.tracer.clearAll();
    this._clearFx();
    this._hideCombo();
    this._refreshHint();
    this.renderer.render(this.charData, 0);
    this._resetStars();
    this._setMsg('请书写第 1 笔：<b>' + this._strokeName(0) + '</b>', 'ok');
    this._dom.btnNext.disabled = true;
    if (this.opts.onReset) this.opts.onReset();
    this._maybePlayWatch(0, 'first');
  };

  TraceInstance.prototype.getStrokeResults = function () {
    return this.strokeResults.slice();
  };

  TraceInstance.prototype.getCurrentStroke = function () {
    return this.curStroke;
  };

  /** v1.4 手动触发当前笔示范（也用于 📹 按钮 onclick） */
  TraceInstance.prototype.playDemo = function (slow) {
    if (!this.charData) return;
    this._playWatchDemo(this.curStroke, !!slow);
  };

  /** 切换练习字（同一 instance 复用 UI）*/
  TraceInstance.prototype.setChar = function (newChar) {
    this.opts.char = newChar;
    this._loadAndStart();
  };

  TraceInstance.prototype.destroy = function () {
    if (this._destroyed) return;
    this._destroyed = true;
    this._cancelAutoAdvance();
    this._cancelFailClear();
    this._stopFxLoop();
    if (this._artworkTimer) { clearTimeout(this._artworkTimer); this._artworkTimer = null; }
    this._clearPraiseCircles();         // ★ v1.7：移除残留红圈节点
    if (this.tracer) this.tracer.unmount();
    if (this.renderer) this.renderer.clear();
    this.container.innerHTML = '';
    this.container.classList.remove('st-trace', 'st-finished');
  };

  // ============================================================
  // ★ AnimateInstance（v1.5 新增）
  // 仅笔顺展示动画，无手写交互。一笔一笔自动连播：
  // 金色虚拟笔尖沿 medians 滑过 + ✍️ 握笔 emoji 跟随 + 蓝色发光墨迹
  // 笔间停顿 ~300ms 让学生消化，已写完的笔保留为浅蓝积累。
  // ============================================================

  function _injectAnimateStyles() {
    _injectStyles();  // 复用 trace 的样式
    if (document.getElementById('_st-anim-styles')) return;
    const css = [
      '.st-anim { position: relative; display: inline-block; max-width: 100%; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; color: #2D3436; }',
      '.st-anim .st-hint { display: flex; align-items: center; gap: 8px; padding: 8px 14px; margin-bottom: 10px; background: #fff; border-radius: 999px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 14px; }',
      '.st-anim .st-hint-num { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 6px; background: linear-gradient(135deg,#3498DB,#2980B9); color:#fff; border-radius: 12px; font-weight: 700; font-size: 13px; }',
      '.st-anim .st-hint-name { color: #2980B9; font-weight: 600; }',
      '.st-anim .st-hint-prog { color: #95A5A6; font-size: 12px; margin-left: auto; }',
      '.st-anim .st-tip { margin: -6px 0 10px; padding: 6px 12px 6px 14px; font-size: 12px; line-height: 1.5; color: #5D6D7E; background: #FFF8EE; border-radius: 8px; border-left: 3px solid #FF9F43; }',
      '.st-anim .st-tip:empty { display: none; }',
      '.st-anim .st-tip::before { content: "\u{1F4A1} "; }',
      '.st-anim .st-pad { position: relative; width: 320px; height: 320px; max-width: 100%; aspect-ratio: 1 / 1; background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding: 12px; }',
      '.st-anim .st-pad svg, .st-anim .st-pad canvas { position: absolute; left: 12px; top: 12px; right: 12px; bottom: 12px; width: calc(100% - 24px); height: calc(100% - 24px); }',
      '.st-anim .st-pad svg, .st-anim .st-pad canvas { pointer-events: none; }',
      '.st-anim .st-bar { display: flex; align-items: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; justify-content: center; }',
      '.st-anim button.st-btn { padding: 6px 12px; border:none; border-radius: 8px; background: #fff; color: #2D3436; font-family: inherit; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.06); transition: all 0.15s; }',
      '.st-anim button.st-btn:hover { transform: translateY(-1px); }',
      '.st-anim button.st-btn:disabled { opacity: 0.4; cursor: not-allowed; }',
      '.st-anim button.st-btn.primary { background: linear-gradient(135deg,#3498DB,#2980B9); color:#fff; }',
      '.st-anim select.st-speed { padding: 6px 10px; border-radius: 8px; border: 1px solid #E0E0E0; font-family: inherit; font-size: 13px; background: #fff; cursor: pointer; }',
      '.st-anim .st-msg { margin-top: 8px; padding: 8px 12px; background: #FAF6EE; border-radius: 8px; font-size: 13px; color: #5D6D7E; min-height: 18px; text-align: center; }',
      '.st-anim .st-msg.ok { background: #D5F5E3; color: #196F3D; }'
    ].join('\n');
    const s = document.createElement('style');
    s.id = '_st-anim-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function AnimateInstance(opts) {
    this.opts = Object.assign({
      target: null,
      char: null,
      grid: { style: 'tian' },
      // 播放控制
      autoStart: true,
      loop: false,
      speed: 1.0,
      perStrokeMs: 1100,
      pauseBetweenStrokes: 350,
      finishHoldMs: 1200,             // 整字播完停留时长（loop 时）
      // 视觉
      showHand: true,
      handEmoji: '\u270D\uFE0F',
      handSize: 80,
      showBrush: true,
      showStrokeName: true,
      showStrokeTip: true,
      showHint: true,
      showControls: true,
      // 回调
      onStrokeStart: null,
      onStrokeEnd: null,
      onComplete: null
    }, opts || {});

    this.container = _resolveTarget(this.opts.target);
    if (!this.container) throw new Error('StrokeTrace.animate: target 未找到');
    this.charData = null;
    this.curStroke = -1;            // -1 = 未开始；0..N-1 = 当前笔；N = 完成
    this._state = 'idle';            // 'idle' | 'playing' | 'paused' | 'done'
    this._raf = null;
    this._frame = null;              // 当前笔的帧状态 { median, accLen, total, t0, paused, pausedElapsed }
    this._pauseTimer = null;
    this._destroyed = false;
    this._renderUI();
    this._loadAndStart();
  }

  AnimateInstance.prototype._renderUI = function () {
    _injectAnimateStyles();
    this.container.innerHTML = '';
    this.container.classList.add('st-anim');
    const showHint = this.opts.showHint !== false;
    const showTip = this.opts.showStrokeTip !== false;
    const showCtl = this.opts.showControls !== false;
    this.container.innerHTML = ''
      + (showHint ? '<div class="st-hint">'
            + '  <span class="st-hint-num">·</span>'
            + '  <span>当前笔：<span class="st-hint-name">—</span></span>'
            + '  <span class="st-hint-prog">（— / —）</span>'
            + '</div>' : '')
      + (showTip ? '<div class="st-tip"></div>' : '')
      + '<div class="st-pad">'
      + '  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"></svg>'
      + '  <canvas class="st-fx" width="1024" height="1024"></canvas>'
      + '</div>'
      + (showCtl ? '<div class="st-bar">'
            + '  <button class="st-btn" data-act="prev" title="上一笔">⏮</button>'
            + '  <button class="st-btn primary" data-act="play" title="播放/暂停">▶ 播放</button>'
            + '  <button class="st-btn" data-act="next" title="下一笔">⏭</button>'
            + '  <button class="st-btn" data-act="restart" title="重新播放">🔁</button>'
            + '  <select class="st-speed" data-act="speed" title="播放速度">'
            + '    <option value="0.5">0.5x 慢</option>'
            + '    <option value="1" selected>1x</option>'
            + '    <option value="1.5">1.5x</option>'
            + '    <option value="2">2x 快</option>'
            + '  </select>'
            + '</div>' : '')
      + '<div class="st-msg">加载中…</div>';
    this._dom = {
      hintNum:  this.container.querySelector('.st-hint-num'),
      hintName: this.container.querySelector('.st-hint-name'),
      hintProg: this.container.querySelector('.st-hint-prog'),
      tipText:  this.container.querySelector('.st-tip'),
      svg:      this.container.querySelector('svg'),
      fxCanvas: this.container.querySelector('canvas.st-fx'),
      btnPrev:  this.container.querySelector('[data-act="prev"]'),
      btnPlay:  this.container.querySelector('[data-act="play"]'),
      btnNext:  this.container.querySelector('[data-act="next"]'),
      btnRestart: this.container.querySelector('[data-act="restart"]'),
      selSpeed: this.container.querySelector('[data-act="speed"]'),
      msg:      this.container.querySelector('.st-msg')
    };
    const self = this;
    if (this._dom.btnPlay)    this._dom.btnPlay.addEventListener('click', function () { self._state === 'playing' ? self.pause() : self.play(); });
    if (this._dom.btnPrev)    this._dom.btnPrev.addEventListener('click', function () { self.prev(); });
    if (this._dom.btnNext)    this._dom.btnNext.addEventListener('click', function () { self.next(); });
    if (this._dom.btnRestart) this._dom.btnRestart.addEventListener('click', function () { self.restart(); });
    if (this._dom.selSpeed)   this._dom.selSpeed.addEventListener('change', function (e) { self.setSpeed(parseFloat(e.target.value)); });
    this.renderer = new RendererMod.Renderer(this._dom.svg, {
      yFlipBase: dataLoader.getYFlipBase(),
      grid: { style: this.opts.grid.style || 'tian', color: '#E8C4A2', dashColor: '#D9B38A' },
      hints: { showOutline: true, showHintLine: true, showArrow: true, pulseNextStroke: false }
    });
  };

  AnimateInstance.prototype._loadAndStart = function () {
    const self = this;
    dataLoader.loadAll().then(function () {
      const data = dataLoader.getCharData(self.opts.char);
      if (!data) {
        self._setMsg('「' + self.opts.char + '」不在字库内', 'err');
        return;
      }
      self.charData = data;
      self.curStroke = -1;
      self.renderer.render(data, 0);
      self._refreshHint();
      self._setMsg('准备就绪 · 共 ' + data.outlines.length + ' 笔');
      if (self.opts.autoStart !== false) self.play();
    }).catch(function (e) {
      self._setMsg('加载失败：' + (e && e.message ? e.message : e), 'err');
    });
  };

  AnimateInstance.prototype._strokeNameAt = function (i) {
    return (this.charData && this.charData.strokeNames && this.charData.strokeNames[i]) || ('笔' + (i + 1));
  };

  AnimateInstance.prototype._refreshHint = function () {
    if (!this.charData || !this._dom.hintNum) return;
    const total = this.charData.outlines.length;
    const idx = Math.max(0, Math.min(this.curStroke, total - 1));
    const isDone = this._state === 'done' || this.curStroke >= total;
    let name = '';
    if (isDone) {
      this._dom.hintNum.textContent = '✓';
      this._dom.hintName.textContent = '已完成';
      this._dom.hintProg.textContent = '（' + total + ' / ' + total + '）';
    } else {
      name = this._strokeNameAt(idx);
      this._dom.hintNum.textContent = (idx + 1);
      this._dom.hintName.textContent = name;
      this._dom.hintProg.textContent = '（' + (idx + 1) + ' / ' + total + '）';
    }
    if (this._dom.tipText) {
      this._dom.tipText.textContent = isDone ? '' : _strokeTip(name);
    }
  };

  AnimateInstance.prototype._setMsg = function (html, cls) {
    if (!this._dom.msg) return;
    this._dom.msg.innerHTML = html;
    this._dom.msg.className = 'st-msg' + (cls ? ' ' + cls : '');
  };

  AnimateInstance.prototype._updatePlayBtn = function () {
    if (!this._dom.btnPlay) return;
    this._dom.btnPlay.textContent = (this._state === 'playing') ? '⏸ 暂停' : '▶ 播放';
  };

  // ───── 播放控制 ─────

  AnimateInstance.prototype.play = function () {
    if (!this.charData || this._destroyed) return;
    if (this._state === 'playing') return;
    if (this._state === 'done' || this.curStroke >= this.charData.outlines.length) {
      this.curStroke = -1;
      this._clearFx();
    }
    if (this.curStroke < 0) this.curStroke = 0;
    this._state = 'playing';
    this._updatePlayBtn();
    if (!this._frame || this._frame.paused !== true) this._beginStroke(this.curStroke);
    else { this._frame.t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this._frame.pausedElapsed; this._frame.paused = false; this._startLoop(); }
  };

  AnimateInstance.prototype.pause = function () {
    if (this._state !== 'playing') return;
    this._state = 'paused';
    this._updatePlayBtn();
    this._cancelPauseTimer();
    if (this._frame) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      this._frame.pausedElapsed = now - this._frame.t0;
      this._frame.paused = true;
    }
    this._stopLoop();
  };

  AnimateInstance.prototype.next = function () {
    if (!this.charData) return;
    this._cancelPauseTimer();
    this._stopLoop();
    const total = this.charData.outlines.length;
    if (this.curStroke < 0) this.curStroke = 0;
    else if (this.curStroke < total - 1) this.curStroke++;
    else { this._finishChar(); return; }
    if (this._state === 'paused') this._state = 'idle';
    if (this._state !== 'playing') this.play();
    else this._beginStroke(this.curStroke);
  };

  AnimateInstance.prototype.prev = function () {
    if (!this.charData) return;
    this._cancelPauseTimer();
    this._stopLoop();
    if (this.curStroke > 0) this.curStroke--;
    else this.curStroke = 0;
    this._state = 'idle';
    this.play();
  };

  AnimateInstance.prototype.restart = function () {
    if (!this.charData) return;
    this._cancelPauseTimer();
    this._stopLoop();
    this.curStroke = -1;
    this._clearFx();
    this._state = 'idle';
    this.play();
  };

  AnimateInstance.prototype.setSpeed = function (s) {
    const n = parseFloat(s);
    if (!isFinite(n) || n <= 0) return;
    this.opts.speed = n;
    if (this._dom.selSpeed) {
      // 同步 select 显示（如果用户传入非预设值，select 选项不变）
      const opts = this._dom.selSpeed.options;
      for (let i = 0; i < opts.length; i++) if (parseFloat(opts[i].value) === n) { this._dom.selSpeed.selectedIndex = i; break; }
    }
    // 不重启当前笔，只在下一帧按新速度计算
  };

  AnimateInstance.prototype.setChar = function (c) {
    this._cancelPauseTimer();
    this._stopLoop();
    this._clearFx();
    this.opts.char = c;
    this._loadAndStart();
  };

  AnimateInstance.prototype.destroy = function () {
    if (this._destroyed) return;
    this._destroyed = true;
    this._cancelPauseTimer();
    this._stopLoop();
    if (this.renderer) this.renderer.clear();
    this.container.innerHTML = '';
    this.container.classList.remove('st-anim');
  };

  // ───── 内部状态机 ─────

  AnimateInstance.prototype._beginStroke = function (idx) {
    if (!this.charData) return;
    const median = this.charData.medians[idx];
    if (!median || median.length < 2) {
      // 退化：跳过空笔
      this._onStrokeFinished();
      return;
    }
    const accLen = [0];
    let total = 0;
    for (let i = 1; i < median.length; i++) {
      total += Math.hypot(median[i][0] - median[i-1][0], median[i][1] - median[i-1][1]);
      accLen.push(total);
    }
    this._frame = {
      strokeIdx: idx,
      median: median,
      accLen: accLen,
      total: total,
      t0: (typeof performance !== 'undefined' ? performance.now() : Date.now()),
      paused: false,
      pausedElapsed: 0
    };
    this.renderer.render(this.charData, idx);
    this._refreshHint();
    if (this.opts.onStrokeStart) {
      this.opts.onStrokeStart({
        index: idx + 1,
        strokeIndex: idx,
        strokeNo: idx + 1,
        name: this._strokeNameAt(idx),
        total: this.charData.outlines.length
      });
    }
    this._setMsg('正在示范第 ' + (idx + 1) + ' 笔…');
    this._startLoop();
  };

  AnimateInstance.prototype._strokeDuration = function () {
    const base = this.opts.perStrokeMs || 1100;
    const sp = this.opts.speed || 1;
    return base / sp;
  };

  AnimateInstance.prototype._startLoop = function () {
    if (this._raf) return;
    const self = this;
    const raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); };
    function tick(now) {
      if (self._destroyed) { self._raf = null; return; }
      if (self._state !== 'playing') { self._raf = null; return; }
      const cont = self._drawFrame(now);
      if (cont) self._raf = raf(tick);
      else self._raf = null;
    }
    self._raf = raf(tick);
  };

  AnimateInstance.prototype._stopLoop = function () {
    if (this._raf) {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  };

  AnimateInstance.prototype._cancelPauseTimer = function () {
    if (this._pauseTimer) { clearTimeout(this._pauseTimer); this._pauseTimer = null; }
  };

  AnimateInstance.prototype._clearFx = function () {
    const cv = this._dom && this._dom.fxCanvas;
    if (!cv) return;
    const ctx = cv.getContext && cv.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
  };

  AnimateInstance.prototype._drawFrame = function (now) {
    const f = this._frame;
    if (!f || !this.charData) return false;
    const cv = this._dom.fxCanvas;
    const ctx = cv.getContext('2d');
    const dur = this._strokeDuration();
    const elapsed = now - f.t0;
    const t = Math.min(1, elapsed / dur);
    ctx.clearRect(0, 0, cv.width, cv.height);
    // 1. 绘制已完成笔的累积墨迹（淡蓝色）
    ctx.save();
    ctx.strokeStyle = 'rgba(52,152,219,0.55)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < f.strokeIdx; i++) {
      const m = this.charData.medians[i];
      if (!m || m.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(m[0][0], m[0][1]);
      for (let j = 1; j < m.length; j++) ctx.lineTo(m[j][0], m[j][1]);
      ctx.stroke();
    }
    ctx.restore();
    // 2. 当前笔进度（深蓝发光）
    const targetLen = _watchSpeedCurve(t) * f.total;
    let segIdx = 0;
    while (segIdx < f.accLen.length - 1 && f.accLen[segIdx + 1] < targetLen) segIdx++;
    const seg0 = f.median[segIdx];
    const seg1 = f.median[Math.min(segIdx + 1, f.median.length - 1)];
    const segLen = f.accLen[segIdx + 1] - f.accLen[segIdx];
    const segT = segLen > 0 ? (targetLen - f.accLen[segIdx]) / segLen : 0;
    const curX = seg0[0] + (seg1[0] - seg0[0]) * segT;
    const curY = seg0[1] + (seg1[1] - seg0[1]) * segT;
    ctx.save();
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(52,152,219,0.7)';
    ctx.beginPath();
    ctx.moveTo(f.median[0][0], f.median[0][1]);
    for (let i = 1; i <= segIdx; i++) ctx.lineTo(f.median[i][0], f.median[i][1]);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.restore();
    // 3. ✍️ 握笔 emoji
    if (this.opts.showHand !== false) {
      const handSize = this.opts.handSize || 80;
      ctx.save();
      ctx.font = handSize + 'px -apple-system, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textBaseline = 'top';
      const ax = handSize * 0.20;
      const ay = handSize * 0.78;
      ctx.fillText(this.opts.handEmoji || '\u270D\uFE0F', curX - ax, curY - ay);
      ctx.restore();
    }
    // 4. 金色虚拟笔尖
    if (this.opts.showBrush !== false) {
      let r = 14;
      if (t < 0.12) r = 14 + (1 - t / 0.12) * 8;
      else if (t > 0.88) r = 14 + ((t - 0.88) / 0.12) * 8;
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.shadowBlur = 18; ctx.shadowColor = '#FFA500';
      ctx.beginPath();
      ctx.arc(curX, curY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(curX, curY, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 5. 检查本笔是否完成
    if (t >= 1) {
      this._onStrokeFinished();
      return false;
    }
    return true;
  };

  AnimateInstance.prototype._onStrokeFinished = function () {
    if (!this.charData) return;
    const idx = this._frame ? this._frame.strokeIdx : this.curStroke;
    if (this.opts.onStrokeEnd) {
      this.opts.onStrokeEnd({
        index: idx + 1,
        strokeIndex: idx,
        strokeNo: idx + 1,
        name: this._strokeNameAt(idx),
        total: this.charData.outlines.length
      });
    }
    const total = this.charData.outlines.length;
    const isLast = (idx >= total - 1);
    this._frame = null;
    if (isLast) {
      this._finishChar();
      return;
    }
    // 笔间停顿
    const self = this;
    const pauseMs = (this.opts.pauseBetweenStrokes != null) ? this.opts.pauseBetweenStrokes : 350;
    this._pauseTimer = setTimeout(function () {
      self._pauseTimer = null;
      if (self._destroyed || self._state !== 'playing') return;
      self.curStroke = idx + 1;
      self._beginStroke(self.curStroke);
    }, Math.max(0, pauseMs));
  };

  AnimateInstance.prototype._finishChar = function () {
    if (!this.charData) return;
    const total = this.charData.outlines.length;
    // 显示完整字（所有 medians 全为浅蓝）
    this._frame = null;
    this.curStroke = total;
    const cv = this._dom.fxCanvas;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.strokeStyle = 'rgba(52,152,219,0.65)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < total; i++) {
      const m = this.charData.medians[i];
      if (!m || m.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(m[0][0], m[0][1]);
      for (let j = 1; j < m.length; j++) ctx.lineTo(m[j][0], m[j][1]);
      ctx.stroke();
    }
    ctx.restore();
    this._state = 'done';
    this._updatePlayBtn();
    this._refreshHint();
    this._setMsg('「<b>' + this.opts.char + '</b>」演示完成 · 共 ' + total + ' 笔', 'ok');
    if (this.opts.onComplete) this.opts.onComplete({ char: this.opts.char, total: total });
    // 循环播放
    if (this.opts.loop) {
      const self = this;
      const hold = (this.opts.finishHoldMs != null) ? this.opts.finishHoldMs : 1200;
      this._pauseTimer = setTimeout(function () {
        self._pauseTimer = null;
        if (!self._destroyed) self.restart();
      }, Math.max(300, hold));
    }
  };

  // ============= 公开接口 =============
  function mount(options) {
    const inst = new TraceInstance(options);
    return {
      reset: function () { inst.reset(); },
      destroy: function () { inst.destroy(); },
      redoStroke: function () { inst.redoStroke(); },
      nextStroke: function () { inst.nextStroke(); },
      setChar: function (c) { inst.setChar(c); },
      playDemo: function (slow) { inst.playDemo(slow); },         // v1.4
      getStrokeResults: function () { return inst.getStrokeResults(); },
      getCurrentStroke: function () { return inst.getCurrentStroke(); },
      _instance: inst
    };
  }

  /** v1.5: 笔顺展示动画（无手写交互） */
  function animate(options) {
    const inst = new AnimateInstance(options);
    return {
      play:      function () { inst.play(); },
      pause:     function () { inst.pause(); },
      next:      function () { inst.next(); },
      prev:      function () { inst.prev(); },
      restart:   function () { inst.restart(); },
      setSpeed:  function (s) { inst.setSpeed(s); },
      setChar:   function (c) { inst.setChar(c); },
      destroy:   function () { inst.destroy(); },
      isPlaying: function () { return inst._state === 'playing'; },
      _instance: inst
    };
  }

  function preload(chars) {
    return dataLoader.loadAll().then(function () {
      // chars 参数预留：未来按字预热 IndexedDB
      return true;
    });
  }

  // ============= 输入校验（v1.2 新增） =============

  /**
   * 规范失败原因码 → 中文描述
   * 所有 code 都是稳定字符串，LLM 可安全 switch。
   */
  const REASON_TEXT = {
    'not-ready':       '字库尚未加载完毕，请等待 stroke-anim-ready 事件后再校验',
    'empty':           '输入为空，请提供一个汉字',
    'not-han':         '输入不是汉字（可能是字母/符号/空白）',
    'not-in-library':  '该汉字不在本 skill 字库内（超出 7818 字）',
    'not-in-textbook': '该汉字不在小学教材 2865 字内（仅小学范围外字库有笔画名，没有跟练几何数据）',
    'multi-char':      '输入包含多个汉字，建议批量 mount 或用 validateAll'
  };

  function _makeResult(ok, reason, char, extra) {
    extra = extra || {};
    return {
      ok: !!ok,
      char: char || null,
      reason: ok ? null : reason,
      reasonText: ok ? '' : (REASON_TEXT[reason] || reason || '未知原因'),
      strokeCount: (typeof extra.strokeCount === 'number') ? extra.strokeCount : null,
      strokeNames: Array.isArray(extra.strokeNames) ? extra.strokeNames : null,
      tier: extra.tier || null,
      hasPath: !!extra.hasPath,
      hasNames: !!extra.hasNames,
      allHansInInput: Array.isArray(extra.allHansInInput) ? extra.allHansInInput : [],
      suggestion: extra.suggestion || null
    };
  }

  /**
   * 校验单字是否可用于 StrokeTrace.mount
   *
   * @param {string} input   单字或字符串（自动取首个 Han 字符）
   * @param {Object} [opts]
   * @param {boolean} [opts.strict=true]  true=只认 textbook；false=允许 extended（但 extended 没有几何数据，仍会 ok:false）
   * @returns {{ok,char,reason,reasonText,strokeCount,strokeNames,tier,hasPath,hasNames,allHansInInput,suggestion}}
   */
  function validate(input, opts) {
    opts = opts || {};
    const strict = (opts.strict !== false); // default true

    // 数据就绪性检查
    if (!dataLoader.isReady()) {
      return _makeResult(false, 'not-ready', null, {
        suggestion: "等待事件：window.addEventListener('stroke-anim-ready', function () { /* 此时再 validate */ });"
      });
    }

    // 空 / 类型校验
    if (typeof input !== 'string' || !input.replace(/\s+/g, '')) {
      return _makeResult(false, 'empty', null, {
        suggestion: '请提供非空字符串，如 "学" 或 "春夏秋冬"。'
      });
    }

    const allHans = dataLoader.extractHans(input);
    const first = dataLoader.firstHan(input);

    // 没有任何汉字
    if (!first) {
      return _makeResult(false, 'not-han', null, {
        allHansInInput: allHans,
        suggestion: '输入需至少包含一个汉字。'
      });
    }

    const tier = dataLoader.getTier(first);
    const hasPath = dataLoader.hasChar(first);
    const names = dataLoader.getCharNames(first);
    const strokeCount = dataLoader.getStrokeCount(first);

    // 字不在任何库
    if (!tier && !hasPath) {
      return _makeResult(false, 'not-in-library', first, {
        allHansInInput: allHans,
        hasPath: false, hasNames: !!names,
        suggestion: '该字不支持跟练。可改用 stroke-order 组件 <stroke-card char="' + first + '"> 展示降级 UI。'
      });
    }

    // extended 字（strict 模式拒绝）
    if (strict && tier === 'extended') {
      return _makeResult(false, 'not-in-textbook', first, {
        tier: 'extended',
        hasPath: false, hasNames: !!names,
        strokeNames: names, strokeCount: strokeCount,
        allHansInInput: allHans,
        suggestion: '该字为小学范围外字，没有跟练几何数据。请改用 <stroke-card char="' + first + '"> 或提示用户换字。'
      });
    }

    // 多字提示（仍 ok:true，但附带 hint）
    const isMulti = allHans.length > 1;

    return _makeResult(true, null, first, {
      tier: tier || 'textbook',
      hasPath: hasPath, hasNames: !!names,
      strokeNames: names, strokeCount: strokeCount,
      allHansInInput: allHans,
      suggestion: isMulti
        ? '输入含 ' + allHans.length + ' 字，当前会 mount 首字「' + first + '」。如需批量，改用 validateAll() 后循环 mount 每字。'
        : null
    });
  }

  /**
   * 批量校验字符串中的所有汉字
   *
   * @param {string} input
   * @param {Object} [opts]  同 validate
   * @returns {{
   *   ok: boolean,                 // 所有 Han 字都 ok
   *   totalHans: number,           // 输入中检测到的 Han 字总数（去重后）
   *   valid: string[],             // 可以 mount 的字
   *   invalid: Array<{char,reason,reasonText,tier}>,
   *   suggestion: string | null
   * }}
   */
  function validateAll(input, opts) {
    if (!dataLoader.isReady()) {
      return {
        ok: false,
        totalHans: 0,
        valid: [],
        invalid: [],
        suggestion: "等待事件：window.addEventListener('stroke-anim-ready', ...)"
      };
    }
    const hans = (typeof input === 'string') ? dataLoader.extractHans(input) : [];
    const valid = [];
    const invalid = [];
    for (let i = 0; i < hans.length; i++) {
      const r = validate(hans[i], opts);
      if (r.ok) valid.push(r.char);
      else invalid.push({ char: r.char, reason: r.reason, reasonText: r.reasonText, tier: r.tier });
    }
    const ok = (hans.length > 0 && invalid.length === 0);
    let suggestion = null;
    if (hans.length === 0) suggestion = '输入未检测到汉字。';
    else if (invalid.length > 0 && valid.length > 0) {
      suggestion = '部分字不支持：' + invalid.map(function (x) { return x.char; }).join('、')
        + '。建议只对 valid 字调用 mount，对 invalid 字用 <stroke-card> 降级。';
    } else if (invalid.length === hans.length) {
      suggestion = '全部字不支持跟练，建议整体走 stroke-order 的笔顺展示组件。';
    }
    return { ok: ok, totalHans: hans.length, valid: valid, invalid: invalid, suggestion: suggestion };
  }

  return {
    mount: mount,
    animate: animate,                    // v1.5 新增：仅展示笔顺动画（无手写）
    preload: preload,
    isReady: function () { return dataLoader.isReady(); },
    hasChar: function (c) { return dataLoader.hasChar(c); },
    listChars: function () { return dataLoader.listChars(); },
    // v1.2 新增
    validate: validate,
    validateAll: validateAll,
    getTier: function (c) { return dataLoader.getTier(c); },
    // ★ 仅供单元测试访问内部原型；生产代码请勿依赖（API 不稳定）
    __test__: { TraceInstance: TraceInstance }
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = _StrokeTrace;
if (typeof window !== 'undefined') {
  window._ST = window._ST || {};
  window._ST.strokeTrace = _StrokeTrace;
  window.StrokeTrace = _StrokeTrace;

  // 自动启动加载（如果在浏览器中）
  // 注：dataLoader.loadAll() 内部已有 .catch 派发 error 事件 / 占位符兜底，
  //    这里再加一层 .catch 是为了消除 Node/浏览器层面的"未处理 promise rejection"
  //    (loadAll 返回的 Promise 没有人 await/then，没人接管才会被运行时报警)
  function _bootLoad() {
    if (!(window._ST && window._ST.dataLoader)) return;
    var p = window._ST.dataLoader.loadAll();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootLoad);
  } else {
    _bootLoad();
  }
}

})(typeof self !== 'undefined' ? self : this);
