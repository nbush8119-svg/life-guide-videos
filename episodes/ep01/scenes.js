/* 第 1 集《不要早死》场景。依赖 engine/stage.js 提供的绘图函数。 */
const SEQ = ['belt','helmet','smoke','mushroom','ebike','bp'];
// ---------- scene: hook ----------
function sHook(t){
  const a=L('hook',0), b=L('hook',1);
  const u0=P(t,a.t0,a.t1);
  // heartbeat line across top of the stage, alive from frame 0
  ecg(t, 300, C.red, clamp(P(t,0,0.8))*(1-P(t,b.t0,b.t0+.6)));
  const up=eInOut(P(t,b.t0-.1,b.t0+.6));
  g.save();g.translate(0,-up*250);g.globalAlpha=1-up*0.72;
  reveal('有些死法',80,600,P(t,a.t0,a.t0+1.0),{size:132,font:SERIF,weight:900});
  // 2秒 · ¥100 count up
  const c=eOut(P(t,a.t0+1.0,a.t0+2.0));
  if(c>0){ g.globalAlpha*=c;
    txt('2',80,820,{size:230,font:NUM,weight:900,color:C.amber}); txt('秒',80+tw('2',230,NUM,900)+10,820,{size:84,font:SERIF,weight:900,color:C.amber});
    txt('¥'+Math.round(lerp(0,100,c)),520,820,{size:230,font:NUM,weight:900,color:C.amber});
    g.globalAlpha/=c; }
  reveal('就能躲开',80,990,P(t,a.t0+2.0,a.t1),{size:132,font:SERIF,weight:900});
  g.restore();
  // six icons
  if(t>b.t0-.2){
    reveal('六件最便宜的保命小事',80,860,P(t,b.t0+.2,b.t0+1.3),{size:76,font:SERIF,weight:900});
    for(let i=0;i<6;i++){ const p=gridPos(i); const u=P(t,b.t0+.5+i*.22,b.t0+1.3+i*.22);
      cell(p.x,p.y,u); drawIcon(SEQ[i],p.x+80,p.y+18,140,u,C.ink,5); }
  }
}
// ---------- item scene frame (index numeral, hero icon, title, cost) ----------
const ITEMS = {
 belt:   {n:'01', zh:'第一件', title:['系安全带'], sub:'前排后排都要系', cost:'成本 · 2 秒'},
 helmet: {n:'02', zh:'第二件', title:['戴头盔'], sub:'骑摩托、电动车，扣好扣带', cost:'成本 · ¥100–300'},
 smoke:  {n:'03', zh:'第三件', title:['装烟雾报警器'], sub:'冬天屋里烧煤用气，再加一氧化碳报警器', cost:'成本 · ¥30–100'},
 mushroom:{n:'04',zh:'第四件', title:['不碰野生蘑菇'], sub:'不采、不买、不吃', cost:'成本 · ¥0'},
 ebike:  {n:'05', zh:'第五件', title:['电动车不进楼'], sub:'不推进楼道，不在家里充电', cost:'成本 · ¥0'},
 bp:     {n:'06', zh:'最后一件', title:['量一次血压'], sub:'可能是全书性价比最高的一个动作', cost:'成本 · ¥100–200 · 1 分钟'},
};
// ---------- 01 belt ----------
function sBelt(t){ const id='belt';
  itemFrame(id,t,L(id,3).t0);
  const l1=L(id,1), l2=L(id,2);
  // bars: 没系 vs 系上
  const a=eOut(P(t,l1.t0,l1.t0+.6)), sh=eInOut(P(t,l1.t0+.8,l1.t0+2.2));
  if(a>0){ g.save(); g.globalAlpha=a;
    txt('没系',80,920,{size:40,weight:500,color:C.mute}); rrect(220,880,780,52,10); g.fillStyle=C.red; g.globalAlpha=a*.9; g.fill();
    g.globalAlpha=a; txt('系上',80,1010,{size:40,weight:500,color:C.mute});
    rrect(220,970,780*lerp(1,.55,sh),52,10); g.fillStyle=C.green; g.fill();
    if(sh>0) txt('−'+Math.round(45*sh)+'%',220+780*lerp(1,.55,sh)+24,1012,{size:60,font:NUM,weight:800,color:C.green});
    txt('轿车前排 · 车祸致死风险',220,1070,{size:30,weight:500,color:C.mute});
    g.restore(); }
  // rear-seat ten people, six red
  const b=P(t,l2.t0,l2.t0+.5);
  if(b>0){ const up=eInOut(P(t,l2.t0,l2.t0+.6));
    g.save(); g.globalAlpha=up; g.fillStyle=C.bg; g.fillRect(60,860,960,240); g.restore();
    for(let i=0;i<10;i++){ const r=i<6 && t>l2.t0+1.0+i*.18; const e=eOut(P(t,l2.t0+.1+i*.05,l2.t0+.6+i*.05));
      person(130+i*92,1060+(1-e)*30,150,r?C.red:C.dim,e); }
    reveal('后排死者 · 10 人中 6 人没系',80,1140,P(t,l2.t0+1.2,l2.t0+2.2),{size:40,weight:700,color:C.ink});
  }
}
// ---------- 02 helmet ----------
function sHelmet(t){ const id='helmet';
  itemFrame(id,t,L(id,2).t0);
  const l1=L(id,1);
  const u=P(t,l1.t0+.3,l1.t0+2.0), v=P(t,l1.t0+1.6,l1.t0+3.4);
  if(t>l1.t0){ ring(300,1010,120,u,.42,'死亡风险',C.green); ring(780,1010,120,v,.69,'头部受伤',C.green); }
}
// ---------- 03 smoke ----------
function sSmoke(t){ const id='smoke';
  const l1=L(id,1), l2=L(id,2), l3=L(id,3);
  const quiet = P(t,l3.t0-.6,l3.t0);           // the hush before the line
  g.save(); g.globalAlpha=1-quiet; itemFrame(id,t,l1.t0+1.5); g.restore();
  // alarm rings + bar
  if(t>l1.t0 && t<l2.t0+.3){ const e=eOut(P(t,l1.t0,l1.t0+.6));
    g.save(); g.globalAlpha=e*(1-P(t,l2.t0-.2,l2.t0+.3));
    txt('死亡风险',80,950,{size:40,weight:500,color:C.mute});
    const sh=eInOut(P(t,l1.t0+.8,l1.t0+2.4));
    rrect(80,980,920,56,10); g.fillStyle=C.red; g.globalAlpha*=.35; g.fill(); g.globalAlpha/=.35;
    rrect(80,980,920*lerp(1,.4,sh),56,10); g.fillStyle=C.green; g.fill();
    if(sh>0) txt('约 −'+Math.round(60*sh)+'%',80+920*lerp(1,.4,sh)+24,1026,{size:56,font:NUM,weight:800,color:C.green});
    txt('有一个能正常工作的烟雾报警器',80,1100,{size:32,weight:500,color:C.mute});
    g.restore(); }
  // sleepers: 10 people, 4 lying with moon
  if(t>l2.t0 && t<l3.t0+.2){ const out=P(t,l3.t0-.6,l3.t0);
    for(let i=0;i<10;i++){ const sl=i<4; const e=eOut(P(t,l2.t0+i*.06,l2.t0+.5+i*.06));
      const lying = sl && t>l2.t0+.9+i*.15;
      person(130+i*92,1060,150,lying?C.amber:C.dim,e*(1-out),lying); }
    // moon
    const m=eOut(P(t,l2.t0+.9,l2.t0+1.5)); g.save(); g.globalAlpha=m*(1-out); g.fillStyle=C.amber;
    g.beginPath(); g.arc(940,900,34,0,7); g.fill(); g.fillStyle=C.bg; g.beginPath(); g.arc(956,890,30,0,7); g.fill(); g.restore();
    reveal('41% 起火时在睡觉',80,1140,P(t,l2.t0+1.2,l2.t0+2.2),{size:44,color:C.ink,alpha:1-out});
  }
  // the line, alone
  if(t>l3.t0-.1){ const e=P(t,l3.t0,l3.t0+1.4);
    reveal('你睡着了，',540,860,e,{size:104,font:SERIF,weight:900,align:'center'});
    reveal('它醒着。',540,1010,P(t,l3.t0+.7,l3.t0+1.8),{size:104,font:SERIF,weight:900,align:'center',color:C.amber});
    // detector LED blinking
    const on = (Math.floor((t-l3.t0)*1.5)%2===0)?1:.25; g.save(); g.globalAlpha=on*clamp(P(t,l3.t0+.6,l3.t0+1)); g.fillStyle=C.red;
    g.beginPath(); g.arc(540,1110,10,0,7); g.fill(); g.restore();
  }
}
// ---------- 04 mushroom ----------
function sMush(t){ const id='mushroom';
  itemFrame(id,t,L(id,2).t1-.3);
  const l1=L(id,1), l2=L(id,2);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4);
    g.save(); g.globalAlpha=1-out;
    txt('中国疾控 · 2025 年',80,900,{size:34,weight:500,color:C.mute});
    const cols=[[828,'起中毒',C.ink,0],[2165,'人中招',C.ink,1.6],[13,'人死亡',C.red,3.4]];
    cols.forEach(([v,lab,col,dt],i)=>{ const u=eOut(P(t,l1.t0+.4+dt,l1.t0+1.6+dt)); if(u<=0)return;
      const x=80+i*330; g.globalAlpha=(1-out)*u; counter(v*u,x,1040,110,col); txt(lab,x,1100,{size:38,weight:700,color:C.mute,alpha:u}); });
    g.restore(); }
  if(t>l2.t0){ const myths=['银针试毒','虫子吃过就没毒','颜色鲜艳才有毒'];
    const seg=(l2.t1-l2.t0-1.2)/3;
    myths.forEach((m,i)=>{ const a=l2.t0+.1+i*seg; const e=eOut(P(t,a,a+.4)); if(e<=0)return; const y=880+i*104;
      g.save(); g.globalAlpha=e; rrect(80,y,620,84,14); g.fillStyle=C.panel; g.fill();
      txt(m,112,y+56,{size:42,weight:700,color:C.ink});
      const st=eExpo(P(t,a+.45,a+.75)); // strike
      if(st>0){ g.strokeStyle=C.red; g.lineWidth=6; g.beginPath(); g.moveTo(104,y+44); g.lineTo(104+tw(m,42)*st+16,y+44); g.stroke();
        const s2=eOut(P(t,a+.6,a+.9)); g.save(); g.globalAlpha=s2; g.translate(760,y+42); g.rotate(-.12); g.scale(lerp(1.6,1,s2),lerp(1.6,1,s2));
        rrect(-6,-34,230,68,8); g.strokeStyle=C.red; g.lineWidth=5; g.stroke(); txt('✕ 不成立',16,16,{size:40,weight:900,color:C.red}); g.restore(); }
      g.restore(); });
  }
}
// ---------- 05 ebike ----------
function sEbike(t){ const id='ebike';
  itemFrame(id,t,L(id,2).t1-.2);
  const l1=L(id,1), l2=L(id,2);
  if(t>l1.t0 && t<l2.t0+.4){ const out=P(t,l2.t0-.1,l2.t0+.4);
    g.save(); g.globalAlpha=1-out;
    // building outline
    const b=eOut(P(t,l1.t0,l1.t0+.8)); g.strokeStyle=C.mute; g.lineWidth=4;
    g.beginPath(); g.moveTo(80,1150); g.lineTo(80,1150-280*b); g.lineTo(80+300*b,1150-380*b); g.lineTo(80+600*b,1150-280*b); g.lineTo(80+600*b,1150); g.stroke();
    txt('2021 年 · 电动自行车火灾',80,880,{size:34,weight:500,color:C.mute});
    for(let i=0;i<65;i++){ const inside=i<60; const col=i%10, row=Math.floor(i/10);
      const x= inside? 130+col*52 : 760+(i-60)*52, y= inside? 1110-row*40 : 1110;
      const e=eOut(P(t,l1.t0+.6+i*.03,l1.t0+1.0+i*.03)); if(e<=0)continue;
      const red = inside && t>l1.t0+3.2;
      g.globalAlpha=(1-out)*e; g.fillStyle=red?C.red:C.ink; g.beginPath(); g.arc(x,y-(1-e)*30,13,0,7); g.fill(); }
    g.globalAlpha=1-out;
    const c=eOut(P(t,l1.t0+1.0,l1.t0+3.0)); counter(65*c,760,1000,96,C.ink); txt('人死亡',760+tw('65',96,NUM,800)+12,1000,{size:38,weight:700,color:C.mute,alpha:c});
    const d=eOut(P(t,l1.t0+3.2,l1.t0+4.0)); txt('60 人死在建筑物里',700,1060,{size:38,weight:700,color:C.red,alpha:d});
    g.restore(); }
  if(t>l2.t0){ const e=eOut(P(t,l2.t0,l2.t0+.8));
    // corridor in one-point perspective
    g.save(); g.globalAlpha=e; g.strokeStyle=C.mute; g.lineWidth=3;
    const vx=540, vy=1010; [[80,860],[1000,860],[80,1160],[1000,1160]].forEach(([x,y])=>{g.beginPath();g.moveTo(x,y);g.lineTo(lerp(x,vx,.72),lerp(y,vy,.72));g.stroke();});
    g.strokeRect(lerp(80,vx,.72),lerp(860,vy,.72),lerp(1000,vx,.72)-lerp(80,vx,.72),lerp(1160,vy,.72)-lerp(860,vy,.72));
    // exit sign
    rrect(470,880,140,52,8); g.fillStyle=C.green; g.fill(); txt('出口',540,918,{size:30,weight:900,color:C.bg,align:'center'});
    // fire blocks the corridor
    const f=eOut(P(t,l2.t0+.9,l2.t0+1.8));
    for(let i=0;i<14;i++){ const fx=360+i*26, h=(60+70*hash(i))*f*(0.8+0.2*Math.sin(t*9+i)); g.fillStyle=i%2?C.red:C.amber; g.globalAlpha=e*.85;
      g.beginPath(); g.moveTo(fx-16,1120); g.quadraticCurveTo(fx,1120-h*1.4,fx+16,1120); g.fill(); }
    g.restore();
    reveal('唯一的逃生通道',540,1210,P(t,l2.t0+1.2,l2.t0+2.2),{size:44,color:C.ink,align:'center'});
  }
}
// ---------- 06 blood pressure ----------
function sBP(t){ const id='bp';
  itemFrame(id,t,L(id,4).t0);
  const l0=L(id,0), l1=L(id,1), l2=L(id,2), l3=L(id,3);
  // badge
  const bd=eOut(P(t,l0.t0+1.2,l0.t0+1.8)); if(bd>0){ g.save(); g.globalAlpha=bd; rrect(80,860,330,56,28); g.fillStyle=C.amber; g.fill(); txt('全书性价比最高之一',245,898,{size:30,weight:900,color:C.bg,align:'center'}); g.restore(); }
  // 10x10 grid
  if(t>l1.t0 && t<l3.t0+.3){ const out=P(t,l3.t0-.2,l3.t0+.3);
    const phase2 = t>l2.t0;
    for(let i=0;i<100;i++){ const x=110+(i%10)*44, y=950+Math.floor(i/10)*30;
      const e=eOut(P(t,l1.t0+.2+i*.008,l1.t0+.6+i*.008)); if(e<=0)continue;
      let col=C.dim;
      if(!phase2){ if(i<45 && t>l1.t0+1.2+i*.01) col=C.amber; }
      else { col=C.amber; if(i<7 && t>l2.t0+1.2+i*.12) col=C.green; }
      g.save(); g.globalAlpha=e*(1-out); g.fillStyle=col; g.beginPath(); g.arc(x,y,11,0,7); g.fill(); g.restore(); }
    const lab = phase2? ['有高血压的人里','控制住的：7 / 100'] : ['35–75 岁人群','≈ 45% 有高血压'];
    const lu = phase2? P(t,l2.t0+.6,l2.t0+1.6) : P(t,l1.t0+1.4,l1.t0+2.4);
    reveal(lab[0],600,1000,lu,{size:34,weight:500,color:C.mute,alpha:1-out});
    reveal(lab[1],600,1070,lu,{size:52,weight:900,color:phase2?C.green:C.amber,alpha:1-out});
  }
  if(t>l3.t0){ const e=eOut(P(t,l3.t0,l3.t0+.6));
    g.save(); g.globalAlpha=e; ecg(t,1020,C.green,e); g.restore();
    reveal('高压 −10 mmHg',80,1120,P(t,l3.t0+.2,l3.t0+1.2),{size:52,font:NUM,weight:800});
    reveal('中风风险 −27%',560,1120,P(t,l3.t0+1.4,l3.t0+2.4),{size:52,weight:900,color:C.green});
  }
}
// ---------- outro ----------
function sOutro(t){
  const l0=L('outro',0), l1=L('outro',1), l2=L('outro',2), s=SC.outro;
  const end=P(t,l2.t0-.5,l2.t0+.1);
  g.save(); g.globalAlpha=1-end;
  const span=(l0.t1-l0.t0)/6;
  for(let i=0;i<6;i++){ const p=gridPos(i); const y=p.y-560; const u=P(t,s.t0+i*.08,s.t0+.6+i*.08);
    cell(p.x,y,u); drawIcon(SEQ[i],p.x+80,y+18,140,1,C.ink,5,eOut(u));
    const ck=P(t,l0.t0+i*span,l0.t0+i*span+.4);
    if(ck>0){ g.save(); g.beginPath(); g.arc(p.x+250,y+40,26,0,7); g.fillStyle=C.green; g.globalAlpha*=eOut(ck); g.fill(); g.restore();
      drawIcon('check',p.x+228,y+18,44,ck,C.bg,6); } }
  if(t>l1.t0) reveal('6 件事，加起来几百块',80,960,P(t,l1.t0,l1.t0+1.2),{size:76,font:SERIF,weight:900});
  g.restore();
  if(t>l2.t0-.1){
    reveal('下一集',540,700,P(t,l2.t0,l2.t0+.6),{size:44,weight:500,color:C.mute,align:'center'});
    reveal('不要慢慢死',540,850,P(t,l2.t0+.3,l2.t0+1.3),{size:140,font:SERIF,weight:900,align:'center'});
    ecg(t,950,C.red,eOut(P(t,l2.t0+.8,l2.t0+1.6))*.7);
    const cr=eOut(P(t,l2.t0+1.2,l2.t0+2.0));
    const lines=['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写，同步自 2026-10-21 版本 · 不构成医疗或法律建议'];
    lines.forEach((s,i)=>txt(s,540,1080+i*48,{size:28,weight:500,color:C.mute,align:'center',alpha:cr}));
  }
}

const FN = {hook:sHook, belt:sBelt, helmet:sHelmet, smoke:sSmoke, mushroom:sMush, ebike:sEbike, bp:sBP, outro:sOutro};
function buildEvents(EV){
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  ['belt','helmet','smoke','mushroom','ebike','bp'].forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  (()=>{const l=L('mushroom',2);const seg=(l.t1-l.t0-1.2)/3;for(let i=0;i<3;i++)EV.push({t:l.t0+.1+i*seg+.62,type:'stamp'});})();
  (()=>{const l=L('outro',0);const sp=(l.t1-l.t0)/6;for(let i=0;i<6;i++)EV.push({t:l.t0+i*sp+.05,type:'pop'});})();
  EV.push({t:L('belt',2).t0+1.0,type:'pulse'},{t:L('ebike',1).t0+3.2,type:'pulse'},{t:L('bp',2).t0+1.2,type:'pulse'});
}