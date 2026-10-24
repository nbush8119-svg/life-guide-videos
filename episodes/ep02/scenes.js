/* 第 2 集《不要慢慢死》— 核心意象「人生千月格」：按 80 岁算 960 个月，一个点一个月。
   开头：一颗点心跳 → 波纹铺满 960 → 末尾的月份一个个烧成灰、计数往下掉。
   每一件：图标先在画面中央「登场」（各自的烟、气泡、蒸汽、表盘、脚印），再退到角上让位给数据。
   关键数字落地时整屏震一下（IMPACTS，与低频 boom 同一时刻）。结尾：偷走的月份一个个绿着还回来。依赖 engine/stage.js。 */

// ---------- 本集图标（单位格 0..100） ----------
Object.assign(ICON, {
  cig:  [ rrPts(6,48,72,14,4), [[58,48],[58,62]], [[84,42],[89,32],[82,23],[88,12]] ],
  beer: [ [[40,92],[40,50],[46,38],[46,12],[54,12],[54,38],[60,50],[60,92],[40,92]], rrPts(40,60,20,18,2) ],
  can:  [ rrPts(30,12,40,80,9), [[30,26],[70,26]], [[30,78],[70,78]], [[44,7],[56,7]] ],
  cup:  [ [[18,46],[23,84],[65,84],[70,46],[18,46]], arcPts(71,62,11,-Math.PI/2,Math.PI/2,12), [[34,38],[29,28],[35,18]], [[50,38],[45,28],[51,18]], [[10,92],[78,92]] ],
  chair:[ [[28,8],[28,58]], [[28,58],[76,58]], [[32,58],[32,94]], [[72,58],[72,94]], [[28,30],[44,30]] ],
  feet: [ rrPts(20,44,20,38,10), arcPts(30,37,4,0,Math.PI*2,10), rrPts(58,14,20,38,10), arcPts(68,7,4,0,Math.PI*2,10) ],
});
const SEQ = ['smoke','alcohol','soda','tea','sit','walk'];
const ICONOF = {smoke:'cig', alcohol:'beer', soda:'can', tea:'cup', sit:'chair', walk:'feet'};
const ITEMS = {
 smoke:  {n:'01', zh:'第一件', title:['戒烟'],     sub:'越早越好，40 岁前戒最划算', cost:'成本 · 每天还省 ¥20–30'},
 alcohol:{n:'02', zh:'第二件', title:['少喝酒'],   sub:'按整体健康算，最划算的量是 0', cost:''},
 soda:   {n:'03', zh:'第三件', title:['不喝甜饮料'], sub:'换成无糖的，也不算解决', cost:''},
 tea:    {n:'04', zh:'第四件', title:['放凉再喝'], sub:'不喝滚烫的茶、汤和咖啡', cost:'成本 · 每次多等 2–3 分钟'},
 sit:    {n:'05', zh:'第五件', title:['别久坐'],   sub:'坐多久，不如动多少', cost:''},
 walk:   {n:'06', zh:'最后一件', title:['走路'],   sub:'最便宜的解药', cost:'成本 · ¥0'},
};
SEQ.forEach(id=>{ ICON[id]=ICON[ICONOF[id]]; });
function mixc(a,b,u){ const pa=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)), pb=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));
  return 'rgb('+pa.map((v,i)=>Math.round(lerp(v,pb[i],clamp(u)))).join(',')+')'; }
function softDot(x,y,r,col,a){ if(a<=0) return; const gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.save(); g.globalAlpha*=a; g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); g.restore(); }

// ---------- 人生千月格 ----------
const N=960, STOLEN=44;
const LAY = {
  big:   {cols:30, x0:(W-29*23)/2, y0:520, sp:23, r:8.2},
  strip: {cols:60, x0:(W-59*15.2)/2, y0:900, sp:15.2, r:5.3},
  top:   {cols:60, x0:(W-59*15.2)/2, y0:318, sp:15.2, r:5.3},
};
function gpos(i,lay){ const c=i%lay.cols, r=Math.floor(i/lay.cols); return [lay.x0+c*lay.sp, lay.y0+r*lay.sp]; }
function lifeGrid(state, m=0, alpha=1, A='big', B='strip'){
  if(alpha<=0) return; const la=LAY[A], lb=LAY[B];
  g.save(); g.globalAlpha*=alpha; const base=g.globalAlpha;
  for(let i=0;i<N;i++){
    const s=state(i); if(!s||s.a<=0) continue;
    const [x1,y1]=gpos(i,la), [x2,y2]=gpos(i,lb); const e=eInOut(m);
    const x=lerp(x1,x2,e), y=lerp(y1,y2,e), r=lerp(la.r,lb.r,e)*(s.r??1);
    if(s.glow>0){ g.globalAlpha=base*s.a*s.glow*.55; g.fillStyle=s.c; g.beginPath(); g.arc(x,y,r*2.6,0,7); g.fill(); }
    g.globalAlpha=base*s.a; g.fillStyle=s.c; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  }
  g.restore();
}
const CREAM='#F2EDE4', ASH='#2E2C29', EMBER='#FF7A2E';
// 关键词落点（engine/cues.py 从配音里识别出来的绝对时间），没有就用备用值
const CUE=(k,w,fb)=>{ const v=TL.cues&&TL.cues[k+':'+w]; return v==null?fb:v; };

// ---------- 开头：一颗心跳 → 960 个月 → 被一个一个偷走 ----------
function hookT(){ const a=L('hook',0), b=L('hook',1), c=L('hook',2);
  const fill0=a.t0+.45, fillDur=2.0, th0=b.t0+.5, step=Math.min(.075,(c.t0-.5-th0)/STOLEN);
  return {a,b,c,fill0,fillDur,th0,step}; }
function sHook(t){
  const {a,b,c,fill0,fillDur,th0,step}=hookT();
  const G=LAY.big, rows=N/G.cols;
  const gcx=G.x0+(G.cols-1)/2*G.sp, gcy=G.y0+(rows-1)/2*G.sp, maxD=Math.hypot((G.cols-1)/2*G.sp,(rows-1)/2*G.sp);
  const seed=(rows/2)*G.cols+G.cols/2;
  const toTop=eInOut(P(t,c.t0-.25,c.t0+.75)), gone=P(t,c.t1-.05,c.t1+.4);
  const stolenAt=k=>th0+k*step;                         // k = 0 是最后一个月
  lifeGrid(i=>{
    const [x,y]=gpos(i,G); const d=Math.hypot(x-gcx,y-gcy)/maxD;
    const ti=fill0+fillDur*Math.pow(d,1.1); const u=P(t,ti,ti+.4);
    if(i===seed && u<=0){ const p=Math.pow(Math.max(0,Math.sin(t*Math.PI*64/60)),6); return {c:C.amber,a:.95,r:2.0+.6*p,glow:.5+.5*p}; }
    if(u<=0) return null;
    let st={c:u<1?mixc(C.amber,CREAM,u):CREAM, a:.92, r:lerp(1.9,1,eOut(u)), glow:(1-u)*.9};
    const k=N-1-i; if(k<STOLEN){ const td=stolenAt(k); if(t>td){ const v=P(t,td,td+.45);
      st = v<1 ? {c:v<.4?'#FFE2A8':EMBER, a:.95, r:lerp(1.8,.9,v), glow:1-v} : {c:ASH,a:.95,r:.85}; } }
    return st;
  }, toTop, 1-gone, 'big','top');
  // 被偷走的月份化成灰往下掉
  if(toTop<1){ g.save(); const ba=g.globalAlpha*(1-toTop);
    for(let k=0;k<STOLEN;k++){ const d=t-stolenAt(k)-.3; if(d<=0||d>1.8) continue;
      const [x,y]=gpos(N-1-k,G); const px=x+Math.sin(k*2.3+d*2.6)*16*d, py=y+250*d*d+24*d;
      g.globalAlpha=ba*(1-d/1.8)*.8; g.fillStyle=d<.3?EMBER:'#5E5650'; g.beginPath(); g.arc(px,py,lerp(5,2.2,d/1.8),0,7); g.fill(); }
    g.restore(); }
  // 计数：先 1 → 960，再一个月一个月往下掉
  const fa=(1-toTop)*eOut(P(t,a.t0-.25,a.t0+.35));
  const lit=Math.max(1,Math.round(N*clamp(P(t,fill0,fill0+fillDur+.25))));
  const stolen=t<th0?0:Math.min(STOLEN,Math.floor((t-th0)/step)+1);
  const cnt=lit-stolen;
  g.save(); g.globalAlpha*=fa;
  txt('按 80 岁算，一辈子',80,330,{size:40,weight:500,color:C.mute});
  txt(String(cnt),80,470,{size:150,font:NUM,weight:900,color:stolen?mixc(C.amber,C.red,.4+.6*stolen/STOLEN):C.amber});
  txt('个月',80+tw(String(Math.max(cnt,100)),150,NUM,900)+16,462,{size:64,font:SERIF,weight:900});
  g.restore();
  if(t>b.t0){ g.save(); g.globalAlpha*=(1-toTop);
    reveal('一个月一个月，被偷走',566,462,P(t,b.t0+.3,b.t0+1.5),{size:40,weight:700,color:C.red}); g.restore(); }
  // 六笔账：千月格缩成顶上的一条，六张卡落下
  if(t>c.t0-.2){ g.save(); g.globalAlpha*=1-gone;
    txt('每个点 = 1 个月 · 灰的是被偷走的',540,600,{size:26,weight:500,color:C.mute,align:'center',alpha:eOut(P(t,c.t0+.5,c.t0+1.1))});
    reveal('六笔慢性的账',80,830,P(t,c.t0+.2,c.t0+1.2),{size:84,font:SERIF,weight:900});
    for(let i=0;i<6;i++){ const p=gridPos(i); const u=P(t,c.t0+.45+i*.16,c.t0+1.2+i*.16);
      cell(p.x,p.y,u); drawIcon(SEQ[i],p.x+80,p.y+18,140,u,C.ink,5); }
    g.restore(); }
}

// ---------- 每一件的开场：图标在中央登场，再退到角上 ----------
const HERO={cx:540, cy:1050, s:320};
function heroBack(id,t,cx,cy,s,a){
  const u=s/100; g.save(); const ba=g.globalAlpha*a;
  for(let j=0;j<3;j++){ const ph=((t*.7+j/3)%1); g.globalAlpha=ba*(1-ph)*.28; g.strokeStyle=C.amber; g.lineWidth=2;
    g.beginPath(); g.arc(cx,cy,s*.64+ph*s*.34,0,7); g.stroke(); }
  if(id==='sit'){ // 一天 24 小时，坐着的钟点一格格变红
    const R=s*.74, lit=clamp((t-SC.sit.t0-.7)/2.6)*10;
    for(let h=0;h<24;h++){ const an=-Math.PI/2+h/24*Math.PI*2, on=h<lit, L2=on?28:16;
      g.globalAlpha=ba*(on?.95:.55); g.strokeStyle=on?C.red:C.dim; g.lineWidth=on?7:4; g.lineCap='round';
      g.beginPath(); g.moveTo(cx+Math.cos(an)*R,cy+Math.sin(an)*R); g.lineTo(cx+Math.cos(an)*(R+L2),cy+Math.sin(an)*(R+L2)); g.stroke(); }
    if(lit>0){ g.globalAlpha=ba; txt(Math.min(10,Math.floor(lit)+1)+' 小时',cx+R+44,cy-R+10,{size:34,font:NUM,weight:900,color:C.red}); }
  }
  if(id==='walk'){ // 脚印绕着走一圈
    const R=s*.8, n=16;
    for(let k=0;k<n;k++){ const tk=SC.walk.t0+.6+k*.2, d=t-tk; if(d<0) continue; const an=-Math.PI*.9+k/n*Math.PI*2*.95;
      const side=k%2?1:-1, rr=R+side*14; const fa=d<1.6?1:clamp(1-(d-1.6)/1.2)*.6+.4;
      footprint(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,an+Math.PI,1.05,k>7?C.green:C.mute,ba*eOut(clamp(d/.25))*fa); }
  }
  g.restore();
}
function heroFront(id,t,x,y,s,a){
  const u=s/100; g.save(); const ba=g.globalAlpha*a;
  if(id==='smoke'){ // 烟头的火星 + 往上飘的烟
    const glow=.55+.35*Math.sin(t*5.3)+.1*Math.sin(t*17);
    g.globalAlpha=ba; softDot(x+78*u,y+55*u,26*u,'rgba(255,122,46,0.9)',glow);
    for(let j=0;j<14;j++){ const ph=((t*.32+j/14)%1); const px=x+(86+ph*14)*u+Math.sin(ph*5+j*1.7)*10*u*ph, py=y+(36-ph*95)*u;
      g.globalAlpha=1; softDot(px,py,(7+ph*22)*u,'rgba(170,164,154,0.5)',ba*Math.sin(ph*Math.PI)*.75); }
  }
  if(id==='alcohol'||id==='soda'){ // 瓶里、罐口的气泡
    const box=id==='alcohol'?{x0:43,x1:57,y0:90,y1:48}:{x0:36,x1:64,y0:20,y1:-26};
    g.strokeStyle=C.amber; g.lineWidth=2.5;
    for(let j=0;j<16;j++){ const ph=((t*.55+hash(j+1))%1); const bx=x+lerp(box.x0,box.x1,hash(j+9))*u+Math.sin(ph*9+j)*1.5*u, by=y+lerp(box.y0,box.y1,ph)*u;
      g.globalAlpha=ba*Math.sin(ph*Math.PI)*.85; g.beginPath(); g.arc(bx,by,(1+hash(j+3)*1.4)*u*.9,0,7); g.stroke(); }
  }
  if(id==='tea'){ // 越飘越旺的蒸汽
    g.lineCap='round';
    for(let j=0;j<4;j++){ const sx=x+(28+j*13)*u; g.globalAlpha=ba*.5; g.strokeStyle=j%2?C.ink:C.amber; g.lineWidth=4;
      g.beginPath(); for(let k=0;k<=18;k++){ const yy=y+(36-k*3.6)*u, xx=sx+Math.sin(k*.55-t*3.2+j*1.3)*5*u*(k/18+.2); k?g.lineTo(xx,yy):g.moveTo(xx,yy); }
      g.stroke(); }
  }
  g.restore();
}
function itemFrameX(id,t,costAt){
  const s=SC[id], it=ITEMS[id], l0=L(id,0), l1=L(id,1), k=SEQ.indexOf(id), ti=t-s.t0;
  // 编号从上一件滚过来
  const roll=eExpoIO(P(ti,0,0.7));
  g.save(); g.beginPath(); g.rect(60,280,560,250); g.clip();
  const prev=k===0?'00':ITEMS[SEQ[k-1]].n;
  [prev,it.n].forEach((nn,j)=>{ const yy=500+(j===0? -roll*240 : (1-roll)*240);
    g.font=`900 250px ${NUM}`; g.lineWidth=4; g.strokeStyle=j?C.amber:C.dim; g.strokeText(nn,74,yy);
    if(j){ g.save(); g.globalAlpha*=.12; g.fillStyle=C.amber; g.fillText(nn,74,yy); g.restore(); } });
  g.restore();
  reveal(it.zh,400,330,P(ti,.35,1.0),{size:40,weight:500,color:C.mute});
  // 图标：卡片位 → 中央登场 → 角上
  const gp=gridPos(k), a1=eExpoIO(P(ti,0.05,0.9)), a2=eExpoIO(P(t,l1.t0-.3,l1.t0+.5));
  let isz=lerp(lerp(140,HERO.s,a1),280,a2);
  let ix=lerp(lerp(gp.x+80,HERO.cx-HERO.s/2,a1),720,a2), iy=lerp(lerp(gp.y+18,HERO.cy-HERO.s/2,a1),300,a2);
  const cx=ix+isz/2, cy=iy+isz/2, heroA=a1*(1-a2);
  if(heroA>0) heroBack(id,t,cx,cy,isz,heroA);
  g.save(); g.globalAlpha*=.92; g.beginPath(); g.arc(cx,cy,isz*.62,0,7); g.fillStyle=C.panel; g.fill(); g.restore();
  if(heroA>0) softDot(cx,cy,isz*.7,'rgba(242,181,68,0.10)',heroA);
  drawIcon(id,ix,iy,isz,1,C.amber,lerp(5,7.5,heroA)+2*a2);
  if(heroA>0) heroFront(id,t,ix,iy,isz,heroA);
  // 标题
  const ts=Math.min(116, Math.floor(116*600/Math.max(1,tw(it.title[0],116,SERIF,900))));
  reveal(it.title[0],80,700,P(t,l0.t0,l0.t0+.9),{size:ts,font:SERIF,weight:900});
  reveal(it.sub,80,786,P(t,l0.t0+.5,l0.t0+1.6),{size:44,weight:500,color:C.mute});
  const dv=eOut(P(t,l0.t0+.4,l0.t0+1.4)); g.fillStyle=C.line; g.fillRect(80,830,920*dv,3);
  if(it.cost) chip(it.cost,80,1176,P(t,costAt,costAt+.6));
}

// ---------- 01 烟：十年烧成灰，九成重新点亮 ----------
function smokeT(){ const l1=L('smoke',1), l2=L('smoke',2); const b0=l1.t0+1.0, bEnd=CUE('smoke:1','十年',b0+2.8), rEnd=CUE('smoke:2','九成',l2.t0+3.1);
  return {l1,l2,b0,bDur:Math.max(1.5,bEnd-b0),r0:Math.max(l2.t0+.9,rEnd-2.4),rDur:Math.min(2.4,rEnd-l2.t0-.9)}; }
function sSmoke(t){ const id='smoke';
  const {l1,l2,b0,bDur,r0,rDur}=smokeT(), l3=L(id,3);
  itemFrameX(id,t,l3.t0+.1);
  const gin=eOut(P(t,l1.t0,l1.t0+.8)), gout=eInOut(P(t,l3.t0-.2,l3.t0+.4));
  let burned=0;
  lifeGrid(i=>{
    const sweep=P(t,l1.t0+(i%60)/60*.5,l1.t0+.5+(i%60)/60*.5); if(sweep<=0) return null;
    const k=N-1-i;
    if(k>=120) return {c:CREAM,a:.85*sweep};
    const tb=b0+k/120*bDur; let st={c:CREAM,a:.85};
    if(t>tb){ const v=P(t,tb,tb+.45); burned++;
      st = v<1 ? {c:v<.5?'#FFD27A':EMBER,a:.95,r:lerp(1.6,1,v),glow:1-v} : {c:ASH,a:.9,r:.85}; }
    const kk=119-k;
    if(kk<108){ const tr=r0+kk/108*rDur; if(t>tr){ const v=P(t,tr,tr+.4); st={c:C.green,a:.95,r:lerp(1.5,1,v),glow:1-v}; } }
    return st;
  }, 1, gin*(1-gout), 'strip','strip');
  g.save(); g.globalAlpha*=1-gout;
  txt('每个点 = 1 个月 · 每行 = 5 年',88,880,{size:26,weight:500,color:C.mute,alpha:gin});
  if(t>b0 && t<l2.t0+.6){ const a=1-P(t,l2.t0+.2,l2.t0+.6);
    txt('−'+Math.min(120,burned)+' 个月',88,1215,{size:64,font:NUM,weight:900,color:C.red,alpha:a});
    txt('少活 10 年以上',88+tw('−120 个月',64,NUM,900)+24,1208,{size:40,weight:900,color:C.red,alpha:a*eOut(P(t,b0+bDur*.8,b0+bDur+.3))}); }
  if(t>l2.t0+.4){ const a=eOut(P(t,l2.t0+.4,l2.t0+.9));
    txt('40 岁前戒掉',88,1215,{size:44,weight:900,color:C.green,alpha:a});
    txt('额外死亡风险抹掉约 90%',88+tw('40 岁前戒掉',44)+24,1213,{size:40,weight:700,color:C.ink,alpha:a*eOut(P(t,r0+rDur*.6,r0+rDur))}); }
  g.restore();
}

// ---------- 02 酒：2.5 升啤酒、少活的年数、最划算的量是 0 ----------
function beerCan(x,y,fill,alpha){
  g.save(); g.globalAlpha*=alpha;
  rrect(x,y,110,190,16); g.strokeStyle=C.mute; g.lineWidth=4; g.stroke();
  g.save(); rrect(x,y,110,190,16); g.clip(); const h=190*fill;
  g.fillStyle=C.amber; g.fillRect(x,y+190-h,110,h);
  g.fillStyle='rgba(255,255,255,.65)'; if(fill>0.02) g.fillRect(x,y+190-h,110,8); g.restore();
  txt('500 mL',x+55,y+228,{size:24,weight:500,color:C.mute,align:'center'}); g.restore();
}
function monthRow(x,y,n,lost,lostMax,t0,t,label,sub){
  g.save(); const ba=g.globalAlpha;
  for(let i=0;i<n;i++){ const k=n-1-i; let col=CREAM, a=.8, r=7;
    const tk=t0+k*.035;
    if(k<lostMax && t>tk){ const v=P(t,tk,tk+.3); col = k<lost ? (v<.6?EMBER:C.red) : '#7A2A1E'; a=.95; r=lerp(9,7,v); }
    g.fillStyle=col; g.globalAlpha=ba*a; g.beginPath(); g.arc(x+i*14.4,y,r,0,7); g.fill(); }
  g.restore();
  txt(label,80,y-26,{size:32,weight:700,color:C.ink}); txt(sub,1000,y-26,{size:36,font:NUM,weight:900,color:C.red,align:'right',alpha:clamp(P(t,t0+.4,t0+1.2))});
}
const alcZero=()=>{ const l3=L('alcohol',3); return CUE('alcohol:3','零',l3.t1-.6); };
function sAlcohol(t){ const id='alcohol';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  itemFrameX(id,t,1e9);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4);
    for(let i=0;i<5;i++){ const f=eInOut(P(t,l1.t0+.6+i*.45,l1.t0+1.3+i*.45)); beerCan(98+i*186,880,f,(1-out)*eOut(P(t,l1.t0+.2+i*.1,l1.t0+.6+i*.1))); }
    g.save(); g.globalAlpha*=1-out;
    reveal('2.5 L 啤酒 ≈ 100 g 纯酒精',80,1170,P(t,l1.t0+2.6,l1.t0+3.6),{size:40,weight:900,color:C.amber});
    reveal('每周超过这个量，喝得越多，死得越早',80,1222,P(t,l1.t0+3.4,l1.t0+4.4),{size:30,weight:500,color:C.mute});
    g.restore(); }
  if(t>l2.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3);
    g.save(); g.globalAlpha*=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    txt('40 岁时，每周喝',80,880,{size:28,weight:500,color:C.mute});
    monthRow(108,975,60,12,24,l2.t0+.6,t,'200–350 g / 周','−1–2 年');
    monthRow(108,1105,60,48,60,l2.t0+(l2.t1-l2.t0)*.55,t,'超过 350 g / 周','−4–5 年');
    txt('每个点 = 1 个月',80,1180,{size:24,weight:500,color:C.mute});
    g.restore(); }
  if(t>l3.t0-.1){ const zt=alcZero(), e=eExpo(P(t,zt-.03,zt+.3));
    const cd=eInOut(P(t,l3.t0+.5,zt-.05)), ca=eOut(P(t,l3.t0+.3,l3.t0+.8))*(1-e);
    if(ca>0){ const v=Math.round(350*(1-cd)); txt(String(v),540,1100,{size:240,font:NUM,weight:900,color:mixc(C.red,'#5A5650',cd),align:'center',alpha:ca*.9}); }
    g.save(); g.globalAlpha*=e; g.translate(540,1120); g.scale(lerp(1.7,1,e),lerp(1.7,1,e));
    txt('0',0,0,{size:320,font:NUM,weight:900,color:C.amber,align:'center'}); g.restore();
    txt('克 / 周 · 按整体健康算最划算',540,1200,{size:32,weight:700,color:C.ink,align:'center',alpha:eOut(P(t,l3.t0+.5,l3.t0+1.1))});
  }
}

// ---------- 03 甜饮料：易拉罐翻面成「无糖」，风险反而更高 ----------
function sodaCan(x,y,flip,alpha){
  const sx=Math.cos(flip*Math.PI); const zero=flip>.5;
  g.save(); g.globalAlpha*=alpha; g.translate(x+80,y); g.scale(Math.abs(sx)<.04?.04:Math.abs(sx),1);
  rrect(-80,0,160,300,26); g.fillStyle=zero?'#1C1C20':'#C8341F'; g.fill(); g.strokeStyle=zero?C.mute:'#FF7A5E'; g.lineWidth=4; g.stroke();
  g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(-56,16,18,268);
  txt(zero?'无糖':'含糖',0,150,{size:52,font:SERIF,weight:900,color:zero?C.ink:'#FFF3E6',align:'center'});
  txt(zero?'0 kcal':'SUGAR',0,200,{size:26,font:NUM,weight:800,color:zero?C.mute:'#FFD2C4',align:'center'});
  g.restore();
}
const sodaHit=()=>{ const l2=L('soda',2); return CUE('soda:2','四分之一',l2.t0+(l2.t1-l2.t0)*.8); };
function sSoda(t){ const id='soda';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), hit=sodaHit();
  itemFrameX(id,t,1e9);
  const vis=1-P(t,l3.t0-.1,l3.t0+.4);
  if(t>l1.t0 && vis>0){
    const flip=eInOut(P(t,l2.t0+.6,l2.t0+1.3));
    sodaCan(90,880,flip,vis*eOut(P(t,l1.t0+.2,l1.t0+.8)));
    const X=340, base=1180, unit=230;
    g.save(); g.globalAlpha*=vis;
    g.strokeStyle=C.mute; g.lineWidth=2; g.setLineDash([8,8]); g.beginPath(); g.moveTo(X+20,base-unit); g.lineTo(1000,base-unit); g.stroke(); g.setLineDash([]);
    txt('1.0',X+12,base-unit+9,{size:24,font:NUM,weight:800,color:C.mute,align:'right'});
    txt('虚线 = 几乎不喝的人',X+40,base+82,{size:24,weight:500,color:C.mute});
    const s1=CUE('soda:1','两成',l1.t1-.6), b1=eInOut(P(t,Math.max(l1.t0+.9,s1-1.6),s1+.1)), b2=eExpo(P(t,hit-.05,hit+.3));
    const h1=unit*lerp(1,1.21,b1), h2=unit*lerp(1,1.26,b2);
    rrect(X+40,base-h1,240,h1,10); g.fillStyle='#C8341F'; g.fill();
    txt('+'+Math.round(21*b1)+'%',X+160,base-h1-20,{size:56,font:NUM,weight:900,color:C.red,align:'center'});
    txt('含糖 · 每天 2 份+',X+160,base+40,{size:26,weight:700,color:C.ink,align:'center'});
    if(t>l2.t0+1.2){ const e=eOut(P(t,l2.t0+1.2,l2.t0+1.6)); g.save(); g.globalAlpha*=e;
      rrect(X+340,base-h2,240,h2,10); g.fillStyle='#3A3A42'; g.fill(); g.strokeStyle=C.red; g.lineWidth=4; g.stroke();
      txt(b2>0?'+'+Math.round(26*b2)+'%':'?',X+460,base-h2-20,{size:56,font:NUM,weight:900,color:b2>0?C.red:C.mute,align:'center'});
      txt('无糖 · 每天 2 杯+',X+460,base+40,{size:26,weight:700,color:C.ink,align:'center'});
      g.restore(); }
    g.restore();
  }
  if(t>l3.t0){ const a=P(t,l3.t0+.2,l3.t0+1.2), b=P(t,l3.t0+(l3.t1-l3.t0)*.6,l3.t0+(l3.t1-l3.t0)*.6+1);
    reveal('不是代糖更毒',80,960,a,{size:72,font:SERIF,weight:900,color:C.mute});
    g.save(); g.globalAlpha*=eOut(a); g.strokeStyle=C.mute; g.lineWidth=5; g.beginPath(); g.moveTo(80,935); g.lineTo(80+tw('不是代糖更毒',72,SERIF,900)*eExpo(P(t,l3.t0+1,l3.t0+1.4)),935); g.stroke(); g.restore();
    reveal('「换无糖就没事」没有证据',80,1060,P(t,l3.t0+1.2,l3.t0+2.2),{size:48,weight:900});
    reveal('最稳的：白水',80,1170,b,{size:64,font:SERIF,weight:900,color:C.green});
  }
}

// ---------- 04 烫茶：×8 与 4 分钟秒表 ----------
function teaCup(x,y,heat,alpha,t){
  g.save(); g.globalAlpha*=alpha;
  drawIcon('cup',x,y,150,1,heat>1.5?C.red:heat>.5?C.amber:C.ink,6);
  g.strokeStyle=heat>1.5?C.red:C.mute; g.lineWidth=4; g.lineCap='round'; const ba=g.globalAlpha;
  for(let s=0;s<Math.round(1+heat*1.5);s++){ g.beginPath(); for(let k=0;k<=12;k++){ const yy=y+20-k*7, xx=x+40+s*22+Math.sin(k*.8+t*5+s)*6; k?g.lineTo(xx,yy):g.moveTo(xx,yy);} g.globalAlpha=ba*.6; g.stroke(); }
  g.restore();
}
const teaHits=()=>{ const l1=L('tea',1), l2=L('tea',2); return {x8:CUE('tea:1','八倍',l1.t0+(l1.t1-l1.t0)*.9), x5:CUE('tea:2','五倍',l2.t0+(l2.t1-l2.t0)*.9), eq1:CUE('tea:2','等四分钟',l2.t0+(l2.t1-l2.t0)*.5)}; };
function sTea(t){ const id='tea';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=teaHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4); const a=(1-out);
    txt('食管癌风险 · 相对喝温茶',80,900,{size:30,weight:700,color:C.mute,alpha:a*eOut(P(t,l1.t0+.2,l1.t0+.8))});
    const cols=[{lab:'温',v:1,c:C.ink},{lab:'热',v:2.07,c:C.amber},{lab:'很烫',v:8.16,c:C.red}];
    cols.forEach((o,i)=>{ const x=80+i*290, appear=eOut(P(t,l1.t0+.2+i*.35,l1.t0+.7+i*.35));
      teaCup(x,1080,i,a*appear,t);
      const grow=i<2?eInOut(P(t,l1.t0+.9+i*.4,l1.t0+1.7+i*.4)):eExpo(P(t,H.x8-.05,H.x8+.3));
      const h=27*o.v*grow; g.save(); g.globalAlpha*=a*appear; rrect(x+164,1235-h,56,h,8); g.fillStyle=o.c; g.fill(); g.restore();
      txt(o.lab,x+75,1272,{size:32,weight:900,color:o.c,align:'center',alpha:a*appear});
    });
    const s=eExpo(P(t,H.x8-.05,H.x8+.3));
    if(s>0){ g.save(); g.globalAlpha*=a*s; g.translate(1010,990); g.scale(lerp(1.7,1,s),lerp(1.7,1,s));
      txt('×8',0,0,{size:180,font:NUM,weight:900,color:C.red,align:'right'}); g.restore(); }
  }
  if(t>l2.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    const cx=280, cy=1060, R=150;
    const sweep=eInOut(P(t,l2.t0+.5,l2.t0+2.6))*4;
    g.save(); g.globalAlpha*=a; g.lineWidth=24; g.lineCap='butt'; const ba=g.globalAlpha;
    g.strokeStyle=C.line; g.beginPath(); g.arc(cx,cy,R,0,7); g.stroke();
    const ang=m=>-Math.PI/2+m/5*Math.PI*2;
    g.strokeStyle=C.red; g.beginPath(); g.arc(cx,cy,R,ang(0),ang(Math.min(2,sweep))); g.stroke();
    if(sweep>2){ g.strokeStyle=C.amber; g.globalAlpha=ba*.5; g.beginPath(); g.arc(cx,cy,R,ang(2),ang(Math.min(4,sweep))); g.stroke(); g.globalAlpha=ba; }
    if(sweep>=4){ g.strokeStyle=C.green; g.beginPath(); g.arc(cx,cy,R,ang(4),ang(5)); g.stroke(); }
    g.strokeStyle=C.ink; g.lineWidth=6; g.lineCap='round'; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(ang(sweep))*(R-30),cy+Math.sin(ang(sweep))*(R-30)); g.stroke();
    g.fillStyle=C.ink; g.beginPath(); g.arc(cx,cy,10,0,7); g.fill();
    const mm=Math.floor(sweep), ss=Math.floor((sweep-mm)*60);
    txt(`${mm}:${String(ss).padStart(2,'0')}`,cx,cy+R+70,{size:48,font:NUM,weight:800,color:C.ink,align:'center'});
    g.restore();
    const r1=eOut(P(t,l2.t0+.6,l2.t0+1.2)), r2=eOut(P(t,H.eq1,H.eq1+.6)), r3=eExpo(P(t,H.x5-.05,H.x5+.3));
    txt('倒出 < 2 分钟就喝',520,960,{size:36,weight:700,color:C.ink,alpha:a*r1});
    if(r3>0){ g.save(); g.globalAlpha*=a*r3; g.translate(520,1080); g.scale(lerp(1.6,1,r3),lerp(1.6,1,r3)); txt('×5',0,0,{size:120,font:NUM,weight:900,color:C.red}); g.restore(); }
    txt('等 4 分钟以上',520,1160,{size:36,weight:700,color:C.green,alpha:a*r2});
    txt('= 1',520+tw('等 4 分钟以上',36)+20,1162,{size:44,font:NUM,weight:900,color:C.green,alpha:a*r2});
  }
}

// ---------- 05 久坐：两项研究分开画，不混成一根柱子 ----------
const sitHits=()=>{ const l1=L('sit',1), l2=L('sit',2); return {x26:CUE('sit:1','二点六倍',l1.t0+(l1.t1-l1.t0)*.85), r0:CUE('sit:2','六十',l2.t0+(l2.t1-l2.t0)*.25), r1:CUE('sit:2','抵消',l2.t1-.6)}; };
function sSit(t){ const id='sit';
  const l1=L(id,1), l2=L(id,2), H=sitHits();
  itemFrameX(id,t,1e9);
  if(t<l1.t0) return;
  const unit=300, X=80;
  const grow=eExpo(P(t,H.x26-.05,H.x26+.35));
  const a=eOut(P(t,l1.t0,l1.t0+.5)), dimA=1-.5*eInOut(P(t,l2.t0,l2.t0+.6));
  g.save(); g.globalAlpha*=a;
  // ×1 参照虚线
  g.save(); g.strokeStyle=C.mute; g.globalAlpha*=.55; g.lineWidth=2; g.setLineDash([6,8]); g.beginPath(); g.moveTo(X+unit,900); g.lineTo(X+unit,t>l2.t0?1250:1090); g.stroke(); g.restore();
  g.save(); g.globalAlpha*=dimA;
  txt('美国加速度计研究',X,880,{size:24,weight:500,color:C.mute});
  txt('坐得最少',X,925,{size:30,weight:700,color:C.mute});
  rrect(X,940,unit,36,8); g.fillStyle=C.dim; g.fill(); txt('×1',X+unit+18,972,{size:36,font:NUM,weight:900,color:C.mute});
  txt('坐得最久',X,1028,{size:30,weight:700,color:C.ink});
  const v=lerp(1,2.63,grow); rrect(X,1043,unit*v,46,8); g.fillStyle=C.red; g.fill();
  txt(grow<=0?'×?':'×'+(grow>=1?'2.6':v.toFixed(1)),X+unit*v+18,1082,{size:52,font:NUM,weight:900,color:C.red});
  g.restore();
  if(t>l2.t0){ const b=eOut(P(t,l2.t0+.2,l2.t0+.8)), ru=eInOut(P(t,H.r0,H.r1));
    g.save(); g.globalAlpha*=b;
    txt('百万人汇总 · 每天坐 8 小时以上的人',X,1140,{size:24,weight:500,color:C.mute});
    txt('每天动够 60–75 分钟',X,1186,{size:30,weight:700,color:C.green});
    txt(Math.round(75*ru)+' 分钟',1000,1186,{size:34,font:NUM,weight:900,color:C.green,align:'right',alpha:ru>0?1:0});
    if(ru>0){ rrect(X,1202,unit*1.04*ru,46,8); g.fillStyle=C.green; g.fill(); }
    txt('×1.04',X+unit*1.04*ru+18,1241,{size:52,font:NUM,weight:900,color:C.green,alpha:eOut(P(t,H.r1-.2,H.r1+.3))});
    g.restore(); }
  g.restore();
}

// ---------- 06 走路：脚印、步数与曲线 ----------
function footprint(x,y,ang,s,col,a){ if(a<=0) return; g.save(); g.globalAlpha*=a; g.translate(x,y); g.rotate(ang); g.fillStyle=col;
  g.beginPath(); g.ellipse(0,0,10*s,20*s,0,0,7); g.fill(); g.beginPath(); g.arc(0,-28*s,6*s,0,7); g.fill(); g.restore(); }
const walkHit=()=>{ const l1=L('walk',1); return CUE('walk:1','四成半',l1.t0+(l1.t1-l1.t0)*.88); };
function sWalk(t){ const id='walk';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), hit=walkHit();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4), a=1-out;
    const steps=22; for(let i=0;i<steps;i++){ const ti=l1.t0+.3+i*.2; const u=P(t,ti,ti+.25); if(u<=0)continue;
      const f=i/(steps-1); const x=90+f*900, y=1225-Math.sin(f*Math.PI)*60+(i%2?18:-18);
      footprint(x,y,Math.PI/2+.15*(i%2?1:-1)-Math.cos(f*Math.PI)*.25,1,i>11?C.green:C.mute,a*eOut(u)*(.4+.6*f)); }
    const c1=eOut(P(t,l1.t0+.3,l1.t0+1.5)), c2=eOut(P(t,l1.t0+1.3,l1.t0+3.0));
    g.save(); g.globalAlpha*=a;
    counter(3553*c1,80,960,72,C.mute); txt('步 / 天',80+tw('3,553',72,NUM,800)+12,960,{size:30,weight:700,color:C.mute,alpha:c1});
    counter(3553+(7842-3553)*c2,80,1070,96,C.ink); txt('步 / 天',80+tw('7,842',96,NUM,800)+12,1070,{size:34,weight:700,color:C.ink,alpha:c2});
    const d=eExpo(P(t,hit-.05,hit+.35));
    g.save(); g.globalAlpha*=d; g.translate(1000,1060); g.scale(lerp(1.5,1,d),lerp(1.5,1,d)); txt('−45%',0,0,{size:150,font:NUM,weight:900,color:C.green,align:'right'}); g.restore();
    txt('同期死亡概率',1000,1110,{size:28,weight:700,color:C.ink,align:'right',alpha:d});
    g.restore(); }
  if(t>l2.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    const X0=120, X1=1000, Y0=1200, Y1=880; const sx=s=>X0+(s-2000)/(12000-2000)*(X1-X0), sy=r=>Y0-(1-r)/(1-.4)*(Y0-Y1);
    g.save(); g.globalAlpha*=a;
    const band=eOut(P(t,l2.t0+1.4,l2.t0+2.2)); g.fillStyle='rgba(61,214,140,.16)'; g.fillRect(sx(4000),Y1-10,(sx(7000)-sx(4000))*band,Y0-Y1+10);
    txt('最划算的一段',sx(5500),Y1-24,{size:30,weight:900,color:C.green,align:'center',alpha:band});
    g.strokeStyle=C.dim; g.lineWidth=2; g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X1,Y0); g.stroke();
    [4000,7000,10000].forEach(s=>txt(s/1000+'千步',sx(s),Y0+40,{size:24,weight:500,color:C.mute,align:'center'}));
    const pts=[[3553,1],[5801,.60],[7842,.55],[10901,.47]]; const dr=eInOut(P(t,l2.t0+.4,l2.t0+1.8));
    g.strokeStyle=C.green; g.lineWidth=6; g.lineJoin='round'; g.beginPath();
    const tot=pts.length-1; pts.forEach((p,i)=>{ const f=i/tot; if(f>dr+1e-6) return; const x=sx(p[0]), y=sy(p[1]); i?g.lineTo(x,y):g.moveTo(x,y); });
    const k=Math.min(tot-1,Math.floor(dr*tot)), fr=dr*tot-k; if(dr<1){ const p=pts[k], q=pts[k+1]; g.lineTo(lerp(sx(p[0]),sx(q[0]),fr),lerp(sy(p[1]),sy(q[1]),fr)); }
    g.stroke();
    pts.forEach((p,i)=>{ if(i/tot>dr+1e-6) return; g.fillStyle=C.ink; g.beginPath(); g.arc(sx(p[0]),sy(p[1]),9,0,7); g.fill();
      const lab=p[1].toFixed(2).replace(/0$/,'').replace(/\.$/,'');
      if(i===0) txt('3500 步 = 1',sx(p[0]),sy(p[1])-24,{size:26,font:NUM,weight:800,color:C.ink,align:'center'});
      else txt(lab,sx(p[0])+14,sy(p[1])-14,{size:26,font:NUM,weight:800,color:C.ink}); });
    txt('不用非凑一万步',X1,Y0-60,{size:34,weight:900,color:C.ink,align:'right',alpha:eOut(P(t,l2.t0+(l2.t1-l2.t0)*.65,l2.t1))});
    g.restore(); }
}

// ---------- 结尾：六件打勾 → 偷走的月份一个个绿着还回来 ----------
const OUTLAB=['戒烟','少酒','不喝甜的','放凉再喝','起来动动','多走几步'];
function outroStarts(){ const l0=L('outro',0); const w=OUTLAB.map(s=>s.length+1.4); const tot=w.reduce((a,b)=>a+b,0); let acc=0;
  return w.map(x=>{ const r=l0.t0+(l0.t1-l0.t0)*acc/tot; acc+=x; return r; }); }
function outroT(){ const l1=L('outro',1); const lit0=l1.t0+.1, d1=l1.t1-l1.t0, wave=d1*.55, back0=lit0+wave*.8, done=CUE('outro:1','还回来',l1.t1-.6);
  return {lit0,wave,back0,backDur:Math.max(.8,done-.35-back0),done}; }
function sOutro(t){
  const l0=L('outro',0), l1=L('outro',1), l2=L('outro',2), s=SC.outro, st=outroStarts(), O=outroT();
  const midOut=eInOut(P(t,l1.t0-.5,l1.t0+.2));
  g.save(); g.globalAlpha*=1-midOut;
  reveal('记住这六件',80,330,P(t,s.t0+.1,s.t0+1.0),{size:56,font:SERIF,weight:900,color:C.ink});
  for(let i=0;i<6;i++){ const col=i%2,row=Math.floor(i/2), x=80+col*470, y=400+row*236;
    const u=eOut(P(t,s.t0+.1+i*.07,s.t0+.7+i*.07)); if(u<=0) continue; const ck=P(t,st[i],st[i]+.35);
    g.save(); g.globalAlpha*=u; g.translate(0,(1-u)*30);
    rrect(x,y,450,204,26); g.fillStyle=C.panel; g.fill();
    if(ck>0){ g.save(); g.globalAlpha*=lerp(1,.45,P(t,st[i]+.35,st[i]+1.4)); g.strokeStyle=C.green; g.lineWidth=3; rrect(x,y,450,204,26); g.stroke(); g.restore(); }
    drawIcon(SEQ[i],x+36,y+42,120,1,ck>0?C.green:C.ink,5);
    txt(OUTLAB[i],x+182,y+124,{size:50,font:SERIF,weight:900,color:ck>0?C.ink:C.mute});
    if(ck>0){ g.save(); g.globalAlpha*=eOut(ck); g.fillStyle=C.green; g.beginPath(); g.arc(x+410,y+40,22,0,7); g.fill(); g.restore(); drawIcon('check',x+390,y+20,40,ck,C.bg,6); }
    g.restore(); }
  g.restore();
  const endOut=P(t,l2.t0-.3,l2.t0+.3);
  if(t>l1.t0-.5){ let back=0;
    lifeGrid(i=>{ const k=N-1-i;
      if(k<STOLEN){ const tb=O.back0+(STOLEN-1-k)/STOLEN*O.backDur; if(t>tb){ back++; const v=P(t,tb,tb+.45); return {c:C.green,a:.95,r:lerp(1.7,1.05,v),glow:1-v*.6}; } return {c:ASH,a:.95,r:.85}; }
      const ti=O.lit0+O.wave*(i/(N-STOLEN)); const v=P(t,ti,ti+.4);
      return {c:CREAM,a:lerp(.26,.92,v),r:v>0&&v<1?lerp(1.3,1,v):1,glow:v>0&&v<1?(1-v)*.6:0};
    },0, eOut(P(t,l1.t0-.5,l1.t0+.1))*(1-endOut*.88));
    const ta=eOut(P(t,l1.t0-.2,l1.t0+.4))*(1-endOut), cnt=N-STOLEN+back;
    txt(String(cnt),80,470,{size:150,font:NUM,weight:900,color:back?mixc(C.amber,C.green,.3+.7*back/STOLEN):mixc(C.amber,C.red,.6),alpha:ta});
    txt('个月',80+tw('960',150,NUM,900)+16,462,{size:64,font:SERIF,weight:900,alpha:ta});
    reveal('一天一天，还回来',566,462,P(t,l1.t0+1.2,l1.t0+2.4),{size:40,weight:700,color:C.green,alpha:1-endOut});
  }
  if(t>l2.t0-.1){
    reveal('下一集',540,700,P(t,l2.t0,l2.t0+.6),{size:44,weight:500,color:C.mute,align:'center'});
    reveal('不要浪费精力',540,850,P(t,l2.t0+.3,l2.t0+1.3),{size:128,font:SERIF,weight:900,align:'center'});
    const cr=eOut(P(t,l2.t0+1.2,l2.t0+2.0));
    ['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写，同步自 2026-10-21 版本 · 不构成医疗建议']
      .forEach((s,i)=>txt(s,540,1080+i*48,{size:28,weight:500,color:C.mute,align:'center',alpha:cr}));
  }
}

const FN = {hook:sHook, smoke:sSmoke, alcohol:sAlcohol, soda:sSoda, tea:sTea, sit:sSit, walk:sWalk, outro:sOutro};

// ---------- 冲击点：画面震动 + 闪光 + 声音，同一时刻 ----------
const AMB='242,181,68', RED='255,82,50', GRN='61,214,140', EMB='255,122,46';
(function(){
  const H=hookT(), S=smokeT(), T=teaHits(), Si=sitHits(), O=outroT();
  window.IMPACTS=[
    {t:H.fill0, k:.45, c:AMB, f:.45, sfx:'boom'},
    {t:S.b0+S.bDur, k:.6, c:EMB, sfx:'boom'},
    {t:S.r0+S.rDur, k:.25, c:GRN, f:.45, sfx:'chime'},
    {t:L('alcohol',3).t0+.32, k:1, c:AMB, sfx:'boom', riser:1},
    {t:sodaHit(), k:.85, c:RED, sfx:'boom', riser:1},
    {t:T.x8, k:1, c:RED, sfx:'boom', riser:1},
    {t:T.x5, k:.55, c:RED, sfx:'stamp'},
    {t:Si.x26, k:1, c:RED, sfx:'boom', riser:1},
    {t:Si.r1, k:.25, c:GRN, f:.45, sfx:'chime'},
    {t:walkHit(), k:.45, c:GRN, f:.55, sfx:'chime'},
    {t:O.done, k:.4, c:GRN, f:.6, sfx:'chime'},
  ];
})();
function buildEvents(EV){
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  SEQ.forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  IMPACTS.forEach(im=>{ EV.push({t:im.t,type:im.sfx}); if(im.riser) EV.push({t:im.t-.03,type:'riser'}); });
  const H=hookT(); EV.push({t:H.th0+.1,type:'ember'});
  const S=smokeT(); EV.push({t:S.b0,type:'ember'},{t:S.b0+1.4,type:'ember'});
  EV.push({t:L('alcohol',2).t0+.6,type:'ember'});
  const s2=L('soda',2); EV.push({t:s2.t0+.65,type:'whoosh'});
  EV.push({t:walkHit()+.02,type:'pulse'});
  outroStarts().forEach(x=>EV.push({t:x+.05,type:'pop'}));
  const O=outroT(); EV.push({t:O.back0,type:'ember'});
}
