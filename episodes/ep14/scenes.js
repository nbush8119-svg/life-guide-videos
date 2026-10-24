/* 通用场景模板：新一集默认用它，不写定制动画也能出片。
   数据来自 script.json 的 items（每个条目：n 序号、zh「第一件」、title 大标题、sub 副标题、cost 成本标签、icon 图标名）。
   想做得更好时，把某个条目的场景函数换成定制动画（参考 episodes/ep01/scenes.js）。 */
const SEQ = Object.keys(TL.items);
const ITEMS = TL.items;
const BIG = /(−?[0-9][0-9,.]*\s*(%|元|万|亿|倍|年|岁|天|小时|分钟|秒|人|起|个|次|mmHg)?)/;
function sHook(t){
  const a=L('hook',0), b=LINES.hook[1];
  ecg(t,300,C.red,clamp(P(t,0,.8))*(b?1-P(t,b.t0,b.t0+.6):1));
  const up=b?eInOut(P(t,b.t0-.1,b.t0+.6)):0;
  g.save(); g.translate(0,-up*250); g.globalAlpha=1-up*.72;
  const rows=wrap(a.sub.replace(/[，。]/g,' ').trim(),920,112,SERIF,900);
  rows.forEach((r,k)=>reveal(r,80,620+k*150,P(t,a.t0+k*.5,a.t0+k*.5+1.1),{size:112,font:SERIF,weight:900,
     colorAt:i=>/[0-9¥%]/.test([...r][i])?C.amber:null}));
  g.restore();
  if(b && t>b.t0-.2){
    reveal(b.sub.replace(/^这一集[，,:：]?/,''),80,860,P(t,b.t0+.2,b.t0+1.3),{size:72,font:SERIF,weight:900});
    for(let i=0;i<SEQ.length;i++){ const p=gridPos(i); const u=P(t,b.t0+.5+i*.22,b.t0+1.3+i*.22);
      cell(p.x,p.y,u); drawIcon(ITEMS[SEQ[i]].icon||SEQ[i],p.x+80,p.y+18,140,u,C.ink,5); }
  }
}
function genericItem(id){ return function(t){
  const lines=LINES[id]; const last=lines[lines.length-1];
  itemFrame(id,t,ITEMS[id].cost?last.t0:1e9);
  // 每句一张「关键数字卡」：句中第一个数字放大，其余文字作说明
  for(let k=1;k<lines.length;k++){ const l=lines[k], nx=lines[k+1];
    const vis=P(t,l.t0,l.t0+.5)*(nx?1-P(t,nx.t0-.25,nx.t0+.1):1); if(vis<=0) continue;
    g.save(); g.globalAlpha*=vis;
    const m=l.sub.match(/(−?[0-9][0-9,.]*\s*(%|倍|万|亿|成))/)||l.sub.match(/(−?[0-9][0-9,.]*\s*(元|人|起|个|次|岁|天|小时|分钟|秒|mmHg))/)||l.sub.match(BIG); const rest=l.sub.replace(/[：:]/,' ');
    if(m){ txt(m[1].replace('-','−'),80,1010,{size:150,font:NUM,weight:900,color:C.amber});
      wrap(rest,920,40).slice(0,3).forEach((r,i)=>reveal(r,80,1080+i*54,P(t,l.t0+.2,l.t0+1.2),{size:40,weight:700,color:C.ink})); }
    else wrap(rest,920,64,SERIF,900).slice(0,3).forEach((r,i)=>reveal(r,80,940+i*90,P(t,l.t0,l.t0+1.2),{size:64,font:SERIF,weight:900}));
    g.restore(); }
};}
function sOutro(t){
  const l0=LINES.outro[0], l1=LINES.outro[1], l2=LINES.outro[2], s=SC.outro;
  const end=l2?P(t,l2.t0-.5,l2.t0+.1):0;
  g.save(); g.globalAlpha=1-end; const span=(l0.t1-l0.t0)/SEQ.length;
  for(let i=0;i<SEQ.length;i++){ const p=gridPos(i); const y=p.y-560; const u=P(t,s.t0+i*.08,s.t0+.6+i*.08);
    cell(p.x,y,u); drawIcon(ITEMS[SEQ[i]].icon||SEQ[i],p.x+80,y+18,140,1,C.ink,5,eOut(u));
    const ck=P(t,l0.t0+i*span,l0.t0+i*span+.4);
    if(ck>0){ g.save(); g.beginPath(); g.arc(p.x+250,y+40,26,0,7); g.fillStyle=C.green; g.globalAlpha*=eOut(ck); g.fill(); g.restore(); drawIcon('check',p.x+228,y+18,44,ck,C.bg,6); } }
  if(l1 && t>l1.t0) reveal(l1.sub,80,960,P(t,l1.t0,l1.t0+1.2),{size:72,font:SERIF,weight:900});
  g.restore();
  if(l2 && t>l2.t0-.1){
    reveal('下一集',540,700,P(t,l2.t0,l2.t0+.6),{size:44,weight:500,color:C.mute,align:'center'});
    reveal(TL.next,540,850,P(t,l2.t0+.3,l2.t0+1.3),{size:TL.next.length>6?110:140,font:SERIF,weight:900,align:'center'});
    ecg(t,950,C.red,eOut(P(t,l2.t0+.8,l2.t0+1.6))*.7);
    const cr=eOut(P(t,l2.t0+1.2,l2.t0+2.0));
    ['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写 · 不构成医疗、法律或理财建议']
      .forEach((s,i)=>txt(s,540,1080+i*48,{size:28,weight:500,color:C.mute,align:'center',alpha:cr}));
  }
}
const FN = {hook:sHook, outro:sOutro}; SEQ.forEach(id=>FN[id]=genericItem(id));
function buildEvents(EV){
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  SEQ.forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  const l=LINES.outro[0], sp=(l.t1-l.t0)/SEQ.length; for(let i=0;i<SEQ.length;i++) EV.push({t:l.t0+i*sp+.05,type:'pop'});
}
