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
    g: '#5e6b7c', n: '#24345f', N: '#18244a'
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
  function build(opt) {
    opt = opt || {};
    var tail = opt.tail || 0, blink = !!opt.blink, swing = opt.swing || 0;
    var g = grid(), P = api(g);
    var D = SEAT;                                   // deck surface row

    /* ---- tail (behind everything), lies along the deck and curls up at the tip ---- */
    var ty = [0, -1, -2][tail];                     // tip lift per frame
    P.poly([[16, D - 8], [6, D - 6 + ty], [1, D - 8 + ty], [0, D - 3], [8, D - 1], [17, D - 1]], 'b', 'i');
    P.poly([[1, D - 8 + ty], [1, D - 17 + ty * 2], [5, D - 12 + ty], [9, D - 19 + ty * 2], [7, D - 8 + ty]], 'F', 'O');   // tail fin lobes (dark)
    P.poly([[2, D - 10 + ty], [4, D - 14 + ty], [6, D - 10 + ty]], 'G');

    /* ---- hood bunched behind the neck + torso (oversized hoodie, wide shoulders, slight slouch) ---- */
    P.poly([[13, D - 29], [23, D - 32], [34, D - 31], [39, D - 24], [40, D - 9], [36, D - 1], [14, D - 1], [10, D - 11], [10, D - 23]], 'W', 'i');   // body
    P.ell(16, D - 27, 7, 5, 'W', 'i');                                                                                                              // hood
    P.poly([[19, D - 16], [33, D - 14], [34, D - 7], [19, D - 6]], 'h', 'i');                                                                        // kangaroo pocket
    // little shark logo on the belly
    P.poly([[21, D - 22], [26, D - 24], [30, D - 22], [28, D - 20], [23, D - 20]], 'g');
    P.set(26, D - 25, 'g'); P.set(29, D - 21, 'g');

    /* ---- legs: chunky shorts, thigh along the deck, sturdy calf and foot dangling over the edge ---- */
    P.poly([[18, D - 9], [41, D - 9], [44, D - 1], [18, D - 1]], 'n', 'O');
    var sw = swing;                                                                                                                                 // calf sway (0 or 1 px)
    P.poly([[38 + sw, D - 1], [45 + sw, D - 1], [46 + sw, D + 10], [38 + sw, D + 10]], 'b', 'i');
    P.poly([[37 + sw, D + 10], [49 + sw, D + 10], [50 + sw, D + 13], [37 + sw, D + 13]], 'd', 'O');                                                 // foot
    P.rect(48 + sw, D + 11, 1, 2, 'B');

    /* ---- neck + head: big, wide head, short thick neck, blunt snout, heavy jaw ---- */
    P.poly([[25, D - 34], [37, D - 34], [38, D - 28], [25, D - 28]], 'b', 'i');                                                                     // neck
    P.ell(29.5, D - 41, 10.5, 9.5, 'b', 'i');                                                                                                       // skull
    P.poly([[35, D - 48], [45, D - 47], [50, D - 43], [52, D - 37], [49, D - 31], [34, D - 31]], 'b', 'i');                                         // snout
    P.poly([[32, D - 38], [49, D - 38], [51, D - 35], [49, D - 31], [34, D - 30], [29, D - 34]], 'w', 'i');                                         // pale jaw / cheek
    P.rect(50, D - 44, 2, 4, 'F');                                                                                                                  // nose
    // hair swoop across the forehead + strand behind the ear
    P.poly([[19, D - 42], [21, D - 51], [30, D - 54], [39, D - 51], [41, D - 46], [31, D - 47], [24, D - 43]], 'B', 'i');
    P.poly([[19, D - 38], [15, D - 29], [21, D - 31]], 'b', 'i');
    // fin spikes (dark blue) swept back and lower, shorter
    P.poly([[24, D - 47], [10, D - 58], [12, D - 51], [18, D - 41]], 'F', 'O');      // big back fin-ear
    P.poly([[29, D - 51], [28, D - 58], [35, D - 51]], 'F', 'O');                    // small top spike
    P.poly([[12, D - 56], [14, D - 52], [18, D - 45], [16, D - 51]], 'G');           // fin highlight
    /* ---- face ---- */
    if (blink) { P.rect(38, D - 41, 4, 1, 'p'); }
    else { P.rect(38, D - 41, 3, 2, 'y'); P.set(40, D - 41, 'p'); P.set(40, D - 40, 'p'); P.rect(38, D - 42, 5, 1, 'p'); }                          // eye + heavy brow
    P.rect(40, D - 35, 8, 2, 'p'); P.set(48, D - 36, 'p');                                                                                          // grin
    P.set(41, D - 35, 't'); P.set(43, D - 35, 't'); P.set(45, D - 35, 't'); P.set(47, D - 35, 't');                                                 // teeth

    /* ---- arm resting on the knee (sleeve with navy stripes) ---- */
    P.poly([[26, D - 29], [35, D - 28], [40, D - 16], [39, D - 9], [31, D - 9], [26, D - 17]], 'W', 'i');
    [[28, D - 25], [31, D - 21], [32, D - 17], [33, D - 13]].forEach(function (s) { P.rect(s[0], s[1], 5, 2, 'S'); });
    P.rect(36, D - 9, 7, 4, 'b'); P.rect(43, D - 9, 1, 3, 'B');                                                                                      // hand on the knee

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

  // turn a grid into a canvas (works in browsers and in @napi-rs/canvas)
  function toCanvas(g, mk) {
    var c = mk(SW, SH), ctx = c.getContext('2d');
    for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) {
      var k = g[y][x]; if (k === '.') continue;
      ctx.fillStyle = PAL[k] || '#f0f'; ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  var exp = { SW: SW, SH: SH, SEAT: SEAT, PAL: PAL, build: build, toCanvas: toCanvas };
  if (typeof module !== 'undefined' && module.exports) module.exports = exp; else root.AspenSprite = exp;
})(typeof window !== 'undefined' ? window : globalThis);
