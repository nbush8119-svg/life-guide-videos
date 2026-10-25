/* 第 4 集《不要浪费时间》— 核心意象「漏掉的时间块」：一小时一个方块。
   开头：2018 → 2024 每天上网时长两根条，翻一倍还多 →「时间不是不够用，是漏掉了」。
   每一件：图标先在中央登场，再退到角上让位给数据（等比例的条、圆环、时间轴）。
   结尾：一天 24 个方块一块块亮回来。依赖 engine/stage.js。 */

// ---------- 本集图标（单位格 0..100） ----------
Object.assign(ICON, {
  phone: [ rrPts(30,8,40,84,8), [[44,17],[56,17]], arcPts(50,80,3.5,0,Math.PI*2,10) ],
  glass: [ [[24,10],[76,10]], [[24,90],[76,90]], [[30,10],[30,22],[50,50],[30,78],[30,90]], [[70,10],[70,22],[50,50],[70,78],[70,90]] ],
  flag:  [ [[26,92],[26,8]], [[26,12],[80,12],[66,31],[80,50],[26,50]] ],
  note:  [ rrPts(16,8,62,84,8), [[28,30],[64,30]], [[28,46],[64,46]], [[28,62],[50,62]], [[56,92],[88,60]] ],
  door:  [ rrPts(16,8,44,84,4), arcPts(50,52,3,0,Math.PI*2,10), [[62,50],[92,50]], [[80,38],[92,50],[80,62]] ],
  loop:  [ arcPts(50,50,34,-Math.PI*.35,Math.PI*1.45,44), [[72,8],[78,26],[60,30]] ],
});
const SEQ = ['screen','estimate','deadline','ifthen','exit','habit'];
const ICONOF = {screen:'phone', estimate:'glass', deadline:'flag', ifthen:'note', exit:'door', habit:'loop'};
const ITEMS = {
 screen:  {n:'01', zh:'第一件', title:['刷屏设硬上限'], sub:'短视频和无目的的刷屏', cost:'成本 · 不花钱'},
 estimate:{n:'02', zh:'第二件', title:['按过去估工期'], sub:'看上次实际用了多久，别按计划推', cost:'成本 · 估之前花几分钟'},
 deadline:{n:'03', zh:'第三件', title:['自己定截止日期'], sub:'没人催的事，也给它一个日子', cost:''},
 ifthen:  {n:'04', zh:'第四件', title:['写成「如果……就……」'], sub:'几点、在哪、遇到什么就做什么', cost:'成本 · 每件事 1–2 分钟'},
 exit:    {n:'05', zh:'第五件', title:['先写退出条件'], sub:'开工之前，趁头脑冷静', cost:''},
 habit:   {n:'06', zh:'最后一件', title:['新习惯按月算'], sub:'别信「21 天」', cost:'成本 · 同一场景，天天重复几个月'},
};
SEQ.forEach(id=>{ ICON[id]=ICON[ICONOF[id]]; });
function softDot(x,y,r,col,a){ if(a<=0) return; const gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.save(); g.globalAlpha*=a; g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); g.restore(); }
const CUE=(k,w,fb)=>{ const v=TL.cues&&TL.cues[k+':'+w]; return v==null?fb:v; };
const frac=(l,f)=>l.t0+(l.t1-l.t0)*f;
function pop(s,x,y,u,o){ if(u<=0) return; g.save(); g.globalAlpha*=clamp(u*3); g.translate(x,y); const k=lerp(1.6,1,eExpo(u)); g.scale(k,k); txt(s,0,0,o); g.restore(); }
function stamp(s,x,y,u,col=C.red,rot=-.12,size=44){ if(u<=0) return; g.save(); g.globalAlpha*=clamp(u*3); g.translate(x,y); g.rotate(rot); const k=lerp(1.7,1,eExpo(u)); g.scale(k,k);
  const w=tw(s,size,SANS,900)+60; rrect(-w/2,-size*1.1,w,size*1.8,12); g.fillStyle=C.panel; g.fill(); g.strokeStyle=col; g.lineWidth=6; g.stroke();
  txt(s,0,size*.25,{size,weight:900,color:col,align:'center'}); g.restore(); }
function bar(x,y,w,h,u,col){ if(u<=0) return; rrect(x,y,Math.max(h*.4,w*u),h,Math.min(10,h/3)); g.fillStyle=col; g.fill(); }
function ring2(cx,cy,R,v,u,col,lw=24){ g.save(); g.lineWidth=lw; g.lineCap='round';
  g.strokeStyle=C.line; g.beginPath(); g.arc(cx,cy,R,0,7); g.stroke();
  if(u>0){ g.strokeStyle=col; g.beginPath(); g.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*v*u); g.stroke(); } g.restore(); }
const hm=m=>`${Math.floor(m/60)}:${String(Math.round(m%60)).padStart(2,'0')}`;

// ---------- 开头：两根上网时长条 ----------
const hookHits=()=>{ const b=L('hook',1), c=L('hook',2);
  return {h537:CUE('hook:1','五小时三十七分',frac(b,.55)), x2:CUE('hook:1','一倍还多',b.t1-.5), leak:CUE('hook:2','漏掉了',frac(c,.35))}; };
function sHook(t){
  const a=L('hook',0), b=L('hook',1), c=L('hook',2), H=hookHits();
  const X=250, Wmax=740, m18=162, m24=337;
  const out=eInOut(P(t,c.t0-.3,c.t0+.35));
  if(out<1){ g.save(); g.globalAlpha*=1-out; g.translate(0,-out*80);
    reveal('中国人平均每天上网',80,470,P(t,a.t0,a.t0+1),{size:56,font:SERIF,weight:900});
    const u1=eInOut(P(t,a.t0+.6,a.t1-.2)), u2=eInOut(P(t,b.t0+.3,H.h537+.2));
    const ina=eOut(P(t,a.t0+.3,a.t0+.8));
    txt('2018',80,640,{size:52,font:NUM,weight:900,color:C.mute,alpha:ina});
    bar(X,580,Wmax*m18/m24,90,u1,C.ink);
    txt(hm(m18*u1),X+Wmax*m18/m24*u1+20,646,{size:56,font:NUM,weight:900,color:C.ink,alpha:u1>0?1:0});
    if(t>b.t0-.2){ const inb=eOut(P(t,b.t0-.2,b.t0+.3));
      txt('2024',80,800,{size:52,font:NUM,weight:900,color:C.amber,alpha:inb});
      bar(X,740,Wmax,90,u2,C.amber);
      if(u2>0) txt(hm(m24*u2),Math.min(X+Wmax*u2+20,X+Wmax-200),u2>.75?712:806,{size:56,font:NUM,weight:900,color:u2>.75?C.amber:C.ink});
      const dx=X+Wmax*m18/m24, k=eOut(P(t,H.x2-.1,H.x2+.4));
      if(k>0){ g.save(); g.globalAlpha*=k; g.strokeStyle=C.mute; g.lineWidth=2; g.setLineDash([6,8]); g.beginPath(); g.moveTo(dx,560); g.lineTo(dx,850); g.stroke(); g.restore(); }
      pop('×2 还多',X+Wmax-10,920,P(t,H.x2-.05,H.x2+.4),{size:64,font:NUM,weight:900,color:C.red,align:'right'}); }
    g.restore(); }
  if(t>c.t0-.1){
    reveal('时间不是不够用',80,560,P(t,c.t0+.35,c.t0+1.3),{size:96,font:SERIF,weight:900});
    reveal('是漏掉了',80,690,P(t,H.leak-.3,H.leak+.5),{size:96,font:SERIF,weight:900,color:C.red});
    if(t>H.leak+.6){
      reveal('六个把时间找回来的办法',80,905,P(t,H.leak+.7,H.leak+1.7),{size:64,font:SERIF,weight:900});
      for(let i=0;i<6;i++){ const p=gridPos(i); const u=P(t,H.leak+.9+i*.15,H.leak+1.6+i*.15);
        cell(p.x,p.y,u); drawIcon(SEQ[i],p.x+80,p.y+18,140,u,C.ink,5); } }
  }
}

// ---------- 每一件的开场：图标在中央登场，再退到角上 ----------
const HERO={cx:540, cy:1050, s:320};
function heroFront(id,t,x,y,s,a){
  const u=s/100; g.save(); const ba=g.globalAlpha*a;
  if(id==='screen'){ for(let j=0;j<4;j++){ const ph=((t*.8+j/4)%1); g.globalAlpha=ba*Math.sin(ph*Math.PI);
      g.fillStyle=C.red; g.beginPath(); g.arc(x+(72+j*6)*u,y+(14-ph*20)*u,7*u,0,7); g.fill(); } }
  if(id==='estimate'){ const ph=(t*.9)%1; g.globalAlpha=ba; g.fillStyle=C.amber;
      g.beginPath(); g.arc(x+50*u,y+(52+ph*30)*u,3.5*u,0,7); g.fill(); }
  if(id==='habit'){ g.globalAlpha=1; softDot(x+50*u,y+50*u,50*u,'rgba(61,214,140,0.35)',ba*(.6+.3*Math.sin(t*2.4))); }
  g.restore();
}
function itemFrameX(id,t,costAt){
  const s=SC[id], it=ITEMS[id], l0=L(id,0), l1=L(id,1), k=SEQ.indexOf(id), ti=t-s.t0;
  const roll=eExpoIO(P(ti,0,0.7));
  g.save(); g.beginPath(); g.rect(60,280,560,250); g.clip();
  const prev=k===0?'00':ITEMS[SEQ[k-1]].n;
  [prev,it.n].forEach((nn,j)=>{ const yy=500+(j===0? -roll*240 : (1-roll)*240);
    const NF=(THEME&&THEME.numFill)||.12;
    g.font=`900 250px ${NUM}`; g.lineWidth=4; g.strokeStyle=j?C.amber:C.dim; if(NF<1||!j) g.strokeText(nn,74,yy);
    if(j){ g.save(); g.globalAlpha*=NF; g.fillStyle=C.amber; g.fillText(nn,74,yy); g.restore(); } });
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
  drawIcon(id,ix,iy,isz,1,C.amber,lerp(5,7.5,heroA)+2*a2);
  if(heroA>0) heroFront(id,t,ix,iy,isz,heroA);
  const ts=Math.min(116, Math.floor(116*900/Math.max(1,tw(it.title[0],116,SERIF,900))));
  reveal(it.title[0],80,700,P(t,l0.t0,l0.t0+.9),{size:ts,font:SERIF,weight:900,colorAt:i=>/[0-9–]/.test([...it.title[0]][i])?C.amber:null});
  { const sh=P(t,l0.t0+1.0,l0.t0+2.0); if(sh>0&&sh<1){ const ww=tw(it.title[0],ts,SERIF,900), cx=80+lerp(-220,ww+220,eInOut(sh));   // 标题扫光
      const gr=g.createLinearGradient(cx-130,0,cx+130,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(.5,'rgba(255,255,255,.7)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      txt(it.title[0],80,700,{size:ts,font:SERIF,weight:900,color:gr}); } }
  reveal(it.sub,80,786,P(t,l0.t0+.5,l0.t0+1.6),{size:44,weight:500,color:C.mute});
  const dv=eOut(P(t,l0.t0+.4,l0.t0+1.4)); g.fillStyle=C.line; g.fillRect(80,830,920*dv,3);
  if(it.cost) chip(it.cost,80,1176,P(t,costAt,costAt+.6));
}
const fade=(t,l,nx)=>(nx?1-P(t,nx.t0-.2,nx.t0+.3):1)*eOut(P(t,l.t0,l.t0+.5));

// ---------- 01 刷屏：365 个小时方块；三个开关 ----------
const screenHits=()=>{ const l1=L('screen',1), l3=L('screen',3); return {y365:CUE('screen:1','三百六十五',l1.t1-1.2), hand:CUE('screen:3','管住手',l3.t1-.6)}; };
function sScreen(t){ const id='screen';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=screenHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.3){ const a=fade(t,l1,l2);
    g.save(); g.globalAlpha*=a;
    const f0=frac(l1,.45);
    txt('上网时间里也有工作和学习',80,900,{size:34,weight:700,color:C.mute,alpha:1-P(t,f0-.3,f0)});
    txt('每天少刷 1 小时，一年就是',80,900,{size:34,weight:700,color:C.ink,alpha:P(t,f0-.1,f0+.3)});
    const cols=37, sz=20, gap=4.3, x0=80, y0=930, fill=P(t,f0,H.y365);
    for(let i=0;i<365;i++){ const c=i%cols, r=Math.floor(i/cols); const on=fill*365>i;
      g.fillStyle=on?C.amber:C.line; g.fillRect(x0+c*(sz+gap),y0+r*(sz+gap),sz,sz); }
    const k=P(t,H.y365-.05,H.y365+.4);
    pop('365 小时',80,1250,k,{size:72,font:NUM,weight:900,color:C.amber});
    txt('≈ 15 个整天',80+tw('365 小时',72,NUM,900)+30,1246,{size:40,weight:700,color:C.ink,alpha:eOut(P(t,H.y365+.4,H.y365+1))});
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const a=fade(t,l2,l3);
    g.save(); g.globalAlpha*=a;
    const rows=[['关掉推送','off'],['删掉应用','del'],['每天上限','lim']];
    rows.forEach(([lab,kind],i)=>{ const y=880+i*120, u=P(t,frac(l2,.25+i*.22),frac(l2,.25+i*.22)+.5), e=eInOut(u);
      rrect(80,y,920,100,22); g.fillStyle=C.panel; g.fill();
      txt(lab,120,y+64,{size:40,weight:900,color:C.ink});
      if(kind==='off'){ const on=1-e; rrect(840,y+25,120,50,25); g.fillStyle=on>.5?C.amber:C.dim; g.fill();
        g.fillStyle=C.ink; g.beginPath(); g.arc(lerp(865,935,on),y+50,20,0,7); g.fill(); }
      if(kind==='del'){ drawIcon('phone',850,y+12,76,1,e>.5?C.dim:C.amber,4); if(e>0){ g.save(); g.globalAlpha*=e; g.strokeStyle=C.red; g.lineWidth=6;
          g.beginPath(); g.moveTo(860,y+20); g.lineTo(940,y+82); g.stroke(); g.restore(); } }
      if(kind==='lim'){ txt(e>0?'1:00':'—',960,y+66,{size:48,font:NUM,weight:900,color:e>0?C.green:C.dim,align:'right'}); }
    });
    g.restore(); }
  if(t>l3.t0-.1){ pop('难的是：管住手',540,1010,P(t,H.hand-.4,H.hand),{size:64,font:SERIF,weight:900,color:C.amber,align:'center'}); }
}

// ---------- 02 估工期：33.9 天 vs 55.5 天；29.3% → 60% ----------
const estHits=()=>{ const l1=L('estimate',1), l2=L('estimate',2); return {real:CUE('estimate:1','五十五点五天',l1.t1-1.2), p60:CUE('estimate:2','百分之六十',l2.t1-1)}; };
function sEstimate(t){ const id='estimate';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=estHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.3){ const a=fade(t,l1,l2);
    g.save(); g.globalAlpha*=a;
    txt('写完一篇论文要几天',80,900,{size:32,weight:700,color:C.mute});
    const X=240, Wm=640, sc=Wm/55.5;
    const u1=eInOut(P(t,frac(l1,.25),frac(l1,.5))), u2=eInOut(P(t,frac(l1,.55),H.real+.1));
    txt('自己估',80,1000,{size:36,weight:900,color:C.ink}); bar(X,955,33.9*sc,64,u1,C.ink);
    if(u1>0) txt((33.9*u1).toFixed(1)+' 天',X+33.9*sc*u1+16,1002,{size:40,font:NUM,weight:900,color:C.ink});
    txt('实际',80,1120,{size:36,weight:900,color:C.red});
    const w2=55.5*sc*u2; if(u2>0){ g.save(); g.globalAlpha*=.5; rrect(X,1075,Math.min(w2,33.9*sc),64,10); g.fillStyle=C.ink; g.fill(); g.restore();
      if(w2>33.9*sc){ rrect(X+33.9*sc-10,1075,w2-33.9*sc+10,64,10); g.fillStyle=C.red; g.fill(); } }
    if(u2>0) txt((55.5*u2).toFixed(1)+' 天',Math.min(X+w2+16,880),u2>.9?1062:1122,{size:40,font:NUM,weight:900,color:C.red});
    const k=P(t,H.real-.05,H.real+.4);
    if(k>0){ g.save(); g.globalAlpha*=eOut(k); g.strokeStyle=C.mute; g.lineWidth=2; g.setLineDash([6,8]); g.beginPath(); g.moveTo(X+33.9*sc,940); g.lineTo(X+33.9*sc,1160); g.stroke(); g.restore();
      pop('多出 21.6 天',X+Wm,1230,k,{size:52,font:NUM,weight:900,color:C.red,align:'right'}); }
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const a=fade(t,l2,l3);
    g.save(); g.globalAlpha*=a;
    txt('按时完成的比例',80,890,{size:32,weight:700,color:C.mute});
    const u1=eInOut(P(t,l2.t0+.3,frac(l2,.45))), u2=eInOut(P(t,frac(l2,.55),H.p60+.1));
    ring2(290,1060,120,.293,u1,C.mute); txt((29.3*u1).toFixed(1)+'%',290,1080,{size:56,font:NUM,weight:900,color:C.ink,align:'center'});
    txt('直接估',290,1240,{size:34,weight:700,color:C.mute,align:'center'});
    ring2(790,1060,120,.6,u2,C.green); txt((60*u2).toFixed(u2>=1?0:1)+'%',790,1080,{size:56,font:NUM,weight:900,color:u2>0?C.green:C.ink,align:'center'});
    txt('先回想过去再估',790,1240,{size:34,weight:700,color:C.ink,align:'center'});
    if(u2>0){ drawIcon('check',505,1020,70,P(t,H.p60,H.p60+.4),C.green,7); }
    g.restore(); }
}

// ---------- 03 截止日期：80.6% vs 38.7%；跟着截止走；告诉一个人 ----------
const ddHits=()=>{ const l1=L('deadline',1), l2=L('deadline',2);
  return {p806:CUE('deadline:1','八十点六',frac(l1,.3)), p387:CUE('deadline:1','三十八点七',l1.t1-1), follow:CUE('deadline:2','截止日期走',frac(l2,.45))}; };
function sDeadline(t){ const id='deadline';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=ddHits();
  itemFrameX(id,t,1e9);
  if(t>l1.t0 && t<l2.t0+.3){ const a=fade(t,l1,l2);
    g.save(); g.globalAlpha*=a;
    txt('按时做完的学生',80,890,{size:32,weight:700,color:C.mute});
    const X=80, Wm=700;
    const u1=eInOut(P(t,l1.t0+.4,H.p806+.2)), u2=eInOut(P(t,H.p806+.6,H.p387+.2));
    txt('有别人定的截止日期',X,970,{size:34,weight:900,color:C.ink}); bar(X,990,Wm,64,u1*.806,C.green);
    if(u1>0) txt((80.6*u1).toFixed(1)+'%',X+Wm*.806*u1+16,1040,{size:48,font:NUM,weight:900,color:C.green});
    if(t>H.p806+.4){ txt('按自己预计的时间',X,1130,{size:34,weight:900,color:C.ink,alpha:eOut(P(t,H.p806+.4,H.p806+.8))}); bar(X,1150,Wm,64,u2*.387,C.red);
      if(u2>0) txt((38.7*u2).toFixed(1)+'%',X+Wm*.387*u2+16,1200,{size:48,font:NUM,weight:900,color:C.red}); }
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const a=fade(t,l2,l3);
    g.save(); g.globalAlpha*=a;
    const pan=(x,lab,tight,col,u)=>{ rrect(x,880,440,340,22); g.fillStyle=C.panel; g.fill();
      g.strokeStyle=C.dim; g.lineWidth=2; g.beginPath(); g.moveTo(x+40,1180); g.lineTo(x+410,1180); g.moveTo(x+40,1180); g.lineTo(x+40,920); g.stroke();
      if(tight){ g.save(); g.globalAlpha*=eOut(u); g.strokeStyle=col; g.lineWidth=3; g.setLineDash([6,8]); g.beginPath(); g.moveTo(x+50,1170); g.lineTo(x+400,930); g.stroke(); g.restore(); }
      for(let i=0;i<22;i++){ const q=P(u,i/30,i/30+.25); if(q<=0) continue; const fx=hash(i+1), fy=tight?fx+(hash(i+7)-.5)*.12:hash(i+31);
        g.save(); g.fillStyle=col; g.globalAlpha*=eOut(q); g.beginPath(); g.arc(x+50+fx*350,1170-clamp(fy)*240,9,0,7); g.fill(); g.restore(); }
      txt(lab,x+220,1260,{size:32,weight:900,color:col,align:'center'}); };
    pan(80,'跟截止日期',true,C.green,P(t,l2.t0+.3,H.follow));
    pan(560,'跟自己估的',false,C.mute,P(t,frac(l2,.55),l2.t1));
    txt('什么时候做完',80,860,{size:30,weight:700,color:C.mute});
    g.restore(); }
  if(t>l3.t0-.1){ const a=eOut(P(t,l3.t0,l3.t0+.5));
    g.save(); g.globalAlpha*=a;
    rrect(80,880,460,360,22); g.fillStyle=C.panel; g.fill();
    rrect(80,880,460,70,22); g.fillStyle=C.dim; g.fill(); g.fillRect(80,920,460,30);
    txt('自己定的截止',310,928,{size:30,weight:900,color:C.ink,align:'center'});
    for(let d=0;d<28;d++){ const c=d%7, r=Math.floor(d/7); txt(String(d+1),118+c*61,1010+r*62,{size:28,font:NUM,weight:700,color:d===19?C.amber:C.mute,align:'center'}); }
    const ck=P(t,frac(l3,.35),frac(l3,.35)+.5); if(ck>0){ g.save(); g.strokeStyle=C.amber; g.lineWidth=5; g.beginPath(); g.arc(118+5*61,1000+2*62,30,-Math.PI/2,-Math.PI/2+Math.PI*2*eOut(ck)); g.stroke(); g.restore(); }
    const tl=P(t,frac(l3,.68),frac(l3,.68)+.6);
    if(tl>0){ g.save(); g.globalAlpha*=eOut(tl); person(700,1210,220,C.ink); person(900,1210,220,C.green);
      rrect(610,900,380,90,20); g.fillStyle=C.panel; g.fill(); g.strokeStyle=C.green; g.lineWidth=3; g.stroke();
      txt('20 号我交给你',800,958,{size:36,weight:900,color:C.green,align:'center'}); g.restore(); }
    txt('定了就认账',600,1270,{size:30,weight:700,color:C.mute,alpha:eOut(P(t,frac(l3,.4),frac(l3,.4)+.6))});
    g.restore(); }
}

// ---------- 04 如果就：把模糊的打算改写；d = 0.65 ----------
const itHits=()=>{ const l1=L('ifthen',1), l2=L('ifthen',2); return {wr:CUE('ifthen:1','先写引言',l1.t1-.8), med:CUE('ifthen:2','中到大',l2.t1-.6)}; };
function sIfthen(t){ const id='ifthen';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=itHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.3){ const a=fade(t,l1,l2);
    g.save(); g.globalAlpha*=a;
    rrect(80,870,920,110,22); g.fillStyle=C.panel; g.fill();
    txt('我要写报告',120,945,{size:44,weight:700,color:C.mute});
    const st=eOut(P(t,frac(l1,.18),frac(l1,.3))); if(st>0){ g.fillStyle=C.red; g.fillRect(112,926,(tw('我要写报告',44)+20)*st,5); }
    stamp('太模糊',820,935,P(t,frac(l1,.22),frac(l1,.22)+.4),C.red,-.1,34);
    const w=P(t,frac(l1,.35),H.wr);
    rrect(80,1010,920,230,22); g.fillStyle=C.panel; g.fill(); g.save(); g.strokeStyle=C.amber; g.lineWidth=3; g.globalAlpha*=eOut(P(t,frac(l1,.35),frac(l1,.45))); rrect(80,1010,920,230,22); g.stroke(); g.restore();
    txt('如果',120,1090,{size:40,weight:900,color:C.amber,alpha:eOut(P(w,0,.1))});
    reveal('周二早 8:00 坐到书桌前',230,1090,P(w,.05,.6),{size:48,weight:900,colorAt:i=>i>=4&&i<=7?C.amber:null});
    txt('就',120,1190,{size:40,weight:900,color:C.green,alpha:eOut(P(w,.6,.7))});
    reveal('先写引言',230,1190,P(w,.65,1),{size:48,weight:900,color:C.green});
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const a=fade(t,l2,l3);
    g.save(); g.globalAlpha*=a;
    txt('94 项检验汇总 · 目标达成',80,900,{size:32,weight:700,color:C.mute});
    const N=94, cols=19, u=P(t,l2.t0+.2,frac(l2,.5));
    for(let i=0;i<N;i++){ const c=i%cols, r=Math.floor(i/cols); const on=u*N>i; g.fillStyle=on?C.amber:C.line; g.beginPath(); g.arc(100+c*48,950+r*40,13,0,7); g.fill(); }
    const v=eInOut(P(t,frac(l2,.55),H.med));
    txt('效果大小',80,1200,{size:32,weight:900,color:C.ink});
    bar(240,1165,640,50,v*.65/0.8,C.green);
    if(v>0) txt('d = '+(0.65*v).toFixed(2),240+640*.65/.8*v+16,1205,{size:40,font:NUM,weight:900,color:C.green});
    pop('中到大',1000,1270,P(t,H.med-.05,H.med+.4),{size:48,font:SERIF,weight:900,color:C.green,align:'right'});
    g.restore(); }
  if(t>l3.t0-.1){ const a=eOut(P(t,frac(l3,.4),frac(l3,.4)+.6));
    txt('前提：这件事你自己真想做',80,1000,{size:52,font:SERIF,weight:900,color:C.ink,alpha:a});
    txt('目标本身不想要，写再多句也没用',80,1070,{size:34,weight:500,color:C.mute,alpha:a}); }
}

// ---------- 05 退出条件：填空卡片；剧院季票 4.11 / 3.32 / 3.29；只看往后 ----------
const exHits=()=>{ const l2=L('exit',2), l3=L('exit',3);
  return {e411:CUE('exit:2','四点一一场',frac(l2,.72)), e33:CUE('exit:2','三点三场',l2.t1-.8), back:CUE('exit:3','拿回多少',l3.t1-.6)}; };
function sExit(t){ const id='exit';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=exHits();
  itemFrameX(id,t,1e9);
  if(t>l1.t0 && t<l2.t0+.3){ const a=fade(t,l1,l2);
    g.save(); g.globalAlpha*=a;
    rrect(80,880,920,360,26); g.fillStyle=C.panel; g.fill(); g.strokeStyle=C.amber; g.lineWidth=3; g.stroke();
    txt('退出条件',120,950,{size:40,font:SERIF,weight:900,color:C.amber});
    const ys=[1040,1120,1200], u=P(t,l1.t0+.3,frac(l1,.8));
    txt('如果到',120,ys[0],{size:44,weight:700,color:C.ink,alpha:eOut(P(u,0,.15))});
    [[270,'月'],[430,'日']].forEach(([x,s],i)=>{ const q=eOut(P(u,.1+i*.12,.25+i*.12)); g.fillStyle=C.mute; g.fillRect(x,ys[0]+10,100*q,3); txt(s,x+110,ys[0],{size:44,weight:700,color:C.ink,alpha:q}); });
    txt('还没达到',120,ys[1],{size:44,weight:700,color:C.ink,alpha:eOut(P(u,.4,.55))});
    { const q=eOut(P(u,.5,.7)); g.fillStyle=C.mute; g.fillRect(320,ys[1]+10,380*q,3); }
    pop('就停。',120,ys[2],P(u,.75,1),{size:52,font:SERIF,weight:900,color:C.red});
    drawIcon('door',800,1080,150,P(t,frac(l1,.5),frac(l1,.9)),C.amber,6);
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const a=fade(t,l2,l3);
    g.save(); g.globalAlpha*=a;
    const head=eOut(P(t,l2.t0,l2.t0+.6));
    txt('不提前写，就被已经花掉的钱拖住',80,900,{size:34,weight:900,color:C.ink,alpha:head});
    txt('剧院季票 · 前半季平均看了几场',80,950,{size:28,weight:700,color:C.mute,alpha:eOut(P(t,frac(l2,.3),frac(l2,.3)+.6))});
    const X=300, sc=560/4.11, rows=[['原价',4.11,C.red,H.e411],['便宜 2 美元',3.32,C.mute,H.e33],['便宜 7 美元',3.29,C.mute,H.e33+.15]];
    rows.forEach(([lab,v,col,hit],i)=>{ const y=990+i*86, u=eInOut(P(t,hit-1.1,hit+.1));
      txt(lab,80,y+44,{size:34,weight:900,color:i?C.ink:C.red,alpha:eOut(P(t,frac(l2,.35),frac(l2,.35)+.5))});
      bar(X,y,v*sc,58,u,col);
      if(u>0) txt((v*u).toFixed(2),X+v*sc*u+16,y+46,{size:40,font:NUM,weight:900,color:col}); });
    g.restore(); }
  if(t>l3.t0-.1){ const a=eOut(P(t,l3.t0,l3.t0+.5));
    g.save(); g.globalAlpha*=a;
    const u0=P(t,frac(l3,.45),frac(l3,.6)), u1=P(t,frac(l3,.62),frac(l3,.75)), u2=P(t,H.back-.5,H.back);
    rrect(80,880,920,96,20); g.fillStyle=C.panel; g.fill();
    txt('已经花掉的',120,944,{size:40,weight:700,color:C.mute});
    if(u0>0){ g.fillStyle=C.red; g.fillRect(112,925,(tw('已经花掉的',40)+16)*eOut(u0),5); txt('不算',960,944,{size:40,weight:900,color:C.red,align:'right',alpha:eOut(u0)}); }
    [['往后还要投多少',u1],['还能拿回多少',u2]].forEach(([s,u],i)=>{ const y=1000+i*116; rrect(80,y,920,96,20); g.fillStyle=C.panel; g.fill();
      if(u>0){ g.save(); g.strokeStyle=C.green; g.lineWidth=3; g.globalAlpha*=eOut(u); rrect(80,y,920,96,20); g.stroke(); g.restore(); }
      txt(s,120,y+64,{size:40,weight:900,color:u>0?C.ink:C.mute}); drawIcon('check',900,y+18,60,u,C.green,6); });
    g.restore(); }
}

// ---------- 06 习惯：21 天盖章；18–254 天时间轴；漏一天不清零 ----------
const hbHits=()=>{ const l0=L('habit',0), l1=L('habit',1), l2=L('habit',2);
  return {d21:CUE('habit:0','二十一天',l0.t1-.6), no:frac(l1,.17), d18:CUE('habit:1','十八天',frac(l1,.75)), d254:CUE('habit:1','二百五十四天',l1.t1-.8), zero:CUE('habit:2','清零',l2.t1-.5)}; };
function sHabit(t){ const id='habit';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3), H=hbHits();
  itemFrameX(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.3){ const a=fade(t,l1,l2);
    g.save(); g.globalAlpha*=a;
    const X0=110, X1=980, dx=d=>X0+d/260*(X1-X0), Y=1130;
    const ax=eOut(P(t,frac(l1,.3),frac(l1,.45)));
    const big=1-ax;
    if(big>0){ g.save(); g.globalAlpha*=big; txt('21 天',540,1080,{size:160,font:NUM,weight:900,color:C.ink,align:'center'}); g.restore(); }
    stamp('没有依据',540+(dx(21)+60-540)*ax, 1040+(Y-150-1040)*ax, P(t,H.no-.05,H.no+.35),C.red,-.12,lerp(52,30,ax));
    if(ax>0){ g.save(); g.globalAlpha*=ax;
      g.strokeStyle=C.dim; g.lineWidth=3; g.beginPath(); g.moveTo(X0,Y); g.lineTo(X1,Y); g.stroke();
      [0,50,100,150,200,250].forEach(d=>txt(String(d),dx(d),Y+44,{size:24,font:NUM,weight:800,color:C.mute,align:'center'}));
      txt('天',X1+30,Y+44,{size:24,weight:500,color:C.mute});
      g.strokeStyle=C.mute; g.lineWidth=2; g.setLineDash([5,7]); g.beginPath(); g.moveTo(dx(21),Y-110); g.lineTo(dx(21),Y); g.stroke(); g.setLineDash([]);
      txt('一个动作变得不用想就做，要多久',80,900,{size:32,weight:700,color:C.mute});
      g.restore();
      const r1=eExpo(P(t,H.d18-.05,H.d18+.3)), sp=eInOut(P(t,H.d18+.2,H.d254+.1));
      if(sp>0){ g.save(); const gr=g.createLinearGradient(dx(18),0,dx(254),0); gr.addColorStop(0,C.green); gr.addColorStop(1,C.red);
        g.fillStyle=gr; g.globalAlpha*=.85; g.fillRect(dx(18),Y-8,(dx(254)-dx(18))*sp,16); g.restore(); }
      if(r1>0){ g.fillStyle=C.green; g.beginPath(); g.arc(dx(18),Y,16*r1,0,7); g.fill();
        txt('18 天',dx(18)-6,Y-40,{size:40,font:NUM,weight:900,color:C.green,alpha:r1}); }
      const r2=eExpo(P(t,H.d254-.05,H.d254+.3));
      if(r2>0){ g.fillStyle=C.red; g.beginPath(); g.arc(dx(254),Y,16*r2,0,7); g.fill();
        txt('254 天',dx(254)+10,Y-40,{size:40,font:NUM,weight:900,color:C.red,align:'right',alpha:r2}); }
      txt('12 周跟踪 · 不同人、不同动作',80,1240,{size:26,weight:500,color:C.mute,alpha:r2});
    }
    g.restore(); }
  if(t>l2.t0-.1 && t<l3.t0+.3){ const a=fade(t,l2,l3);
    g.save(); g.globalAlpha*=a;
    const X0=110, X1=980, Y0=1200, Y1=920, dr=eInOut(P(t,l2.t0+.2,H.zero));
    txt('越做越不用想',80,890,{size:32,weight:700,color:C.mute});
    g.strokeStyle=C.dim; g.lineWidth=2; g.beginPath(); g.moveTo(X0,Y0); g.lineTo(X1,Y0); g.stroke();
    const f=x=>Y0-(1-Math.exp(-x*3.2))*(Y0-Y1-30), miss=.42;
    g.strokeStyle=C.green; g.lineWidth=7; g.lineJoin='round'; g.beginPath(); let started=false;
    for(let x=0;x<=dr+1e-6;x+=.005){ const px=X0+x*(X1-X0), py=f(x); if(Math.abs(x-miss)<.012){ if(started) g.stroke(); g.beginPath(); started=false; continue; } started?g.lineTo(px,py):g.moveTo(px,py); started=true; }
    if(started) g.stroke();
    const k=P(t,frac(l2,.5),frac(l2,.5)+.5);
    if(dr>miss && k>0){ const px=X0+miss*(X1-X0); g.save(); g.globalAlpha*=eOut(k); g.strokeStyle=C.red; g.lineWidth=3; g.setLineDash([6,6]); g.beginPath(); g.moveTo(px,f(miss)-10); g.lineTo(px,Y0); g.stroke(); g.restore();
      txt('漏掉一天',px,Y0+40,{size:28,weight:900,color:C.red,align:'center',alpha:eOut(k)}); }
    pop('≠ 清零',X1,Y1+160,P(t,H.zero-.05,H.zero+.4),{size:64,font:SERIF,weight:900,color:C.green,align:'right'});
    g.restore(); }
}

// ---------- 结尾：六件打勾 → 一天 24 块亮回来 ----------
const OUTLAB=['刷屏设上限','按过去估工期','自己定截止','写成如果就','先定退出条件','习惯按月算'];
function outroStarts(){ const l0=L('outro',0); const w=OUTLAB.map(s=>s.length+1.4); const tot=w.reduce((a,b)=>a+b,0); let acc=0;
  return w.map(x=>{ const r=l0.t0+(l0.t1-l0.t0)*acc/tot; acc+=x; return r; }); }
const outroDone=()=>{ const l1=L('outro',1); return CUE('outro:1','找回来',l1.t1-.5); };
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
    drawIcon(SEQ[i],x+30,y+52,100,1,ck>0?C.green:C.ink,5);
    const fs=Math.min(46,Math.floor(270/OUTLAB[i].length));
    txt(OUTLAB[i],x+148,y+124,{size:fs,font:SERIF,weight:900,color:ck>0?C.ink:C.mute});
    if(ck>0){ g.save(); g.globalAlpha*=eOut(ck); g.fillStyle=C.green; g.beginPath(); g.arc(x+410,y+40,22,0,7); g.fill(); g.restore(); drawIcon('check',x+390,y+20,40,ck,C.bg,6); }
    g.restore(); }
  g.restore();
  const endOut=eInOut(P(t,l2.t0-.3,l2.t0+.3));
  if(t>l1.t0-.5){ const a=eOut(P(t,l1.t0-.4,l1.t0+.2))*(1-endOut);
    g.save(); g.globalAlpha*=a;
    reveal('一块一块，找回来',80,460,P(t,l1.t0+.2,l1.t0+1.2),{size:72,font:SERIF,weight:900,color:C.green});
    txt('一天 24 小时',80,560,{size:32,weight:700,color:C.mute});
    const fill=P(t,l1.t0+.3,done);
    for(let i=0;i<24;i++){ const c=i%6, r=Math.floor(i/6), x=80+c*156, y=610+r*156; const on=fill*24>i;
      rrect(x,y,136,136,16); g.fillStyle=on?C.green:C.line; g.fill(); }
    g.restore(); }
  if(t>l2.t0-.1){
    reveal('下一集',540,700,P(t,l2.t0,l2.t0+.6),{size:44,weight:500,color:C.mute,align:'center'});
    reveal('不要浪费钱',540,850,P(t,l2.t0+.3,l2.t0+1.3),{size:128,font:SERIF,weight:900,align:'center'});
    const cr=eOut(P(t,l2.t0+1.2,l2.t0+2.0));
    ['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写，同步自 2026-10-21 版本']
      .forEach((s,i)=>txt(s,540,1080+i*48,{size:30,weight:700,color:C.ink,align:'center',alpha:cr}));
  }
}

const FN = {hook:sHook, screen:sScreen, estimate:sEstimate, deadline:sDeadline, ifthen:sIfthen, exit:sExit, habit:sHabit, outro:sOutro};

// ---------- 冲击点：画面震动 + 闪光 + 声音，同一时刻 ----------
const AMB='242,181,68', RED='255,82,50', GRN='61,214,140';
(function(){
  const Hk=hookHits(), S=screenHits(), E=estHits(), D=ddHits(), I=itHits(), X=exHits(), B=hbHits();
  window.IMPACTS=[
    {t:Hk.h537, k:.8, c:AMB, sfx:'boom', riser:1},
    {t:Hk.x2, k:.5, c:RED, sfx:'stamp'},
    {t:Hk.leak, k:1, c:RED, sfx:'boom'},
    {t:S.y365, k:.6, c:AMB, f:.5, sfx:'chime'},
    {t:S.hand, k:.3, c:AMB, sfx:'stamp'},
    {t:E.real, k:1, c:RED, sfx:'boom', riser:1},
    {t:E.p60, k:.4, c:GRN, f:.5, sfx:'chime'},
    {t:D.p806, k:.4, c:GRN, f:.45, sfx:'chime'},
    {t:D.p387, k:.8, c:RED, sfx:'boom', riser:1},
    {t:I.wr, k:.35, c:AMB, f:.45, sfx:'chime'},
    {t:I.med, k:.4, c:GRN, f:.45, sfx:'stamp'},
    {t:X.e411, k:.7, c:RED, sfx:'boom'},
    {t:X.back, k:.35, c:GRN, f:.5, sfx:'chime'},
    {t:B.no, k:.8, c:RED, sfx:'stamp'},
    {t:B.d254, k:1, c:RED, sfx:'boom', riser:1},
    {t:B.zero, k:.35, c:GRN, f:.5, sfx:'chime'},
    {t:outroDone(), k:.4, c:GRN, f:.6, sfx:'chime'},
  ];
})();
function buildEvents(EV){
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  SEQ.forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  IMPACTS.forEach(im=>{ EV.push({t:im.t,type:im.sfx}); if(im.riser) EV.push({t:im.t-.03,type:'riser'}); });
  const l2=L('screen',2); [.25,.47,.69].forEach(f=>EV.push({t:frac(l2,f)+.2,type:'pop'}));
  const l1=L('ifthen',1); EV.push({t:frac(l1,.22),type:'stamp'});
  outroStarts().forEach(x=>EV.push({t:x+.05,type:'pop'}));
}
