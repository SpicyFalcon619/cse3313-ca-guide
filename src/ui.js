(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- pages ---------------- */
  var pages = $$('article.page'), current = null;
  var course = pages.filter(function (p) { return p.dataset.group === 'CT-2 course' && p.dataset.skip !== '1'; });
  var groups = [];
  var formerRoutes = new Map([
    ['tasmin-01', 'earlier'], ['tasmin-02', 'ct2-registers'],
    ['tasmin-03', 'performance-review'], ['tasmin-04', 's-power'],
    ['tasmin-05', 'ct2-arrays'], ['tasmin-06', 'ct2-loops'],
    ['tasmin-07', 'ct2-call'], ['tasmin-08', 'ct2-encode'],
    ['tasmin-09', 'binary-division'], ['practice-library', 'ct2-simulator'],
  ]);
  function buildNav() {
    var n = 0;
    pages.forEach(function (p) {
      n++; p.dataset.num = n;
      var g = groups.filter(function (x) { return x.name === p.dataset.group; })[0];
      if (!g) { g = { name: p.dataset.group, pages: [] }; groups.push(g); }
      g.pages.push(p);
    });
    pages.forEach(function (p) {
      var groupPages = groups.find(function (group) { return group.name === p.dataset.group; }).pages;
      var position = groupPages.indexOf(p);
      var prev = groupPages[position - 1], next = groupPages[position + 1], pg = document.createElement('nav'); pg.className = 'pager'; pg.setAttribute('aria-label', 'Page');
      pg.innerHTML = (prev ? '<a href="#' + prev.id + '"><span>&#8592; PREVIOUS</span><b>' + prev.dataset.title + '</b></a>' : '') + (next ? '<a class="nx" href="#' + next.id + '"><span>NEXT &#8594;</span><b>' + next.dataset.title + '</b></a>' : '');
      if (p.dataset.skip !== '1') {
        var db = document.createElement('button'); db.type = 'button'; db.className = 'btn donebtn'; db.dataset.done = p.id;
        ($('.foundation-check', p) || p).appendChild(db);
      }
      if (pg.children.length && !$('.foundation-next', p)) p.appendChild(pg);
    });
  }
  function buildSub(p) {
    var g = groups.filter(function (x) { return x.name === p.dataset.group; })[0];
    $$('#groups a').forEach(function (a) {
      var on = a.dataset.section === g.name; a.setAttribute('aria-current', String(on));
      if (on) { var t = $('#groups'); t.scrollTo({ left: a.offsetLeft - t.offsetLeft - t.clientWidth / 2 + a.clientWidth / 2 }); }
    });
    var hero = $('header.hero', p);
    var isCourse = g.name === 'CT-2 course';
    if (p.id !== 'start' && hero && !$('.chips', hero) && g.pages.length > 1) {
      var ch = document.createElement('nav'); ch.className = 'chips'; ch.setAttribute('aria-label', 'Pages in ' + g.name);
      ch.innerHTML = g.pages.map(function (q) {
        var number = isCourse ? course.indexOf(q) + 1 : q.dataset.num;
        var label = number ? '<span class="n">' + String(number).padStart(2, '0') + '</span>' : '';
        return '<a href="#' + q.id + '" data-p="' + q.id + '"' + (q === p ? ' aria-current="page"' : '') + '>' + label + q.dataset.title + (q.dataset.skip === '1' ? '' : '<span class="ok" aria-hidden="true"></span>') + '</a>';
      }).join('');
      ch.id = 'pages-in-' + p.id;
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'chip-toggle';
      toggle.textContent = isCourse ? 'CT-2 lessons' : g.name + ' pages';
      toggle.setAttribute('aria-controls', ch.id);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') === 'false'));
      });
      hero.append(toggle, ch);
    }
    if (isCourse && hero) $('.chip-toggle', hero)?.setAttribute('aria-expanded', 'false');
  }
  function doneSet() { try { return JSON.parse(store('cse3313-done') || '{}'); } catch (e) { return {}; } }
  function refreshDone() {
    var d = doneSet(), cnt = 0, tot = 0;
    $$('.chips a[data-p]').forEach(function (a) { var on = !!d[a.dataset.p]; a.classList.toggle('done', on); });
    pages.forEach(function (p) { if (p.dataset.skip !== '1') { tot++; if (d[p.id]) cnt++; } });
    $$('button[data-done]').forEach(function (b) { var on = !!d[b.dataset.done]; b.classList.toggle('on', on); b.innerHTML = on ? '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>Understood' : 'Mark this page as understood'; });
    $('.prog').hidden = tot === 0;
    $('#progT').textContent = cnt + '/' + tot; $('#progB').style.width = (tot ? cnt / tot * 100 : 0) + '%';
    var complete = course.filter(function (p) { return d[p.id]; }).length;
    var next = course.find(function (p) { return !d[p.id]; });
    if (course.length) {
      var progress = $('[data-course-progress]'), resume = $('[data-course-start]');
      progress.hidden = complete === 0;
      progress.textContent = complete + ' of ' + course.length + ' CT-2 lessons understood';
      resume.href = '#' + (next || course[0]).id;
      resume.textContent = complete === 0 ? 'Start Lesson 1' : next ? 'Continue course' : 'Review from Lesson 1';
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-done]'); if (b) { var d = doneSet(); d[b.dataset.done] = !d[b.dataset.done]; store('cse3313-done', JSON.stringify(d)); refreshDone(); }
  });
  /* ---------- course route and page heroes ---------- */
  function buildHero(p) {
    var h = $('header.hero', p); if (!h || h.__done) return; h.__done = 1;
    var left = $('.hl', h);
    if (!left) {
      left = document.createElement('div'); left.className = 'hl';
      while (h.firstChild) left.appendChild(h.firstChild);
      h.appendChild(left);
    }
    var eb = $('.eyebrow', left);
    if (eb) eb.outerHTML = '<p class="kick"><span class="num">' + String(p.dataset.num).padStart(2, '0') + '</span><span>' + eb.innerHTML + '</span></p>';
    var acts = document.createElement('div'); acts.className = 'acts';
    if ($('.sim', p)) acts.innerHTML += '<button type="button" class="hbtn cream" data-jump="sim">Try it</button>';
    if (p.dataset.skip !== '1' && !p.classList.contains('foundation')) acts.innerHTML += '<button type="button" class="hbtn line" data-done="' + p.id + '"></button>';
    if (acts.innerHTML) ($('.lede', left) || left.lastChild).insertAdjacentElement('afterend', acts);
    addField(h);
  }
  document.addEventListener('click', function (e) {
    var j = e.target.closest('[data-jump]'); if (!j) return;
    var pg = j.closest('.page'), t = $('.sim', pg); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- motion: animated background behind each title band ---------- */
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function HeroField(hero) {
    var cv = document.createElement('canvas'); cv.className = 'field'; cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, hero.firstChild);
    this.cv = cv; this.hero = hero; this.ctx = cv.getContext('2d'); this.t0 = 0; this.reset();
  }
  HeroField.prototype.reset = function () {
    var r = this.hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(320, r.width); this.h = Math.max(200, r.height);
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = Math.ceil(this.w / 120), rows = Math.ceil(this.h / 110), N = [], E = [];
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) N.push({ x: (i + .5) * this.w / cols + (Math.random() - .5) * 60, y: (j + .5) * this.h / rows + (Math.random() - .5) * 50, d: Infinity });
    N.forEach(function (a, ia) {
      var near = N.map(function (b, ib) { return [ib, Math.hypot(a.x - b.x, a.y - b.y)]; }).filter(function (x) { return x[0] !== ia; }).sort(function (x, y) { return x[1] - y[1]; }).slice(0, 3);
      near.forEach(function (n) { if (n[1] < 190 && !E.some(function (e) { return (e[0] === ia && e[1] === n[0]) || (e[1] === ia && e[0] === n[0]); })) E.push([ia, n[0]]); });
    });
    var adj = N.map(function () { return []; }); E.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
    var s = Math.floor(Math.random() * N.length); N[s].d = 0; var q = [s];
    while (q.length) { var u = q.shift(); adj[u].forEach(function (v) { if (N[v].d === Infinity) { N[v].d = N[u].d + 1; q.push(v); } }); }
    this.N = N; this.E = E; this.max = Math.max.apply(null, N.map(function (n) { return n.d === Infinity ? 0 : n.d; })); this.t0 = performance.now();
  };
  HeroField.prototype.draw = function (now) {
    var c = this.ctx, N = this.N, step = 520, t = RM ? this.max + .9 : (now - this.t0) / step, wave = t, fade = this.max + 4;
    if (!RM && t > fade + 3) { this.reset(); return; }
    c.clearRect(0, 0, this.w, this.h);
    this.E.forEach(function (e) {
      var a = N[e[0]], b = N[e[1]], lit = Math.min(a.d, b.d) < wave - .4 && Math.max(a.d, b.d) <= wave;
      c.strokeStyle = lit ? 'rgba(142,173,255,' + (t > fade ? .28 * Math.max(0, 1 - (t - fade) / 3) : .28) + ')' : 'rgba(238,242,243,.07)';
      c.lineWidth = lit ? 1.4 : 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    });
    N.forEach(function (n) {
      var k = wave - n.d, r = 3.2, col = 'rgba(238,242,243,.14)';
      if (n.d === 0) r = 5;
      if (k >= 0 && k < 1) { col = 'rgba(142,173,255,' + (.85 - k * .4) + ')'; r = 4 + (1 - k) * 4; c.beginPath(); c.arc(n.x, n.y, 10 + k * 18, 0, 7); c.strokeStyle = 'rgba(142,173,255,' + (.35 * (1 - k)) + ')'; c.lineWidth = 1.2; c.stroke(); }
      else if (k >= 1) col = 'rgba(102,189,177,' + (t > fade ? .45 * Math.max(0, 1 - (t - fade) / 3) : .45) + ')';
      c.fillStyle = col; c.beginPath(); c.arc(n.x, n.y, r, 0, 7); c.fill();
    });
  };
  var fields = [], rafOn = false;
  function tick(now) {
    var any = false;
    fields.forEach(function (f) { if (!f.hero.closest('.page').hidden && f.hero.getBoundingClientRect().bottom > 0) { f.draw(now); any = true; } });
    if (any && !RM && !document.hidden && !CALM()) requestAnimationFrame(tick); else rafOn = false;
  }
  function CALM() { return document.documentElement.classList.contains('calm'); }
  function wakeFields() { if (!rafOn) { rafOn = true; requestAnimationFrame(tick); } }
  function addField(hero) { var f = new HeroField(hero); fields.push(f); wakeFields(); }
  window.addEventListener('scroll', wakeFields, { passive: true });
  document.addEventListener('visibilitychange', wakeFields);
  window.addEventListener('resize', function () { fields.forEach(function (f) { if (!f.hero.closest('.page').hidden) f.reset(); }); });
  function enterPage(p) {
    p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
    var f = fields.filter(function (x) { return x.hero.closest('.page') === p; })[0];
    if (f) { f.reset(); } wakeFields();
  }

  document.addEventListener('pointermove', function (e) {
    if (RM || e.pointerType !== 'mouse') return;
    var pl = e.target.closest && e.target.closest('header.hero'); var f = pl && $('.plate', pl); if (!f) return;
    var r = pl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    f.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateY(-4px)';
  });
  document.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.matches('header.hero') && !e.relatedTarget?.closest?.('header.hero')) { var f = $('.plate', e.target); if (f) f.style.transform = ''; } });
  function show() {
    var hash = location.hash.slice(1);
    var id = formerRoutes.get(hash) || hash || 'start';
    if (formerRoutes.has(hash)) history.replaceState(history.state, '', '#' + id);
    var p = document.getElementById(id);
    if (!p || !p.classList.contains('page')) { id = 'start'; p = document.getElementById(id); }
    pages.forEach(function (x) { x.hidden = x !== p; });
    document.body.classList.add('guide-ready');
    buildSub(p); buildHero(p); refreshDone(); enterPage(p);
    lastY = 0; setHidden(false); setTimeout(adaptNav, 80);
    if (current !== id) { current = id; window.scrollTo(0, 0); }
  }

  /* ---------------- theme ---------------- */
  function calmInit() {
    var btn = $('#calmBtn'); if (!btn) return;
    var ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M6.4 6.6l4.2-1.2M13.5 5.6l4.1 2.6M5.8 8.4l1.6 7.1M9.6 17.2l5.8.7M18.6 10.5l-1.2 6"/></svg>';
    var OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M3.5 3.5l17 17"/></svg>';
    function paint() {
      var c = CALM(); btn.innerHTML = c ? OFF : ON; btn.setAttribute('aria-pressed', c ? 'true' : 'false');
      btn.setAttribute('aria-label', c ? 'Turn background animation on' : 'Turn background animation off');
      btn.title = c ? 'Background: off' : 'Background: on';
    }
    if (store('cse3313-calm') === '1') document.documentElement.classList.add('calm');
    btn.addEventListener('click', function () {
      var c = !CALM(); document.documentElement.classList.toggle('calm', c); store('cse3313-calm', c ? '1' : '0'); paint();
      if (!c) wakeFields();
    });
    paint();
  }
  function themeInit() {
    var t = store('cse3313-theme'); if (t === 'light' || t === 'dark' || t === 'black') document.documentElement.setAttribute('data-theme', t);
    var btn = $('#themeBtn'), mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
    var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    function cur() { return document.documentElement.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light'); }
    var BLACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>';
    var NEXT = { light: 'dark', dark: 'black', black: 'light' }, NAME = { light: 'paper', dark: 'dark', black: 'charcoal' };
    function paint() {
      var nx = NEXT[cur()] || 'dark';
      btn.innerHTML = nx === 'light' ? SUN : nx === 'black' ? BLACK : MOON;
      btn.setAttribute('aria-label', 'Switch to ' + NAME[nx] + ' theme');
      btn.title = 'Theme: ' + NAME[cur()] + ' (next: ' + NAME[nx] + ')';
    }
    btn.addEventListener('click', function () {
      var nx = NEXT[cur()] || 'dark'; document.documentElement.setAttribute('data-theme', nx); store('cse3313-theme', nx); paint();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    paint();
  }
  /* ---------- floating nav: adapts to what is behind it, hides on scroll down ---------- */
  var topBar = $('.top'), handle = $('.nav-handle'), lastY = 0, ticking = false;
  function setHidden(h) { topBar.classList.toggle('hide', h); document.body.classList.toggle('nav-off', h); }
  function adaptNav() {
    var r = topBar.getBoundingClientRect(); if (r.bottom < 0) return;
    var y = r.top + r.height / 2, d = 0, l = 0;
    for (var i = 0; i < 7; i++) {
      var x = r.left + r.width * (i + .5) / 7;
      var el = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : []).filter(function (e) { return !topBar.contains(e) && e !== handle && e !== document.documentElement && e !== document.body; })[0];
      if (!el) continue;
      if (el.closest('header.hero, .code')) d++; else l++;
    }
    topBar.classList.toggle('light', d === 0 && l > 0);
    topBar.classList.toggle('scrolled', window.scrollY > 10);
  }
  function onScroll() {
    var y = window.scrollY;
    if (y < 90) setHidden(false);
    else if (Math.abs(y - lastY) > 6) { if (y > lastY) { if (!topBar.matches(':hover') && !topBar.querySelector(':focus-visible')) setHidden(true); } else setHidden(false); }
    if (Math.abs(y - lastY) > 6 || y < 90) lastY = y;
    adaptNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', adaptNav);
  handle.addEventListener('click', function () { setHidden(false); lastY = window.scrollY; });
  topBar.addEventListener('focusin', function () { setHidden(false); });
  var termQuery = $('#ct2-term-query');
  if (termQuery) {
    var termSections = $$('[data-course-term-section]');
    var termStatus = $('[data-course-term-status]');
    termQuery.parentElement.hidden = false;
    termQuery.addEventListener('input', function () {
      var query = termQuery.value.trim().toLowerCase(), matches = 0;
      termSections.forEach(function (section) {
        var shown = 0;
        $$('[data-course-term]', section).forEach(function (entry) {
          entry.hidden = !$('dt', entry).textContent.toLowerCase().includes(query);
          if (!entry.hidden) shown++;
        });
        section.hidden = shown === 0;
        matches += shown;
      });
      termStatus.textContent = !query ? '' : matches === 0 ? 'No matches. Try an instruction such as sll or a word such as register.' : matches + (matches === 1 ? ' matching entry' : ' matching entries');
    });
  }
  buildNav(); themeInit(); calmInit();
  $('#themeBtn').hidden = false;
  $('#calmBtn').hidden = false;
  window.addEventListener('hashchange', show);
  show();
})();
