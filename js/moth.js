/* A rosy maple moth that drops by every now and again.
   Movement is ported from moth-forest's moth_screensaver.html (same rest / walk / fly modes, turn rates,
   speeds, wobble and the "lift towards you" scale pop). The difference is the coordinate space:
   the moth lives in PAGE coordinates (it is absolutely positioned inside the document), so when you scroll,
   it stays where it is on the page instead of following the screen.
   Tip: add ?moth=now to the address to make it show up straight away. */
(function () {
  'use strict';
  if (!window.ROSY_MOTH_SVG) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;                                           // no moth for people who asked for less motion

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rnd = function (a, b) { return b == null ? Math.random() * (a || 1) : a + Math.random() * (b - a); };
  var ang = function (a, b) { return Math.atan2(Math.sin(b - a), Math.cos(b - a)); };

  var layer = document.createElement('div');
  layer.id = 'moth-layer'; layer.setAttribute('aria-hidden', 'true');
  var el = document.createElement('div');
  el.className = 'page-moth'; el.innerHTML = window.ROSY_MOTH_SVG;
  layer.appendChild(el); document.body.appendChild(layer);
  var svg = el.firstElementChild;
  svg.style.setProperty('--flap-speed', '.1s');                 // same flap as the screensaver
  svg.style.setProperty('--flap-amp', '.6');

  var size = innerWidth < 640 ? 72 : 100, sc = size / 100;
  el.style.width = size + 'px';
  var hh = el.offsetHeight || size * 0.64;

  var r = { x: -300, y: 0, h: 0, st: 'rest', t: 0, z: 0, ph: rnd(6.28), tx: 0, ty: 0, flying: true, tf: '' };
  var mode = 'away';                                            // away -> visit -> leave -> away ...
  var timer = /[?&]moth=now/.test(location.search) ? 0.3 : rnd(4, 8);
  var visit = 0, T = 0, last = 0;

  function setMode(st) {
    r.st = st;
    var f = st === 'fly';
    if (f !== r.flying) { svg.classList.toggle('fly', f); r.flying = f; }
  }
  setMode('rest'); el.style.visibility = 'hidden';

  var pageW = function () { return layer.clientWidth || document.documentElement.clientWidth; };
  var pageH = function () { return layer.clientHeight || document.documentElement.scrollHeight; };

  // targets are picked around whatever part of the page is currently on screen, but they are page coordinates
  function bounds() {
    var W = pageW(), Hh = pageH(), vt = window.pageYOffset || 0, vh = innerHeight;
    var y0 = Math.max(40, vt - vh * 0.15), y1 = Math.min(Hh - 40, vt + vh * 1.15);
    if (y1 < y0 + 120) y0 = Math.max(40, y1 - 240);
    return { x0: 40, x1: Math.max(120, W - 40), y0: y0, y1: y1 };
  }

  function choose() {                                           // same three behaviours as the screensaver
    var b = bounds(), q = Math.random();
    if (r.st === 'fly') { setMode('rest'); r.t = rnd(2, 5); return; }
    if (q < 0.25) { setMode('rest'); r.t = rnd(2, 7); }
    else if (q < 0.65) {
      setMode('walk');
      var a = rnd(6.28), d = rnd(80, 260);
      r.tx = clamp(r.x + Math.cos(a) * d, b.x0, b.x1); r.ty = clamp(r.y + Math.sin(a) * d, b.y0, b.y1); r.t = rnd(3, 8);
    } else {
      setMode('fly'); r.tx = rnd(b.x0, b.x1); r.ty = rnd(b.y0, b.y1); r.t = rnd(3, 7);
    }
  }

  function startVisit() {
    var W = pageW(), Hh = pageH(), vt = window.pageYOffset || 0, side = Math.random() < 0.5 ? -1 : 1;
    r.x = side < 0 ? -70 : W + 70;
    r.y = clamp(vt + innerHeight * rnd(0.2, 0.75), 60, Hh - 60);
    r.h = side < 0 ? 0 : Math.PI;
    setMode('fly');
    var b = bounds();
    r.tx = rnd(b.x0 + 60, Math.max(b.x0 + 61, b.x1 - 60)); r.ty = clamp(r.y + rnd(-120, 120), b.y0, b.y1); r.t = rnd(3, 6);
    r.z = 0; mode = 'visit'; visit = rnd(18, 38);
    el.style.visibility = 'visible';
  }
  function startLeave() {
    var W = pageW();
    mode = 'leave'; setMode('fly');
    r.tx = r.x < W / 2 ? -140 : W + 140; r.ty = r.y + rnd(-100, 100);
  }
  function hide() { mode = 'away'; timer = rnd(22, 60); setMode('rest'); el.style.visibility = 'hidden'; }

  function step(dt) {
    if (mode === 'away') { timer -= dt; if (timer <= 0) startVisit(); else return; }
    var W = pageW();
    if (mode === 'visit') { visit -= dt; if (visit <= 0) startLeave(); }
    r.t -= dt;
    if (r.st !== 'rest') {
      var dx = r.tx - r.x, dy = r.ty - r.y, dist = Math.hypot(dx, dy), fl = r.st === 'fly';
      r.h += clamp(ang(r.h, Math.atan2(dy, dx) + (fl ? Math.sin(T * 3 + r.ph) * 0.5 : 0)), -(fl ? 2.2 : 4) * dt, (fl ? 2.2 : 4) * dt);
      var sp = (fl ? 190 : 42 * (0.3 + 0.7 * Math.max(0, Math.sin(T * 10 + r.ph)))) * sc;
      r.x += Math.cos(r.h) * sp * dt; r.y += Math.sin(r.h) * sp * dt;
      if (mode === 'leave') { if (r.x < -110 || r.x > W + 110) { hide(); return; } }
      else if (dist < 14 || r.t <= 0) choose();
    } else if (r.t <= 0 && mode === 'visit') choose();

    r.z = lerp(r.z, r.st === 'fly' ? 1 : 0, 1 - Math.exp(-dt * 3)); if (r.z < 0.002) r.z = 0;
    var s = 1 + 0.4 * r.z, wob = r.st === 'walk' ? Math.sin(T * 10 + r.ph) * 5 : 0;
    var tf = 'translate(' + (r.x - size / 2).toFixed(1) + 'px,' + (r.y - hh / 2).toFixed(1) + 'px) rotate(' + (r.h * 57.3 + 90 + wob).toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
    if (tf !== r.tf) { r.tf = tf; el.style.transform = tf; }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 30) return;
    var dt = Math.min(0.08, (now - last) / 1000); last = now; T += dt;
    step(dt);
  }
  requestAnimationFrame(frame);
})();
