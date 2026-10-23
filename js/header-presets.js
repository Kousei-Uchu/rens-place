/* Presets for header-studio.html: the site's procedural header, split into editable code layers.
   Each "code" is the body of function (ctx, t, api). See SKILL.md in the studio's zip export for the api. */
(function (root) {
  'use strict';
  var PRE = `var W=api.w,H=api.h,HORIZON=70,DECK_TOP=118,hash=api.hash,px=api.px,rect=api.rect,disc=api.disc,halo=api.halo;
var deckEnd=Math.round(W*0.43),shoreStart=Math.round(W*0.30);
function shoreY(x){if(x<=shoreStart)return 130;var k=(x-shoreStart)/(W-shoreStart);return Math.round(130-30*Math.pow(k,1.25));}
var WALNUT='#5a3a29',WALNUT_D='#3d2619',WALNUT_DD='#26160d',COPPER='#985b3a',AMBER='#c58a4a',GOLD='#e8c98a',FOREST='#29402e',MOSS='#3f5743';
`;
  var L = [];
  function add(name, body, o) { o = o || {}; L.push({ name: name, code: PRE + body, vis: o.vis !== false, mask: o.mask || null }); }

  add('background', `var S=api.S;
if(!S.c){
var SKY=['#251f4d','#30275a','#3f2f68','#573a76','#734480','#914d86','#b15888','#cd6588','#e27a86','#ee9380','#f7ae7c','#fcc884','#ffe0a0'];
var SEA=['#f7b57c','#e58f83','#c06f87','#8f5a88','#615185','#44497f','#35447a','#2c3b70'];
var c=api.mk(W,H),b=c.getContext('2d');
for(var y=0;y<HORIZON;y++){for(var x=0;x<W;x++){var t0=y/HORIZON*SKY.length,bi=Math.min(SKY.length-1,Math.floor(t0)),fr=t0-bi,col=SKY[bi];if(bi<SKY.length-1&&((fr>0.7&&(x+y)%2===0)||(fr>0.88&&(x+y)%2===1)))col=SKY[bi+1];px(b,x,y,col);}}
var seaBottom=134;
for(y=HORIZON;y<seaBottom;y++){for(x=0;x<W;x++){var u=(y-HORIZON)/(seaBottom-HORIZON)*SEA.length,si=Math.min(SEA.length-1,Math.floor(u)),f2=u-si,sc=SEA[si];if(si<SEA.length-1&&((f2>0.7&&(x+y)%2===0)||(f2>0.88&&(x+y)%2===1)))sc=SEA[si+1];px(b,x,y,sc);}}
rect(b,0,HORIZON,W,1,'#ffe7ae');
for(x=0;x<W;x++){var sy=shoreY(x);for(y=sy;y<H;y++){var d=y-sy,c2;if(d<2)c2='#7d5a45';else if(d<5)c2='#a8744f';else{var m=Math.min(1,(d-5)/28);c2=m<0.34?'#d49a63':m<0.7?'#e2b27a':GOLD;if(((x*7+y*13)%29)===0)c2='#f3d9a3';}px(b,x,y,c2);}}
rect(b,Math.round(W*0.80),126,7,2,'#7d5a45');rect(b,Math.round(W*0.80)+1,125,3,1,'#a8744f');
px(b,Math.round(W*0.62),131,'#fff1d0');px(b,Math.round(W*0.62)+1,131,'#f0c8b0');
var postXs=[10,Math.round(deckEnd*0.45),deckEnd-9];
postXs.forEach(function(pxX){rect(b,pxX,DECK_TOP+14,5,22,WALNUT_D);rect(b,pxX,DECK_TOP+14,1,22,WALNUT);rect(b,pxX+4,DECK_TOP+14,1,22,WALNUT_DD);});
rect(b,0,DECK_TOP+4,deckEnd,10,WALNUT);rect(b,0,DECK_TOP+4,deckEnd,1,COPPER);rect(b,0,DECK_TOP+13,deckEnd,1,WALNUT_DD);
for(x=14;x<deckEnd;x+=22)rect(b,x,DECK_TOP+5,1,8,WALNUT_D);
for(x=0;x<deckEnd;x++)if(hash(x,3,9)>0.86)px(b,x,DECK_TOP+5+Math.floor(hash(x,5,2)*7),WALNUT_D);
rect(b,0,DECK_TOP,deckEnd,4,COPPER);rect(b,0,DECK_TOP,deckEnd,1,AMBER);rect(b,0,DECK_TOP+2,deckEnd,1,'#7a4a32');
for(x=9;x<deckEnd;x+=26)rect(b,x,DECK_TOP+1,1,3,WALNUT_D);
rect(b,deckEnd-1,DECK_TOP,1,14,AMBER);
var railEnd=Math.max(24,deckEnd-40);
for(x=4;x<railEnd;x+=20){rect(b,x,DECK_TOP-17,3,17,WALNUT);rect(b,x,DECK_TOP-17,1,17,COPPER);}
rect(b,0,DECK_TOP-18,railEnd+2,3,COPPER);rect(b,0,DECK_TOP-18,railEnd+2,1,AMBER);rect(b,0,DECK_TOP-16,railEnd+2,1,WALNUT_D);
rect(b,0,DECK_TOP-9,railEnd+2,2,WALNUT);rect(b,0,DECK_TOP-9,railEnd+2,1,COPPER);
var lx=25;
rect(b,lx,DECK_TOP-27,1,9,WALNUT_D);rect(b,lx-3,DECK_TOP-32,7,1,WALNUT_D);rect(b,lx-3,DECK_TOP-26,7,1,WALNUT_D);
rect(b,lx-2,DECK_TOP-31,5,5,'#f4c768');rect(b,lx,DECK_TOP-30,1,3,'#fff2c0');
rect(b,lx-3,DECK_TOP-31,1,5,WALNUT_D);rect(b,lx+3,DECK_TOP-31,1,5,WALNUT_D);
S.c=c;}
ctx.drawImage(S.c,0,0);`);

  add('water mask', `ctx.fillStyle='#000';
for(var x=0;x<W;x++){var yb=x<deckEnd?DECK_TOP:shoreY(x);ctx.fillRect(x,HORIZON,1,Math.max(0,yb-HORIZON));}`, { vis: false });

  add('stars', `var S=api.S;
if(!S.s){S.s=[];for(var i=0;i<Math.round(W/14);i++)S.s.push({x:Math.floor(hash(i,1,7)*W),y:Math.floor(hash(i,2,7)*22),p:hash(i,3,7)*6.28});}
S.s.forEach(function(s){var v=Math.sin(t*1.3+s.p);if(v>-0.2)px(ctx,s.x,s.y,v>0.7?'#fff6d6':'#cdb9e8');});`);

  add('sun', `var sunX=Math.round(W*0.70),sunY=HORIZON+2,sunR=13,pulse=Math.floor(t*1.2)%2;
halo(ctx,sunX,sunY,40+pulse,'#f9b88a',0,HORIZON);halo(ctx,sunX,sunY,28+pulse,'#fde0a4',1,HORIZON);halo(ctx,sunX,sunY,19,'#fff0c0',0,HORIZON);
disc(ctx,sunX,sunY,sunR,'#ffd36e',HORIZON+1);disc(ctx,sunX,sunY,sunR-2,'#ffe596',HORIZON+1);disc(ctx,sunX,sunY,sunR-5,'#fff6cc',HORIZON+1);`);

  add('clouds', `var S=api.S;
if(!S.cs){S.cs=[0,1,2].map(function(n){var w=46+n*14,h=16+n*3,cv=api.mk(w,h),c=cv.getContext('2d');var lumps=[[0.22,0.62,0.2,0.28],[0.42,0.45,0.26,0.38],[0.64,0.55,0.22,0.32],[0.82,0.68,0.16,0.22]];
for(var yy=0;yy<h;yy++)for(var xx=0;xx<w;xx++){var inside=lumps.some(function(l){var dx=(xx/w-l[0])/l[2],dy=(yy/h-l[1])/l[3];return dx*dx+dy*dy<=1;})&&yy>h*0.2;if(!inside)continue;var rel=yy/h,col=rel<0.42?'#ffd7a0':rel<0.68?'#f4a086':'#b8648a';if(rel>=0.68&&(xx+yy)%2===0)col='#d9788a';c.fillStyle=col;c.fillRect(xx,yy,1,1);}return cv;});
S.cl=[{s:0,x:W*0.15,y:16,v:1.1},{s:1,x:W*0.55,y:30,v:0.7},{s:2,x:W*0.88,y:11,v:0.9},{s:0,x:W*0.38,y:46,v:1.6}];}
S.cl.forEach(function(cl){var cs=S.cs[cl.s],span=W+cs.width+20,cx=((cl.x-t*cl.v)%span+span)%span-cs.width;ctx.drawImage(cs,Math.round(cx),cl.y);});`);

  add('sun glitter', `var sunX=Math.round(W*0.70),tick=Math.floor(t*5);
for(var y=HORIZON+1;y<124;y+=2){var dist=y-HORIZON,half=4+dist*0.55;for(var x=Math.floor(sunX-half);x<=sunX+half;x++){var r=hash(x,y,tick+Math.floor(y/2)*3);if(r>0.80-Math.max(0,0.18-dist*0.002)){var len=1+Math.floor(hash(x,y,77)*3);ctx.fillStyle=dist<12?'#fff0b8':dist<28?'#ffd88c':'#f2a888';ctx.fillRect(x,y,len,1);}}}`, { mask: 'water mask' });

  add('swell lines', `for(var y=HORIZON+6;y<120;y+=7){for(var x=0;x<W;x++){var wv=Math.sin(x*0.18+t*0.9+y)+Math.sin(x*0.07-t*0.5);if(wv>1.55&&((x+y)&1)===0&&(y>100||x%3===0))px(ctx,x,y,y<100?'#c98898':'#5a5f94');}}`, { mask: 'water mask' });

  add('foam', `var tick=Math.floor(t*5);
for(var x=deckEnd+1;x<W;x++){var sy=shoreY(x),off=Math.round(Math.sin(t*0.9+x*0.07)*1.6+Math.sin(t*0.5+x*0.2)*0.8);if(hash(x,4,5)>0.22)px(ctx,x,sy-1+off,'#fff3dd');if(hash(x,tick,11)>0.7)px(ctx,x,sy-2+off,'#ffe9c4');px(ctx,x,sy+1,'#7d5a45');}`);

  add('gulls', `ctx.fillStyle='#2a1f45';
for(var i=0;i<3;i++){var gx=((t*(3+i)*2.2+i*W*0.37)%(W+30))-15,gy=22+i*9+Math.sin(t*0.9+i*2)*3,up=Math.floor(t*2.5+i)%2===0;
if(up){ctx.fillRect(gx,gy,3,1);ctx.fillRect(gx+3,gy+1,1,1);ctx.fillRect(gx+4,gy,3,1);ctx.fillRect(gx-1,gy-1,1,1);ctx.fillRect(gx+7,gy-1,1,1);}
else{ctx.fillRect(gx,gy+1,3,1);ctx.fillRect(gx+3,gy,1,1);ctx.fillRect(gx+4,gy+1,3,1);ctx.fillRect(gx-1,gy+2,1,1);ctx.fillRect(gx+7,gy+2,1,1);}}`);

  add('palm tree', `function frond(c,x0,y0,an,len,droop,sway,col,hi){for(var s=0;s<=len;s++){var fx=x0+Math.cos(an)*s+sway*(s/len),fy=y0+Math.sin(an)*s+droop*s*s/len;c.fillStyle=col;c.fillRect(Math.round(fx),Math.round(fy),1,2);if(s>2){var side=(s%2===0)?1:-1,ll=2+(s>len*0.45?1:0)+(s%3===0?1:0);c.fillRect(Math.round(fx),Math.round(fy)+2,1,ll);c.fillRect(Math.round(fx)+side,Math.round(fy)+1,1,ll);}if(hi&&s%3===0){c.fillStyle=hi;c.fillRect(Math.round(fx),Math.round(fy)-1,1,1);}}}
var palmX=Math.round(W*0.90),palmBase=shoreY(palmX)+14,topY=74,topX=palmX-8;
for(var y=palmBase;y>topY;y--){var k=(palmBase-y)/(palmBase-topY),tx=Math.round(palmX-8*k*k-1*k);ctx.fillStyle='#26362a';ctx.fillRect(tx,y,k<0.5?4:3,1);if(y%5===0){ctx.fillStyle='#3a4a3a';ctx.fillRect(tx,y,2,1);}ctx.fillStyle=AMBER;ctx.fillRect(tx-1,y,1,1);}
var sw=Math.sin(t*1.1)*1.2;
[[-3.0,8,0.11],[-2.5,17,0.07],[-1.95,20,0.05],[-1.35,19,0.06],[-0.8,17,0.1],[-0.35,12,0.14],[-3.4,12,0.14]].forEach(function(f,n){frond(ctx,topX,topY,f[0],f[1],f[2]*6,sw*(n%2?1:-1),FOREST,MOSS);});
ctx.fillStyle=AMBER;ctx.fillRect(topX-12,topY+2,1,1);ctx.fillRect(topX-14,topY+5,1,1);`);

  add('Aspen', `var Sp=api.Sprite;if(!Sp)return;
var S=api.S;S.f=S.f||{};
var wagging=t<api.wagUntil;
var tail=wagging?[0,2,1,2][Math.floor(t*8)%4]:[0,1,2,1][Math.floor(t*1.2)%4];
var blink=(t%4.6)>4.42||(wagging&&(t%0.6)>0.5);
var swing=Math.floor(t*0.9)%2;
var key=tail+''+(blink?1:0)+swing;
if(!S.f[key])S.f[key]=Sp.toCanvas(Sp.build({tail:tail,blink:blink,swing:swing}),api.mk);
ctx.drawImage(S.f[key],deckEnd-Math.round(41*Sp.SCALE),DECK_TOP-Sp.outSeat);`);

  add('mug and steam', `var Sp=api.Sprite,k=Sp?Sp.SCALE:1,mx=deckEnd-Math.round(41*k)-3;
rect(ctx,mx,DECK_TOP-5,5,5,AMBER);rect(ctx,mx,DECK_TOP-5,5,1,GOLD);rect(ctx,mx+5,DECK_TOP-4,1,3,AMBER);rect(ctx,mx,DECK_TOP-1,5,1,COPPER);
for(var i=0;i<3;i++){var ph=((t*0.8+i*0.33)%1),sx=mx+2+Math.round(Math.sin(t*2+i*2)*1.2);ctx.fillStyle='rgba(255,240,208,'+(0.8-ph*0.8).toFixed(2)+')';ctx.fillRect(sx,DECK_TOP-7-Math.round(ph*9),1,2);}`);

  add('lantern glow', `var fl=Math.floor(t*6)%3;
halo(ctx,25,DECK_TOP-29,9+(fl===0?1:0),'#f4c768',0,DECK_TOP-8);`);

  add('dune grass', `for(var x=0;x<W;x++){var hgt=3+Math.floor(hash(x,8,3)*9)+(hash(x,9,3)>0.93?4:0);if(hash(x,1,1)>0.58)continue;var lean=Math.round(Math.sin(t*1.4+x*0.35)*(hgt>8?1.6:0.9));ctx.fillStyle=hgt>9?MOSS:FOREST;for(var g=0;g<hgt;g++)ctx.fillRect(x+Math.round(lean*g/hgt),146-g,1,1);if(hash(x,12,4)>0.97)px(ctx,x+lean,146-hgt-1,GOLD);}
rect(ctx,0,146,W,4,FOREST);`);

  root.HeaderPresets = { site: function () { return L.map(function (l) { return { name: l.name, code: l.code, vis: l.vis, mask: l.mask }; }); } };
})(window);
