/**
 * 公共交互：导航/页脚渲染 · 轮播 · 搜索 · 滚动动效 · 详情浮层
 * 依赖 store.js
 */
(function (global) {
  'use strict';

  var NAV_ITEMS = [
    { key: 'home', name: '首页', href: 'index.html' },
    { key: 'about', name: '公司介绍', href: 'about.html' },
    { key: 'business', name: '业务体系', href: 'business.html' },
    { key: 'cases', name: '核心产品', href: 'cases.html' },
    { key: 'news', name: '新闻公告', href: 'news.html' },
    { key: 'search', name: '站内检索', href: 'search.html' }
  ];

  /* ---------- 图标与 Logo（内联 SVG，可整体替换为品牌资产） ---------- */

  var LOGO_SVG = '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="成都文化大数据有限公司 Logo">'
    + '<circle cx="24" cy="24" r="21" stroke="#c9a227" stroke-width="2.2"/>'
    + '<circle cx="24" cy="24" r="5.5" fill="#16324a"/>'
    + '<g stroke="#16324a" stroke-width="2" stroke-linecap="round">'
    + [0, 45, 90, 135, 180, 225, 270, 315].map(function (deg) {
      var r1 = 9.5, r2 = 17.5, a = deg * Math.PI / 180;
      var x1 = 24 + r1 * Math.cos(a), y1 = 24 + r1 * Math.sin(a);
      var x2 = 24 + r2 * Math.cos(a), y2 = 24 + r2 * Math.sin(a);
      return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }).join('')
    + '</g></svg>';

  var BIRD_RAYS = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none">'
    + '<circle cx="100" cy="100" r="60" stroke="#c9a227" stroke-width="1.2"/>'
    + '<circle cx="100" cy="100" r="86" stroke="#c9a227" stroke-width=".8" stroke-dasharray="4 6"/>'
    + '<g stroke="#e3c566" stroke-width="1.4" stroke-linecap="round">'
    + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (deg) {
      var a = deg * Math.PI / 180;
      var x1 = 100 + 62 * Math.cos(a), y1 = 100 + 62 * Math.sin(a);
      var x2 = 100 + 92 * Math.cos(a), y2 = 100 + 92 * Math.sin(a);
      return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }).join('')
    + '</g><circle cx="100" cy="100" r="18" fill="none" stroke="#e3c566" stroke-width="1.2"/></svg>';

  var ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/></svg>',
    network: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5 6.2 16.7M12 7.5l5.8 9.2M7.5 19h9"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9 8 8M16 16l3.1 3.1M4.9 19.1 8 16M16 8l3.1-3.1"/></svg>',
    orbit: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(30 12 12)"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 渲染公共骨架 ---------- */

  function renderHeader(active) {
    var site = CDBG.data().site;
    var mount = document.getElementById('site-header');
    if (!mount) return;
    var links = NAV_ITEMS.map(function (n) {
      return '<a href="' + n.href + '" class="' + (active === n.key ? 'active' : '') + '">' + n.name + '</a>';
    }).join('');
    var mlinks = NAV_ITEMS.map(function (n) {
      return '<a href="' + n.href + '" class="' + (active === n.key ? 'active' : '') + '">' + n.name + '</a>';
    }).join('');

    mount.outerHTML =
      '<div class="topbar"><div class="container">'
      + '<span class="welcome">' + esc(site.slogan) + '</span>'
      + '<div class="topbar__right"><a href="index.html">设为首页</a><a href="javascript:void(0)" onclick="CDBGApp.openSearch()">站内检索</a><a href="admin.html">管理入口</a></div>'
      + '</div></div>'
      + '<header class="header" id="header"><div class="container"><nav class="nav">'
      + '<a class="brand" href="index.html"><span class="brand__logo">' + LOGO_SVG + '</span>'
      + '<span class="brand__text"><span class="zh">' + esc(site.name) + '</span><span class="en">' + esc(site.enName) + '</span></span></a>'
      + '<div class="nav__links">' + links + '</div>'
      + '<div class="nav__actions">'
      + '<button class="search-trigger" onclick="CDBGApp.openSearch()" aria-label="搜索"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#16324a" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="st-text">搜索文化数据…</span></button>'
      + '</div>'
      + '<button class="nav__burger" id="burger" aria-label="菜单"><span></span><span></span><span></span></button>'
      + '</nav></div></header>'
      + '<div class="mobile-menu" id="mobileMenu"><div class="mobile-menu__panel">'
      + '<button class="mobile-menu__close" aria-label="关闭">×</button>' + mlinks
      + '<a href="admin.html" style="color:var(--gold-ink)">管理入口</a>'
      + '</div></div>';
  }

  function renderFooter() {
    var d = CDBG.data();
    var s = d.site;
    var mount = document.getElementById('site-footer');
    if (!mount) return;
    var navHtml = NAV_ITEMS.map(function (n) {
      return '<li><a href="' + n.href + '">' + n.name + '</a></li>';
    }).join('');
    var linkHtml = (s.links || []).map(function (l) {
      return '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.name) + '</a></li>';
    }).join('');
    var contactItems = [
      { ic: ICONS.phone, v: s.hotline },
      { ic: ICONS.mail, v: s.email },
      { ic: ICONS.pin, v: s.address }
    ].filter(function (c) { return c.v && String(c.v).trim(); });
    mount.outerHTML =
      '<footer class="footer"><div class="footer__top"><div class="container"><div class="footer__grid">'
      + '<div><div class="footer__brand"><span class="brand__logo">' + LOGO_SVG + '</span><div>'
      + '<div class="zh">' + esc(s.name) + '</div><div class="en">' + esc(s.enName) + '</div></div></div>'
      + '<p>' + esc(s.slogan) + '<br>在市委宣传部指导下，由成都传媒集团、成都传媒产业集团于2026年3月全资组建</p></div>'
      + '<div><h4>栏目导航</h4><ul class="footer__nav">' + navHtml + '</ul></div>'
      + '<div><h4>联系我们</h4><ul class="footer__contact">'
      + contactItems.map(function (c) { return '<li>' + c.ic + esc(c.v) + '</li>'; }).join('')
      + '</ul></div>'
      + '</div></div></div>'
      + '<div class="footer__bottom"><div class="container" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      + '<span>© 2026 ' + esc(s.name) + '（演示站点，内容均为占位素材）</span>'
      + '<span><a href="#">' + esc(s.icp) + '</a> · <a href="#">公安备案（占位）</a> · <a class="admin-link" href="admin.html">内容管理</a></span>'
      + '</div></div></footer>'
      + '<button class="backtop" id="backtop" aria-label="回到顶部"><span class="zh">顶部</span></button>';
  }

  /* ---------- 搜索 ---------- */

  function openSearch() {
    var overlay = document.getElementById('searchOverlay');
    if (overlay) { overlay.classList.add('open'); document.getElementById('searchInput').focus(); }
  }

  function doSearch(kw) {
    if (!kw || !kw.trim()) return;
    location.href = 'search.html?q=' + encodeURIComponent(kw.trim());
  }

  function initSearchOverlay() {
    var overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
    var form = document.getElementById('searchForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      doSearch(document.getElementById('searchInput').value);
    });
  }

  /* ---------- 轮播 ---------- */

  function initCarousel(rootEl, items, opts) {
    if (!rootEl || !items || !items.length) return;
    opts = opts || {};
    var glyphs = ['蜀', '纹', '锦', '韵']; // 占位视觉主题字（可替换为图片）
    rootEl.innerHTML =
      '<div class="carousel__track">' + items.map(function (b, i) {
        return '<a class="carousel__item' + (i === 0 ? ' active' : '') + '" href="' + esc(b.link || '#') + '">'
          + '<div class="bg bg--' + (i % 4) + '"><div class="bg__rays">' + BIRD_RAYS + '</div></div>'
          + '<div class="carousel__content"><span class="carousel__tag">' + esc(b.tag || '') + '</span>'
          + '<h2 class="carousel__title">' + esc(b.title).replace(/(数聚|文化|数据)/, '<em>$1</em>') + '</h2>'
          + '<p class="carousel__subtitle">' + esc(b.subtitle || '') + '</p>'
          + '<span class="carousel__cta">了解更多 →</span></div>'
          + '<span class="vertical-deco">天府文脉 · 数字新生</span>'
          + '</a>';
      }).join('') + '</div>'
      + '<button class="carousel__arrow carousel__arrow--prev" aria-label="上一张">‹</button>'
      + '<button class="carousel__arrow carousel__arrow--next" aria-label="下一张">›</button>'
      + '<div class="carousel__dots">' + items.map(function (_, i) {
        return '<button data-i="' + i + '" class="' + (i === 0 ? 'active' : '') + '" aria-label="第' + (i + 1) + '张"></button>';
      }).join('') + '</div>';

    if (window.CCFGFX && CCFGFX.prepareText) CCFGFX.prepareText(rootEl);

    var idx = 0, timer = null, count = items.length;
    var slides = rootEl.querySelectorAll('.carousel__item');
    var dots = rootEl.querySelectorAll('.carousel__dots button');

    function go(n) {
      idx = (n + count) % count;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }
    function play() { stop(); timer = setInterval(function () { go(idx + 1); }, opts.interval || 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    rootEl.querySelector('.carousel__arrow--prev').addEventListener('click', function () { go(idx - 1); play(); });
    rootEl.querySelector('.carousel__arrow--next').addEventListener('click', function () { go(idx + 1); play(); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { go(+d.dataset.i); play(); });
    });
    rootEl.addEventListener('mouseenter', stop);
    rootEl.addEventListener('mouseleave', play);

    // 触摸滑动
    var tx = 0;
    rootEl.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; stop(); }, { passive: true });
    rootEl.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
      play();
    }, { passive: true });

    play();
  }

  /* ---------- 详情浮层 ---------- */

  function showDetail(title, meta, body, image) {
    var overlay = document.getElementById('detailOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'detailOverlay';
      overlay.className = 'detail-overlay';
      document.body.appendChild(overlay);
    }
    var imgHtml = image ? '<img class="detail-panel__img" src="' + esc(image) + '" alt="" loading="lazy">' : '';
    overlay.innerHTML = '<div class="detail-panel"><button class="detail-close" aria-label="关闭">×</button>'
      + '<div class="detail-panel__meta"><span>' + esc(meta) + '</span></div>'
      + '<h2>' + esc(title) + '</h2>' + imgHtml + '<div class="body">' + esc(body) + '</div></div>';
    overlay.classList.add('open');
    overlay.onclick = function (e) { if (e.target === overlay) overlay.classList.remove('open'); };
    overlay.querySelector('.detail-close').onclick = function () { overlay.classList.remove('open'); };
  }

  /* ---------- 全局动效 ---------- */

  function initScrollFx() {
    var header = document.getElementById('header');
    var backtop = document.getElementById('backtop');
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (backtop) backtop.classList.toggle('show', y > 420);
    }, { passive: true });
    if (backtop) backtop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    // 移动端菜单
    var burger = document.getElementById('burger');
    var menu = document.getElementById('mobileMenu');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        burger.classList.toggle('open');
        menu.classList.toggle('open');
      });
      menu.addEventListener('click', function (e) {
        if (e.target === menu || e.target.classList.contains('mobile-menu__close')) {
          burger.classList.remove('open');
          menu.classList.remove('open');
        }
      });
    }

    // reveal 动效（同组子元素交错入场，通过 --rd 交给 CSS animation）
    document.querySelectorAll('.reveal').forEach(function (el) {
      var parent = el.parentNode;
      if (!parent) return;
      var sibs = Array.prototype.filter.call(parent.children, function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--rd', Math.min(i * 90, 360) + 'ms');
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- 公共工具 ---------- */

  function fmtDate(str) {
    if (!str) return '';
    var parts = String(str).split('-');
    return { d: parts[2] || '', m: (parts[0] || '') + '.' + (parts[1] || '') };
  }

  function renderNewsItem(n) {
    var dt = fmtDate(n.date);
    return '<div class="news-list__item reveal" data-detail=\'news\' data-id="' + esc(n.id) + '">'
      + '<div class="news-list__date"><div class="d">' + esc(dt.d) + '</div><div class="m">' + esc(dt.m) + '</div></div>'
      + '<div style="flex:1"><div class="news-list__title">' + esc(n.title) + '</div>'
      + '<div class="news-list__summary">' + esc(n.summary || '') + '</div></div>'
      + '<span class="news-list__cat">' + esc(n.category || '动态') + '</span></div>';
  }

  function bindDetail(sel, itemsGetter) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-id');
        var item = (itemsGetter() || []).filter(function (x) { return x.id === id; })[0];
        if (item) showDetail(item.title, (item.date || '') + (item.category ? ' · ' + item.category : ''), item.body || item.summary || '（正文待补充：可在管理端补充完整内容）', item.image);
      });
    });
  }

  /* ---------- 启动 ---------- */

  global.CDBGApp = {
    NAV_ITEMS: NAV_ITEMS,
    LOGO_SVG: LOGO_SVG,
    BIRD_RAYS: BIRD_RAYS,
    ICONS: ICONS,
    esc: esc,
    fmtDate: fmtDate,
    openSearch: openSearch,
    doSearch: doSearch,
    showDetail: showDetail,
    renderNewsItem: renderNewsItem,
    bindDetail: bindDetail,
    initCarousel: initCarousel,
    init: function (opts) {
      opts = opts || {};
      renderHeader(opts.active);
      renderFooter();
      initSearchOverlay();
      initScrollFx();
    }
  };
})(window);
