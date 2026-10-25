/* 高性价比人生指南 · 视频引擎 stage.js — 通用部分。每集在 episodes/epXX/scenes.js 里定义 SEQ、ITEMS、场景函数 FN 和 buildEvents()。 */
const TL = window.__TL__;                      // injected timeline
const W = 1080, H = 1920;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { bg:'#0E0E10', ink:'#F2EDE4', mute:'#8D8A84', dim:'#3A3936', line:'#26252A',
            red:'#FF5232', green:'#3DD68C', amber:'#F2B544', panel:'#17171A' };
// 版面主题：render.py 用环境变量 THEME 注入 window.__THEME__ = {c:{配色}, bg(t), fg(t), subShadow}
const THEME = window.__THEME__ || null;
if (THEME && THEME.c) Object.assign(C, THEME.c);
const SERIF = THEME && THEME.serif===false ? '"LG Sans",sans-serif' : '"LG Serif",serif';
const SANS  = '"LG Sans",sans-serif';
const NUM   = '"LG Num","LG Sans",sans-serif';

// ---------- math ----------
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,u)=>a+(b-a)*u;
const P=(t,a,b)=>clamp((t-a)/(b-a));                 // progress
const eOut=u=>1-Math.pow(1-u,3);
const eExpo=u=>u>=1?1:1-Math.pow(2,-10*u);
const eInOut=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
const eExpoIO=u=>u<=0?0:u>=1?1:u<.5?Math.pow(2,20*u-10)/2:(2-Math.pow(2,-20*u+10))/2;
function hash(n){n=Math.sin(n*127.1)*43758.5453;return n-Math.floor(n);}

// ---------- timeline helpers ----------
const LINES = {}; TL.lines.forEach(l=>{(LINES[l.scene]=LINES[l.scene]||[])[l.i]=l;});
const SC = {}; TL.scenes.forEach((s,k)=>{s.k=k;SC[s.id]=s;});
const L = (id,i)=>LINES[id][i];

// ---------- drawing primitives ----------
function txt(s,x,y,{size=48,font=SANS,weight=700,color=C.ink,align='left',alpha=1,ls=0}={}){
  g.save();g.globalAlpha*=alpha;g.fillStyle=color;g.font=`${weight} ${size}px ${font}`;
  g.textAlign=align;g.textBaseline='alphabetic';
  if(ls){g.letterSpacing=ls+'px';}
  g.fillText(s,x,y);g.restore();
}
function tw(s,size,font=SANS,weight=700){g.save();g.font=`${weight} ${size}px ${font}`;const w=g.measureText(s).width;g.restore();return w;}
// per-character reveal: chars rise 30px and fade, staggered
function reveal(s,x,y,u,o={}){
  const size=o.size||48, font=o.font||SANS, weight=o.weight||700;
  const n=[...s].length; let cx=x;
  if(o.align==='center') cx=x-tw(s,size,font,weight)/2;
  g.save();g.font=`${weight} ${size}px ${font}`; const base=g.globalAlpha;
  [...s].forEach((ch,i)=>{
    const k=eOut(clamp(u*(n+6)/6 - i/6*1)); // stagger
    const kk=clamp((u*(n+4)-i)/4); const e=eOut(kk);
    g.globalAlpha=base*(o.alpha??1)*e; g.fillStyle=(o.colorAt&&o.colorAt(i))||o.color||C.ink;
    g.fillText(ch,cx,y+(1-e)*(o.rise??26));
    cx+=g.measureText(ch).width;
  });
  g.restore();
}
function wrap(s,maxW,size,font=SANS,weight=700){
  const out=[];let cur='';
  for(const ch of s){ if(tw(cur+ch,size,font,weight)>maxW && cur){out.push(cur);cur=ch;} else cur+=ch; }
  if(cur) out.push(cur);
  // avoid a line starting with punctuation
  for(let i=1;i<out.length;i++){ if(/^[，。、：；！？—）」]/.test(out[i])){out[i-1]+=out[i][0];out[i]=out[i].slice(1);} }
  return out.filter(Boolean);
}
// subtitles: balanced 2-line split (no orphan char), prefer breaking after punctuation
function wrapBal(s,maxW,size,font=SANS,weight=700){
  if(tw(s,size,font,weight)<=maxW) return [s];
  const ch=[...s]; let best=null, bestP=null;
  for(let i=2;i<ch.length-1;i++){
    const a=ch.slice(0,i).join(''), b=ch.slice(i).join('');
    if(/^[，。、：；！？—）」％%]/.test(b)) continue;
    if(/[0-9A-Za-z.]$/.test(a)&&/^[0-9A-Za-z.]/.test(b)) continue;          // never split a number
    const wa=tw(a,size,font,weight), wb=tw(b,size,font,weight); if(wa>maxW||wb>maxW) continue;
    const cost=Math.abs(wa-wb);
    if(!best||cost<best[0]) best=[cost,a,b];
    if(/[，。、：；！？]$/.test(a) && Math.min(wa,wb)/Math.max(wa,wb)>=.3 && (!bestP||cost<bestP[0])) bestP=[cost,a,b];
  }
  const r=bestP||best; return r?[r[1],r[2]]:wrap(s,maxW,size,font,weight);
}
function rrect(x,y,w,h,r){if(THEME&&THEME.rad!=null)r*=THEME.rad;r=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2));g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

// ---------- stroke icons (polylines drawn on by progress) ----------
function arcPts(cx,cy,r,a0,a1,n=40){const p=[];for(let i=0;i<=n;i++){const a=lerp(a0,a1,i/n);p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;}
function rrPts(x,y,w,h,r){const p=[];p.push(...arcPts(x+w-r,y+r,r,-Math.PI/2,0,8));p.push(...arcPts(x+w-r,y+h-r,r,0,Math.PI/2,8));p.push(...arcPts(x+r,y+h-r,r,Math.PI/2,Math.PI,8));p.push(...arcPts(x+r,y+r,r,Math.PI,Math.PI*1.5,8));p.push(p[0]);return p;}
const ICON = { // unit box 0..100
  belt:[ arcPts(50,18,11,0,Math.PI*2), [[30,92],[30,48],[38,36],[62,36],[70,48],[70,92]], [[33,40],[67,86]], rrPts(44,56,14,10,3) ],
  helmet:[ [[14,62],...arcPts(50,62,36,Math.PI,Math.PI*1.95,30),[86,62],[14,62]], [[50,26],[50,40]], [[60,62],[76,62],[76,50]], [[24,62],[30,80],[44,86]] ],
  smoke:[ [[18,22],[82,22]], rrPts(30,22,40,14,6), arcPts(50,29,3,0,Math.PI*2,12), arcPts(50,40,16,Math.PI*.2,Math.PI*.8,16), arcPts(50,40,30,Math.PI*.22,Math.PI*.78,20), arcPts(50,40,44,Math.PI*.24,Math.PI*.76,24) ],
  mushroom:[ [[12,54],...arcPts(50,54,38,Math.PI,Math.PI*2,30),[12,54]], [[40,54],[38,86],[62,86],[60,54]], arcPts(36,38,4,0,Math.PI*2,10), arcPts(60,32,5,0,Math.PI*2,10), arcPts(70,46,3,0,Math.PI*2,10) ],
  ebike:[ arcPts(24,70,16,0,Math.PI*2), arcPts(78,70,16,0,Math.PI*2), [[24,70],[44,46],[66,46],[78,70]], [[44,46],[38,32],[30,32]], [[66,46],[62,30],[72,30]], rrPts(46,50,16,9,2) ],
  bp:[ [[10,56],[30,56],[38,38],[48,76],[56,30],[64,56],[90,56]], [[50,92],...arcPts(30,30,18,Math.PI*.75,Math.PI*1.85,20),...arcPts(70,30,18,Math.PI*1.15,Math.PI*2.25,20),[50,92]] ],
  check:[ [[24,52],[42,70],[78,32]] ],
  generic:[ arcPts(50,50,38,0,Math.PI*2,48), [[34,52],[46,64],[68,38]] ],
};
function polyLen(p){let s=0;for(let i=1;i<p.length;i++)s+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return s;}
function drawIcon(name,x,y,size,u,color,lw=5,alpha=1){
  const parts=ICON[name]||ICON.generic; const lens=parts.map(polyLen); const tot=lens.reduce((a,b)=>a+b,0);
  let budget=clamp(u)*tot; const k=size/100;
  g.save();g.globalAlpha*=alpha;g.strokeStyle=color;g.lineWidth=lw;g.lineCap='round';g.lineJoin='round';
  parts.forEach((p,pi)=>{ if(budget<=0)return; g.beginPath(); g.moveTo(x+p[0][0]*k,y+p[0][1]*k);
    for(let i=1;i<p.length;i++){const seg=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
      if(budget>=seg){g.lineTo(x+p[i][0]*k,y+p[i][1]*k);budget-=seg;}
      else{const f=budget/seg;g.lineTo(x+lerp(p[i-1][0],p[i][0],f)*k,y+lerp(p[i-1][1],p[i][1],f)*k);budget=0;break;}}
    g.stroke(); });
  g.restore();
}
// a simple person pictogram
function person(x,y,h,color,alpha=1,lying=false){
  g.save();g.globalAlpha*=alpha;g.fillStyle=color;
  if(!lying){g.beginPath();g.arc(x,y-h*.82,h*.13,0,7);g.fill();rrect(x-h*.16,y-h*.64,h*.32,h*.64,h*.12);g.fill();}
  else{g.beginPath();g.arc(x-h*.38,y-h*.12,h*.12,0,7);g.fill();rrect(x-h*.22,y-h*.24,h*.62,h*.24,h*.1);g.fill();}
  g.restore();
}
function counter(v,x,y,size,color,suffix='',align='left'){
  txt(Math.round(v).toLocaleString('en-US')+suffix,x,y,{size,font:NUM,weight:800,color,align});
}
function chip(label,x,y,u,color=C.amber){
  if(u<=0)return; const e=eOut(u); const w=tw(label,40)+64;
  g.save();g.globalAlpha*=e;g.translate(x,y+(1-e)*20);
  rrect(0,0,w,76,38);g.strokeStyle=color;g.lineWidth=3;g.stroke();
  txt(label,32,52,{size:40,color});g.restore();
}

// ---------- persistent chrome ----------
function chrome(t){
  const sid=sceneAt(t).id; const k=SEQ.indexOf(sid);
  txt('高性价比人生指南',80,232,{size:34,weight:500,color:C.mute,ls:2});
  txt('EP.'+String(TL.ep).padStart(2,'0'),80+tw('高性价比人生指南',34,SANS,500)+24,232,{size:34,font:NUM,weight:700,color:C.amber});
  // six ticks
  for(let i=0;i<SEQ.length;i++){
    const x=1000-SEQ.length*52+2+i*52, done=k>i||sid==='outro', cur=k===i;
    g.fillStyle=cur?C.amber:done?C.ink:C.dim; g.globalAlpha=cur?1:done?.55:1;
    rrect(x,cur?204:212,40,cur?22:8,4);g.fill();g.globalAlpha=1;
  }
}
function sceneAt(t){let s=TL.scenes[0];for(const x of TL.scenes)if(t>=x.t0)s=x;return s;}

// ---------- subtitles ----------
const HL = /([0-9][0-9,.\-–]*\s*(%|元|秒钟|个|人|起|分钟|mmHg)?|四成多|近七成|约六成|四成|一半|不成立)/g;
function subtitle(t){ if(window.NOSUB) return;
  let cur=null; for(const l of TL.lines){ if(t>=l.t0-0.05 && t<l.t1+0.45) cur=l; }
  if(!cur) return;
  const a=clamp(P(t,cur.t0-0.05,cur.t0+0.15))*clamp(1-P(t,cur.t1+0.25,cur.t1+0.45));
  const rows=wrapBal(cur.sub,880,50,SANS,700);
  const y0=1390-(rows.length-1)*36;
  g.save();g.globalAlpha=a;
  rows.forEach((r,ri)=>{
    // colour numbers / key words
    const marks=new Array([...r].length).fill(false); let m; HL.lastIndex=0;
    const s=r; while((m=HL.exec(s))){ const st=[...s.slice(0,m.index)].length; for(let j=0;j<[...m[0]].length;j++)marks[st+j]=true; }
    const w=tw(r,50); let x=540-w/2; const y=y0+ri*72;
    g.font=`700 50px ${SANS}`;
    // soft shadow for legibility
    g.shadowColor=(THEME&&THEME.subShadow)||'rgba(0,0,0,.85)';g.shadowBlur=18;
    [...r].forEach((ch,i)=>{g.fillStyle=marks[i]?C.amber:C.ink;g.fillText(ch,x,y);x+=g.measureText(ch).width;});
    g.shadowBlur=0;
  });
  g.restore();
}

function gridPos(i){return {x:80+(i%3)*316, y:940+Math.floor(i/3)*196};}
function cell(x,y,u){ if(u<=0)return; g.save();g.globalAlpha*=eOut(u)*.9;rrect(x,y,288,176,22);g.fillStyle=C.panel;g.fill();g.restore(); }
function ecg(t,y,color,alpha){
  if(alpha<=0)return; g.save();g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=4;g.lineJoin='round';
  g.beginPath(); const speed=420, beat=60/64;
  for(let x=0;x<=W;x+=4){ const ph=((x/speed - t)/beat)%1; const q=(ph+1)%1;
    let v=0; if(q<.04)v=-Math.sin(q/.04*Math.PI)*10; else if(q<.07)v=Math.sin((q-.04)/.03*Math.PI)*70; else if(q<.1)v=-Math.sin((q-.07)/.03*Math.PI)*28; else if(q>.18&&q<.26)v=-Math.sin((q-.18)/.08*Math.PI)*14;
    x?g.lineTo(x,y-v):g.moveTo(x,y-v);}
  g.stroke(); g.restore();
}

function itemFrame(id,t,costAt){
  const s=SC[id], it=ITEMS[id], l0=L(id,0), k=SEQ.indexOf(id);
  const ti=t-s.t0;
  // numeral: rolls from previous number (carry across the cut)
  const roll=eExpoIO(P(ti,0,0.7));
  g.save(); g.beginPath(); g.rect(60,280,560,250); g.clip();
  const prev=k===0?'00':ITEMS[SEQ[k-1]].n;
  g.globalAlpha=1;
  [prev,it.n].forEach((nn,j)=>{ const yy=500+(j-roll)*-0+ (j===0? -roll*240 : (1-roll)*240);
    g.font=`900 250px ${NUM}`; g.lineWidth=4; g.strokeStyle=j?C.amber:C.dim; g.strokeText(nn,74,yy);
    if(j){ g.globalAlpha=.12; g.fillStyle=C.amber; g.fillText(nn,74,yy); g.globalAlpha=1; } });
  g.restore();
  txt(it.zh,80,262+0,{size:0}); // spacer
  reveal(it.zh,400,330,P(ti,.35,1.0),{size:40,weight:500,color:C.mute});
  // hero icon flies from hook grid position into the corner
  const fly=eExpoIO(P(ti,0.05,0.95)); const gp=gridPos(k);
  const ix=lerp(gp.x+80,720,fly), iy=lerp(gp.y+18,300,fly), isz=lerp(140,280,fly);
  g.save(); g.globalAlpha=.9; g.beginPath(); g.arc(ix+isz/2,iy+isz/2,isz*.62,0,7); g.fillStyle=C.panel; g.fill(); g.restore();
  drawIcon(id,ix,iy,isz,1,C.amber,lerp(5,7,fly));
  // title
  { const ts=Math.min(116, Math.floor(116*600/Math.max(1,tw(it.title[0],116,SERIF,900)))); reveal(it.title[0],80,700,P(t,l0.t0,l0.t0+.9),{size:ts,font:SERIF,weight:900}); }
  reveal(it.sub,80,786,P(t,l0.t0+.5,l0.t0+1.6),{size:44,weight:500,color:C.mute});
  // divider grows
  const dv=eOut(P(t,l0.t0+.4,l0.t0+1.4)); g.fillStyle=C.line; g.fillRect(80,830,920*dv,3);
  chip(it.cost,80,1176,P(t,costAt,costAt+.6));
}
// scene exit: slide left & fade (the numeral + icon carry into next scene)
function withExit(id,t,fn){
  const s=SC[id]; const out=eInOut(P(t,s.t1-.45,s.t1));
  g.save(); g.globalAlpha=1-out; g.translate(-out*90,0); fn(); g.restore();
}

function ring(cx,cy,r,u,val,label,color,t0,t){
  g.save(); g.lineWidth=26; g.lineCap='round';
  g.strokeStyle=C.line; g.beginPath(); g.arc(cx,cy,r,0,7); g.stroke();
  const e=eInOut(u); g.strokeStyle=color; g.beginPath(); g.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*val*e); if(e>0)g.stroke();
  g.restore();
  counter(val*100*e,cx,cy+28,92,C.ink,'%','center');
  txt('−',cx-tw(Math.round(val*100*e)+'%',92,NUM,800)/2-40,cy+26,{size:80,font:NUM,weight:800,color:C.ink,alpha:e>0?1:0});
  txt(label,cx,cy+r+80,{size:40,weight:700,color:C.mute,align:'center'});
}
// ---------- impacts: shake + push + colour flash (episode sets window.IMPACTS=[{t,k,c,f}]) ----------
function impactAt(t){ const I=window.IMPACTS; if(!I||!I.length) return null;
  let dx=0,dy=0,zz=0,fl=0,fc='255,82,50';
  for(const im of I){ const d=t-im.t; if(d<0||d>.7) continue; const k=im.k??1, e=Math.exp(-d*10)*k;
    dx+=Math.sin(d*95+im.t*13)*13*e; dy+=Math.cos(d*81+im.t*7)*10*e; zz+=.035*k*Math.exp(-d*7)*Math.min(1,d*30);
    const f=Math.exp(-d*12)*(im.f??.6)*Math.min(1,d*40); if(f>fl){fl=f;fc=im.c||fc;} }
  return {dx,dy,zz,fl,fc};
}
// ---------- master render ----------
// ---------- 运镜 ----------
// 每个场景一条缓动镜头路径（缓推 / 缓拉 / 横移交替），背景层以 0.4 倍速反向移动形成景深视差；
// 场景之间用「斜切光边」擦除转场：新场景从右侧斜切进入并由虚到实对焦，旧场景向左退并失焦。
const CAMS=[{z0:1.00,z1:1.045,x0:0,x1:-16,y0:6,y1:-10},{z0:1.05,z1:1.01,x0:-14,x1:12,y0:-8,y1:6},{z0:1.00,z1:1.04,x0:16,x1:-8,y0:10,y1:-8}];
function camAt(s,t){ const c=CAMS[s.k%CAMS.length], u=eInOut(P(t,s.t0-.3,s.t1+.3)); return {z:lerp(c.z0,c.z1,u), x:lerp(c.x0,c.x1,u), y:lerp(c.y0,c.y1,u)}; }
function drawScene(s,t){
  if(s.id==='hook') FN.hook(t);
  else if(s.id==='outro') FN.outro(t);
  else { if(s.id===SEQ[0] && t<s.t0+.7){ const f=1-eOut(P(t,s.t0,s.t0+.7)); g.save(); g.globalAlpha=f;
      for(let i=1;i<SEQ.length;i++){ const p=gridPos(i); cell(p.x,p.y,1); drawIcon(SEQ[i],p.x+80,p.y+18,140,1,C.ink,5); } g.restore(); }
    FN[s.id](t); }
}
function shot(s,t,cam,{blur=0,dx=0,alpha=1}={}){
  const c=camAt(s,t), z=c.z*(1+(cam?cam.zz:0));
  g.save(); g.globalAlpha=alpha; if(blur>.3) g.filter=`blur(${blur.toFixed(1)}px)`;
  if(cam) g.translate(cam.dx,cam.dy);
  g.translate(540+c.x+dx,860+c.y); g.scale(z,z); g.translate(-540,-860);
  drawScene(s,t); g.restore();
}
const TR0=.18, TR1=.62;                       // 转场：从下一段开始前 0.18s 到开始后 0.62s
const wipeEdge=(w,y)=>lerp(1080+760,-420,w)-y*.38;
function clipSide(w,right){ g.beginPath(); const x0=wipeEdge(w,0), x1=wipeEdge(w,1920);
  if(right){ g.moveTo(x0,0); g.lineTo(2400,0); g.lineTo(2400,1920); g.lineTo(x1,1920); }
  else { g.moveTo(-400,0); g.lineTo(x0,0); g.lineTo(x1,1920); g.lineTo(-400,1920); } g.closePath(); g.clip(); }
function glint(w){ const x0=wipeEdge(w,0), x1=wipeEdge(w,1920), a=Math.sin(Math.PI*w);
  g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round';
  const col=(THEME&&THEME.glint)||'255,226,170';
  [[90,.07],[34,.16],[6,.6]].forEach(([lw,al])=>{ g.strokeStyle=`rgba(${col},${(al*a).toFixed(3)})`; g.lineWidth=lw; g.beginPath(); g.moveTo(x0,0); g.lineTo(x1,1920); g.stroke(); });
  g.restore(); }
// 浮光：光里缓慢上升的微尘，给画面空气感
function motes(t){ const col=(THEME&&THEME.mote)||'255,228,190';
  g.save(); g.globalCompositeOperation='lighter';
  for(let i=0;i<16;i++){ const sp=14+hash(i+3)*22, x=(hash(i+11)*1180-50+Math.sin(t*.3+i)*30), y=1920-((t*sp+hash(i+5)*1920)%2100), r=6+hash(i+9)*22;
    const a=(.04+hash(i+13)*.07)*(.6+.4*Math.sin(t*.8+i*1.7));
    g.fillStyle=`rgba(${col},${a.toFixed(3)})`; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }
  g.restore(); }
// ---------- master render ----------
function render(t){
  g.setTransform(1,0,0,1,0,0); g.globalAlpha=1; g.filter='none';
  const s=sceneAt(t), prev=TL.scenes[s.k-1], next=TL.scenes[s.k+1];
  // 转场状态：当前帧落在 [next.t0-TR0, next.t0+TR1) 或 [s.t0-TR0, s.t0+TR1)
  let A=s, B=null, w=0;
  if(next && t>=next.t0-TR0){ A=s; B=next; w=P(t,next.t0-TR0,next.t0+TR1); }
  else if(prev && t<s.t0+TR1){ A=prev; B=s; w=P(t,s.t0-TR0,s.t0+TR1); }
  const we=eInOut(w);
  // 背景层：随镜头反向移动 0.4 倍（视差）
  const cb=camAt(B&&we>.5?B:A,t);
  g.save(); g.translate(540,960); g.scale(1.04,1.04); g.translate(-540-cb.x*.4,-960-cb.y*.4);
  if(THEME&&THEME.bg){ g.save(); THEME.bg(t); g.restore(); g.globalAlpha=1; } else {
  g.fillStyle=C.bg; g.fillRect(-60,-60,W+120,H+120);
  const grd=g.createRadialGradient(540,760,80,540,860,1300); grd.addColorStop(0,'rgba(255,190,120,0.06)'); grd.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grd; g.fillRect(-60,-60,W+120,H+120);
  g.fillStyle='rgba(255,255,255,0.035)';
  for(let y=0;y<H;y+=60) for(let x=((y/60)%2)*30;x<W;x+=60){ g.fillRect(x+((t*6)%60),y,2,2); } }
  g.restore();
  const cam=impactAt(t);
  if(!B || we<=0) shot(A,t,cam);
  else if(we>=1) shot(B,t,cam);
  else {
    g.save(); clipSide(we,false); shot(A,t,cam,{blur:7*we,dx:-70*we}); g.restore();
    g.save(); clipSide(we,true);  shot(B,t,cam,{blur:9*(1-we),dx:90*(1-we)}); g.restore();
    glint(we);
  }
  if(cam&&cam.fl>.01){ const gr=g.createRadialGradient(540,1000,60,540,1000,1250);
    gr.addColorStop(0,`rgba(${cam.fc},${(.32*cam.fl).toFixed(3)})`); gr.addColorStop(1,`rgba(${cam.fc},0)`);
    g.save(); g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.fillRect(0,0,W,H); g.restore(); }
  if(!(THEME&&THEME.motes===false)) motes(t);
  if(THEME&&THEME.fg){ g.save(); THEME.fg(t); g.restore(); }
  if(typeof overlay==='function') overlay(t);
  chrome(t);
  subtitle(t);
}
window.DUR=TL.dur; window.render=render;
// sound events for the mixer
