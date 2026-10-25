/* 版面主题（12 套）。render.py 按 THEME=<id> 或 script.json 的 "theme" 注入。
   每套：c 覆盖 stage.js 的配色 C；bg(t) 画背景与灯光；fg(t) 画在内容之上的光效/边框；subShadow 字幕描边阴影。
   在 init 脚本里执行，函数里用到的 g / W / H / C 等在调用时才取，均来自 stage.js。
   配色参考：商场橱窗灯光、各大时装品牌新品的色彩关系；图案均为原创几何，不使用任何品牌标识或纹样。 */
(function(){
const lg=(x0,y0,x1,y1,stops)=>{ const gr=g.createLinearGradient(x0,y0,x1,y1); stops.forEach(([o,c])=>gr.addColorStop(o,c)); return gr; };
const rg=(x,y,r0,r1,stops)=>{ const gr=g.createRadialGradient(x,y,r0,x,y,r1); stops.forEach(([o,c])=>gr.addColorStop(o,c)); return gr; };
const fill=f=>{ g.fillStyle=f; g.fillRect(0,0,1080,1920); };
const glow=(x,y,r,col)=>{ g.fillStyle=rg(x,y,0,r,[[0,col],[1,'rgba(0,0,0,0)']]); g.fillRect(x-r,y-r,r*2,r*2); };
// 舞台射灯：从顶部 (x,0) 照到地面 (x2,y2) 的光锥
function cone(x,x2,y2,w,col,a){ g.save(); g.globalCompositeOperation='lighter';
  const gr=lg(x,0,x2,y2,[[0,`rgba(${col},${a})`],[1,`rgba(${col},0)`]]);
  g.fillStyle=gr; g.beginPath(); g.moveTo(x-18,0); g.lineTo(x+18,0); g.lineTo(x2+w,y2); g.lineTo(x2-w,y2); g.closePath(); g.fill();
  g.globalAlpha=1; const fl=rg(x2,y2,0,w*1.1,[[0,`rgba(${col},${a*.9})`],[1,`rgba(${col},0)`]]); g.save(); g.translate(x2,y2); g.scale(1,.28); g.translate(-x2,-y2); g.fillStyle=fl; g.fillRect(x2-w*1.2,y2-w*1.2,w*2.4,w*2.4); g.restore();
  g.restore(); }
function vignette(a=.55,col='0,0,0'){ g.fillStyle=rg(540,900,500,1250,[[0,`rgba(${col},0)`],[1,`rgba(${col},${a})`]]); g.fillRect(0,0,1080,1920); }
// 斜向扫光（橱窗玻璃反光）
function sweep(t,period=7,col='255,255,255',a=.06){ const ph=((t/period)%1); const x=-600+ph*2400;
  g.save(); g.globalCompositeOperation='lighter'; g.translate(x,0); g.rotate(.32);
  g.fillStyle=lg(-160,0,160,0,[[0,`rgba(${col},0)`],[.5,`rgba(${col},${a})`],[1,`rgba(${col},0)`]]); g.fillRect(-160,-400,320,2800); g.restore(); }
const dark={subShadow:'rgba(0,0,0,.85)'}, light={subShadow:'rgba(255,252,246,.95)'};

window.__THEMES__ = {

// 01 橱窗暖光：深胡桃木底，三束 2700K 射灯在画面里缓慢呼吸，地面留光斑
boutique:{...dark, rad:1, name:'橱窗暖光', ref:'精品店夜间橱窗的射灯与光斑',
  c:{bg:'#160F0A', ink:'#F7EBDB', mute:'#A89580', dim:'#4D3C2D', line:'#2E2219', panel:'rgba(38,27,19,.86)', amber:'#EDB352', red:'#E2583D', green:'#9CC983'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#1E140D'],[.6,'#140D08'],[1,'#0C0805']]));
    const b=k=>.10+.03*Math.sin(t*.7+k);
    cone(220,300,1500,330,'255,196,128',b(0)); cone(860,760,1560,300,'255,206,150',b(2)); cone(540,540,1700,260,'255,180,110',b(4)*.7);
    vignette(.6); },
  fg(t){ sweep(t,9,'255,220,180',.05); }},

// 02 干邑皮革：焦糖到深棕的皮革渐变，原创菱格暗纹，蜂蜜金高光
cognac:{...dark, rad:.5, name:'干邑皮革', ref:'奢侈皮具新品的焦糖棕与五金金色',
  c:{bg:'#3A2314', ink:'#F8EAD2', mute:'#CDB08C', dim:'rgba(255,228,190,.28)', line:'rgba(255,228,190,.13)', panel:'rgba(35,19,9,.6)', amber:'#F5C766', red:'#F07A55', green:'#C6DB8F'},
  bg(t){ fill(lg(0,0,1080,1920,[[0,'#7A4B2A'],[.45,'#4C2C17'],[1,'#22130A']]));
    g.save(); g.strokeStyle='rgba(255,215,150,.07)'; g.lineWidth=2; const s=96, o=(t*4)%s;
    for(let k=-30;k<40;k++){ g.beginPath(); g.moveTo(k*s+o,0); g.lineTo(k*s+o+1920*.6,1920); g.stroke(); g.beginPath(); g.moveTo(k*s-o,1920); g.lineTo(k*s-o+1920*.6,0); g.stroke(); }
    g.restore();
    glow(800,380,700,'rgba(255,200,130,.16)'); vignette(.5,'15,7,2'); },
  fg(t){ g.strokeStyle='rgba(245,199,102,.45)'; g.lineWidth=2; g.strokeRect(36,150,1008,1630); }},

// 03 赛道墨绿：墨绿丝绒底 + 右侧绿红绿织带，金色五金点缀
racing:{...dark, rad:.4, name:'墨绿织带', ref:'意式奢牌经典的墨绿、酒红织带配色',
  c:{bg:'#0E2A1F', ink:'#F4EEDD', mute:'#9DB8A6', dim:'#2F5242', line:'#1B3B2D', panel:'rgba(9,30,21,.82)', amber:'#E0BC63', red:'#D72A40', green:'#6FD39A'},
  bg(t){ fill(rg(480,820,100,1500,[[0,'#1A4634'],[.6,'#0F2D21'],[1,'#071A12']]));
    const x=1020; [[0,26,'#1F7044'],[26,22,'#B71C30'],[48,26,'#1F7044']].forEach(([o,w,c])=>{ g.fillStyle=c; g.fillRect(x+o,0,w,1920); });
    g.fillStyle=lg(0,0,0,1920,[[0,'rgba(255,255,255,.10)'],[.5,'rgba(255,255,255,0)'],[1,'rgba(0,0,0,.25)']]); g.fillRect(x,0,74,1920);
    glow(300,300,600,'rgba(224,188,99,.10)'); vignette(.45); },
  fg(t){ sweep(t,10,'255,240,200',.04); }},

// 04 风衣卡其：浅卡其底 + 原创细格线（黑/白/红），英伦风衣的克制感
trench:{...light, rad:0, numFill:1, name:'风衣卡其', ref:'英伦风衣的卡其色与细格纹',
  c:{bg:'#CDB491', ink:'#1C1712', mute:'#5E4F3C', dim:'#A38C6C', line:'rgba(28,23,18,.13)', panel:'rgba(246,239,226,.82)', amber:'#9A1F24', red:'#B52A2E', green:'#2F6040'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#D8C29F'],[1,'#BFA47E']]));
    g.save(); const S=150;
    [[0,'rgba(28,23,18,.16)',3],[44,'rgba(255,255,255,.35)',2],[52,'rgba(150,30,34,.35)',1.5],[60,'rgba(255,255,255,.35)',2]].forEach(([o,c,w])=>{ g.fillStyle=c;
      for(let x=o;x<1080;x+=S) g.fillRect(x,0,w,1920); for(let y=o;y<1920;y+=S) g.fillRect(0,y,1080,w); });
    g.restore(); glow(540,600,800,'rgba(255,248,232,.35)'); },
  fg(t){}},

// 05 礼盒橙：饱和橙底，奶油色卡片，深巧克力字，像拆开一只礼盒
orange:{...dark, rad:0, numFill:1, serif:false, subShadow:'rgba(120,45,5,.55)', name:'礼盒橙', ref:'法国奢牌礼盒橙与深棕丝带',
  c:{bg:'#E2661E', ink:'#22130A', mute:'#6E3612', dim:'rgba(34,19,10,.28)', line:'rgba(34,19,10,.14)', panel:'rgba(110,35,0,.22)', amber:'#FFF3DD', red:'#7A140C', green:'#1E4A2C'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#F07B2C'],[.55,'#E2661E'],[1,'#C9520F']]));
    g.fillStyle='#3B1F0E'; g.fillRect(0,1650,1080,16); g.fillRect(0,1676,1080,4);
    glow(540,200,900,'rgba(255,230,190,.28)'); },
  fg(t){ sweep(t,8,'255,250,235',.08); }},

// 06 知更蓝：知更鸟蛋蓝底，白缎带斜穿，珊瑚色点睛
robin:{...light, rad:2, name:'知更蓝', ref:'珠宝礼盒的知更鸟蛋蓝与白缎带',
  c:{bg:'#81D4CC', ink:'#0E2A38', mute:'#2F6467', dim:'rgba(14,42,56,.28)', line:'rgba(14,42,56,.12)', panel:'rgba(255,255,255,.82)', amber:'#E9573F', red:'#C42B36', green:'#137257'},
  bg(t){ fill(lg(0,0,1080,1920,[[0,'#9BE0D8'],[1,'#6CC6BE']]));
    g.save(); g.translate(0,1560); g.rotate(-.18); g.fillStyle=lg(0,-60,0,60,[[0,'#FFFFFF'],[.5,'#EEF6F5'],[1,'#D9E9E7']]); g.fillRect(-200,-55,1600,110);
    g.fillStyle=`rgba(255,255,255,${.55+.25*Math.sin(t*1.2)})`; g.fillRect(-200+((t*160)%1600),-55,160,110); g.restore();
    glow(800,350,700,'rgba(255,255,255,.35)'); },
  fg(t){}},

// 07 象牙杂志：象牙白底、黑字、金色细线双框，时装大片的留白
ivory:{...light, rad:0, name:'象牙杂志', ref:'时装杂志大片的黑白留白与金线',
  c:{bg:'#F3EEE5', ink:'#111111', mute:'#6F675D', dim:'#C9BFAF', line:'rgba(17,17,17,.10)', panel:'#FFFDF8', amber:'#A9833B', red:'#B0281F', green:'#3C6046'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#F7F3EC'],[1,'#EDE6DA']])); glow(780,420,700,'rgba(255,255,255,.7)'); },
  fg(t){ g.strokeStyle='#111'; g.lineWidth=3; g.strokeRect(40,150,1000,1640); g.strokeStyle='#A9833B'; g.lineWidth=1.5; g.strokeRect(54,164,972,1612); }},

// 08 霓虹商场：深紫夜色，品红与青色霓虹灯管，地面倒影
neon:{...dark, rad:1.4, serif:false, name:'霓虹商场', ref:'购物中心夜景的霓虹灯管与倒影',
  c:{bg:'#0E0A28', ink:'#F8F4FF', mute:'#A79CD6', dim:'rgba(255,255,255,.2)', line:'rgba(255,255,255,.08)', panel:'rgba(28,18,66,.78)', amber:'#FF4FA6', red:'#FF5C5C', green:'#3DF2D2'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#1E0F44'],[.6,'#0E0A28'],[1,'#07051A']]));
    const fl=.85+.15*Math.sin(t*9)*Math.sin(t*2.3);
    g.save(); g.lineCap='round'; g.globalCompositeOperation='lighter';
    [[255,79,166],[61,242,210]].forEach(([r,gg,b],k)=>{ g.shadowColor=`rgb(${r},${gg},${b})`; g.shadowBlur=40; g.strokeStyle=`rgba(${r},${gg},${b},${(k?.75:.85)*fl})`; g.lineWidth=8;
      g.beginPath(); if(k===0) g.arc(900,330,190,Math.PI*.7,Math.PI*1.95); else { g.moveTo(60,1560); g.lineTo(660,1560); } g.stroke(); });
    g.shadowBlur=0; g.restore();
    glow(900,330,500,'rgba(255,79,166,.14)'); glow(360,1600,600,'rgba(61,242,210,.10)'); vignette(.4); },
  fg(t){ sweep(t,6,'200,180,255',.05); }},

// 09 克莱因蓝：浓郁群青底，白字，荧光黄重点，美术馆海报的力度
klein:{...dark, rad:0, numFill:1, serif:false, name:'克莱因蓝', ref:'当代美术馆海报的群青与荧光黄',
  c:{bg:'#1B2DB0', ink:'#FFFFFF', mute:'#AEB8FF', dim:'rgba(255,255,255,.3)', line:'rgba(255,255,255,.14)', panel:'rgba(10,18,110,.55)', amber:'#E8FF3A', red:'#FF6E5E', green:'#7DFFB8'},
  bg(t){ fill(lg(0,0,1080,1920,[[0,'#2338C8'],[1,'#121F8E']])); glow(240,1500,900,'rgba(80,110,255,.35)');
    g.fillStyle='#E8FF3A'; g.fillRect(80,1690,120*(.6+.4*Math.sin(t*1.5)),10); },
  fg(t){}},

// 10 鹦鹉绿编织：鲜亮鹦鹉绿，原创斜向编织纹，黄油色重点
weave:{...dark, rad:.6, numFill:1, name:'鹦鹉绿编织', ref:'意式皮具编织工艺与鹦鹉绿',
  c:{bg:'#1D6B3B', ink:'#F6F2E4', mute:'#BBD7BD', dim:'rgba(246,242,228,.3)', line:'rgba(246,242,228,.13)', panel:'rgba(8,42,22,.6)', amber:'#F8D876', red:'#FF7B5C', green:'#C2F5A2'},
  bg(t){ fill(lg(0,0,1080,1920,[[0,'#2A8A4C'],[1,'#145430']]));
    g.save(); g.translate(540,960); g.rotate(Math.PI/4); const s=64;
    for(let i=-30;i<30;i++) for(let j=-30;j<30;j++){ const h=(i+j)%2===0; g.fillStyle=h?'rgba(0,0,0,.07)':'rgba(255,255,255,.035)';
      g.fillRect(i*s+(h?4:0),j*s+(h?0:4),h?s-8:s,h?s:s-8); }
    g.restore(); glow(540,500,800,'rgba(255,250,210,.14)'); vignette(.4,'0,25,10'); },
  fg(t){}},

// 11 落日玻璃：桃橙到玫红到梅紫的落日渐变，磨砂玻璃卡片，光球漂浮
sunset:{...dark, rad:2.2, serif:false, subShadow:'rgba(60,10,40,.7)', name:'落日玻璃', ref:'高端商场中庭的落日天光与玻璃幕墙',
  c:{bg:'#C9466E', ink:'#FFFFFF', mute:'rgba(255,255,255,.78)', dim:'rgba(255,255,255,.35)', line:'rgba(255,255,255,.18)', panel:'rgba(255,255,255,.16)', amber:'#FFE6A0', red:'#4A0B33', green:'#B9FFE0'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#FFB07A'],[.45,'#E2567A'],[1,'#3A1A4C']]));
    [[260,520,260,'255,240,200',.5],[880,1000,320,'255,170,200',.35],[400,1500,380,'140,90,220',.35]].forEach(([x,y,r,c,a],k)=>glow(x+Math.sin(t*.4+k)*40,y+Math.cos(t*.3+k)*30,r,`rgba(${c},${a})`)); },
  fg(t){}},

// 12 晨雾灰粉：暖灰底、柔和顶光、玫瑰粉重点，高级时装秀场的安静
mist:{...light, rad:1.6, name:'晨雾灰粉', ref:'巴黎高定秀场的暖灰与玫瑰粉',
  c:{bg:'#E5E0DB', ink:'#2A2724', mute:'#7A726A', dim:'rgba(42,39,36,.25)', line:'rgba(42,39,36,.09)', panel:'rgba(255,255,255,.72)', amber:'#C26F7C', red:'#A3303D', green:'#557A65'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#ECE7E2'],[1,'#D9D2CB']]));
    g.save(); g.globalCompositeOperation='screen'; g.fillStyle=lg(540,0,540,1400,[[0,'rgba(255,255,255,.75)'],[1,'rgba(255,255,255,0)']]);
    g.beginPath(); g.moveTo(400,0); g.lineTo(680,0); g.lineTo(1000,1400); g.lineTo(80,1400); g.closePath(); g.fill(); g.restore();
    glow(860,1500,500,'rgba(232,180,186,.35)'); },
  fg(t){}},

// 13 橙夜：深可可底，右上一束暖橙射灯，橙色实心编号，礼盒橙的夜间版
cocoa:{...dark, rad:0, numFill:1, serif:false, name:'橙夜可可', ref:'礼盒橙的夜间橱窗：深可可底与一束橙色射灯',
  c:{bg:'#24130A', ink:'#FFF1DC', mute:'#C7A589', dim:'#5A3A26', line:'#3A2416', panel:'rgba(52,28,14,.82)', amber:'#F47A2A', red:'#FF5A3C', green:'#9FD38A'},
  bg(t){ fill(lg(0,0,0,1920,[[0,'#2E180C'],[1,'#160B05']]));
    cone(900,700,1500,360,'244,122,42',.13+.03*Math.sin(t*.6)); glow(860,260,520,'rgba(244,122,42,.22)');
    g.fillStyle='#F47A2A'; g.fillRect(0,1650,1080,10); g.fillRect(0,1672,1080,3); vignette(.55); },
  fg(t){ sweep(t,9,'255,200,150',.05); }},

// 14 撞色双拼：上半礼盒橙、下半奶油白，巧克力色分割线，像打开的盒盖与内衬
split:{...light, rad:.3, numFill:1, name:'撞色双拼', ref:'礼盒外橙内白的撞色：上半橙色盒盖，下半奶油内衬',
  c:{bg:'#F6EBDD', ink:'#22130A', mute:'#7A4A28', dim:'rgba(34,19,10,.25)', line:'rgba(34,19,10,.12)', panel:'rgba(255,255,255,.7)', amber:'#9A1F10', red:'#C42412', green:'#1F5E3A'},
  bg(t){ fill('#F6EBDD'); g.fillStyle=lg(0,0,0,832,[[0,'#F27E30'],[1,'#E2661E']]); g.fillRect(0,0,1080,832);
    g.fillStyle='#3B1F0E'; g.fillRect(0,826,1080,8); g.fillRect(0,842,1080,2);
    glow(820,200,600,'rgba(255,230,190,.3)'); glow(540,1300,700,'rgba(255,255,255,.5)'); },
  fg(t){ sweep(t,8,'255,250,235',.06); }},
};
})();
