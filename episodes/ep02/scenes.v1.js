/* 第 2 集《不要慢慢死》— 核心意象「人生千月格」：按 80 岁算 960 个月，一个点一个月。
   烟从末尾把十年烧成灰，戒烟又把九成点亮；结尾整片重新亮起，呼应开头。依赖 engine/stage.js。 */

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
// itemFrame 画的是 ITEMS[id] 的图标名 = id，这里把图标名映射过去
SEQ.forEach(id=>{ ICON[id]=ICON[ICONOF[id]]; });

// ---------- 人生千月格 ----------
const N=960;
const LAY = {
  big:   {cols:30, x0:(W-29*23)/2, y0:520, sp:23, r:8.2},
  strip: {cols:60, x0:(W-59*15.2)/2, y0:900, sp:15.2, r:5.3},
};
function gpos(i,lay){ const c=i%lay.cols, r=Math.floor(i/lay.cols); return [lay.x0+c*lay.sp, lay.y0+r*lay.sp]; }
// state(i) -> {c:color, a:alpha, r:radiusScale, glow:0..1}
function lifeGrid(state, m=0, alpha=1, A='big', B='strip'){
  if(alpha<=0) return; const la=LAY[A], lb=LAY[B];
  g.save(); g.globalAlpha*=alpha;
  for(let i=0;i<N;i++){
    const s=state(i); if(!s||s.a<=0) continue;
    const [x1,y1]=gpos(i,la), [x2,y2]=gpos(i,lb); const e=eInOut(m);
    const x=lerp(x1,x2,e), y=lerp(y1,y2,e), r=lerp(la.r,lb.r,e)*(s.r??1);
    if(s.glow>0){ g.save(); g.globalAlpha*=s.a*s.glow*.55; g.fillStyle=s.c; g.beginPath(); g.arc(x,y,r*2.6,0,7); g.fill(); g.restore(); }
    g.globalAlpha=alpha*s.a; g.fillStyle=s.c; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  }
  g.restore();
}
const CREAM='#F2EDE4', ASH='#2E2C29', EMBER='#FF7A2E';

// ---------- 开头 ----------
function sHook(t){
  const a=L('hook',0), b=L('hook',1), c=L('hook',2);
  const out=eInOut(P(t,c.t0-.1,c.t0+.7));
  // 960 个点一口气铺满
  const fillT0=a.t0+.2, fillDur=2.4;
  const thief0=b.t0+.4;                               // 从末尾开始，一个月一个月变暗
  lifeGrid(i=>{
    const ti=fillT0+fillDur*(i/N); const u=P(t,ti,ti+.25); if(u<=0) return null;
    let col=CREAM, a=.92*eOut(u), r=1;
    const k=N-1-i; const td=thief0+k*.075;            // 被偷走：每 0.075 秒一个月
    if(k<44 && t>td){ const v=P(t,td,td+.35); col=v<.5?'#FF5232':ASH; a=lerp(.92,.9,v); r=lerp(1.25,.8,v); return {c:col,a,r,glow:v<.5?1-v*2:0}; }
    return {c:col,a,r};
  }, 0, 1-out);
  // 大字：960 个月
  const hu=P(t,a.t0,a.t0+.6), cnt=Math.round(N*clamp(P(t,fillT0,fillT0+fillDur)));
  g.save(); g.globalAlpha*=(1-out)*eOut(hu);
  txt('按 80 岁算，一辈子',80,330,{size:40,weight:500,color:C.mute});
  txt(String(cnt),80,470,{size:150,font:NUM,weight:900,color:C.amber});
  txt('个月',80+tw(String(Math.max(cnt,100)),150,NUM,900)+16,462,{size:64,font:SERIF,weight:900});
  g.restore();
  if(t>b.t0){ g.save(); g.globalAlpha*=(1-out);
    reveal('一个月一个月，被偷走',560,462,P(t,b.t0+.3,b.t0+1.5),{size:40,weight:700,color:C.red}); g.restore(); }
  // 六笔账
  if(t>c.t0-.2){
    reveal('六笔慢性的账',80,860,P(t,c.t0+.2,c.t0+1.2),{size:76,font:SERIF,weight:900});
    for(let i=0;i<6;i++){ const p=gridPos(i); const u=P(t,c.t0+.45+i*.16,c.t0+1.2+i*.16);
      cell(p.x,p.y,u); drawIcon(SEQ[i],p.x+80,p.y+18,140,u,C.ink,5); }
  }
}

// ---------- 01 烟：十年烧成灰，九成重新点亮 ----------
function sSmoke(t){ const id='smoke';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  itemFrame(id,t,l3.t0+.1);
  const gin=eOut(P(t,l1.t0,l1.t0+.8)), gout=eInOut(P(t,l3.t0-.2,l3.t0+.4));
  const b0=l1.t0+1.0, bDur=2.8;                      // 燃烧：从第 960 个月往回烧 120 个
  const r0=l2.t0+.9, rDur=2.2;                       // 复燃：九成重新点亮
  let burned=0, relit=0;
  lifeGrid(i=>{
    const sweep=P(t,l1.t0+(i%60)/60*.5,l1.t0+.5+(i%60)/60*.5); if(sweep<=0) return null;
    const k=N-1-i;
    if(k>=120) return {c:CREAM,a:.85*sweep};
    const tb=b0+k/120*bDur; let st={c:CREAM,a:.85};
    if(t>tb){ const v=P(t,tb,tb+.45); burned++;
      st = v<1 ? {c:v<.5?'#FFD27A':EMBER,a:.95,r:lerp(1.6,1,v),glow:1-v} : {c:ASH,a:.9,r:.85}; }
    const kk=119-k;                                   // 从烧掉的最前端开始复燃
    if(kk<108){ const tr=r0+kk/108*rDur; if(t>tr){ const v=P(t,tr,tr+.4); relit++; st={c:C.green,a:.95,r:lerp(1.5,1,v),glow:1-v}; } }
    return st;
  }, 1, gin*(1-gout), 'strip','strip');
  // 标注
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
  // 一行 60 个月（5 年）：被吃掉的从右往左变红
  for(let i=0;i<n;i++){ const k=n-1-i; let col=CREAM, a=.8, r=7;
    const tk=t0+k*.035;
    if(k<lostMax && t>tk){ const v=P(t,tk,tk+.3); col = k<lost ? (v<.6?EMBER:C.red) : '#7A2A1E'; a=.95; r=lerp(9,7,v); }
    g.fillStyle=col; g.globalAlpha=a; g.beginPath(); g.arc(x+i*14.4,y,r,0,7); g.fill(); }
  g.globalAlpha=1;
  txt(label,80,y-26,{size:32,weight:700,color:C.ink}); txt(sub,1000,y-26,{size:36,font:NUM,weight:900,color:C.red,align:'right',alpha:clamp(P(t,t0+.4,t0+1.2))});
}
function sAlcohol(t){ const id='alcohol';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  itemFrame(id,t,1e9);
  // L1 啤酒罐一罐罐灌满
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4);
    for(let i=0;i<5;i++){ const f=eInOut(P(t,l1.t0+.4+i*.45,l1.t0+1.1+i*.45)); beerCan(98+i*186,880,f,(1-out)*eOut(P(t,l1.t0+i*.1,l1.t0+.4+i*.1))); }
    g.save(); g.globalAlpha*=1-out;
    reveal('2.5 L 啤酒 ≈ 100 g 纯酒精',80,1170,P(t,l1.t0+2.4,l1.t0+3.4),{size:40,weight:900,color:C.amber});
    reveal('每周超过这个量，喝得越多，死得越早',80,1222,P(t,l1.t0+3.2,l1.t0+4.2),{size:30,weight:500,color:C.mute});
    g.restore(); }
  // L2 少活的月份
  if(t>l2.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3);
    g.save(); g.globalAlpha*=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    txt('40 岁时，每周喝',80,880,{size:28,weight:500,color:C.mute});
    monthRow(108,975,60,12,24,l2.t0+.6,t,'200–350 g / 周','−1–2 年');
    monthRow(108,1105,60,48,60,l2.t0+(l2.t1-l2.t0)*.55,t,'超过 350 g / 周','−4–5 年');
    txt('每个点 = 1 个月',80,1180,{size:24,weight:500,color:C.mute});
    g.restore(); }
  // L3 巨大的 0
  if(t>l3.t0-.1){ const e=eExpo(P(t,l3.t0+.35,l3.t0+.75));
    g.save(); g.globalAlpha*=e; g.translate(540,1120); g.scale(lerp(1.35,1,e),lerp(1.35,1,e));
    txt('0',0,0,{size:300,font:NUM,weight:900,color:C.amber,align:'center'}); g.restore();
    txt('克 / 周 · 按整体健康算最划算',540,1200,{size:32,weight:700,color:C.ink,align:'center',alpha:eOut(P(t,l3.t0+.8,l3.t0+1.4))});
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
function sSoda(t){ const id='soda';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  itemFrame(id,t,1e9);
  const vis=1-P(t,l3.t0-.1,l3.t0+.4);
  if(t>l1.t0 && vis>0){
    const flip=eInOut(P(t,l2.t0+.6,l2.t0+1.3));
    sodaCan(90,880,flip,vis*eOut(P(t,l1.t0,l1.t0+.6)));
    // 风险柱：基线 1.0 = 300px
    const X=340, base=1180, unit=230;
    g.save(); g.globalAlpha*=vis;
    g.strokeStyle=C.mute; g.lineWidth=2; g.setLineDash([8,8]); g.beginPath(); g.moveTo(X,base-unit); g.lineTo(1000,base-unit); g.stroke(); g.setLineDash([]);
    txt('几乎不喝 = 1.0',1000,base-unit-14,{size:24,weight:500,color:C.mute,align:'right'});
    const b1=eInOut(P(t,l1.t0+.8,l1.t0+2.2)), b2=eInOut(P(t,l2.t0+1.5,l2.t0+2.6));
    const h1=unit*lerp(1,1.21,b1), h2=unit*lerp(1,1.26,b2);
    rrect(X+40,base-h1,240,h1,10); g.fillStyle='#C8341F'; g.fill();
    txt('+'+Math.round(21*b1)+'%',X+160,base-h1-20,{size:56,font:NUM,weight:900,color:C.red,align:'center'});
    txt('含糖 · 每天 2 份+',X+160,base+40,{size:26,weight:700,color:C.ink,align:'center'});
    if(t>l2.t0+1.2){ const e=eOut(P(t,l2.t0+1.2,l2.t0+1.6)); g.save(); g.globalAlpha*=e;
      rrect(X+340,base-h2,240,h2,10); g.fillStyle='#3A3A42'; g.fill(); g.strokeStyle=C.red; g.lineWidth=4; g.stroke();
      txt('+'+Math.round(26*b2)+'%',X+460,base-h2-20,{size:56,font:NUM,weight:900,color:C.red,align:'center'});
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
  // 蒸汽随温度变旺
  g.strokeStyle=heat>1.5?C.red:C.mute; g.lineWidth=4; g.lineCap='round';
  for(let s=0;s<Math.round(1+heat*1.5);s++){ g.beginPath(); for(let k=0;k<=12;k++){ const yy=y+20-k*7, xx=x+40+s*28+Math.sin(k*.8+t*5+s)*6; k?g.lineTo(xx,yy):g.moveTo(xx,yy);} g.globalAlpha=alpha*.6; g.stroke(); }
  g.restore();
}
function sTea(t){ const id='tea';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  itemFrame(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4); const a=(1-out);
    const cols=[{lab:'温',v:1,c:C.ink},{lab:'热',v:2.07,c:C.amber},{lab:'很烫',v:8.16,c:C.red}];
    cols.forEach((o,i)=>{ const x=110+i*320, appear=eOut(P(t,l1.t0+.2+i*.4,l1.t0+.7+i*.4));
      teaCup(x,1060,i,a*appear,t);
      const grow=i<2?eInOut(P(t,l1.t0+.8+i*.4,l1.t0+1.6+i*.4)):eExpo(P(t,l1.t0+(l1.t1-l1.t0)*.62,l1.t0+(l1.t1-l1.t0)*.62+.35));
      const h=22*o.v*grow; g.save(); g.globalAlpha*=a*appear; rrect(x+160,1220-h,60,h,8); g.fillStyle=o.c; g.fill(); g.restore();
      txt(o.lab,x+75,1270,{size:32,weight:900,color:o.c,align:'center',alpha:a*appear});
    });
    // ×8 砸下来
    const s=eExpo(P(t,l1.t0+(l1.t1-l1.t0)*.62,l1.t0+(l1.t1-l1.t0)*.62+.35));
    if(s>0){ g.save(); g.globalAlpha*=a*s; g.translate(1010,1000); g.scale(lerp(1.6,1,s),lerp(1.6,1,s));
      txt('×8',0,0,{size:200,font:NUM,weight:900,color:C.red,align:'right'}); g.restore();
      txt('食管癌风险',1010,1050,{size:30,weight:700,color:C.ink,align:'right',alpha:a*s}); }
  }
  if(t>l2.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    const cx=280, cy=1060, R=150;
    const sweep=eInOut(P(t,l2.t0+.5,l2.t0+2.6))*4;   // 0→4 分钟
    g.save(); g.globalAlpha*=a; g.lineWidth=24; g.lineCap='butt';
    g.strokeStyle=C.line; g.beginPath(); g.arc(cx,cy,R,0,7); g.stroke();
    const ang=m=>-Math.PI/2+m/5*Math.PI*2;              // 表盘 5 分钟一圈
    g.strokeStyle=C.red; g.beginPath(); g.arc(cx,cy,R,ang(0),ang(Math.min(2,sweep))); g.stroke();
    if(sweep>2){ g.strokeStyle=C.amber; g.globalAlpha*=.5; g.beginPath(); g.arc(cx,cy,R,ang(2),ang(Math.min(4,sweep))); g.stroke(); g.globalAlpha/=.5; }
    if(sweep>=4){ g.strokeStyle=C.green; g.beginPath(); g.arc(cx,cy,R,ang(4),ang(5)); g.stroke(); }
    g.strokeStyle=C.ink; g.lineWidth=6; g.lineCap='round'; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(ang(sweep))*(R-30),cy+Math.sin(ang(sweep))*(R-30)); g.stroke();
    g.fillStyle=C.ink; g.beginPath(); g.arc(cx,cy,10,0,7); g.fill();
    const mm=Math.floor(sweep), ss=Math.floor((sweep-mm)*60);
    txt(`${mm}:${String(ss).padStart(2,'0')}`,cx,cy+R+70,{size:48,font:NUM,weight:800,color:C.ink,align:'center'});
    g.restore();
    const r1=eOut(P(t,l2.t0+.9,l2.t0+1.5)), r2=eOut(P(t,l2.t0+(l2.t1-l2.t0)*.6,l2.t0+(l2.t1-l2.t0)*.6+.6));
    txt('倒出 < 2 分钟就喝',520,960,{size:36,weight:700,color:C.ink,alpha:a*r1});
    txt('×5',520,1080,{size:120,font:NUM,weight:900,color:C.red,alpha:a*r1});
    txt('等 4 分钟以上',520,1160,{size:36,weight:700,color:C.green,alpha:a*r2});
    txt('= 1',520+tw('等 4 分钟以上',36)+20,1162,{size:44,font:NUM,weight:900,color:C.green,alpha:a*r2});
  }
}

// ---------- 05 久坐：2.6 倍，被 75 分钟活动抵消 ----------
function sSit(t){ const id='sit';
  const l1=L(id,1), l2=L(id,2);
  itemFrame(id,t,1e9);
  if(t<l1.t0) return;
  const unit=300, X=80;
  const grow=eExpo(P(t,l1.t0+(l1.t1-l1.t0)*.55,l1.t0+(l1.t1-l1.t0)*.55+.5));
  const ringU=eInOut(P(t,l2.t0+(l2.t1-l2.t0)*.2,l2.t0+(l2.t1-l2.t0)*.75));
  const v=lerp(1,2.63,grow), v2=lerp(v,1.04,ringU);
  const a=eOut(P(t,l1.t0,l1.t0+.5));
  g.save(); g.globalAlpha*=a;
  txt('坐得最少',X,905,{size:30,weight:700,color:C.mute});
  rrect(X,925,unit,48,8); g.fillStyle=C.dim; g.fill(); txt('×1',X+unit+18,962,{size:40,font:NUM,weight:900,color:C.mute});
  txt('坐得最久',X,1035,{size:30,weight:700,color:C.ink});
  const col = ringU>.5?C.amber:C.red;
  rrect(X,1055,unit*v2,48,8); g.fillStyle=col; g.fill();
  txt('×'+v2.toFixed(ringU>0?2:1).replace(/\.?0+$/,m=>m.length>1?'':m),X+unit*v2+18,1094,{size:52,font:NUM,weight:900,color:col});
  g.restore();
  if(t>l2.t0){ const e=eOut(P(t,l2.t0,l2.t0+.6));
    // 活动环
    const cx=860, cy=920, R=78; g.save(); g.globalAlpha*=e; g.lineWidth=20; g.lineCap='round';
    g.strokeStyle=C.line; g.beginPath(); g.arc(cx,cy,R,0,7); g.stroke();
    g.strokeStyle=C.green; g.beginPath(); g.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*ringU); if(ringU>0)g.stroke(); g.restore();
    txt(String(Math.round(75*ringU)),cx,cy+18,{size:52,font:NUM,weight:900,color:C.green,align:'center',alpha:e});
    txt('分钟 / 天',cx,cy+R+50,{size:26,weight:700,color:C.ink,align:'center',alpha:e});
    reveal('动够了，久坐多出来的风险基本抵消',80,1200,P(t,l2.t0+(l2.t1-l2.t0)*.7,l2.t1),{size:38,weight:900,color:C.green});
  }
}

// ---------- 06 走路：脚印、步数与曲线 ----------
function footprint(x,y,ang,s,col,a){ g.save(); g.globalAlpha*=a; g.translate(x,y); g.rotate(ang); g.fillStyle=col;
  g.beginPath(); g.ellipse(0,0,10*s,20*s,0,0,7); g.fill(); g.beginPath(); g.arc(0,-28*s,6*s,0,7); g.fill(); g.restore(); }
function sWalk(t){ const id='walk';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  itemFrame(id,t,l3.t0+.1);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4), a=1-out;
    // 脚印沿弧线一路走过去
    const steps=22; for(let i=0;i<steps;i++){ const ti=l1.t0+.2+i*.18; const u=P(t,ti,ti+.25); if(u<=0)continue;
      const f=i/(steps-1); const x=90+f*900, y=1225-Math.sin(f*Math.PI)*60+(i%2?18:-18);
      footprint(x,y,Math.PI/2+.15*(i%2?1:-1)-Math.cos(f*Math.PI)*.25,1,i>11?C.green:C.mute,a*eOut(u)*(.4+.6*f)); }
    const c1=eOut(P(t,l1.t0+.3,l1.t0+1.5)), c2=eOut(P(t,l1.t0+1.3,l1.t0+3.0));
    g.save(); g.globalAlpha*=a;
    counter(3553*c1,80,960,72,C.mute); txt('步 / 天',80+tw('3,553',72,NUM,800)+12,960,{size:30,weight:700,color:C.mute,alpha:c1});
    counter(3553+(7842-3553)*c2,80,1070,96,C.ink); txt('步 / 天',80+tw('7,842',96,NUM,800)+12,1070,{size:34,weight:700,color:C.ink,alpha:c2});
    const d=eExpo(P(t,l1.t0+(l1.t1-l1.t0)*.7,l1.t0+(l1.t1-l1.t0)*.7+.4));
    g.save(); g.globalAlpha*=d; g.translate(1000,1060); g.scale(lerp(1.5,1,d),lerp(1.5,1,d)); txt('−45%',0,0,{size:150,font:NUM,weight:900,color:C.green,align:'right'}); g.restore();
    txt('同期死亡概率',1000,1110,{size:28,weight:700,color:C.ink,align:'right',alpha:d});
    g.restore(); }
  if(t>l2.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3), a=(1-out)*eOut(P(t,l2.t0,l2.t0+.5));
    const X0=120, X1=1000, Y0=1200, Y1=880; const sx=s=>X0+(s-2000)/(12000-2000)*(X1-X0), sy=r=>Y0-(1-r)/(1-.4)*(Y0-Y1);
    g.save(); g.globalAlpha*=a;
    // 最划算的一段 4000–7000
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
      txt(p[1].toFixed(2).replace(/0$/,'').replace(/\.$/,''),sx(p[0])+14,sy(p[1])-14,{size:26,font:NUM,weight:800,color:C.ink}); });
    txt('不用非凑一万步',X1,Y0-60,{size:34,weight:900,color:C.ink,align:'right',alpha:eOut(P(t,l2.t0+(l2.t1-l2.t0)*.65,l2.t1))});
    g.restore(); }
}

// ---------- 结尾：打勾回顾，千月格重新点亮 ----------
function sOutro(t){
  const l0=L('outro',0), l1=L('outro',1), l2=L('outro',2), s=SC.outro;
  const midOut=P(t,l1.t0-.4,l1.t0+.2);
  g.save(); g.globalAlpha*=1-midOut; const span=(l0.t1-l0.t0)/6;
  for(let i=0;i<6;i++){ const p=gridPos(i); const y=p.y-560; const u=P(t,s.t0+i*.08,s.t0+.6+i*.08);
    cell(p.x,y,u); drawIcon(SEQ[i],p.x+80,y+18,140,1,C.ink,5,eOut(u));
    const ck=P(t,l0.t0+i*span,l0.t0+i*span+.4);
    if(ck>0){ g.save(); g.beginPath(); g.arc(p.x+250,y+40,26,0,7); g.fillStyle=C.green; g.globalAlpha*=eOut(ck); g.fill(); g.restore(); drawIcon('check',p.x+228,y+18,44,ck,C.bg,6); } }
  g.restore();
  // 千月格从暗处一格格亮回来
  const endOut=P(t,l2.t0-.3,l2.t0+.3);
  if(t>l1.t0-.4){ const lit0=l1.t0+.2, litDur=(l1.t1-l1.t0)-.2;
    lifeGrid(i=>{ const ti=lit0+litDur*(i/N); const v=P(t,ti,ti+.4); return {c:v>0?CREAM:ASH, a:v>0?lerp(.5,.92,v):.6, r:v>0&&v<1?lerp(1.3,1,v):1, glow:v>0&&v<1?(1-v)*.6:0}; },
      0, eOut(P(t,l1.t0-.4,l1.t0+.2))*(1-endOut*.85));
    txt('960',80,470,{size:150,font:NUM,weight:900,color:C.amber,alpha:eOut(P(t,l1.t0,l1.t0+.6))*(1-endOut)});
    txt('个月',80+tw('960',150,NUM,900)+16,462,{size:64,font:SERIF,weight:900,alpha:eOut(P(t,l1.t0,l1.t0+.6))*(1-endOut)});
    reveal('一天一天，还回来',560,462,P(t,l1.t0+1.2,l1.t0+2.4),{size:40,weight:700,color:C.green,alpha:1-endOut});
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
function buildEvents(EV){
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  SEQ.forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  const sm1=L('smoke',1), sm2=L('smoke',2); EV.push({t:sm1.t0+1.0,type:'ember'},{t:sm1.t0+2.4,type:'ember'},{t:sm2.t0+.9,type:'chime'});
  EV.push({t:L('alcohol',2).t0+.6,type:'ember'},{t:L('alcohol',3).t0+.35,type:'boom'});
  const s2=L('soda',2); EV.push({t:s2.t0+.6,type:'riser'},{t:s2.t0+1.3,type:'whoosh'},{t:s2.t0+2.5,type:'boom'});
  const t1=L('tea',1); EV.push({t:t1.t0+(t1.t1-t1.t0)*.62,type:'boom'}); const t2=L('tea',2); EV.push({t:t2.t0+.9,type:'stamp'});
  const si=L('sit',1); EV.push({t:si.t0+(si.t1-si.t0)*.55,type:'boom'}); const si2=L('sit',2); EV.push({t:si2.t0+(si2.t1-si2.t0)*.75,type:'chime'});
  const w1=L('walk',1); EV.push({t:w1.t0+(w1.t1-w1.t0)*.7,type:'pulse'});
  const o0=L('outro',0), sp=(o0.t1-o0.t0)/6; for(let i=0;i<6;i++) EV.push({t:o0.t0+i*sp+.05,type:'pop'});
  EV.push({t:L('outro',1).t0+.2,type:'chime'});
}
