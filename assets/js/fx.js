/**
 * 成都文化大数据有限公司 — 动效模块（原创实现）
 * 1. 流动数据线 Canvas（金色丝流 + 数据包光点 + 暜星数据列）
 * 2. 数字滚动计数
 * 3. 数据脉搏 HUD（模拟数据随机游走 + 字节流跑马灯）
 * 4. 页面跳转过渡（黑金帷幕）
 */
(function (global) {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GOLD = { r: 217, g: 185, b: 126 };
  var GOLD_DEEP = { r: 168, g: 139, b: 92 };
  function rgba(c, a) { return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }

  /* ============ 1. 流动数据线 Canvas ============ */

  function flowCanvas(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, visible = true;

    function resize() {
      W = canvas.clientWidth || canvas.parentNode.clientWidth || 320;
      H = canvas.clientHeight || canvas.parentNode.clientHeight || 160;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStreams();
    }

    /* 流线模型：双正弦叠加的"数据丝流" */
    var streams = [];
    function buildStreams() {
      streams = [];
      var K = Math.max(4, Math.min(9, Math.round(W / 150)));
      for (var i = 0; i < K; i++) {
        var s = {
          baseY: (H / (K + 1)) * (i + 1),
          amp: H * (0.05 + Math.random() * 0.05),
          freq: 1.4 + Math.random() * 1.6,
          freq2: 2.2 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.35,
          hi: i % 3 === 0,
          packets: []
        };
        var pc = 2 + Math.floor(Math.random() * 2);
        for (var p = 0; p < pc; p++) {
          s.packets.push({
            u: Math.random(),
            v: 0.08 + Math.random() * 0.22,
            glow: Math.random() < 0.35
          });
        }
        streams.push(s);
      }
    }

    function streamY(s, u, t) {
      return s.baseY
        + Math.sin(u * Math.PI * s.freq + t * s.speed + s.phase) * s.amp
        + Math.sin(u * Math.PI * s.freq2 - t * s.speed * 1.6 + s.phase * 2) * s.amp * 0.38;
    }

    var mouse = 0, smoothMouse = 0;
    if (!REDUCED && opts.parallax !== false) {
      window.addEventListener('pointermove', function (e) {
        mouse = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      }, { passive: true });
    }

    var t = 0, lastNow = performance.now();

    function frame(now) {
      var dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      if (visible) { t += dt; }
      draw();
      if (!REDUCED) requestAnimationFrame(frame);
    }

    function draw() {
      if (!REDUCED) smoothMouse += (mouse - smoothMouse) * 0.04;
      ctx.clearRect(0, 0, W, H);

      if (opts.fill) {
        ctx.fillStyle = opts.fill;
        ctx.fillRect(0, 0, W, H);
      }

      /* 底层：稀疏数据点阵 */
      if (opts.dots !== false) {
        ctx.fillStyle = rgba(GOLD_DEEP, 0.10);
        var gx = Math.max(64, W / 14), gy = Math.max(44, H / 7);
        for (var x = gx / 2; x < W; x += gx) {
          for (var y = gy / 2; y < H; y += gy) {
            var tw = 0.5 + 0.5 * Math.sin(t * 0.8 + x * 0.02 + y * 0.03);
            ctx.globalAlpha = 0.05 + tw * 0.09;
            ctx.fillRect(x - 1, y - 1, 2, 2);
          }
        }
        ctx.globalAlpha = 1;
      }

      var my = smoothMouse * (H * 0.02);

      /* 流线 */
      for (var i = 0; i < streams.length; i++) {
        var s = streams[i];
        var grad = ctx.createLinearGradient(0, 0, W, 0);
        var a = s.hi ? 0.34 : 0.13;
        grad.addColorStop(0, rgba(s.hi ? GOLD : GOLD_DEEP, 0));
        grad.addColorStop(0.18, rgba(s.hi ? GOLD : GOLD_DEEP, a * 0.7));
        grad.addColorStop(0.5, rgba(GOLD, a));
        grad.addColorStop(0.82, rgba(s.hi ? GOLD : GOLD_DEEP, a * 0.7));
        grad.addColorStop(1, rgba(s.hi ? GOLD : GOLD_DEEP, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.hi ? 1.3 : 0.8;
        if (s.hi) { ctx.shadowBlur = 8; ctx.shadowColor = rgba(GOLD, 0.35); }

        ctx.beginPath();
        var SEG = 60;
        for (var seg = 0; seg <= SEG; seg++) {
          var u = seg / SEG;
          var y = streamY(s, u, t) + my;
          if (seg === 0) ctx.moveTo(u * W, y);
          else ctx.lineTo(u * W, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        /* 数据包光点（沿流线行进） */
        for (var p = 0; p < s.packets.length; p++) {
          var pk = s.packets[p];
          if (!REDUCED) pk.u = (pk.u + (0.10 + pk.v * 0.5) * (1 / 60) * 2.2) % 1;
          var py = streamY(s, pk.u, t) + my;
          var px = pk.u * W;
          var fadeIn = Math.sin(pk.u * Math.PI);
          var pr = pk.glow ? 2.6 : 1.6;
          var rg = ctx.createRadialGradient(px, py, 0, px, py, pr * 3.2);
          rg.addColorStop(0, 'rgba(246,238,214,' + (0.9 * fadeIn).toFixed(3) + ')');
          rg.addColorStop(0.35, rgba(GOLD, 0.55 * fadeIn));
          rg.addColorStop(1, rgba(GOLD, 0));
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(px, py, pr * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    var ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () { resize(); draw(); });
      ro.observe(canvas.parentNode || canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.02 });
      io.observe(canvas);
    }

    if (REDUCED) { draw(); return; }
    requestAnimationFrame(frame);
  }

  /* ============ 2. 数字滚动计数 ============ */

  function countUp(el, dur) {
    dur = dur || 1300;
    var raw = el.textContent || '';
    var m = raw.match(/^([^0-9]*)([0-9][0-9,]*)(.*)$/);
    if (!m) return;
    var prefix = m[1], target = parseFloat(m[2].replace(/,/g, '')), suffix = m[3];
    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString('zh-CN') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    if (REDUCED) { return; }
    requestAnimationFrame(step);
  }

  function initCounters(selector) {
    var els = document.querySelectorAll(selector || '.stat__value');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || REDUCED) { els.forEach(function () {}); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============ 3. 数据脉搏 HUD ============ */

  function hexRun(n) {
    var s = '';
    var chars = '0123456789ABCDEF';
    for (var i = 0; i < n; i++) {
      s += Math.random() < 0.22 ? ' ' : chars[Math.floor(Math.random() * 16)];
    }
    return s;
  }

  function initPulse(root) {
    root = root || document;
    /* 跑马灯 */
    var ticker = root.querySelector('.flow-ticker');
    if (ticker) {
      var content = 'DATA STREAM · ' + hexRun(120) + ' ·';
      ticker.innerHTML = '<span class="flow-ticker__track">' + content + content + '</span>';
    }
    /* 随机游走数字 */
    var chips = root.querySelectorAll('[data-tick]');
    if (chips.length && !REDUCED) {
      setInterval(function () {
        chips.forEach(function (chip) {
          if (!chip.offsetParent) return;
          var v = parseInt(chip.getAttribute('data-tick'), 10) || 0;
          v += Math.floor(Math.random() * 9) + 1;
          chip.setAttribute('data-tick', v);
          chip.textContent = v.toLocaleString('zh-CN');
          chip.classList.remove('tick-flash');
          void chip.offsetWidth;
          chip.classList.add('tick-flash');
        });
      }, 2400);
    }
  }

  /* ============ 4. 页面跳转过渡 ============ */

  function initPageVeil() {
    if (REDUCED) return;
    var veil = document.createElement('div');
    veil.className = 'page-veil';
    veil.setAttribute('aria-hidden', 'true');
    document.body.appendChild(veil);

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
      if (href.indexOf('javascript:') === 0 || /^(tel|mailto|https?:)/i.test(href)) return;
      if (!/\.html(\?|#|$)/.test(href)) return;
      e.preventDefault();
      veil.classList.add('on');
      setTimeout(function () { location.href = href; }, 240);
    });
  }

  /* ============ 5. 标题遮罩逐字揭示（TIDY 式文字显现） ============ */

  /* 把文本节点拆为逐字/逐词的 rv 结构；CJK 逐字、拉丁逐词 */
  function tokenize(text) {
    var out = [];
    var re = /([\u2E80-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF])|([A-Za-z0-9][A-Za-z0-9@&%+.'\-\/]*)|(\s)|([\s\S])/g;
    var m;
    while ((m = re.exec(text))) {
      if (m[3]) out.push({ t: ' ', sp: true });
      else out.push({ t: m[1] || m[2] || m[4] });
    }
    return out;
  }

  function splitNode(node, state) {
    if (node.nodeType === 3) {
      var tokens = tokenize(node.textContent);
      var frag = document.createDocumentFragment();
      tokens.forEach(function (tk) {
        if (tk.sp) { frag.appendChild(document.createTextNode(' ')); return; }
        state.i++;
        var wrap = document.createElement('span');
        wrap.className = 'rv';
        var ch = document.createElement('span');
        ch.className = 'rv__ch';
        ch.style.setProperty('--i', state.i);
        ch.textContent = tk.t;
        wrap.appendChild(ch);
        frag.appendChild(wrap);
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !/^(BR|SVG|CANVAS)$/.test(node.tagName)) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) { splitNode(c, state); });
    }
  }

  /* 对容器内所有 .rv-text 目标做拆分并按视口触发 */
  function prepareText(root) {
    root = root || document;
    var targets = root.querySelectorAll('.carousel__title, .carousel__subtitle, .page-hero h1');
    targets.forEach(function (el) {
      if (el.getAttribute('data-rv-done')) return;
      el.setAttribute('data-rv-done', '1');
      var plain = el.textContent;
      el.setAttribute('aria-label', plain);
      splitNode(el, { i: -1 });
      /* aria：内部结构对读屏隐藏 */
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 1) n.setAttribute('aria-hidden', 'true');
      });
      if (el.closest('.carousel__item')) return; /* 轮播由 .active 类驱动，无需 IO */
      var hero = el.closest('.page-hero');
      if (hero) hero.classList.add('rv-armed');
      if ('IntersectionObserver' in window && !REDUCED) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add('rv-in');
              if (hero) hero.classList.add('rv-in');
              io.unobserve(en.target);
            }
          });
        }, { threshold: 0.2 });
        io.observe(el);
      } else {
        el.classList.add('rv-in');
        if (hero) hero.classList.add('rv-in');
      }
    });
  }

  /* ============ 6. 分段进度指示（左下角 01 — 0N） ============ */

  function initSectionProgress() {
    var secs = Array.prototype.slice.call(document.querySelectorAll('.section, .flow-sec'))
      .filter(function (s) { return s.offsetParent !== null || s.classList.contains('flow-sec'); });
    if (secs.length < 2) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var bar = document.createElement('div');
    bar.className = 'sec-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span class="sp-cur"><span class="sp-val">01</span></span>'
      + '<span class="sp-sep">—</span>'
      + '<span class="sp-total">' + pad(secs.length) + '</span>';
    document.body.appendChild(bar);
    var val = bar.querySelector('.sp-val');
    var cur = 0;

    function setTo(i) {
      if (i === cur) return;
      cur = i;
      val.textContent = pad(i + 1);
      if (!REDUCED) {
        val.classList.remove('tick');
        void val.offsetWidth;
        val.classList.add('tick');
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setTo(secs.indexOf(en.target));
        });
      }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      secs.forEach(function (s) { io.observe(s); });
    }
  }

  /* ============ 7. SCROLL 滚动提示（首屏左下） ============ */

  function initScrollHint() {
    var carousel = document.getElementById('bannerCarousel');
    if (!carousel) return;
    var hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span>SCROLL</span><i class="sh-line"></i>';
    carousel.appendChild(hint);
    window.addEventListener('scroll', function () {
      hint.classList.toggle('gone', window.scrollY > 140);
    }, { passive: true });
  }

  /* ============ 挂载入口 ============ */

  function mount() {
    /* 首页轮播：流动线叠加层 */
    var carousel = document.getElementById('bannerCarousel');
    if (carousel) {
      carousel.classList.add('has-fx');
      var cv = document.createElement('canvas');
      cv.className = 'carousel__fx';
      cv.setAttribute('aria-hidden', 'true');
      carousel.insertBefore(cv, carousel.firstChild);
      flowCanvas(cv, { fill: null, parallax: true });
    }

    /* 数据脉搏全幅段 */
    var flowSec = document.getElementById('flowCanvas');
    if (flowSec) {
      flowCanvas(flowSec, { fill: '#0a0908', dots: true });
    }

    /* 子页页头 */
    document.querySelectorAll('.page-hero').forEach(function (hero) {
      if (hero.querySelector('canvas')) return;
      var cv = document.createElement('canvas');
      cv.className = 'page-hero__fx';
      cv.setAttribute('aria-hidden', 'true');
      hero.insertBefore(cv, hero.firstChild);
      flowCanvas(cv, { fill: null, parallax: false });
    });

    initCounters();
    initPulse();
    initPageVeil();
    prepareText(document);
    initSectionProgress();
    initScrollHint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  global.CCFGFX = { flowCanvas: flowCanvas, countUp: countUp, prepareText: prepareText };
})(window);
