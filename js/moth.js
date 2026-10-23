/* A rosy maple moth that drops by every now and again, drawn in pixels.
   Movement is ported from moth-forest's moth_screensaver.html (same rest / walk / fly modes, turn rates,
   speeds, wobble and the "lift towards you" scale pop). The moth lives in PAGE coordinates, so when you scroll
   it stays where it is on the page instead of following the screen.

   Pixel look: the moth SVG is baked into a few wing-flap frames, then each frame is drawn into a tiny canvas
   whose pixels are exactly as big as the header's pixels (the --px zoom set by js/main.js). Every pixel is
   fully on or off (no soft edges), the heading snaps in ROT_STEP turns, and the position snaps to the header's
   pixel grid, so the moth looks like it was drawn on the same canvas.
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

  /* ---------- pixel look settings ---------- */
  var FLAP_N = 6;                  // flap frames per wing beat
  var FLAP_CYCLE = 0.36;           // seconds per wing beat (slower than the old smooth flap so it reads in pixels)
  var FLAP_AMP = 0.6;
  var ROT_STEP = Math.PI / 12;     // heading snaps to 15 degree turns
  var ALPHA_CUT = 110;             // pixel is drawn if it is at least this opaque (0-255)
  var VB = { x: -126, y: -72.4, w: 252, h: 169.9 };   // viewBox padded so flapping wings are never clipped
  var VB_CX = VB.x + VB.w / 2, VB_CY = VB.y + VB.h / 2;   // centre of the drawing (the old CSS rotated around it)

  /* ---------- bake the flap frames from the SVG ---------- */
  var frames = [];                                              // 0..FLAP_N-1 = flap, FLAP_N = wings at rest
  (function bake() {
    var base = window.ROSY_MOTH_SVG
      .replace(/(class="moth [^"]*?) fly"/, '$1"')              // switch off the CSS animations
      .replace(/viewBox="[^"]*"/, 'viewBox="' + [VB.x, VB.y, VB.w, VB.h].join(' ') + '"')
      .replace('<svg ', '<svg width="' + VB.w * 2 + '" height="' + VB.h * 2 + '" ');
    for (var k = 0; k <= FLAP_N; k++) {
      var svg = base.replace(/class="wing wing-(hind|fore) ([rl])"/g, function (m, kind) {
        var ph = k / FLAP_N - (kind === 'hind' ? 0.12 : 0);     // hind wings lag a little, like the original
        var f = k === FLAP_N ? 0 : (1 - Math.cos(ph * 6.28319)) / 2;
        return m + ' style="transform:rotate(' + (-FLAP_AMP * 10 * f).toFixed(2) + 'deg) scale(' + (1 - FLAP_AMP * f).toFixed(3) + ',1)"';
      });
      var img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      frames.push(img);
    }
  })();

  /* ---------- the canvas ---------- */
  var layer = document.createElement('div');
  layer.id = 'moth-layer'; layer.setAttribute('aria-hidden', 'true');
  var el = document.createElement('canvas');
  el.className = 'page-moth';
  layer.appendChild(el); document.body.appendChild(layer);
  var ctx = el.getContext('2d', { willReadFrequently: true });

  var S = 4, size = 100, sc = 1, C = 48, dw = 25, dh = 17;
  function setup() {
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--px'));
    S = v > 0 ? v : 4;                                          // header pixel size, in screen pixels
    size = innerWidth < 640 ? 72 : 100; sc = size / 100;
    C = Math.ceil(1.9 * size / S / 2) * 2;                      // canvas side, in moth pixels (room to rotate + pop)
    el.width = C; el.height = C;
    el.style.width = (C * S) + 'px'; el.style.height = (C * S) + 'px';
    dw = (size / S) * (VB.w / 228); dh = dw * VB.h / VB.w;      // drawing size in moth pixels
    lastKey = ''; r.tf = '';
  }

  var r = { x: -300, y: 0, h: 0, st: 'rest', t: 0, z: 0, ph: rnd(6.28), tx: 0, ty: 0, flying: true, tf: '' };
  var mode = 'away';                                            // away -> visit -> leave -> away ...
  var timer = /[?&]moth=now/.test(location.search) ? 0.3 : rnd(4, 8);
  var visit = 0, T = 0, last = 0, lastKey = '';
  setup();

  var rt;
  addEventListener('resize', function () {                      // wait until main.js has re-laid-out the header
    clearTimeout(rt); rt = setTimeout(setup, 250);
  });

  function setMode(st) { r.st = st; r.flying = st === 'fly'; }
  setMode('rest'); el.style.visibility = 'hidden';

  /* draw one pixel frame: rotate + scale the baked SVG into the small canvas, then snap every pixel on/off */
  function draw(rot, s, fi) {
    var img = frames[fi];
    if (!img || !img.complete || !img.naturalWidth) return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, C, C);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.translate(C / 2, C / 2); ctx.rotate(rot); ctx.scale(s, s);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    try {
      var id = ctx.getImageData(0, 0, C, C), d = id.data;
      for (var i = 3; i < d.length; i += 4) d[i] = d[i] >= ALPHA_CUT ? 255 : 0;
      ctx.putImageData(id, 0, 0);
    } catch (e) { /* if the browser blocks reading pixels the moth is simply a little soft */ }
    return true;
  }

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
    var s = Math.round((1 + 0.4 * r.z) * 20) / 20;              // scale pop, in 5% steps
    var wob = r.st === 'walk' ? Math.sin(T * 10 + r.ph) * 5 : 0;
    var rot = Math.round((r.h + Math.PI / 2 + wob * Math.PI / 180) / ROT_STEP) * ROT_STEP;
    var fi = r.st === 'fly' ? Math.floor(T / FLAP_CYCLE * FLAP_N) % FLAP_N : FLAP_N;

    var key = fi + '|' + rot.toFixed(3) + '|' + s;               // only redraw the pixels when something changed
    if (key !== lastKey && draw(rot, s, fi)) lastKey = key;

    // snap the canvas to the header's pixel grid
    var tf = 'translate(' + (Math.round((r.x - C * S / 2) / S) * S) + 'px,' + (Math.round((r.y - C * S / 2) / S) * S) + 'px)';
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