/* Pixel sprite of Aspen, built from simple shapes so it is easy to tweak.
   Facing right, seated on the end of the deck with legs dangling.
   Palette comes from the character art (periwinkle body, dark blue fins, pale muzzle, amber eye, white hoodie). */
(function (root) {
  'use strict';
  var SW = 54, SH = 78;          // sprite size in pixels
  var SEAT = 63;                 // row of the deck surface inside the sprite (hips sit on the row above)

  var PAL = {
    O: '#1c2a5e', i: '#4a62b0',
    b: '#93a3cf', B: '#b3c0e2', d: '#7283b8',
    F: '#0a2c86', G: '#2a58c8',
    w: '#e9f8ff', v: '#bfe3f0',
    W: '#f6f6f8', h: '#d3d9ea', H: '#b2bddb',
    S: '#14325f',
    y: '#f7b92e', p: '#1b1830', t: '#ffffff',
    g: '#5e6b7c', n: '#24345f', N: '#18244a', k: '#f4a9bd'
  };

  function grid() {
    var g = [];
    for (var y = 0; y < SH; y++) { g.push(new Array(SW).fill('.')); }
    return g;
  }
  function api(g) {
    var set = function (x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < SW && y < SH) g[y][x] = c; };
    var rect = function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var k = 0; k < w; k++) set(x + k, y + j, c); };
    var inPoly = function (pts, px, py) {
      var inside = false;
      for (var a = 0, b = pts.length - 1; a < pts.length; b = a++) {
        var xi = pts[a][0], yi = pts[a][1], xj = pts[b][0], yj = pts[b][1];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
      }
      return inside;
    };
    // fill a polygon, then draw its inner contour in colour `edge` (optional)
    var poly = function (pts, fill, edge) {
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, m = {};
      pts.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
      for (var y = Math.floor(miny); y <= Math.ceil(maxy); y++) for (var x = Math.floor(minx); x <= Math.ceil(maxx); x++) {
        if (inPoly(pts, x + 0.5, y + 0.5)) { m[x + ',' + y] = 1; }
      }
      Object.keys(m).forEach(function (k) { var s = k.split(','); set(+s[0], +s[1], fill); });
      if (edge) Object.keys(m).forEach(function (k) {
        var s = k.split(','), x = +s[0], y = +s[1];
        if (!m[(x - 1) + ',' + y] || !m[(x + 1) + ',' + y] || !m[x + ',' + (y - 1)] || !m[x + ',' + (y + 1)]) set(x, y, edge);
      });
    };
    var ell = function (cx, cy, rx, ry, fill, edge) {
      var pts = [];
      for (var a = 0; a < 48; a++) { var t = a / 48 * Math.PI * 2; pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); }
      poly(pts, fill, edge);
    };
    return { set: set, rect: rect, poly: poly, ell: ell };
  }

  // opt.tail: 0..2 (tail tip lift), opt.blink, opt.swing: 0/1 (calf sway)
  function buildProc(opt) {
    opt = opt || {};
    var tail = opt.tail || 0, blink = !!opt.blink, swing = opt.swing || 0;
    var g = grid(), P = api(g);
    var D = SEAT;                                   // deck surface row

    /* ---- tail (behind everything), lies along the deck and curls up at the tip ---- */
    var ty = [0, -1, -2][tail];                     // tip lift per frame
    P.poly([[16, D - 8], [6, D - 6 + ty], [1, D - 8 + ty], [0, D - 3], [8, D - 1], [17, D - 1]], 'b', 'i');
    P.poly([[1, D - 8 + ty], [1, D - 17 + ty * 2], [5, D - 12 + ty], [9, D - 19 + ty * 2], [7, D - 8 + ty]], 'F', 'O');   // tail fin lobes (dark)
    P.poly([[2, D - 10 + ty], [4, D - 14 + ty], [6, D - 10 + ty]], 'G');

    /* ---- torso: oversized hoodie, hood bunched behind the neck ---- */
    P.poly([[13, D - 27], [18, D - 32], [30, D - 32], [37, D - 27], [38, D - 14], [36, D - 8], [14, D - 8], [11, D - 15], [11, D - 22]], 'W', 'i');   // body
    P.ell(17, D - 28, 7, 5, 'W', 'i');                                                                                                                  // hood
    P.rect(13, D - 9, 24, 1, 'h');                                                                                                                      // hem
    P.poly([[29, D - 18], [32, D - 20], [36, D - 18], [34, D - 16], [30, D - 16]], 'g');                                                                // shark logo
    P.set(32, D - 21, 'g'); P.set(35, D - 17, 'g');

    /* ---- legs: shorts across the lap, calf + foot dangling over the deck edge ---- */
    P.poly([[15, D - 9], [43, D - 9], [45, D - 1], [15, D - 1]], 'n', 'O');
    var sw = swing;
    P.poly([[39 + sw, D - 1], [45 + sw, D - 1], [46 + sw, D + 10], [39 + sw, D + 10]], 'b', 'i');
    P.poly([[38 + sw, D + 10], [50 + sw, D + 10], [51 + sw, D + 13], [38 + sw, D + 13]], 'd', 'O');                                                   // foot
    P.rect(49 + sw, D + 11, 1, 2, 'B');

    /* ---- neck: thick, grey-blue at the back, pale throat flowing into the chest ---- */
    P.poly([[24, D - 36], [36, D - 36], [38, D - 27], [23, D - 27]], 'b', 'i');
    P.poly([[30, D - 33], [38, D - 31], [36, D - 25], [32, D - 22]], 'w');                                                                             // pale chest V
    P.set(31, D - 24, 'h'); P.set(31, D - 23, 'h'); P.set(31, D - 22, 'h'); P.set(34, D - 24, 'h'); P.set(34, D - 23, 'h'); P.set(34, D - 22, 'h');     // drawstrings

    /* ---- head: one long flat-topped box (skull flows straight into a blunt, square-ended snout) ---- */
    P.poly([[19, D - 40], [20, D - 47], [26, D - 51], [35, D - 50], [41, D - 47], [51, D - 46], [52, D - 44], [52, D - 34], [49, D - 32], [38, D - 31], [30, D - 29], [22, D - 31]], 'b', 'i');
    // pale muzzle: under the eye, along the whole jaw, sweeping down into the throat
    P.poly([[36, D - 42], [52, D - 42], [52, D - 34], [49, D - 32], [38, D - 31], [30, D - 29], [27, D - 31], [31, D - 38]], 'w', 'v');
    // hair: spiky swept-back tufts + a lock hanging by the eye
    P.poly([[21, D - 39], [15, D - 41], [18, D - 44], [13, D - 47], [19, D - 48], [18, D - 52], [25, D - 51], [29, D - 54], [33, D - 51], [40, D - 49], [41, D - 47], [35, D - 46], [34, D - 42], [30, D - 44], [26, D - 41]], 'b', 'i');
    // fin-ears sweep back and up, on top of the hair
    P.poly([[34, D - 49], [19, D - 61], [21, D - 54], [27, D - 45]], 'F', 'O');      // big back fin-ear
    P.poly([[36, D - 50], [39, D - 58], [42, D - 48]], 'F', 'O');                    // small top spike
    P.poly([[21, D - 58], [22, D - 55], [26, D - 49], [25, D - 55]], 'G');           // fin highlight

    /* ---- face ---- */
    if (blink) { P.rect(37, D - 45, 4, 1, 'p'); }
    else { P.rect(37, D - 45, 3, 2, 'y'); P.set(39, D - 45, 'p'); P.set(39, D - 44, 'p'); P.rect(36, D - 46, 5, 1, 'p'); P.set(41, D - 45, 'p'); }    // eye + heavy lid
    P.rect(37, D - 42, 3, 1, 'k');                                                                                                                      // blush
    P.rect(35, D - 37, 13, 1, 'i'); P.set(48, D - 38, 'i'); P.set(49, D - 39, 'i');                                                                     // closed smirk
    P.set(40, D - 36, 't'); P.set(44, D - 36, 't');                                                                                                     // two little teeth
    P.set(50, D - 45, 'i');                                                                                                                             // nostril

    /* ---- near arm: shoulder -> elbow -> forearm resting on the knee, navy-striped sleeve ---- */
    P.poly([[19, D - 29], [27, D - 29], [28, D - 18], [26, D - 11], [18, D - 11], [17, D - 20]], 'W', 'i');                                              // upper arm
    P.poly([[20, D - 14], [34, D - 14], [45, D - 13], [46, D - 8], [34, D - 7], [20, D - 8]], 'W', 'i');                                                  // forearm
    [[32, D - 12], [36, D - 12], [40, D - 12]].forEach(function (s) { P.rect(s[0], s[1], 2, 4, 'S'); });                                                  // sleeve stripes
    P.rect(46, D - 12, 4, 4, 'b'); P.rect(50, D - 11, 1, 3, 'B');                                                                                          // hand over the knee

    /* ---- automatic selective shading + outer outline ---- */
    function shade(from, light, dark) {
      var out = g.map(function (r) { return r.slice(); });
      for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) {
        if (g[y][x] !== from) continue;
        var up = y > 0 ? g[y - 1][x] : '.', dn = y < SH - 1 ? g[y + 1][x] : '.';
        if (light && (up === '.' || up === 'i' || up === 'O')) out[y][x] = light;
        else if (dark && (dn === '.' || dn === 'i' || dn === 'O')) out[y][x] = dark;
      }
      g = out;
    }
    shade('b', 'B', 'd'); shade('W', null, 'h'); shade('h', null, 'H');
    var o = g.map(function (r) { return r.slice(); });
    for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) {
      if (g[y][x] !== '.') continue;
      var n = (x > 0 && g[y][x - 1] !== '.') || (x < SW - 1 && g[y][x + 1] !== '.') || (y > 0 && g[y - 1][x] !== '.') || (y < SH - 1 && g[y + 1][x] !== '.');
      if (n) o[y][x] = 'O';
    }
    return o;
  }

  // If js/shark-art.js (made with editor.html) exists, draw from it; otherwise use the generated sprite above.
  // Frames: base + optional blink / swing / tail. Each extra frame only replaces the pixels that differ from base.
  function fromArt(art, opt) {
    opt = opt || {};
    Object.keys(art.pal || {}).forEach(function (k) { PAL[k] = art.pal[k]; });
    var base = art.base, g = base.map(function (r) { return r.split(''); });
    function diff(f) { if (!f) return; for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) if (f[y][x] !== base[y][x]) g[y][x] = f[y][x]; }
    if (opt.blink) diff(art.blink);
    if (opt.swing) diff(art.swing);
    if (opt.tail) diff(art.tail);
    return g;
  }
  function build(opt) { return root.AspenSpriteArt ? fromArt(root.AspenSpriteArt, opt) : buildProc(opt); }

  // turn a grid into a canvas (works in browsers and in @napi-rs/canvas)
  function toCanvas(g, mk) {
    var c = mk(SW, SH), ctx = c.getContext('2d');
    for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) {
      var k = g[y][x]; if (k === '.') continue;
      ctx.fillStyle = PAL[k] || '#f0f'; ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  var exp = { SW: SW, SH: SH, SEAT: SEAT, PAL: PAL, build: build, buildProc: buildProc, fromArt: fromArt, toCanvas: toCanvas };
  if (typeof module !== 'undefined' && module.exports) module.exports = exp; else root.AspenSprite = exp;
})(typeof window !== 'undefined' ? window : globalThis);
