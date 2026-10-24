/* Visual elements for header-studio.html.
   An element is a ready-made piece of the header (sun, clouds, palm tree...) with a list of settings.
   The studio shows the settings as sliders and colour pickers, and draws drag handles on the canvas.
   Under the hood each element is still an ordinary code layer: gen() turns the settings into the
   JavaScript body of function (ctx, t, api), so the player (header-player.js) needs nothing new.
   The scene object holds the shared layout (horizon, deck, shore, sun position) that many elements use. */
(function (root) {
  'use strict';

  var HEX = /^#[0-9a-fA-F]{6}$/;
  function num(v, d, lo, hi) { v = +v; if (!isFinite(v)) v = d; if (lo != null && v < lo) v = lo; if (hi != null && v > hi) v = hi; return Math.round(v * 1000) / 1000; }
  function colour(v, d) { return typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : d; }
  function colours(v, d) { if (!Array.isArray(v) || !v.length) return d.slice(); return v.slice(0, 40).map(function (c) { return colour(c, '#ff00ff'); }); }
  function f(n) { return String(Math.round(n * 100000) / 100000); }
  function J(a) { return JSON.stringify(a); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- scene layout shared by elements ---------- */
  var SCENE_SCHEMA = [
    { k: 'horizon', l: 'Horizon line (y)', min: 8, max: 600, y: 1 },
    { k: 'seaBottom', l: 'Sea bottom (y)', min: 10, max: 600, y: 1 },
    { k: 'deckTop', l: 'Deck top (y)', min: 20, max: 600, y: 1 },
    { k: 'deckEnd', l: 'Deck length (% of width)', min: 10, max: 90 },
    { k: 'shoreStart', l: 'Shore slope starts (% of width)', min: 5, max: 90 },
    { k: 'shoreY', l: 'Shore height at left (y)', min: 20, max: 600, y: 1 },
    { k: 'shoreRise', l: 'Shore rises toward right (px)', min: -100, max: 300 },
    { k: 'sunX', l: 'Sun position (% of width)', min: 0, max: 100 }
  ];
  var SCENE_DEF = { horizon: 70, seaBottom: 134, deckTop: 118, deckEnd: 43, shoreStart: 30, shoreY: 130, shoreRise: 30, sunX: 70 };
  function defaultScene() { return JSON.parse(JSON.stringify(SCENE_DEF)); }
  function cleanScene(s) {
    var o = {}; s = (s && typeof s === 'object') ? s : {};
    SCENE_SCHEMA.forEach(function (q) { o[q.k] = num(s[q.k], SCENE_DEF[q.k], q.min, q.max); });
    return o;
  }
  function shoreYat(s, W, x) {
    var st = Math.round(W * s.shoreStart / 100); if (x <= st) return s.shoreY;
    var k = (x - st) / (W - st); return Math.round(s.shoreY - s.shoreRise * Math.pow(k, 1.25));
  }
  /* the variables an element's code can rely on; 'uses' picks which ones to declare */
  function pre(s, uses) {
    var o = 'var W=api.w,H=api.h,hash=api.hash,px=api.px,rect=api.rect,disc=api.disc,halo=api.halo;\n';
    if (uses.indexOf('h') >= 0) o += 'var HORIZON=' + s.horizon + ';\n';
    if (uses.indexOf('b') >= 0) o += 'var SEA_BOTTOM=' + s.seaBottom + ';\n';
    if (uses.indexOf('k') >= 0) o += 'var DECK_TOP=' + s.deckTop + ';\n';
    if (uses.indexOf('e') >= 0) o += 'var deckEnd=Math.round(W*' + f(s.deckEnd / 100) + ');\n';
    if (uses.indexOf('s') >= 0) o += 'var shoreStart=Math.round(W*' + f(s.shoreStart / 100) + ');\nfunction shoreY(x){if(x<=shoreStart)return ' + s.shoreY + ';var k=(x-shoreStart)/(W-shoreStart);return Math.round(' + s.shoreY + '-' + s.shoreRise + '*Math.pow(k,1.25));}\n';
    if (uses.indexOf('x') >= 0) o += 'var sunX=Math.round(W*' + f(s.sunX / 100) + ');\n';
    return o;
  }

  /* ---------- schema helpers ---------- */
  function Nn(k, l, d, min, max, step) { return { k: k, l: l, t: 'n', d: d, min: min, max: max, step: step || 1 }; }
  function Cc(k, l, d) { return { k: k, l: l, t: 'c', d: d }; }
  function CS(k, l, d) { return { k: k, l: l, t: 'cs', d: d }; }
  function Bb(k, l, d) { return { k: k, l: l, t: 'b', d: d }; }
  function Ss(k, l, d, o) { return { k: k, l: l, t: 's', d: d, o: o }; }
  function Hh(h) { return { h: h }; }

  var SKY = ['#251f4d', '#30275a', '#3f2f68', '#573a76', '#734480', '#914d86', '#b15888', '#cd6588', '#e27a86', '#ee9380', '#f7ae7c', '#fcc884', '#ffe0a0'];
  var SEA = ['#f7b57c', '#e58f83', '#c06f87', '#8f5a88', '#615185', '#44497f', '#35447a', '#2c3b70'];

  var T = {}, ORDER = [];
  function def(id, o) { o.id = id; T[id] = o; ORDER.push(id); }

  /* ---------- the elements ---------- */
  def('sky', {
    label: 'Sky', uses: 'h',
    params: [CS('cols', 'Colours, top to horizon', SKY), Bb('dither', 'Checker dither between bands', true)],
    handles: function () { return []; },
    gen: function (p) {
      return 'var S=api.S;\nif(!S.c){\nvar SKY=' + J(p.cols) + ',DITHER=' + p.dither + ';\nvar c=api.mk(W,Math.max(1,HORIZON)),b=c.getContext(\'2d\');\n' +
        'for(var y=0;y<HORIZON;y++){for(var x=0;x<W;x++){var t0=y/HORIZON*SKY.length,bi=Math.min(SKY.length-1,Math.floor(t0)),fr=t0-bi,col=SKY[bi];if(DITHER&&bi<SKY.length-1&&((fr>0.7&&(x+y)%2===0)||(fr>0.88&&(x+y)%2===1)))col=SKY[bi+1];px(b,x,y,col);}}\n' +
        'S.c=c;}\nctx.drawImage(S.c,0,0);';
    }
  });

  def('sea', {
    label: 'Sea', uses: 'hb',
    params: [CS('cols', 'Colours, horizon to shore', SEA), Bb('dither', 'Checker dither between bands', true), Bb('line', 'Bright line on the horizon', true), Cc('lc', 'Horizon line colour', '#ffe7ae')],
    handles: function () { return []; },
    gen: function (p) {
      return 'var S=api.S;\nif(!S.c){\nvar SEA=' + J(p.cols) + ',DITHER=' + p.dither + ';\nvar hh=Math.max(1,SEA_BOTTOM-HORIZON),c=api.mk(W,hh),b=c.getContext(\'2d\');\n' +
        'for(var y=HORIZON;y<SEA_BOTTOM;y++){for(var x=0;x<W;x++){var u=(y-HORIZON)/hh*SEA.length,si=Math.min(SEA.length-1,Math.floor(u)),f2=u-si,sc=SEA[si];if(DITHER&&si<SEA.length-1&&((f2>0.7&&(x+y)%2===0)||(f2>0.88&&(x+y)%2===1)))sc=SEA[si+1];px(b,x,y-HORIZON,sc);}}\n' +
        (p.line ? 'rect(b,0,0,W,1,\'' + p.lc + '\');\n' : '') + 'S.c=c;}\nctx.drawImage(S.c,0,HORIZON);';
    }
  });

  def('stars', {
    label: 'Stars', uses: '',
    params: [Nn('per', 'Spacing (px per star)', 14, 4, 60), Nn('maxY', 'Sky height they fill (y)', 22, 4, 140), Nn('speed', 'Twinkle speed', 1.3, 0.2, 4, 0.1), Cc('c1', 'Bright', '#fff6d6'), Cc('c2', 'Dim', '#cdb9e8')],
    handles: function (p, s, c) { return [{ id: 'y', x: c.W * 0.5, y: p.maxY, l: 'stars height' }]; },
    drag: function (p, s, id, x, y) { p.maxY = clamp(Math.round(y), 4, 140); },
    gen: function (p) {
      return 'var S=api.S;\nif(!S.s){S.s=[];for(var i=0;i<Math.round(W/' + p.per + ');i++)S.s.push({x:Math.floor(hash(i,1,7)*W),y:Math.floor(hash(i,2,7)*' + p.maxY + '),p:hash(i,3,7)*6.28});}\n' +
        'S.s.forEach(function(s){var v=Math.sin(t*' + p.speed + '+s.p);if(v>-0.2)px(ctx,s.x,s.y,v>0.7?\'' + p.c1 + '\':\'' + p.c2 + '\');});';
    }
  });

  def('sun', {
    label: 'Sun', uses: 'hx',
    params: [Nn('r', 'Size (radius)', 13, 2, 50), Nn('dy', 'Height (px below the horizon)', 2, -80, 30), Nn('glow', 'Glow size', 1, 0, 2, 0.05), Bb('pulse', 'Glow pulses', true),
      Hh('Colours'), Cc('c1', 'Rim', '#ffd36e'), Cc('c2', 'Body', '#ffe596'), Cc('c3', 'Core', '#fff6cc'), Cc('h1', 'Outer glow', '#f9b88a'), Cc('h2', 'Middle glow', '#fde0a4'), Cc('h3', 'Inner glow', '#fff0c0')],
    handles: function (p, s, c) { return [{ id: 'c', x: Math.round(c.W * s.sunX / 100), y: s.horizon + p.dy, l: 'sun' }]; },
    drag: function (p, s, id, x, y, c) { s.sunX = clamp(Math.round(x / c.W * 100), 0, 100); p.dy = clamp(Math.round(y) - s.horizon, -80, 30); },
    gen: function (p) {
      return 'var sunY=HORIZON+' + p.dy + ',sunR=' + p.r + ',pulse=' + (p.pulse ? 'Math.floor(t*1.2)%2' : '0') + ',G=' + p.glow + ';\n' +
        'halo(ctx,sunX,sunY,Math.round(40*G)+pulse,\'' + p.h1 + '\',0,HORIZON);halo(ctx,sunX,sunY,Math.round(28*G)+pulse,\'' + p.h2 + '\',1,HORIZON);halo(ctx,sunX,sunY,Math.round(19*G),\'' + p.h3 + '\',0,HORIZON);\n' +
        'disc(ctx,sunX,sunY,sunR,\'' + p.c1 + '\',HORIZON+1);disc(ctx,sunX,sunY,Math.max(1,sunR-2),\'' + p.c2 + '\',HORIZON+1);disc(ctx,sunX,sunY,Math.max(1,sunR-5),\'' + p.c3 + '\',HORIZON+1);';
    }
  });

  var CLOUD_SIZES = [[0, 'Small'], [1, 'Medium'], [2, 'Large']];
  function cloudBox(p) { return { w: 46 + (+p.shape) * 14, h: 16 + (+p.shape) * 3 }; }
  function cloudX(p, c) { var b = cloudBox(p), span = c.W + b.w + 20; return ((c.W * p.x / 100 - c.T * p.speed) % span + span) % span - b.w; }
  def('cloud', {
    label: 'Cloud', uses: '',
    params: [Ss('shape', 'Size', '0', CLOUD_SIZES), Nn('x', 'Start position (% of width)', 15, -20, 140), Nn('y', 'Height (y)', 16, -10, 140), Nn('speed', 'Drift speed (px/s)', 1.1, -8, 8, 0.1),
      Hh('Colours'), Cc('c1', 'Top', '#ffd7a0'), Cc('c2', 'Middle', '#f4a086'), Cc('c3', 'Underside', '#b8648a'), Cc('cd', 'Underside dither', '#d9788a')],
    handles: function (p, s, c) { var b = cloudBox(p); return [{ id: 'c', x: cloudX(p, c) + b.w / 2, y: p.y + b.h / 2, l: 'cloud' }]; },
    drag: function (p, s, id, x, y, c) {
      var b = cloudBox(p), span = c.W + b.w + 20, st = ((x - b.w / 2 + b.w + c.T * p.speed) % span + span) % span;
      p.x = Math.round(st / c.W * 1000) / 10; p.y = clamp(Math.round(y - b.h / 2), -10, 140);
    },
    gen: function (p) {
      return 'var S=api.S;\nif(!S.cs){var n=' + p.shape + ',w=46+n*14,h=16+n*3,cv=api.mk(w,h),c=cv.getContext(\'2d\');var lumps=[[0.22,0.62,0.2,0.28],[0.42,0.45,0.26,0.38],[0.64,0.55,0.22,0.32],[0.82,0.68,0.16,0.22]];\n' +
        'for(var yy=0;yy<h;yy++)for(var xx=0;xx<w;xx++){var inside=lumps.some(function(l){var dx=(xx/w-l[0])/l[2],dy=(yy/h-l[1])/l[3];return dx*dx+dy*dy<=1;})&&yy>h*0.2;if(!inside)continue;var rel=yy/h,col=\'' + p.c1 + '\';if(rel>=0.42)col=\'' + p.c2 + '\';if(rel>=0.68)col=((xx+yy)%2===0)?\'' + p.cd + '\':\'' + p.c3 + '\';c.fillStyle=col;c.fillRect(xx,yy,1,1);}\nS.cs=cv;}\n' +
        'var cs=S.cs,span=W+cs.width+20,cx=((W*' + f(p.x / 100) + '-t*' + p.speed + ')%span+span)%span-cs.width;\nctx.drawImage(cs,Math.round(cx),' + p.y + ');';
    }
  });

  def('beach', {
    label: 'Beach', uses: 's',
    params: [Hh('Sand colours'), Cc('wet', 'Wet edge', '#7d5a45'), Cc('dune', 'Dune edge', '#a8744f'), Cc('s1', 'Sand, darkest', '#d49a63'), Cc('s2', 'Sand, middle', '#e2b27a'), Cc('s3', 'Sand, lightest', '#e8c98a'), Cc('speck', 'Sparkle specks', '#f3d9a3'),
      Hh('Extras'), Bb('drift', 'Driftwood', true), Nn('dx', 'Driftwood x (% of width)', 80, 0, 100), Nn('dyy', 'Driftwood y', 126, 40, 600), Bb('shell', 'Shell', true), Nn('sx', 'Shell x (% of width)', 62, 0, 100), Nn('sy', 'Shell y', 131, 40, 600)],
    handles: function (p, s, c) {
      var h = []; if (p.drift) h.push({ id: 'd', x: Math.round(c.W * p.dx / 100) + 3, y: p.dyy, l: 'driftwood' });
      if (p.shell) h.push({ id: 's', x: Math.round(c.W * p.sx / 100), y: p.sy, l: 'shell' }); return h;
    },
    drag: function (p, s, id, x, y, c) {
      if (id === 'd') { p.dx = clamp(Math.round((x - 3) / c.W * 1000) / 10, 0, 100); p.dyy = clamp(Math.round(y), 40, 600); }
      else { p.sx = clamp(Math.round(x / c.W * 1000) / 10, 0, 100); p.sy = clamp(Math.round(y), 40, 600); }
    },
    gen: function (p) {
      return 'var S=api.S;\nif(!S.c){var c=api.mk(W,H),b=c.getContext(\'2d\');\n' +
        'for(var x=0;x<W;x++){var sy=shoreY(x);for(var y=sy;y<H;y++){var d=y-sy,c2;if(d<2)c2=\'' + p.wet + '\';else if(d<5)c2=\'' + p.dune + '\';else{var m=Math.min(1,(d-5)/28);c2=m<0.34?\'' + p.s1 + '\':m<0.7?\'' + p.s2 + '\':\'' + p.s3 + '\';if(((x*7+y*13)%29)===0)c2=\'' + p.speck + '\';}px(b,x,y,c2);}}\n' +
        (p.drift ? 'rect(b,Math.round(W*' + f(p.dx / 100) + '),' + p.dyy + ',7,2,\'' + p.wet + '\');rect(b,Math.round(W*' + f(p.dx / 100) + ')+1,' + (p.dyy - 1) + ',3,1,\'' + p.dune + '\');\n' : '') +
        (p.shell ? 'px(b,Math.round(W*' + f(p.sx / 100) + '),' + p.sy + ',\'#fff1d0\');px(b,Math.round(W*' + f(p.sx / 100) + ')+1,' + p.sy + ',\'#f0c8b0\');\n' : '') +
        'S.c=c;}\nctx.drawImage(S.c,0,0);';
    }
  });

  def('deck', {
    label: 'Deck', uses: 'ke',
    params: [Hh('Wood colours'), Cc('w1', 'Wood', '#5a3a29'), Cc('w2', 'Shadow wood', '#3d2619'), Cc('w3', 'Darkest wood', '#26160d'), Cc('cu', 'Copper edge', '#985b3a'), Cc('am', 'Highlight', '#c58a4a'), Cc('pl', 'Plank line', '#7a4a32'),
      Hh('Parts'), Bb('posts', 'Support posts', true), Bb('rail', 'Railing', true), Nn('gap', 'Railing stops this far from the end (px)', 40, 0, 200)],
    handles: function () { return []; },
    gen: function (p) {
      return 'var S=api.S;\nif(!S.c){var c=api.mk(W,H),b=c.getContext(\'2d\'),x;\n' +
        'var WALNUT=\'' + p.w1 + '\',WALNUT_D=\'' + p.w2 + '\',WALNUT_DD=\'' + p.w3 + '\',COPPER=\'' + p.cu + '\',AMBER=\'' + p.am + '\',PLANK=\'' + p.pl + '\';\n' +
        (p.posts ? 'var postXs=[10,Math.round(deckEnd*0.45),deckEnd-9];\npostXs.forEach(function(pxX){rect(b,pxX,DECK_TOP+14,5,22,WALNUT_D);rect(b,pxX,DECK_TOP+14,1,22,WALNUT);rect(b,pxX+4,DECK_TOP+14,1,22,WALNUT_DD);});\n' : '') +
        'rect(b,0,DECK_TOP+4,deckEnd,10,WALNUT);rect(b,0,DECK_TOP+4,deckEnd,1,COPPER);rect(b,0,DECK_TOP+13,deckEnd,1,WALNUT_DD);\n' +
        'for(x=14;x<deckEnd;x+=22)rect(b,x,DECK_TOP+5,1,8,WALNUT_D);\n' +
        'for(x=0;x<deckEnd;x++)if(hash(x,3,9)>0.86)px(b,x,DECK_TOP+5+Math.floor(hash(x,5,2)*7),WALNUT_D);\n' +
        'rect(b,0,DECK_TOP,deckEnd,4,COPPER);rect(b,0,DECK_TOP,deckEnd,1,AMBER);rect(b,0,DECK_TOP+2,deckEnd,1,PLANK);\n' +
        'for(x=9;x<deckEnd;x+=26)rect(b,x,DECK_TOP+1,1,3,WALNUT_D);\n' +
        'rect(b,deckEnd-1,DECK_TOP,1,14,AMBER);\n' +
        (p.rail ? 'var railEnd=Math.max(24,deckEnd-' + p.gap + ');\nfor(x=4;x<railEnd;x+=20){rect(b,x,DECK_TOP-17,3,17,WALNUT);rect(b,x,DECK_TOP-17,1,17,COPPER);}\n' +
          'rect(b,0,DECK_TOP-18,railEnd+2,3,COPPER);rect(b,0,DECK_TOP-18,railEnd+2,1,AMBER);rect(b,0,DECK_TOP-16,railEnd+2,1,WALNUT_D);\n' +
          'rect(b,0,DECK_TOP-9,railEnd+2,2,WALNUT);rect(b,0,DECK_TOP-9,railEnd+2,1,COPPER);\n' : '') +
        'S.c=c;}\nctx.drawImage(S.c,0,0);';
    }
  });

  def('glitter', {
    label: 'Sun glitter', uses: 'hxeks',
    params: [Nn('bottom', 'Reaches down to (y)', 124, 80, 300), Nn('spread', 'Width', 1, 0.2, 3, 0.05), Nn('amount', 'Amount', 1, 0, 2, 0.05), Nn('speed', 'Sparkle speed', 5, 1, 20), Bb('clip', 'Keep on the water', true),
      Hh('Colours'), Cc('c1', 'Near the sun', '#fff0b8'), Cc('c2', 'Middle', '#ffd88c'), Cc('c3', 'Far', '#f2a888')],
    handles: function (p, s, c) { return [{ id: 'b', x: Math.round(c.W * s.sunX / 100), y: p.bottom, l: 'glitter end' }]; },
    drag: function (p, s, id, x, y) { p.bottom = clamp(Math.round(y), 80, 300); },
    gen: function (p) {
      return 'var tick=Math.floor(t*' + p.speed + ');\nfunction wy(x){return x<deckEnd?DECK_TOP:shoreY(x);}\n' +
        'for(var y=HORIZON+1;y<' + p.bottom + ';y+=2){var dist=y-HORIZON,half=(4+dist*0.55)*' + p.spread + ';for(var x=Math.floor(sunX-half);x<=sunX+half;x++){var r=hash(x,y,tick+Math.floor(y/2)*3);if(r>' + f(0.8 + (1 - p.amount) * 0.2) + '-Math.max(0,0.18-dist*0.002)){var len=1+Math.floor(hash(x,y,77)*3);ctx.fillStyle=dist<12?\'' + p.c1 + '\':dist<28?\'' + p.c2 + '\':\'' + p.c3 + '\';' +
        'for(var q=0;q<len;q++){' + (p.clip ? 'if(y<wy(x+q))' : '') + 'ctx.fillRect(x+q,y,1,1);}}}}';
    }
  });

  def('swell', {
    label: 'Swell lines', uses: 'heks',
    params: [Nn('gap', 'Spacing between lines (px)', 7, 3, 30), Nn('bottom', 'Reaches down to (y)', 120, 80, 300), Nn('near', 'Near-water colour starts at (y)', 100, 60, 300), Nn('thr', 'Line density (higher = fewer)', 1.55, 0.5, 1.95, 0.05), Nn('speed', 'Speed', 1, 0, 4, 0.1), Bb('clip', 'Keep on the water', true),
      Hh('Colours'), Cc('c1', 'Far water', '#c98898'), Cc('c2', 'Near water', '#5a5f94')],
    handles: function (p, s, c) { return [{ id: 'b', x: Math.round(c.W * 0.5), y: p.bottom, l: 'swell end' }]; },
    drag: function (p, s, id, x, y) { p.bottom = clamp(Math.round(y), 80, 300); },
    gen: function (p) {
      return 'function wy(x){return x<deckEnd?DECK_TOP:shoreY(x);}\n' +
        'for(var y=HORIZON+6;y<' + p.bottom + ';y+=' + p.gap + '){for(var x=0;x<W;x++){var wv=Math.sin(x*0.18+t*' + p.speed + '*0.9+y)+Math.sin(x*0.07-t*' + p.speed + '*0.5);if(wv>' + p.thr + '&&((x+y)&1)===0&&(y>' + p.near + '||x%3===0)' + (p.clip ? '&&y<wy(x)' : '') + ')px(ctx,x,y,y<' + p.near + '?\'' + p.c1 + '\':\'' + p.c2 + '\');}}';
    }
  });

  def('lantern', {
    label: 'Lantern', uses: 'k',
    params: [Nn('x', 'Position (x)', 25, 0, 600), Nn('dy', 'Height above the deck', 27, 8, 80), Bb('glow', 'Glow', true), Bb('flicker', 'Flicker', true), Hh('Colours'), Cc('post', 'Frame', '#3d2619'), Cc('lamp', 'Lamp', '#f4c768'), Cc('core', 'Flame', '#fff2c0')],
    handles: function (p, s) { return [{ id: 'c', x: p.x, y: s.deckTop - p.dy - 2, l: 'lantern' }]; },
    drag: function (p, s, id, x, y) { p.x = clamp(Math.round(x), 0, 600); p.dy = clamp(Math.round(s.deckTop - y - 2), 8, 80); },
    gen: function (p) {
      var d = p.dy;
      return 'var lx=' + p.x + ',post=\'' + p.post + '\',lamp=\'' + p.lamp + '\';\n' +
        'rect(ctx,lx,DECK_TOP-' + d + ',1,9,post);rect(ctx,lx-3,DECK_TOP-' + (d + 5) + ',7,1,post);rect(ctx,lx-3,DECK_TOP-' + (d - 1) + ',7,1,post);\n' +
        'rect(ctx,lx-2,DECK_TOP-' + (d + 4) + ',5,5,lamp);rect(ctx,lx,DECK_TOP-' + (d + 3) + ',1,3,\'' + p.core + '\');\n' +
        'rect(ctx,lx-3,DECK_TOP-' + (d + 4) + ',1,5,post);rect(ctx,lx+3,DECK_TOP-' + (d + 4) + ',1,5,post);\n' +
        (p.glow ? 'var fl=' + (p.flicker ? 'Math.floor(t*6)%3' : '1') + ';\nhalo(ctx,lx,DECK_TOP-' + (d + 2) + ',9+(fl===0?1:0),lamp,0,DECK_TOP-8);' : '');
    }
  });

  def('foam', {
    label: 'Shore foam', uses: 'es',
    params: [Nn('amount', 'Amount', 1, 0, 1.28, 0.02), Nn('swing', 'Wave swing', 1, 0, 3, 0.1), Nn('speed', 'Sparkle speed', 5, 1, 20), Hh('Colours'), Cc('c1', 'Foam', '#fff3dd'), Cc('c2', 'Foam highlight', '#ffe9c4'), Cc('edge', 'Wet line', '#7d5a45')],
    handles: function () { return []; },
    gen: function (p) {
      return 'var tick=Math.floor(t*' + p.speed + ');\n' +
        'for(var x=deckEnd+1;x<W;x++){var sy=shoreY(x),off=Math.round((Math.sin(t*0.9+x*0.07)*1.6+Math.sin(t*0.5+x*0.2)*0.8)*' + p.swing + ');if(hash(x,4,5)>' + f(1 - 0.78 * p.amount) + ')px(ctx,x,sy-1+off,\'' + p.c1 + '\');if(hash(x,tick,11)>' + f(1 - 0.3 * p.amount) + ')px(ctx,x,sy-2+off,\'' + p.c2 + '\');px(ctx,x,sy+1,\'' + p.edge + '\');}';
    }
  });

  function gullPos(p, c, i) { return { x: ((c.T * (3 + i) * 2.2 * p.speed + i * c.W * 0.37) % (c.W + 30)) - 15, y: p.y + i * p.gap + Math.sin(c.T * 0.9 + i * 2) * 3 }; }
  def('gulls', {
    label: 'Gulls', uses: '',
    params: [Nn('count', 'How many', 3, 0, 10), Nn('y', 'Height (y)', 22, 0, 140), Nn('gap', 'Vertical spacing', 9, 0, 40), Nn('speed', 'Speed', 1, 0, 4, 0.1), Cc('c', 'Colour', '#2a1f45')],
    handles: function (p, s, c) { if (!p.count) return []; var g = gullPos(p, c, 0); return [{ id: 'y', x: g.x + 3, y: g.y, l: 'gulls' }]; },
    drag: function (p, s, id, x, y, c) { p.y = clamp(Math.round(y - Math.sin(c.T * 0.9) * 3), 0, 140); },
    gen: function (p) {
      return 'ctx.fillStyle=\'' + p.c + '\';\nfor(var i=0;i<' + p.count + ';i++){var gx=((t*(3+i)*2.2*' + p.speed + '+i*W*0.37)%(W+30))-15,gy=' + p.y + '+i*' + p.gap + '+Math.sin(t*0.9+i*2)*3,up=Math.floor(t*2.5+i)%2===0;\n' +
        'if(up){ctx.fillRect(gx,gy,3,1);ctx.fillRect(gx+3,gy+1,1,1);ctx.fillRect(gx+4,gy,3,1);ctx.fillRect(gx-1,gy-1,1,1);ctx.fillRect(gx+7,gy-1,1,1);}\n' +
        'else{ctx.fillRect(gx,gy+1,3,1);ctx.fillRect(gx+3,gy,1,1);ctx.fillRect(gx+4,gy+1,3,1);ctx.fillRect(gx-1,gy+2,1,1);ctx.fillRect(gx+7,gy+2,1,1);}}';
    }
  });

  def('palm', {
    label: 'Palm tree', uses: 's',
    params: [Nn('x', 'Trunk position (% of width)', 90, 0, 100, 0.5), Nn('base', 'Base sinks below the shore (px)', 14, -20, 60), Nn('top', 'Crown height (y)', 74, 10, 200), Nn('lean', 'Lean (px toward the left)', 8, -30, 40), Nn('size', 'Frond length', 1, 0.4, 2.5, 0.05), Nn('sway', 'Sway', 1.2, 0, 5, 0.1),
      Hh('Colours'), Cc('trunk', 'Trunk', '#26362a'), Cc('trunkHi', 'Trunk bands', '#3a4a3a'), Cc('accent', 'Trunk edge and coconuts', '#c58a4a'), Cc('frond', 'Fronds', '#29402e'), Cc('frondHi', 'Frond highlights', '#3f5743')],
    handles: function (p, s, c) {
      var px = Math.round(c.W * p.x / 100);
      return [{ id: 'base', x: px, y: shoreYat(s, c.W, px) + p.base, l: 'trunk base' }, { id: 'top', x: px - p.lean, y: p.top, l: 'crown' }];
    },
    drag: function (p, s, id, x, y, c) {
      var px = Math.round(c.W * p.x / 100);
      if (id === 'base') { p.x = clamp(Math.round(x / c.W * 200) / 2, 0, 100); var nx = Math.round(c.W * p.x / 100); p.base = clamp(Math.round(y) - shoreYat(s, c.W, nx), -20, 60); }
      else { p.top = clamp(Math.round(y), 10, 200); p.lean = clamp(Math.round(px - x), -30, 40); }
    },
    gen: function (p) {
      return 'function frond(c,x0,y0,an,len,droop,sway,col,hi){for(var s=0;s<=len;s++){var fx=x0+Math.cos(an)*s+sway*(s/len),fy=y0+Math.sin(an)*s+droop*s*s/len;c.fillStyle=col;c.fillRect(Math.round(fx),Math.round(fy),1,2);if(s>2){var side=(s%2===0)?1:-1,ll=2+(s>len*0.45?1:0)+(s%3===0?1:0);c.fillRect(Math.round(fx),Math.round(fy)+2,1,ll);c.fillRect(Math.round(fx)+side,Math.round(fy)+1,1,ll);}if(hi&&s%3===0){c.fillStyle=hi;c.fillRect(Math.round(fx),Math.round(fy)-1,1,1);}}}\n' +
        'var palmX=Math.round(W*' + f(p.x / 100) + '),palmBase=shoreY(palmX)+' + p.base + ',topY=' + p.top + ',LEAN=' + p.lean + ',topX=palmX-LEAN;\n' +
        'for(var y=palmBase;y>topY;y--){var k=(palmBase-y)/(palmBase-topY),tx=Math.round(palmX-LEAN*k*k-1*k);ctx.fillStyle=\'' + p.trunk + '\';ctx.fillRect(tx,y,k<0.5?4:3,1);if(y%5===0){ctx.fillStyle=\'' + p.trunkHi + '\';ctx.fillRect(tx,y,2,1);}ctx.fillStyle=\'' + p.accent + '\';ctx.fillRect(tx-1,y,1,1);}\n' +
        'var sw=Math.sin(t*1.1)*' + p.sway + ';\n' +
        '[[-3.0,8,0.11],[-2.5,17,0.07],[-1.95,20,0.05],[-1.35,19,0.06],[-0.8,17,0.1],[-0.35,12,0.14],[-3.4,12,0.14]].forEach(function(f,n){frond(ctx,topX,topY,f[0],Math.round(f[1]*' + p.size + '),f[2]*6,sw*(n%2?1:-1),\'' + p.frond + '\',\'' + p.frondHi + '\');});\n' +
        'ctx.fillStyle=\'' + p.accent + '\';ctx.fillRect(topX-12,topY+2,1,1);ctx.fillRect(topX-14,topY+5,1,1);';
    }
  });

  function aspenBox(p, s, c) {
    var Sp = c.sprite, k = Sp ? Sp.SCALE : 1, w = Sp ? Sp.outW : 40, h = Sp ? Sp.outH : 60, seat = Sp ? Sp.outSeat : 40;
    var de = Math.round(c.W * s.deckEnd / 100);
    return { x: de - Math.round(p.from * k) + p.dx, y: s.deckTop - seat + p.dy, w: w, h: h, x0: de - Math.round(p.from * k), y0: s.deckTop - seat };
  }
  def('aspen', {
    label: 'Aspen (shark)', uses: 'ek',
    params: [Nn('from', 'Distance from the deck end', 41, 0, 200), Nn('dx', 'Nudge left/right (px)', 0, -100, 100), Nn('dy', 'Nudge up/down (px)', 0, -100, 100)],
    handles: function (p, s, c) { var b = aspenBox(p, s, c); return [{ id: 'c', x: b.x + b.w / 2, y: b.y + b.h * 0.45, l: 'Aspen' }]; },
    drag: function (p, s, id, x, y, c) { var b = aspenBox(p, s, c); p.dx = clamp(Math.round(x - b.w / 2 - b.x0), -100, 100); p.dy = clamp(Math.round(y - b.h * 0.45 - b.y0), -100, 100); },
    gen: function (p) {
      return 'var Sp=api.Sprite;if(!Sp)return;\nvar S=api.S;S.f=S.f||{};\nvar wagging=t<api.wagUntil;\n' +
        'var tail=wagging?[0,2,1,2][Math.floor(t*8)%4]:[0,1,2,1][Math.floor(t*1.2)%4];\nvar blink=(t%4.6)>4.42||(wagging&&(t%0.6)>0.5);\nvar swing=Math.floor(t*0.9)%2;\n' +
        'var key=tail+\'\'+(blink?1:0)+swing;\nif(!S.f[key])S.f[key]=Sp.toCanvas(Sp.build({tail:tail,blink:blink,swing:swing}),api.mk);\n' +
        'ctx.drawImage(S.f[key],deckEnd-Math.round(' + p.from + '*Sp.SCALE)+' + p.dx + ',DECK_TOP-Sp.outSeat+' + p.dy + ');';
    }
  });

  def('mug', {
    label: 'Mug and steam', uses: 'ek',
    params: [Nn('from', 'Distance from the deck end', 41, 0, 200), Nn('dx', 'Nudge left/right (px)', -3, -100, 100), Nn('dy', 'Nudge up/down (px)', 0, -100, 100), Bb('steam', 'Steam', true), Hh('Colours'), Cc('c1', 'Mug', '#c58a4a'), Cc('c2', 'Rim', '#e8c98a'), Cc('c3', 'Base', '#985b3a')],
    handles: function (p, s, c) {
      var Sp = c.sprite, k = Sp ? Sp.SCALE : 1, mx = Math.round(c.W * s.deckEnd / 100) - Math.round(p.from * k) + p.dx;
      return [{ id: 'c', x: mx + 2.5, y: s.deckTop - 2.5 + p.dy, l: 'mug' }];
    },
    drag: function (p, s, id, x, y, c) {
      var Sp = c.sprite, k = Sp ? Sp.SCALE : 1, x0 = Math.round(c.W * s.deckEnd / 100) - Math.round(p.from * k);
      p.dx = clamp(Math.round(x - 2.5 - x0), -100, 100); p.dy = clamp(Math.round(y + 2.5 - s.deckTop), -100, 100);
    },
    gen: function (p) {
      return 'var Sp=api.Sprite,k=Sp?Sp.SCALE:1,mx=deckEnd-Math.round(' + p.from + '*k)+' + p.dx + ',DY=' + p.dy + ';\n' +
        'rect(ctx,mx,DECK_TOP-5+DY,5,5,\'' + p.c1 + '\');rect(ctx,mx,DECK_TOP-5+DY,5,1,\'' + p.c2 + '\');rect(ctx,mx+5,DECK_TOP-4+DY,1,3,\'' + p.c1 + '\');rect(ctx,mx,DECK_TOP-1+DY,5,1,\'' + p.c3 + '\');\n' +
        (p.steam ? 'for(var i=0;i<3;i++){var ph=((t*0.8+i*0.33)%1),sx=mx+2+Math.round(Math.sin(t*2+i*2)*1.2);ctx.fillStyle=\'rgba(255,240,208,\'+(0.8-ph*0.8).toFixed(2)+\')\';ctx.fillRect(sx,DECK_TOP-7+DY-Math.round(ph*9),1,2);}' : '');
    }
  });

  def('grass', {
    label: 'Dune grass', uses: '',
    params: [Nn('base', 'Ground line (y)', 146, 20, 600), Nn('dens', 'Density (% of columns)', 58, 5, 100), Nn('tall', 'Height', 1, 0.3, 3, 0.05), Nn('sway', 'Sway speed', 1.4, 0, 5, 0.1), Bb('fill', 'Solid strip under the grass', true),
      Hh('Colours'), Cc('c1', 'Grass', '#29402e'), Cc('c2', 'Tall grass', '#3f5743'), Cc('tip', 'Seed tips', '#e8c98a')],
    handles: function (p, s, c) { return [{ id: 'b', x: Math.round(c.W * 0.5), y: p.base, l: 'ground line' }]; },
    drag: function (p, s, id, x, y) { p.base = clamp(Math.round(y), 20, 600); },
    gen: function (p) {
      return 'var BASE=' + p.base + ',TALL=' + p.tall + ';\nfor(var x=0;x<W;x++){var hgt=Math.round((3+Math.floor(hash(x,8,3)*9)+(hash(x,9,3)>0.93?4:0))*TALL);if(hash(x,1,1)>' + f(p.dens / 100) + ')continue;var lean=Math.round(Math.sin(t*' + p.sway + '+x*0.35)*(hgt>8?1.6:0.9));ctx.fillStyle=hgt>9?\'' + p.c2 + '\':\'' + p.c1 + '\';for(var g=0;g<hgt;g++)ctx.fillRect(x+Math.round(lean*g/hgt),BASE-g,1,1);if(hash(x,12,4)>0.97)px(ctx,x+lean,BASE-hgt-1,\'' + p.tip + '\');}\n' +
        (p.fill ? 'rect(ctx,0,BASE,W,Math.max(0,H-BASE),\'' + p.c1 + '\');' : '');
    }
  });

  def('rect', {
    label: 'Rectangle', uses: '',
    params: [Nn('x', 'Position (% of width)', 50, 0, 100, 0.5), Nn('y', 'Position (y)', 40, -50, 600), Nn('w', 'Width', 20, 1, 400), Nn('h', 'Height', 6, 1, 400), Cc('c', 'Colour', '#fff6cc'), Nn('bob', 'Bob up and down (px)', 0, 0, 20, 0.5), Nn('bobSpeed', 'Bob speed', 1, 0.1, 6, 0.1)],
    handles: function (p, s, c) { return [{ id: 'c', x: c.W * p.x / 100 + p.w / 2, y: p.y + p.h / 2, l: 'rectangle' }]; },
    drag: function (p, s, id, x, y, c) { p.x = clamp(Math.round((x - p.w / 2) / c.W * 200) / 2, 0, 100); p.y = clamp(Math.round(y - p.h / 2), -50, 600); },
    gen: function (p) {
      return 'var oy=Math.round(Math.sin(t*' + p.bobSpeed + ')*' + p.bob + ');\nrect(ctx,Math.round(W*' + f(p.x / 100) + '),' + p.y + '+oy,' + p.w + ',' + p.h + ',\'' + p.c + '\');';
    }
  });

  def('disc', {
    label: 'Circle', uses: '',
    params: [Nn('x', 'Centre (% of width)', 50, 0, 100, 0.5), Nn('y', 'Centre (y)', 40, -50, 600), Nn('r', 'Radius', 8, 1, 200), Cc('c', 'Colour', '#fff6cc'), Nn('bob', 'Bob up and down (px)', 0, 0, 20, 0.5), Nn('bobSpeed', 'Bob speed', 1, 0.1, 6, 0.1)],
    handles: function (p, s, c) { return [{ id: 'c', x: c.W * p.x / 100, y: p.y, l: 'circle' }]; },
    drag: function (p, s, id, x, y, c) { p.x = clamp(Math.round(x / c.W * 200) / 2, 0, 100); p.y = clamp(Math.round(y), -50, 600); },
    gen: function (p) {
      return 'var oy=Math.round(Math.sin(t*' + p.bobSpeed + ')*' + p.bob + ');\ndisc(ctx,Math.round(W*' + f(p.x / 100) + '),' + p.y + '+oy,' + p.r + ',\'' + p.c + '\',100000);';
    }
  });

  /* ---------- public helpers ---------- */
  function defaults(t) {
    var o = {}; T[t].params.forEach(function (q) { if (q.k) o[q.k] = (q.t === 'cs') ? q.d.slice() : q.d; }); return o;
  }
  function clean(t, p) {
    var o = {}; p = (p && typeof p === 'object') ? p : {};
    T[t].params.forEach(function (q) {
      if (!q.k) return; var v = p[q.k];
      if (q.t === 'n') o[q.k] = num(v, q.d, q.min, q.max);
      else if (q.t === 'c') o[q.k] = colour(v, q.d);
      else if (q.t === 'cs') o[q.k] = colours(v, q.d);
      else if (q.t === 'b') o[q.k] = v == null ? !!q.d : !!v;
      else if (q.t === 's') { var ok = q.o.some(function (op) { return String(op[0]) === String(v); }); o[q.k] = ok ? String(v) : String(q.d); }
    });
    return o;
  }
  function gen(el, scene) {
    var d = T[el.t], p = clean(el.t, el.p), s = cleanScene(scene);
    return pre(s, d.uses) + d.gen(p, s);
  }
  /* give every element layer in design D its current code; returns true if any code changed */
  function regen(D) {
    var changed = false; D.scene = cleanScene(D.scene);
    D.layers.forEach(function (l) {
      if (!l.el || !T[l.el.t]) return; var c = gen(l.el, D.scene);
      if (l.code !== c) { l.code = c; changed = true; }
    });
    return changed;
  }
  /* after loading a design: sanitise settings, and drop the element link from layers whose code was edited by hand */
  function adopt(D) {
    D.scene = cleanScene(D.scene);
    D.layers.forEach(function (l) {
      if (!l.el) return;
      if (!T[l.el.t] || l.kind !== 'code') { l.el = null; return; }
      l.el = { t: l.el.t, p: clean(l.el.t, l.el.p) };
      if (gen(l.el, D.scene) !== l.code) l.el = null;
    });
  }
  function sceneHandles(s, c) {
    var de = Math.round(c.W * s.deckEnd / 100), st = Math.round(c.W * s.shoreStart / 100);
    return [
      { id: 'horizon', x: 8, y: s.horizon, l: 'horizon' },
      { id: 'deck', x: de, y: s.deckTop, l: 'deck corner' },
      { id: 'shore', x: st, y: s.shoreY, l: 'shore slope starts' },
      { id: 'rise', x: c.W - 6, y: shoreYat(s, c.W, c.W - 6), l: 'shore height' }
    ];
  }
  function dragScene(s, id, x, y, c) {
    if (id === 'horizon') s.horizon = clamp(Math.round(y), 8, 600);
    else if (id === 'deck') { s.deckEnd = clamp(Math.round(x / c.W * 100), 10, 90); s.deckTop = clamp(Math.round(y), 20, 600); }
    else if (id === 'shore') { s.shoreStart = clamp(Math.round(x / c.W * 100), 5, 90); s.shoreY = clamp(Math.round(y), 20, 600); }
    else if (id === 'rise') s.shoreRise = clamp(Math.round(s.shoreY - y), -100, 300);
  }

  /* the header the site draws today, as editable elements, bottom layer first */
  function site() {
    return [
      ['sky', 'sky'], ['sea', 'sea'], ['stars', 'stars'], ['sun', 'sun'],
      ['cloud', 'cloud 1', { shape: '0', x: 15, y: 16, speed: 1.1 }],
      ['cloud', 'cloud 2', { shape: '1', x: 55, y: 30, speed: 0.7 }],
      ['cloud', 'cloud 3', { shape: '2', x: 88, y: 11, speed: 0.9 }],
      ['cloud', 'cloud 4', { shape: '0', x: 38, y: 46, speed: 1.6 }],
      ['beach', 'beach'], ['deck', 'deck'], ['glitter', 'sun glitter'], ['swell', 'swell lines'], ['lantern', 'lantern'],
      ['foam', 'shore foam'], ['gulls', 'gulls'], ['palm', 'palm tree'], ['aspen', 'Aspen'], ['mug', 'mug and steam'], ['grass', 'dune grass']
    ].map(function (a) { return { t: a[0], name: a[1], p: Object.assign(defaults(a[0]), a[2] || {}) }; });
  }

  root.HeaderElements = {
    types: T, order: ORDER, sceneSchema: SCENE_SCHEMA, defaultScene: defaultScene, cleanScene: cleanScene,
    defaults: defaults, clean: clean, gen: gen, regen: regen, adopt: adopt, sceneHandles: sceneHandles, dragScene: dragScene, site: site
  };
})(typeof window !== 'undefined' ? window : globalThis);
