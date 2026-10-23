/* Shared renderer for designs made with header-studio.html (used by the studio and by header-player.js).
   A design is a stack of layers. Each layer is either a pixel layer (character grids + skeleton binding)
   or a code layer (a JavaScript function that draws every frame). Any layer can be masked by another layer. */
(function (root) {
  'use strict';

  /* ---------- helpers handed to code layers ---------- */
  function hash(a, b, c) {
    var h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) / 4294967295);
  }
  function px(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
  function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function disc(c, cx, cy, r, col, clipY) {
    c.fillStyle = col;
    for (var yy = -r; yy <= r; yy++) {
      var y2 = cy + yy; if (y2 >= clipY) break;
      var half = Math.floor(Math.sqrt(r * r - yy * yy) + 0.5);
      c.fillRect(cx - half, y2, half * 2 + 1, 1);
    }
  }
  function halo(c, cx, cy, r, col, parity, clipY) {
    c.fillStyle = col;
    for (var yy = -r; yy <= r; yy++) {
      var y2 = cy + yy; if (y2 >= clipY || y2 < 0) continue;
      var half = Math.floor(Math.sqrt(r * r - yy * yy));
      for (var xx = -half; xx <= half; xx++) { if ((((cx + xx) + y2) & 1) === parity) c.fillRect(cx + xx, y2, 1, 1); }
    }
  }

  /* ---------- skeleton maths (2x3 matrices [a,b,c,d,e,f]) ---------- */
  function mul(A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
  function inv(m) { var d = m[0] * m[3] - m[1] * m[2] || 1; return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d]; }
  function M(model, j, f) {
    var S = model.skel, J = S.j[j], p = S.poses[f], a = ((p && p[j]) || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    var m = mul(mul([1, 0, 0, 1, J.x, J.y], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -J.x, -J.y]);
    return J.p >= 0 ? mul(M(model, J.p, f), m) : m;
  }
  function jpos(model, i, f) { var J = model.skel.j[i]; if (J.p < 0) return [J.x, J.y]; var m = M(model, J.p, f); return [m[0] * J.x + m[2] * J.y + m[4], m[1] * J.x + m[3] * J.y + m[5]]; }
  function lg(l, f) { return l.frames[l.anim ? Math.min(f, l.frames.length - 1) : 0]; }
  function posed(model, l, f) {
    var g = lg(l, f); if (l.bind < 0 || !model.skel.j[l.bind]) return g;
    var m = inv(M(model, l.bind, f)), o = new Uint8Array(g.length), w = model.w, h = model.h;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var sx = Math.floor(m[0] * (x + .5) + m[2] * (y + .5) + m[4]), sy = Math.floor(m[1] * (x + .5) + m[3] * (y + .5) + m[5]);
      if (sx >= 0 && sy >= 0 && sx < w && sy < h) o[y * w + x] = g[sy * w + sx];
    }
    return o;
  }

  /* ---------- drawing layers ---------- */
  function rgbOf(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function gridCanvas(model, l, f, env) {
    var w = model.w, h = model.h, g = posed(model, l, f), c = env.mk(w, h), x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data, rg = model.pal.map(rgbOf);
    for (var i = 0; i < g.length; i++) { var v = g[i]; if (!v) continue; var r = rg[v - 1], p = i * 4; d[p] = r[0]; d[p + 1] = r[1]; d[p + 2] = r[2]; d[p + 3] = 255; }
    x.putImageData(im, 0, 0); return c;
  }
  function runCode(model, l, x, t, W, env) {
    if (model.trust === false) { l.err = 'paused until you press Run code layers'; return; }
    if (l._src !== l.code) { l._src = l.code; l._st = {}; l._fn = null; l.err = ''; try { l._fn = new Function('ctx', 't', 'api', l.code); } catch (e) { l.err = String(e.message); } }
    if (l._stW !== W) { l._stW = W; l._st = {}; }
    if (!l._fn) return;
    var api = { w: W, h: model.h, mk: env.mk, Sprite: env.Sprite, wagUntil: env.wagUntil || 0, hash: hash, px: px, rect: rect, disc: disc, halo: halo, S: l._st };
    try { l._fn(x, t, api); l.err = ''; } catch (e) { l.err = String(e.message); }
  }
  function byId(model, id) { for (var i = 0; i < model.layers.length; i++) if (model.layers[i].id === id) return model.layers[i]; return null; }
  function layerCanvas(model, l, f, t, W, env, depth) {
    var c = env.mk(W, model.h), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    if (l.kind === 'code') runCode(model, l, x, t, W, env);
    else { var gc = gridCanvas(model, l, f, env); x.drawImage(gc, 0, 0); if (W > model.w) x.drawImage(gc, model.w - 1, 0, 1, model.h, model.w, 0, W - model.w, model.h); }
    var ml = l.mask ? byId(model, l.mask) : null;
    if (ml && ml !== l && depth < 4) {
      var m = layerCanvas(model, ml, f, t, W, env, depth + 1);
      if (l.maskInv) { var iv = env.mk(W, model.h), ix = iv.getContext('2d'); ix.fillStyle = '#000'; ix.fillRect(0, 0, W, model.h); ix.globalCompositeOperation = 'destination-out'; ix.drawImage(m, 0, 0); m = iv; }
      x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-over';
    }
    return c;
  }
  function render(model, f, t, W, env) {
    var c = env.mk(W, model.h), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    model.layers.forEach(function (l) { if (!l.vis) return; x.globalAlpha = l.op; x.drawImage(layerCanvas(model, l, f, t, W, env, 0), 0, 0); });
    x.globalAlpha = 1; return c;
  }
  function draw(model, ctx, f, t, W, env) { ctx.clearRect(0, 0, W, model.h); ctx.drawImage(render(model, f, t, W, env), 0, 0); }

  /* ---------- design.json -> model ---------- */
  function decode(o) {
    if (!o || typeof o !== 'object' || !o.layers || !o.layers.length) throw new Error('no layers found in that design');
    var w = Math.floor(+o.w), h = Math.floor(+o.h);
    if (!(w >= 8 && h >= 8 && w <= 1024 && h <= 1024)) throw new Error('w and h must be numbers from 8 to 1024');
    var pal = [], map = {}, N = Math.max(1, Math.floor(+o.frames) || 1);
    Object.keys(o.palette || {}).forEach(function (k) {
      if (k === '.' || k.length !== 1) return; if (pal.length >= 62) throw new Error('palette has more than 62 colours');
      if (!/^#[0-9a-fA-F]{6}$/.test(o.palette[k])) throw new Error('colour "' + k + '" is not a #rrggbb value');
      pal.push(o.palette[k].toLowerCase()); map[k] = pal.length;
    });
    if (!pal.length) pal = ['#ffffff'];
    var layers = o.layers.map(function (l, li) {
      var code = l.type === 'code' || typeof l.code === 'string', gs;
      if (code) gs = [new Uint8Array(w * h)];
      else {
        var fs = l.frames; if (!fs || !fs.length) throw new Error('layer ' + (li + 1) + ' has no frames'); if (typeof fs[0] === 'string') fs = [fs];
        N = Math.max(N, fs.length);
        gs = fs.map(function (rows) {
          var g = new Uint8Array(w * h);
          for (var y = 0; y < h; y++) { var r = rows[y] || ''; for (var x = 0; x < w; x++) { var c = r[x]; if (c && map[c]) g[y * w + x] = map[c]; } }
          return g;
        });
      }
      return { id: li + 1, name: String(l.name || 'layer ' + (li + 1)), vis: l.visible !== false, op: l.opacity == null ? 1 : Math.max(0, Math.min(1, +l.opacity)),
        anim: !code && (gs.length > 1 || !!l.animated), bind: -1, kind: code ? 'code' : 'pixels', code: code ? String(l.code || '') : '', mask: 0, maskInv: !!l.maskInvert, frames: gs, _b: l.bind, _m: l.mask };
    });
    layers.forEach(function (l) { if (l.anim) while (l.frames.length < N) l.frames.push(l.frames[l.frames.length - 1].slice()); });
    var sk = o.skeleton || {}, names = {}, J = (sk.joints || []).map(function (j, i) { names[j.name] = i; return { n: String(j.name), x: +j.x || 0, y: +j.y || 0, p: -1, _p: j.parent }; });
    J.forEach(function (j, i) { var p = names[j._p]; j.p = p == null || p === i ? -1 : p; delete j._p; });
    J.forEach(function (j) { var k = j.p, c = 0; while (k >= 0 && c++ <= J.length) k = J[k].p; if (c > J.length) j.p = -1; });
    var poses = []; for (var f = 0; f < N; f++) { var po = {}, s0 = (sk.poses || [])[f] || {}; Object.keys(s0).forEach(function (nm) { if (names[nm] != null) po[names[nm]] = +s0[nm] || 0; }); poses.push(po); }
    layers.forEach(function (l) {
      if (l._b != null && names[l._b] != null) l.bind = names[l._b];
      if (l._m) { var t = layers.filter(function (x) { return x.name === l._m && x !== l; })[0]; l.mask = t ? t.id : 0; }
      delete l._b; delete l._m;
    });
    return { w: w, h: h, fps: Math.max(1, Math.min(60, +o.fps || 8)), nf: N, pal: pal, layers: layers, skel: { j: J, poses: poses }, trust: true, hit: o.hit || null };
  }

  root.HeaderRender = { hash: hash, M: M, inv: inv, mul: mul, jpos: jpos, posed: posed, layerCanvas: layerCanvas, render: render, draw: draw, decode: decode };
})(typeof window !== 'undefined' ? window : globalThis);
