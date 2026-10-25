/* 第 5 集《不要浪费钱》— 通用模板 + 定制开头：第 0 帧就是满屏「10%」，0.5 秒内给出冲突。
   本集图标按条目 id 命名（itemFrame 用 id 取图标）。依赖 engine/stage.js。 */
Object.assign(ICON, {
  high:  [ [[50,8],[92,86],[8,86],[50,8]], [[50,34],[50,60]], arcPts(50,72,3,0,Math.PI*2,10) ],
  kid:   [ rrPts(30,8,40,84,8), [[44,17],[56,17]], [[38,40],[62,64]], [[62,40],[38,64]] ],
  drug:  [ rrPts(14,34,72,32,16), [[50,34],[50,66]], [[24,80],[76,80]] ],
  trade: [ [[8,70],[24,40],[38,62],[54,20],[68,58],[80,30],[92,46]], [[8,92],[92,92]] ],
  lever: [ [[10,72],[90,36]], [[44,58],[36,86],[60,86],[52,55]], rrPts(70,14,18,18,3) ],
  index: [ arcPts(50,50,38,0,Math.PI*2,48), [[50,50],[50,12]], [[50,50],[82,70]], [[50,50],[18,70]] ],
});
const CUE=(k,w,fb)=>{ const v=TL.cues&&TL.cues[k+':'+w]; return v==null?fb:v; };
const SEQ = Object.keys(TL.items);
const ITEMS = TL.items;
const BIG = /(−?[0-9][0-9,.]*\s*(%|元|万|亿|倍|年|岁|天|小时|分钟|秒|人|起|个|次|mmHg)?)/;
function sHook(t){
  const a=L('hook',0), b=LINES.hook[1], c=LINES.hook[2];
  const hit=CUE('hook:0','百分之十',a.t0+1.2), ruin=CUE('hook:0','赔光本金',a.t0+2.8);
  const up=c?eInOut(P(t,c.t0-.1,c.t0+.6)):0;
  g.save(); g.translate(0,-up*330); g.globalAlpha=1-up;
  // 第 0 帧就在：巨大的 10%，说到「百分之十」时砸一下
  const pop=.9+.1*eOut(P(t,0,.25)), slam=1+.10*Math.max(0,1-Math.abs(t-hit)/.18);
  g.save(); g.translate(80,600); g.scale(pop*slam,pop*slam);
  txt('10%',0,0,{size:340,font:NUM,weight:900,color:C.amber}); g.restore();
  txt('年化收益超过',86,300,{size:48,weight:700,color:C.mute,alpha:pop});
  // 「赔光本金」：红色，落下时数字被划掉
  reveal('就要准备赔光本金',80,760,P(t,ruin-.25,ruin+.6),{size:104,font:SERIF,weight:900,color:C.red});
  const cut=eOut(P(t,ruin,ruin+.35)); if(cut>0){ g.fillStyle=C.red; g.fillRect(70,470,640*cut,14); }
  if(b && t>b.t0-.1) reveal('—— 原银保监会主席，2018 年',80,880,P(t,b.t0,b.t0+.9),{size:46,weight:500,color:C.mute});
  g.restore();
  ecg(t,1500,C.red,clamp(P(t,0,.6))*(c?1-P(t,c.t0,c.t0+.6):1)*.6);
  if(c && t>c.t0-.2){
    const parts=c.sub.split('｜');
    reveal(parts[0],80,560,P(t,c.t0+.2,c.t0+1.3),{size:62,font:SERIF,weight:900});
    if(parts[1]) reveal(parts[1],80,660,P(t,c.t0+1.6,c.t0+2.6),{size:46,weight:700,color:C.amber});
    for(let i=0;i<SEQ.length;i++){ const p=gridPos(i); const u=P(t,c.t0+.5+i*.22,c.t0+1.3+i*.22);
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
    const m=l.sub.match(/(−?[0-9][0-9,.]*\s*(%|倍|万|亿|成))/)||l.sub.match(/(−?[0-9][0-9,.]*\s*(元|人|起|个|次|岁|天|小时|分钟|秒|mmHg))/)||l.sub.match(BIG); const rest=l.sub.replace(/[：:]/,' ').replace(/｜/g,'，');
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
  if(l1 && t>l1.t0) l1.sub.split('｜').forEach((r,k)=>reveal(r,80,960+k*110,P(t,l1.t0+k*.8,l1.t0+k*.8+1.2),{size:r.length>10?60:72,font:SERIF,weight:900,color:k?C.amber:C.ink}));
  g.restore();
  if(!l2 && l1){ const cr=eOut(P(t,l1.t0+1.8,l1.t0+2.6));
    ['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写 · 不构成理财建议']
      .forEach((s,i)=>txt(s,540,1300+i*48,{size:28,weight:500,color:C.mute,align:'center',alpha:cr})); }
  if(l2 && t>l2.t0-.1){
    reveal('下一集',540,700,P(t,l2.t0,l2.t0+.6),{size:44,weight:500,color:C.mute,align:'center'});
    reveal(TL.next,540,850,P(t,l2.t0+.3,l2.t0+1.3),{size:TL.next.length>6?110:140,font:SERIF,weight:900,align:'center'});
    ecg(t,950,C.red,eOut(P(t,l2.t0+.8,l2.t0+1.6))*.7);
    const cr=eOut(P(t,l2.t0+1.2,l2.t0+2.0));
    ['内容改编自开源书《高性价比人生指南》（CC BY 4.0）','github.com/eternity4719/HowToLiveBetter','节选缩写 · 不构成理财建议']
      .forEach((s,i)=>txt(s,540,1080+i*48,{size:28,weight:500,color:C.mute,align:'center',alpha:cr}));
  }
}
const FN = {hook:sHook, outro:sOutro}; SEQ.forEach(id=>FN[id]=genericItem(id));
function buildEvents(EV){
  EV.push({t:CUE('hook:0','百分之十',1.6),type:'boom'});
  TL.scenes.forEach(s=>{ if(s.id!=='hook') EV.push({t:s.t0,type:'whoosh'}); });
  SEQ.forEach(id=>EV.push({t:SC[id].t0+0.85,type:'tick'}));
  const l=LINES.outro[0], sp=(l.t1-l.t0)/SEQ.length; for(let i=0;i<SEQ.length;i++) EV.push({t:l.t0+i*sp+.05,type:'pop'});
}
