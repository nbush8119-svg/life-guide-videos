/* 第 3 集《不要浪费精力》— 核心意象「两块电池」：上面一块是「你觉得」的精力，下面一块是「实际」的精力。
   开头：手机电量掉到 20% 会去充 → 人的两块电池：感觉一直是满的，实际一格格漏掉，中间那道缝就是「感觉不到」。
   每一件：图标先在中央登场，再退到角上让位给数据；每件都在讲同一件事——仪器测得到，自己感觉不到。
   结尾：实际那块电池一格格充回来，和感觉对齐。依赖 engine/stage.js。 */

// ---------- 本集图标（单位格 0..100） ----------
Object.assign(ICON, {
  moon:  [ [...arcPts(50,50,38,Math.PI*.25,Math.PI*1.75,30), ...arcPts(66,50,30,Math.PI*1.62,Math.PI*.38,24)] ],
  cup:   [ [[18,46],[23,84],[65,84],[70,46],[18,46]], arcPts(71,62,11,-Math.PI/2,Math.PI/2,12), [[34,38],[29,28],[35,18]], [[50,38],[45,28],[51,18]], [[10,92],[78,92]] ],
  phones:[ arcPts(50,58,34,Math.PI,Math.PI*2,24), rrPts(8,52,18,32,7), rrPts(74,52,18,32,7) ],
  phone: [ rrPts(30,8,40,84,8), [[44,17],[56,17]], arcPts(50,80,3.5,0,Math.PI*2,10) ],
  brief: [ rrPts(10,32,80,56,8), [[38,32],[38,22],[62,22],[62,32]], [[10,56],[90,56]] ],
  sun:   [ arcPts(50,50,18,0,Math.PI*2,30), ...Array.from({length:8},(_,k)=>{ const a=k/8*Math.PI*2; return [[50+Math.cos(a)*28,50+Math.sin(a)*28],[50+Math.cos(a)*40,50+Math.sin(a)*40]]; }) ],
  bolt:  [ [[56,6],[28,54],[50,54],[42,94],[74,40],[52,40],[56,6]] ],
  talk:  [ [...rrPts(12,16,76,52,14)], [[30,68],[24,86],[46,68]] ],
  run:   [ arcPts(60,14,8,0,Math.PI*2,12), [[56,26],[44,56],[60,70],[54,92]], [[44,56],[30,84]], [[52,36],[72,46]], [[52,36],[34,40]] ],
});
const SEQ = ['sleep','caffeine','focus','bedtime','hours','mood'];
const ICONOF = {sleep:'moon', caffeine:'cup', focus:'phones', bedtime:'phone', hours:'brief', mood:'sun'};
const ITEMS = {
 sleep:   {n:'01', zh:'第一件', title:['睡够 7–8 小时'], sub:'6 小时不算够用', cost:'成本 · 每天多留 1–2 小时'},
 caffeine:{n:'02', zh:'第二件', title:['下午 2 点后不碰咖啡因'], sub:'睡前 8.8 小时以上喝完', cost:''},
 focus:   {n:'03', zh:'第三件', title:['挡住打断'], sub:'几秒钟的打断也不放进来', cost:'成本 · 关门、戴耳机'},
 bedtime: {n:'04', zh:'第四件', title:['到点就睡'], sub:'别为游戏和短视频熬夜', cost:''},
 hours:   {n:'05', zh:'第五件', title:['别硬加班'], sub:'工时过了一道坎，多干也不多出活', cost:''},
 mood:    {n:'06', zh:'最后一件', title:['低落时先动起来'], sub:'最划算的几件事，先做', cost:''},
};
SEQ.forEach(id=>{ ICON[id]=ICON[ICONOF[id]]; });
function mixc(a,b,u){ const pa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)), pb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));
  return 'rgb('+pa.map((v,i)=>Math.round(lerp(v,pb[i],clamp(u)))).join(',')+')'; }
function softDot(x,y,r,col,a){ if(a<=0) return; const gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.save(); g.globalAlpha*=a; g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); g.restore(); }
const CUE=(k,w,fb)=>{ const v=TL.cues&&TL.cues[k+':'+w]; return v==null?fb:v; };
const lvCol=v=>v>.5?mixc(C.green,C.amber,(1-v)/.5):mixc(C.amber,C.red,(.5-v)/.3);
function pop(s,x,y,u,o){ if(u<=0) return; g.save(); g.globalAlpha*=clamp(u*3); g.translate(x,y); const k=lerp(1.6,1,eExpo(u)); g.scale(k,k); txt(s,0,0,o); g.restore(); }

// ---------- 电池：分 10 格，lv 0..1 ----------
function battery(x,y,w,h,lv,col,alpha=1,seg=10){
  if(alpha<=0) return; g.save(); g.globalAlpha*=alpha;
  rrect(x,y,w,h,h*.18); g.fillStyle=C.panel; g.fill(); g.strokeStyle=C.mute; g.lineWidth=5; g.stroke();
  rrect(x+w+6,y+h*.3,h*.14,h*.4,4); g.fillStyle=C.mute; g.fill();
  const pad=h*.12, iw=w-pad*2, ih=h-pad*2, gap=6, sw=(iw-gap*(seg-1))/seg;
  g.fillStyle=col;
  for(let k=0;k<seg;k++){ const f=clamp(lv*seg-k); if(f<=0) break; rrect(x+pad+k*(sw+gap),y+pad,sw*f,ih,4); g.fill(); }
  g.restore();
}
// 两块电池：你觉得 vs 实际
function twoBatteries(y0,felt,real,a,t,{gapLab=0}={}){
  if(a<=0) return; g.save(); g.globalAlpha*=a;
  txt('你觉得',80,y0-22,{size:36,weight:700,color:C.ink}); txt(Math.round(felt*100)+'%',960,y0-22,{size:40,font:NUM,weight:900,color:C.ink,align:'right'});
  battery(80,y0,870,120,felt,C.ink,.92);
  const y1=y0+230;
  txt('实际',80,y1-22,{size:36,weight:700,color:lvCol(real)}); txt(Math.round(real*100)+'%',960,y1-22,{size:40,font:NUM,weight:900,color:lvCol(real),align:'right'});
  battery(80,y1,870,120,real,lvCol(real),1);
  if(gapLab>0){ const pad=14, iw=870-pad*2, xa=80+pad+iw*real, xb=80+pad+iw*felt; g.save(); g.globalAlpha*=eOut(gapLab);
    g.strokeStyle=C.red; g.lineWidth=3; g.setLineDash([8,8]);
    g.beginPath(); g.moveTo(xa,y1+120); g.lineTo(xa,y0); g.moveTo(xb,y1+120); g.lineTo(xb,y0); g.stroke(); g.setLineDash([]);
    g.fillStyle='rgba(255,82,50,.14)'; g.fillRect(xa,y1,xb-xa,120);
    txt('感觉不到的部分',(xa+xb)/2,y1+200,{size:40,weight:900,color:C.red,align:'center'}); g.restore(); }
  g.restore();
}

// ---------- 开头 ----------
function hookT(){ const a=L('hook',0), b=L('hook',1), c=L('hook',2);
  const dr1=a.t0+(a.t1-a.t0)*.55, ch0=a.t1-.7; return {a,b,c,dr1,ch0}; }
function sHook(t){
  const {a,b,c,dr1,ch0}=hookT();
  // 手机电量：100 → 20，然后充电
  const outA=eInOut(P(t,b.t0-.3,b.t0+.4));
  if(outA<1){ g.save(); g.globalAlpha*=1-outA;
    const charge=P(t,ch0,ch0+1.6); let lv=lerp(1,.2,eInOut(P(t,a.t0,dr1))); if(charge>0) lv=lerp(.2,.9,eInOut(charge));
    const col=charge>0?C.green:lvCol(lv), inA=eOut(P(t,0,.5));
    g.save(); g.globalAlpha*=inA; battery(190,620,640,280,lv,col); g.restore();
    txt(Math.round(lv*100)+'%',510,1020,{size:120,font:NUM,weight:900,color:col,align:'center',alpha:inA});
    if(charge>0){ const u=eExpo(clamp(charge*3)); g.save(); g.globalAlpha*=u; drawIcon('bolt',410,660,200,1,C.bg,18); drawIcon('bolt',410,660,200,1,C.amber,7); g.restore(); }
    txt('手机',80,560,{size:40,weight:700,color:C.mute,alpha:inA});
    g.restore(); }
  // 人的两块电池
  if(t>b.t0-.3){ const out=eInOut(P(t,c.t0-.2,c.t0+.5)), inn=eOut(P(t,b.t0-.1,b.t0+.6));
    const real=lerp(.9,.35,eInOut(P(t,b.t0+.6,b.t1-.6))), gl=P(t,b.t1-.9,b.t1-.1);
    g.save(); g.translate(0,-out*120); g.globalAlpha*=1-out;
    reveal('人的精力',80,420,P(t,b.t0,b.t0+.8),{size:72,font:SERIF,weight:900});
    twoBatteries(560,.9,real,inn,t,{gapLab:gl});
    g.restore(); }
  // 六个漏电点
  if(t>c.t0-.2){
    reveal('六个最容易漏电的地方',80,830,P(t,c.t0+.1,c.t0+1.2),{size:72,font:SERIF,weight:900});
    for(let i=0;i<6;i++){ const p=gridPos(i); const u=P(t,c.t0+.4+i*.15,c.t0+1.15+i*.15);
      cell(p.x,p.y,u); drawIcon(SEQ[i],p.x+80,p.y+18,140,u,C.ink,5); }
  }
}

// ---------- 每一件的开场：图标在中央登场，再退到角上 ----------
const HERO={cx:540, cy:1050, s:320};
function heroFront(id,t,x,y,s,a){
  const u=s/100; g.save(); const ba=g.globalAlpha*a;
  if(id==='sleep'){ for(let j=0;j<3;j++){ const ph=((t*.35+j/3)%1); g.globalAlpha=ba*Math.sin(ph*Math.PI);
      txt('z',x+(78+ph*30)*u,y+(30-ph*60)*u,{size:(18+ph*22)*u,font:NUM,weight:900,color:C.amber}); } }
  if(id==='caffeine'){ g.lineCap='round';
    for(let j=0;j<3;j++){ const sx=x+(30+j*14)*u; g.globalAlpha=ba*.55; g.strokeStyle=C.ink; g.lineWidth=4;
      g.beginPath(); for(let k=0;k<=16;k++){ const yy=y+(38-k*3.4)*u, xx=sx+Math.sin(k*.55-t*3+j*1.3)*5*u*(k/16+.2); k?g.lineTo(xx,yy):g.moveTo(xx,yy); } g.stroke(); } }
  if(id==='focus'){ for(let j=0;j<6;j++){ const ph=((t*.6+j/6)%1), an=j*1.05+.4; const r=(70+ph*40)*u;
      g.globalAlpha=ba*(1-ph)*.9; g.fillStyle=C.red; g.beginPath(); g.arc(x+50*u+Math.cos(an)*r,y+50*u+Math.sin(an)*r,8*u*(1-ph*.5),0,7); g.fill(); } }
  if(id==='bedtime'){ g.globalAlpha=1; softDot(x+50*u,y+50*u,60*u,'rgba(150,190,255,0.35)',ba*(.6+.4*Math.sin(t*4))); }
  if(id==='mood'){ g.globalAlpha=1; softDot(x+50*u,y+50*u,46*u,'rgba(242,181,68,0.5)',ba*(.6+.3*Math.sin(t*2.4))); }
  g.restore();
}
function itemFrameX(id,t,costAt){
  const s=SC[id], it=ITEMS[id], l0=L(id,0), l1=L(id,1), k=SEQ.indexOf(id), ti=t-s.t0;
  const roll=eExpoIO(P(ti,0,0.7));
  g.save(); g.beginPath(); g.rect(60,280,560,250); g.clip();
  const prev=k===0?'00':ITEMS[SEQ[k-1]].n;
  [prev,it.n].forEach((nn,j)=>{ const yy=500+(j===0? -roll*240 : (1-roll)*240);
    g.font=`900 250px ${NUM}`; g.lineWidth=4; g.strokeStyle=j?C.amber:C.dim; g.strokeText(nn,74,yy);
    if(j){ g.save(); g.globalAlpha*=.12; g.fillStyle=C.amber; g.fillText(nn,74,yy); g.restore(); } });
  g.restore();
  reveal(it.zh,400,330,P(ti,.35,1.0),{size:40,weight:500,color:C.mute});
  const gp=gridPos(k), a1=eExpoIO(P(ti,0.05,0.9)), a2=eExpoIO(P(t,l1.t0-.3,l1.t0+.5));
  const isz=lerp(lerp(140,HERO.s,a1),280,a2);
  const ix=lerp(lerp(gp.x+80,HERO.cx-HERO.s/2,a1),720,a2), iy=lerp(lerp(gp.y+18,HERO.cy-HERO.s/2,a1),300,a2);
  const cx=ix+isz/2, cy=iy+isz/2, heroA=a1*(1-a2);
  if(heroA>0){ g.save(); const ba=g.globalAlpha*heroA;
    for(let j=0;j<3;j++){ const ph=((t*.7+j/3)%1); g.globalAlpha=ba*(1-ph)*.28; g.strokeStyle=C.amber; g.lineWidth=2;
      g.beginPath(); g.arc(cx,cy,isz*.64+ph*isz*.34,0,7); g.stroke(); } g.restore(); }
  g.save(); g.globalAlpha*=.92; g.beginPath(); g.arc(cx,cy,isz*.62,0,7); g.fillStyle=C.panel; g.fill(); g.restore();
  if(heroA>0) softDot(cx,cy,isz*.7,'rgba(242,181,68,0.10)',heroA);
  drawIcon(id,ix,iy,isz,1,C.amber,lerp(5,7.5,heroA)+2*a2);
  if(heroA>0) heroFront(id,t,ix,iy,isz,heroA);
  const ts=Math.min(116, Math.floor(116*900/Math.max(1,tw(it.title[0],116,SERIF,900))));
  reveal(it.title[0],80,700,P(t,l0.t0,l0.t0+.9),{size:ts,font:SERIF,weight:900,colorAt:i=>/[0-9–]/.test([...it.title[0]][i])?C.amber:null});
  reveal(it.sub,80,786,P(t,l0.t0+.5,l0.t0+1.6),{size:44,weight:500,color:C.mute});
  const dv=eOut(P(t,l0.t0+.4,l0.t0+1.4)); g.fillStyle=C.line; g.fillRect(80,830,920*dv,3);
  if(it.cost) chip(it.cost,80,1176,P(t,costAt,costAt+.6));
}

// ---------- 01 睡眠：14 天，表现一路往下掉，自我感觉早早持平 ----------
const sleepHits=()=>{ const l1=L('sleep',1), l2=L('sleep',2); return {two:CUE('sleep:1','两晚',l1.t1-.8), same:CUE('sleep:2','一样困',l2.t1-.6)}; };
function sSleep(t){ const id='sleep';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=sleepHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t<l1.t0) return;
  const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l1.t0,l1.t0+.5));
  const X0=110, X1=990, Y0=940, Y1=1130, dx=(X1-X0)/13;
  g.save(); g.globalAlpha*=a;
  const ref=Y1-10; const rl=eOut(P(t,l1.t0+.8,l1.t0+1.6));
  g.strokeStyle=C.red; g.lineWidth=3; g.setLineDash([10,10]); g.beginPath(); g.moveTo(X0,ref); g.lineTo(X0+(X1-X0)*rl,ref); g.stroke(); g.setLineDash([]);
  txt('= 连续 2 晚完全没睡',X1,ref+44,{size:28,weight:900,color:C.red,align:'right',alpha:rl});
  for(let d=0;d<14;d++){ txt(String(d+1),X0+d*dx,1240,{size:22,font:NUM,weight:800,color:C.dim,align:'center',alpha:rl}); }
  txt('天',X1+34,1240,{size:22,weight:500,color:C.dim,alpha:rl});
  const dr=eInOut(P(t,l1.t0+1.4,H.two));
  const perf=d=>lerp(Y0+10,ref,Math.pow(d/13,.85));
  g.strokeStyle=C.red; g.lineWidth=7; g.lineJoin='round'; g.beginPath();
  for(let d=0;d<=13*dr+1e-6;d+=.25){ const x=X0+d*dx, y=perf(d); d?g.lineTo(x,y):g.moveTo(x,y); } if(dr>0) g.stroke();
  if(dr>0){ const d=13*dr; g.fillStyle=C.red; g.beginPath(); g.arc(X0+d*dx,perf(d),11,0,7); g.fill(); }
  txt('实际脑力表现',X0,Y0-24,{size:30,weight:900,color:C.red,alpha:eOut(P(t,l1.t0+1.4,l1.t0+2))});
  if(t>l2.t0){ const fe=eInOut(P(t,l2.t0+.3,l2.t0+(l2.t1-l2.t0)*.45));
    const feel=d=>Y0+10+(d<3? d/3*45 : 45);
    g.strokeStyle=C.ink; g.lineWidth=6; g.beginPath();
    for(let d=0;d<=13*fe+1e-6;d+=.25){ const x=X0+d*dx, y=feel(d); d?g.lineTo(x,y):g.moveTo(x,y); } if(fe>0) g.stroke();
    txt('自己感觉的状态',X1,Y0+20,{size:30,weight:900,color:C.ink,align:'right',alpha:eOut(P(t,l2.t0+.4,l2.t0+1.2))});
    txt('头几天变差，之后就不再变',X1,Y0-20,{size:26,weight:500,color:C.mute,align:'right',alpha:eOut(P(t,l2.t0+1.4,l2.t0+2.2))});
    const sm=eExpo(P(t,H.same-.05,H.same+.3));
    if(sm>0){ g.save(); g.globalAlpha*=sm; rrect(110,1035,420,104,20); g.fillStyle=C.panel; g.fill(); g.strokeStyle=C.amber; g.lineWidth=3; g.stroke();
      txt('睡 6 小时 = 睡 4 小时',320,1078,{size:34,weight:900,color:C.amber,align:'center'});
      txt('自己觉得一样困',320,1118,{size:26,weight:500,color:C.ink,align:'center'}); g.restore(); }
  }
  g.restore();
}

// ---------- 02 咖啡因：两条睡眠条、看不出的日记、倒推 8.8 小时 ----------
const cafHits=()=>{ const l1=L('caffeine',1), l2=L('caffeine',2), l3=L('caffeine',3);
  return {cut:CUE('caffeine:1','一个多小时',l1.t1-1.0), diary:CUE('caffeine:2','看不出',l2.t1-.8), two:CUE('caffeine:3','两点',l3.t1-.8)}; };
function sCaffeine(t){ const id='caffeine';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=cafHits();
  itemFrameX(id,t,1e9);
  const hx=h=>230+(h-13)/(31-13)*750;          // 13:00 → 次日 07:00
  if(t>l1.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l1.t0,l1.t0+.5));
    g.save(); g.globalAlpha*=a;
    txt('仪器测出的睡眠',80,890,{size:30,weight:700,color:C.mute});
    g.strokeStyle=C.dim; g.lineWidth=2; g.beginPath(); g.moveTo(hx(13),1150); g.lineTo(hx(31),1150); g.stroke();
    [[13,'13:00'],[17,'17:00'],[23,'23:00'],[31,'7:00']].forEach(([h,s])=>txt(s,hx(h),1190,{size:24,font:NUM,weight:800,color:C.mute,align:'center'}));
    const cu=eOut(P(t,l1.t0+.3,l1.t0+1));
    drawIcon('cup',hx(17)-40,1060,80,cu,C.amber,4);
    txt('400 mg',hx(17),1040,{size:26,font:NUM,weight:900,color:C.amber,align:'center',alpha:cu});
    const s1=eInOut(P(t,l1.t0+1,l1.t0+2.2));
    rrect(hx(23),930,(hx(31)-hx(23))*s1,46,8); g.fillStyle=C.dim; g.fill();
    txt('安慰剂',hx(23)-16,966,{size:26,weight:700,color:C.mute,align:'right',alpha:s1});
    const cutU=eExpo(P(t,H.cut-.05,H.cut+.35)), lost=1.15/8;
    const w2=(hx(31)-hx(23))*s1*(1-lost*cutU);
    rrect(hx(23),1000,w2,46,8); g.fillStyle=C.green; g.fill();
    txt('咖啡因',hx(23)-16,1036,{size:26,weight:700,color:C.ink,align:'right',alpha:s1});
    if(cutU>0){ const xe=hx(23)+w2; g.fillStyle='rgba(255,82,50,.3)'; g.fillRect(xe,1000,(hx(31)-hx(23))*lost*cutU,46);
      pop('−1 小时+',990,1110,P(t,H.cut-.05,H.cut+.4),{size:52,font:NUM,weight:900,color:C.red,align:'right'}); }
    g.restore();
    if(t>l2.t0){ const d=eOut(P(t,l2.t0,l2.t0+.5)), st=P(t,H.diary-.05,H.diary+.3);
      g.save(); g.globalAlpha*=d*(1-out); g.fillStyle='rgba(14,14,16,.85)'; g.fillRect(60,860,960,380);
      rrect(180,880,720,300,24); g.fillStyle=C.panel; g.fill(); g.strokeStyle=C.mute; g.lineWidth=3; g.stroke();
      txt('自己写的睡眠日记',220,945,{size:36,font:SERIF,weight:900,color:C.ink});
      txt('安慰剂那晚：睡得还行',220,1015,{size:32,weight:500,color:C.mute});
      txt('咖啡因那晚：睡得还行',220,1075,{size:32,weight:500,color:C.mute});
      if(st>0){ g.save(); g.globalAlpha*=clamp(st*3); g.translate(700,1130); g.rotate(-.12); const k=lerp(1.7,1,eExpo(st)); g.scale(k,k);
        rrect(-170,-50,340,80,12); g.fillStyle='rgba(23,23,26,.9)'; g.fill(); g.strokeStyle=C.red; g.lineWidth=6; g.stroke();
        txt('看不出差别',0,8,{size:44,weight:900,color:C.red,align:'center'}); g.restore(); }
      g.restore(); }
  }
  if(t>l3.t0-.1){ const a=eOut(P(t,l3.t0,l3.t0+.5));
    const X0=110, X1=990, hx2=h=>X0+(h-12)/(24-12)*(X1-X0);
    g.save(); g.globalAlpha*=a;
    g.strokeStyle=C.dim; g.lineWidth=3; g.beginPath(); g.moveTo(X0,1080); g.lineTo(X1,1080); g.stroke();
    for(let h=12;h<=24;h+=2) txt((h===24?'0':h)+':00',hx2(h),1124,{size:24,font:NUM,weight:800,color:C.mute,align:'center'});
    drawIcon('moon',hx2(23)-30,970,60,1,C.ink,4); txt('11 点睡',hx2(23),950,{size:28,weight:900,color:C.ink,align:'center'});
    const back=eInOut(P(t,l3.t0+.4,l3.t0+(l3.t1-l3.t0)*.5)), xs=hx2(23-8.8*back);
    g.strokeStyle=C.amber; g.lineWidth=8; g.lineCap='round'; g.beginPath(); g.moveTo(hx2(23),1080); g.lineTo(xs,1080); g.stroke();
    txt((8.8*back).toFixed(1)+' 小时',(hx2(23)+xs)/2,1050,{size:36,font:NUM,weight:900,color:C.amber,align:'center',alpha:back>0?1:0});
    const two=P(t,H.two-.05,H.two+.35);
    if(two>0){ g.save(); g.globalAlpha*=eExpo(two); g.strokeStyle=C.amber; g.lineWidth=4; g.beginPath(); g.moveTo(hx2(14),900); g.lineTo(hx2(14),1090); g.stroke(); g.restore();
      pop('下午 2 点',hx2(14)+20,940,two,{size:52,font:SERIF,weight:900,color:C.amber});
      txt('之后不碰咖啡因',hx2(14)+20,990,{size:30,weight:700,color:C.ink,alpha:eOut(two)}); }
    txt('一杯 250 mL 咖啡 ≈ 107 mg 咖啡因',80,1200,{size:26,weight:500,color:C.mute,alpha:eOut(P(t,l3.t0+1,l3.t0+1.6))});
    g.restore(); }
}

// ---------- 03 打断：一串步骤被戳一下，出错率 ×2、×3；回来要 25 分钟 ----------
const focusHits=()=>{ const l1=L('focus',1), l2=L('focus',2);
  return {x2:CUE('focus:1','翻倍',l1.t0+(l1.t1-l1.t0)*.45), x3:CUE('focus:1','翻三倍',l1.t1-.6), m25:CUE('focus:2','二十五分钟',l2.t1-1.2)}; };
function sFocus(t){ const id='focus';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=focusHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.3){ const out=P(t,l2.t0-.2,l2.t0+.3), a=(1-out)*eOut(P(t,l1.t0,l1.t0+.5));
    g.save(); g.globalAlpha*=a;
    txt('一步一步做的任务',80,890,{size:30,weight:700,color:C.mute});
    const n=12, x0=110, sp=78, y=975, hit=l1.t0+1.8;
    const head=clamp((t-l1.t0-.3)/.18,0,n);
    for(let i=0;i<n;i++){ const on=head>i; const x=x0+i*sp; const err=(t>H.x2-.1&&i===7)||(t>H.x3-.1&&i===10);
      if(i){ g.fillStyle=on?C.mute:C.line; g.fillRect(x-sp+16,y-2,sp-32,4); }
      g.fillStyle=err?C.red:on?C.ink:C.dim; g.beginPath(); g.arc(x,y,err?16:13,0,7); g.fill(); }
    if(t>hit-.1){ const u=eExpo(P(t,hit-.1,hit+.2)), f=1-P(t,hit+.4,hit+1.2); const x=x0+5.5*sp;
      g.save(); g.globalAlpha*=u*lerp(.5,1,f); rrect(x-60,y-80,120,50,12); g.fillStyle=C.red; g.fill();
      txt('2.8 秒',x,y-45,{size:28,font:NUM,weight:900,color:C.bg,align:'center'}); g.restore(); }
    const base=1070, unit=60;
    txt('之后的出错率',80,base-14,{size:30,weight:700,color:C.mute});
    const b2=eExpo(P(t,H.x2-.05,H.x2+.3)), b3=eExpo(P(t,H.x3-.05,H.x3+.3));
    const rows=[['没被打断',1,C.dim,1],['打断 2.8 秒',lerp(1,2,b2),C.amber,b2],['打断 4.4 秒',lerp(1,3,b3),C.red,b3]];
    rows.forEach(([lab,v,col,u],i)=>{ const yy=base+i*58; txt(lab,80,yy+30,{size:26,weight:700,color:C.ink});
      rrect(280,yy,unit*3.3*v,38,8); g.fillStyle=col; g.fill();
      if(i) txt('×'+(u>=1?(i+1):v.toFixed(1)),280+unit*3.3*v+16,yy+32,{size:40,font:NUM,weight:900,color:col,alpha:u>0?1:0}); });
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    const cx=290, cy=1040, R=140, sw=eInOut(P(t,l2.t0+.4,H.m25));
    g.save(); g.globalAlpha*=a; g.lineWidth=22;
    g.strokeStyle=C.line; g.beginPath(); g.arc(cx,cy,R,0,7); g.stroke();
    g.strokeStyle=C.amber; g.beginPath(); g.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*sw*25/60); if(sw>0) g.stroke();
    txt(String(Math.round(25*sw)),cx,cy+30,{size:96,font:NUM,weight:900,color:C.amber,align:'center'});
    txt('分钟',cx,cy+80,{size:30,weight:700,color:C.mute,align:'center'});
    txt('被打断的那件事',520,1000,{size:36,weight:700,color:C.ink,alpha:eOut(P(t,l2.t0+.5,l2.t0+1.1))});
    txt('平均要这么久才回得来',520,1056,{size:36,weight:700,color:C.ink,alpha:eOut(P(t,l2.t0+.8,l2.t0+1.4))});
    txt('24 名白领的现场跟踪',520,1110,{size:26,weight:500,color:C.mute,alpha:eOut(P(t,l2.t0+1.2,l2.t0+1.8))});
    g.restore(); }
}

// ---------- 04 熬夜：钟走到 0:10；睡前用设备 ×2 倍多 / ×2.7；手机请出卧室 ----------
const bedHits=()=>{ const l1=L('bedtime',1), l2=L('bedtime',2), l3=L('bedtime',3);
  return {clk:CUE('bedtime:1','零点十分',l1.t1-1.2), x2:CUE('bedtime:2','两倍多',l2.t0+(l2.t1-l2.t0)*.5), x27:CUE('bedtime:2','二点七倍',l2.t1-.8), out:CUE('bedtime:3','不进卧室',l3.t1-1)}; };
function sBedtime(t){ const id='bedtime';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=bedHits();
  itemFrameX(id,t,1e9);
  if(t>l1.t0 && t<l2.t0+.3){ const out=P(t,l2.t0-.2,l2.t0+.3), a=(1-out)*eOut(P(t,l1.t0,l1.t0+.5));
    g.save(); g.globalAlpha*=a;
    txt('2025 年 · 中国人平均',80,890,{size:30,weight:700,color:C.mute});
    const sl=eOut(P(t,l1.t0+.4,l1.t0+1.2));
    txt('夜里只睡',80,980,{size:30,weight:700,color:C.mute,alpha:sl});
    txt('6.97',80,1080,{size:110,font:NUM,weight:900,color:C.amber,alpha:sl});
    txt('小时',80+tw('6.97',110,NUM,900)+8,1076,{size:34,weight:700,color:C.amber,alpha:sl});
    const m=Math.round(lerp(22*60,24*60+10,eInOut(P(t,l1.t0+(l1.t1-l1.t0)*.45,H.clk+.1))));
    const hh=Math.floor(m/60)%24, mm=m%60, s=`${hh}:${String(mm).padStart(2,'0')}`, late=m>=24*60;
    const ca=eOut(P(t,l1.t0+(l1.t1-l1.t0)*.4,l1.t0+(l1.t1-l1.t0)*.5));
    txt('才入睡',1000,980,{size:30,weight:700,color:late?C.red:C.mute,align:'right',alpha:ca});
    txt(s,1000,1080,{size:110,font:NUM,weight:900,color:late?C.red:C.ink,align:'right',alpha:ca});
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    g.save(); g.globalAlpha*=a;
    txt('儿童青少年 · 睡前用手机平板的',80,890,{size:30,weight:700,color:C.mute});
    const X=80, unit=230, b1=eExpo(P(t,H.x2-.05,H.x2+.3)), b2=eExpo(P(t,H.x27-.05,H.x27+.3));
    g.save(); g.strokeStyle=C.mute; g.globalAlpha*=.55; g.lineWidth=2; g.setLineDash([6,8]); g.beginPath(); g.moveTo(X+unit,920); g.lineTo(X+unit,1200); g.stroke(); g.restore();
    txt('虚线 = 睡前不用的人',X,1240,{size:24,weight:500,color:C.mute});
    [['睡不够',lerp(1,2.17,b1),b1,'×2 倍多',970],['白天犯困',lerp(1,2.72,b2),b2,'×2.7',1100]].forEach(([lab,v,u,s,y])=>{
      txt(lab,X,y,{size:32,weight:900,color:C.ink});
      rrect(X,y+18,unit*v,50,8); g.fillStyle=u>0?C.red:C.dim; g.fill();
      txt(u>0?s:'×?',X+unit*v+16,y+60,{size:44,font:NUM,weight:900,color:u>0?C.red:C.mute}); });
    g.restore(); }
  if(t>l3.t0-.1){ const a=eOut(P(t,l3.t0,l3.t0+.5)), ex=eInOut(P(t,H.out-.9,H.out+.2));
    g.save(); g.globalAlpha*=a;
    g.strokeStyle=C.mute; g.lineWidth=5; rrect(120,900,560,300,18); g.stroke();
    g.fillStyle=C.bg; g.fillRect(670,990,30,150);
    rrect(170,1080,300,70,14); g.fillStyle=C.panel; g.fill(); g.strokeStyle=C.dim; g.stroke();
    rrect(180,1050,90,40,10); g.fillStyle=C.dim; g.fill();
    txt('卧室',150,950,{size:30,weight:700,color:C.mute});
    const px=lerp(540,880,ex), py=lerp(1040,1070,ex), col=ex>.7?C.green:C.amber;
    drawIcon('phone',px-45,py-50,90,1,col,5);
    txt('只放在卧室里不用，也差不多',150,1262,{size:30,weight:500,color:C.mute,alpha:1-ex});
    pop('手机不进卧室',540,1262,P(t,H.out-.05,H.out+.4),{size:56,font:SERIF,weight:900,color:C.green,align:'center'});
    g.restore(); }
}

// ---------- 05 工时：产出曲线，56 小时与 70 小时一样高 ----------
const hoursHit=()=>{ const l2=L('hours',2); return CUE('hours:2','白干',l2.t1-.8); };
function sHours(t){ const id='hours';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), hit=hoursHit();
  itemFrameX(id,t,1e9);
  if(t<l1.t0) return;
  const X0=150, X1=990, Y0=1190, Y1=930;
  const hx=h=>X0+(h-35)/(75-35)*(X1-X0);
  // 产出：49 前直线；之后变缓，约 63 达到最大，70 与 56 持平（示意，纵轴不标数值）
  const p49=49/63, v56=p49+(1-p49)*(1-Math.pow(1-7/14,2));
  const outp=h=>{ if(h<=49) return h/63; if(h<=63){ const u=(h-49)/14; return p49+(1-p49)*(1-Math.pow(1-u,2)); } return lerp(1,v56,(h-63)/7); };
  const oy=v=>Y0-(v-35/63)/(1-35/63)*(Y0-Y1);
  const a=eOut(P(t,l1.t0,l1.t0+.5)), dim=t>l3.t0?lerp(1,.12,P(t,l3.t0,l3.t0+.5)):1;
  g.save(); g.globalAlpha*=a;
  txt('每周工时 → 产出',80,880,{size:30,weight:700,color:C.mute,alpha:dim});
  g.strokeStyle=C.dim; g.lineWidth=2; g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X1,Y0); g.stroke();
  [35,49,56,63,70].forEach(h=>txt(String(h),hx(h),Y0+40,{size:24,font:NUM,weight:800,color:C.mute,align:'center'}));
  txt('小时 / 周',X1,Y0+76,{size:22,weight:500,color:C.mute,align:'right'});
  const dr=eInOut(P(t,l1.t0+.6,l1.t1-.3)), hEnd=lerp(35,70,dr);
  g.lineJoin='round'; g.lineCap='round';
  for(const [h0,h1,col] of [[35,49,C.green],[49,70,C.amber]]){ if(hEnd<=h0) continue;
    g.save(); g.strokeStyle=col; g.lineWidth=7; g.globalAlpha*=dim; g.beginPath();
    for(let h=h0;h<=Math.min(h1,hEnd)+1e-6;h+=.5){ const x=hx(h), y=oy(outp(h)); h===h0?g.moveTo(x,y):g.lineTo(x,y); } g.stroke(); g.restore(); }
  const k49=eOut(P(t,l1.t0+(l1.t1-l1.t0)*.3,l1.t0+(l1.t1-l1.t0)*.4)), kUp=eOut(P(t,l1.t0+(l1.t1-l1.t0)*.6,l1.t0+(l1.t1-l1.t0)*.7));
  g.save(); g.globalAlpha*=dim; g.strokeStyle=C.mute; g.lineWidth=2; g.setLineDash([6,8]); g.globalAlpha*=k49; g.beginPath(); g.moveTo(hx(49),Y0); g.lineTo(hx(49),Y1-60); g.stroke(); g.setLineDash([]);
  txt('49 小时以内',X0,Y1+20,{size:28,weight:900,color:C.green});
  txt('干多久出多少',X0,Y1+56,{size:26,weight:500,color:C.green}); g.restore();
  txt('再往上：多干一小时，多出的越来越少',hx(49)+14,Y1-70,{size:26,weight:700,color:C.amber,alpha:kUp*dim});
  if(t>l2.t0){ const u=eOut(P(t,l2.t0+.3,l2.t0+1.2)), y56=oy(v56);
    g.save(); g.globalAlpha*=u*dim;
    [56,70].forEach(h=>{ g.fillStyle=C.ink; g.beginPath(); g.arc(hx(h),oy(outp(h)),12,0,7); g.fill(); });
    g.strokeStyle=C.ink; g.lineWidth=2; g.setLineDash([4,6]); g.beginPath(); g.moveTo(hx(56),y56); g.lineTo(hx(70),y56); g.stroke(); g.setLineDash([]);
    g.restore();
    const w=eExpo(P(t,hit-.05,hit+.3));
    if(w>0){ g.save(); g.globalAlpha*=dim; g.fillStyle=C.red; g.fillRect(hx(56),Y0-4,(hx(70)-hx(56))*w,8); g.restore();
      g.save(); g.globalAlpha*=dim; pop('14 小时 = 白干',hx(63),y56+120,P(t,hit-.05,hit+.4),{size:52,font:SERIF,weight:900,color:C.red,align:'center'}); g.restore(); }
  }
  g.restore();
  if(t>l3.t0){ const u=P(t,l3.t0+.2,l3.t0+1.2);
    g.save(); g.globalAlpha*=eOut(P(t,l3.t0,l3.t0+.5))*.94; rrect(120,940,840,240,28); g.fillStyle=C.panel; g.fill(); g.restore();
    reveal('坎在哪不一定准',540,1030,u,{size:60,font:SERIF,weight:900,color:C.ink,align:'center'});
    reveal('方向可靠',540,1120,P(t,l3.t0+(l3.t1-l3.t0)*.6,l3.t0+(l3.t1-l3.t0)*.6+.8),{size:60,font:SERIF,weight:900,color:C.amber,align:'center'}); }
}

// ---------- 06 低落：四件事一张张点亮；12356 ----------
const MOODC=[{ic:'run',lab:'动起来'},{ic:'sun',lab:'多见光'},{ic:'moon',lab:'按时睡'},{ic:'talk',lab:'找人说'}];
const moodHit=()=>{ const l3=L('mood',3); return CUE('mood:3','一二三五六',l3.t0+(l3.t1-l3.t0)*.4); };
const moodOn=()=>{ const l1=L('mood',1), l2=L('mood',2); return [l1.t0+.2, l2.t0+(l2.t1-l2.t0)*.2, l2.t0+(l2.t1-l2.t0)*.5, l2.t0+(l2.t1-l2.t0)*.75]; };
function sMood(t){ const id='mood';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), hit=moodHit(), on=moodOn();
  itemFrameX(id,t,1e9);
  if(t<l1.t0) return;
  const barOut=eInOut(P(t,l2.t0-.2,l2.t0+.3));
  const a=eOut(P(t,l1.t0,l1.t0+.5));
  g.save(); g.globalAlpha*=a;
  MOODC.forEach((m,i)=>{ const u=P(t,on[i],on[i]+.4); const w=210, x=80+i*(w+26), y=880, h=140;
    rrect(x,y,w,h,20); g.fillStyle=C.panel; g.fill();
    if(u>0){ g.save(); g.strokeStyle=C.green; g.lineWidth=3; g.globalAlpha*=eOut(u); rrect(x,y,w,h,20); g.stroke(); g.restore(); }
    drawIcon(m.ic,x+(w-64)/2,y+14,64,1,u>0?C.green:C.dim,4);
    txt(m.lab,x+w/2,y+h-18,{size:32,weight:900,color:u>0?C.ink:C.mute,align:'center'}); });
  if(barOut<1){ g.save(); g.globalAlpha*=1-barOut;
    txt('218 项试验汇总 · 减轻抑郁的效果大小',80,1080,{size:28,weight:700,color:C.mute});
    [['快走 / 慢跑',.62],['瑜伽',.55],['力量训练',.49]].forEach(([lab,v],i)=>{ const t0=l1.t0+(l1.t1-l1.t0)*.45+i*.3, u=eInOut(P(t,t0,t0+.8));
      const y=1105+i*52; txt(lab,80,y+30,{size:28,weight:700,color:C.ink}); rrect(300,y,800*v*u,36,8); g.fillStyle=C.green; g.fill();
      if(u>0) txt((v*u).toFixed(2),300+800*v*u+14,y+30,{size:30,font:NUM,weight:900,color:C.green}); });
    g.restore(); }
  g.restore();
  if(t>l3.t0-.1){ const u=P(t,hit-.05,hit+.5);
    txt('想不开的时候，先打',80,1090,{size:36,weight:700,color:C.ink,alpha:eOut(P(t,l3.t0,l3.t0+.6))});
    if(u>0){ g.save(); g.globalAlpha*=clamp(u*3); txt('12356',80,1240,{size:150,font:NUM,weight:900,color:C.amber}); g.restore();
      txt('全国心理援助热线',80+tw('12356',150,NUM,900)+24,1190,{size:36,weight:900,color:C.ink,alpha:eOut(P(t,hit+.3,hit+.9))});
      txt('每天开通不少于 18 小时',80+tw('12356',150,NUM,900)+24,1236,{size:26,weight:500,color:C.mute,alpha:eOut(P(t,hit+.6,hit+1.2))}); }
  }
}

// ---------- 结尾：六件打勾 → 实际那块电池充回来 ----------
const OUTLAB=['睡够','咖啡趁早','挡住打断','到点就睡','别硬加班','先动起来'];
function outroStarts(){ const l0=L('outro',0); const w=OUTLAB.map(s=>s.length+1.4); const tot=w.reduce((a,b)=>a+b,0); let acc=0;
  return w.map(x=>{ const r=l0.t0+(l0.t1-l0.t0)*acc/tot; acc+=x; return r; }); }
const outroDone=()=>{ const l1=L('outro',1); return CUE('outro:1','来堵',l1.t1-.5); };
function sOutro(t){
  const l0=L('outro',0), l1=L('outro',1), l2=L('outro',2), s=SC.outro, st=outroStarts(), done=outroDone();
  const midOut=eInOut(P(t,l1.t0-.5,l1.t0+.2));
  g.save(); g.globalAlpha*=1-midOut;
  reveal('记住这六件',80,330,P(t,s.t0+.1,s.t0+1.0),{size:56,font:SERIF,weight:900,color:C.ink});
  for(let i=0;i<6;i++){ const col=i%2,row=Math.floor(i/2), x=80+col*470, y=400+row*236;
    const u=eOut(P(t,s.t0+.1+i*.07,s.t0+.7+i*.07)); if(u<=0) continue; const ck=P(t,st[i],st[i]+.35);
    g.save(); g.globalAlpha*=u; g.translate(0,(1-u)*30);
    rrect(x,y,450,204,26); g.fillStyle=C.panel; g.fill();
    if(ck>0){ g.save(); g.globalAlpha*=lerp(1,.45,P(t,st[i]+.35,st[i]+1.4)); g.strokeStyle=C.green; g.lineWidth=3; rrect(x,y,450,204,26); g.stroke(); g.restore(); }
    drawIcon(SEQ[i],x+36,y+42,120,1,ck>0?C.green:C.ink,5);
    txt(OUTLAB[i],x+182,y+124,{size:OUTLAB[i].length>3?44:50,font:SERIF,weight:900,color:ck>0?C.ink:C.mute});
    if(ck>0){ g.save(); g.globalAlpha*=eOut(ck); g.fillStyle=C.green; g.beginPath(); g.arc(x+410,y+40,22,0,7); g.fill(); g.restore(); drawIcon('check',x+390,y+20,40,ck,C.bg,6); }
    g.restore(); }
  g.restore();
  const endOut=eInOut(P(t,l2.t0-.3,l2.t0+.3));
  if(t>l1.t0-.5){ const a=eOut(P(t,l1.t0-.4,l1.t0+.2))*(1-endOut);
    const real=lerp(.35,.9,eInOut(P(t,l1.t0+.3,done)));
    reveal('一格一格，充回来',80,420,P(t,l1.t0+.2,l1.t0+1.2),{size:64,font:SERIF,weight:900,color:C.green,alpha:1-endOut});
    twoBatteries(560,.9,real,a,t);
  }
  if(t>l2.t0-.1){
    reveal('下一集',540,700,P(t,l2.t0,l2.t0+.6),{size:44,weight:500,color:C.mute,align:'center'});
    reveal('不要浪费时间',540,850,P(t,l2.t0+.3,l2.t0+1.3),{size:128,font:SERIF,weight:900,align:'center'});
    const cr=eOut(P(t,l2.t0+1.2,l2.t0+2.0));
    ['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写，同步自 2026-10-21 版本 · 不构成医疗建议']
      .forEach((s,i)=>txt(s,540,1080+i*48,{size:28,weight:500,color:C.mute,align:'center',alpha:cr}));
  }
}

const FN = {hook:sHook, sleep:sSleep, caffeine:sCaffeine, focus:sFocus, bedtime:sBedtime, hours:sHours, mood:sMood, outro:sOutro};

// ---------- 冲击点：画面震动 + 闪光 + 声音，同一时刻 ----------
const AMB='242,181,68', RED='255,82,50', GRN='61,214,140';
(function(){
  const Hk=hookT(), S=sleepHits(), Cf=cafHits(), F=focusHits(), B=bedHits();
  window.IMPACTS=[
    {t:Hk.ch0, k:.3, c:GRN, f:.45, sfx:'chime'},
    {t:S.two, k:1, c:RED, sfx:'boom', riser:1},
    {t:S.same, k:.45, c:AMB, sfx:'stamp'},
    {t:Cf.cut, k:.8, c:RED, sfx:'boom', riser:1},
    {t:Cf.diary, k:.55, c:RED, sfx:'stamp'},
    {t:Cf.two, k:.4, c:AMB, f:.45, sfx:'chime'},
    {t:F.x2, k:.6, c:AMB, sfx:'boom'},
    {t:F.x3, k:1, c:RED, sfx:'boom', riser:1},
    {t:B.clk, k:.7, c:RED, sfx:'boom'},
    {t:B.x27, k:.9, c:RED, sfx:'boom', riser:1},
    {t:B.out, k:.3, c:GRN, f:.5, sfx:'chime'},
    {t:hoursHit(), k:1, c:RED, sfx:'boom', riser:1},
    {t:moodHit(), k:.35, c:AMB, f:.5, sfx:'chime'},
    {t:outroDone(), k:.4, c:GRN, f:.6, sfx:'chime'},
  ];
})();
function buildEvents(EV){
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  SEQ.forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  IMPACTS.forEach(im=>{ EV.push({t:im.t,type:im.sfx}); if(im.riser) EV.push({t:im.t-.03,type:'riser'}); });
  EV.push({t:L('focus',1).t0+1.8,type:'pop'});
  moodOn().forEach(x=>EV.push({t:x,type:'pop'}));
  outroStarts().forEach(x=>EV.push({t:x+.05,type:'pop'}));
}
