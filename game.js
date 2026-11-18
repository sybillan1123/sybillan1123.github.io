'use strict';

const questions = [
  {
    title: '假如你是电影主角，开场五分钟，你想摊上哪件事？',
    A: '你被冤枉进了监狱，手里只有一把小锤子。',
    B: '你能偷偷溜进别人的梦里，篡改别人的记忆。'
  },
  {
    title: '你更想发哪个弹幕？',
    A: '“我坚持早睡都撑不过三天，这人是怎么熬下来的？”',
    B: '“老师，如果咱们现在都在梦里，这节课还算出勤吗？”'
  },
  {
    title: '选一个场景？',
    A: '1994 年｜缅因州的一座监狱。',
    B: '2010 年｜巴黎的一条能折叠到你的头顶的街。'
  }
];

const junctions = [
  [[14,154]],
  [[106,193],[111,115]],
  [[208,212],[209,158],[205,105]],
  [[290,220],[294,180],[292,134],[294,91]]
];

const paths = [
  [
    { A:[[31,146],[47,129],[62,126],[80,108],[98,107]],
      B:[[29,166],[51,174],[65,195],[82,203],[94,198]] }
  ],
  [
    { A:[[122,181],[138,157],[157,171],[175,170],[189,157]],
      B:[[124,196],[140,202],[155,220],[177,225],[189,212]] },
    { A:[[123,104],[137,95],[154,101],[169,110],[185,105]],
      B:[[123,130],[135,142],[153,145],[164,132],[182,147],[195,156]] }
  ],
  [
    { A:[[224,208],[239,197],[251,181],[269,182],[283,173]],
      B:[[223,220],[240,229],[258,229],[274,219]] },
    { A:[[222,146],[234,127],[250,124],[269,143],[283,141]],
      B:[[223,166],[237,178],[253,177],[270,162],[281,168]] },
    { A:[[224,112],[239,99],[250,87],[268,86],[281,95]],
      B:[[219,119],[235,119],[250,108],[264,115],[277,127]] }
  ]
].map((round, index) => round.map((pair, votes) => ({
  A:[junctions[index][votes],...pair.A,junctions[index+1][votes+1]],
  B:[junctions[index][votes],...pair.B,junctions[index+1][votes]]
})));

const finalFork = [328,154];
const outerTrail = [
  [[302,216],[310,205],[313,190],[309,179],[319,166]],
  [[309,179],[319,166]],
  [[308,131],[316,141]],
  [[304,103],[309,115],[308,131],[316,141]]
].map((road,votes) => [junctions[3][votes],...road,finalFork]);

const destinations = {
  A: { title:'《肖申克的救赎》', place:'监狱', label:[431,105] },
  B: { title:'《盗梦空间》', place:'迷雾', label:[432,218] }
};

const finalRoads = {
  A:[finalFork,[341,145],[355,143],[367,132],[372,116],[388,113],[398,99]],
  B:[finalFork,[341,164],[352,180],[359,193],[375,203],[388,213],[399,212]]
};

const world = { width:432, height:264 };
const camera = { x:0, y:0 };

const canvas = document.querySelector('#landscape');
const mapViewport = canvas.closest('.map');
const ctx = canvas.getContext('2d');
const backdrop = document.createElement('canvas');
backdrop.width = world.width;
backdrop.height = world.height;
const art = backdrop.getContext('2d');
const skyColors = ['#527e82','#5e9291','#74a294','#8aaf96','#b5bb8b','#d7bd85'];
const terrain = ['#597639','#638344','#6d9148','#739747','#7f9d4d','#879f55'];
const stream = [[200,75],[195,93],[199,105],[202,119],[198,133],[203,154],[208,178],[200,193],[197,212],[208,228],[225,243],[230,264]];
let seed = 53718;
function rand() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}

function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function polygon(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const pt of points.slice(1)) c.lineTo(...pt);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function line(c, points, color, width) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const pt of points.slice(1)) c.lineTo(...pt);
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = color;
  c.stroke();
}

function pine(c, x, y, scale, shades) {
  const pixels = (dx, dy, w, h, color) => box(c, x+dx*scale, y+dy*scale, w*scale, h*scale, color);
  pixels(-3,-9,6,9,'#483d2d');
  pixels(-10,-4,22,3,'#223a2f');
  for (let tier=0; tier<3; tier++) {
    const top = -34+tier*7;
    const width = 4+tier*3;
    pixels(-2,top,4,3,shades[0]);
    pixels(-width,top+3,width*2,4,shades[0]);
    pixels(-width-3,top+7,width*2+6,5,shades[1]);
    pixels(-width-5,top+12,width*2+10,4,shades[2]);
    pixels(-width-2,top+6,4,4,shades[0]);
  }
}

function lantern(c,x,y) {
  box(c,x-1,y-13,2,13,'#47392b');
  box(c,x-4,y-16,8,2,'#3c3327');
  box(c,x-3,y-14,6,6,'#9c6b37');
  box(c,x-2,y-13,4,4,'#f3b65d');
  box(c,x-1,y-12,2,2,'#fff0a6');
  box(c,x-3,y-8,6,2,'#3e352a');
}

function bush(c,x,y,scale) {
  box(c,x-6*scale,y-3*scale,13*scale,4*scale,'#263e31');
  box(c,x-5*scale,y-7*scale,10*scale,5*scale,'#49644b');
  box(c,x-2*scale,y-9*scale,5*scale,4*scale,'#627855');
  box(c,x-5*scale,y-5*scale,4*scale,2*scale,'#718260');
}

function drawSky() {
  for(let band=0;band<skyColors.length;band++) box(art,0,band*13,432,13,skyColors[band]);
  for(let index=0;index<75;index++) {
    const x = rand()*432;
    const y = 3+rand()*59;
    box(art,x,y,rand()>.91?2:1,1,rand()>.8?'#f3d29a':'#a8b1a07d');
  }
  art.save();
  art.translate(0,24);
  polygon(art,[[61,14],[72,14],[72,17],[76,17],[76,22],[79,22],[79,32],[76,32],[76,37],[72,37],[72,40],[61,40],[61,37],[56,37],[56,32],[53,32],[53,22],[56,22],[56,17],[61,17]],'#f3cb89');
  box(art,57,27,8,3,'#dda878'); box(art,66,34,8,2,'#e5af79');
  art.restore();
  const clouds = [[5,49,44],[104,30,61],[160,52,83],[276,34,40],[335,46,68],[376,20,42]];
  for(const [x,y,w] of clouds) {
    box(art,x,y,w,3,'#aaa37a54'); box(art,x+6,y-2,w-17,2,'#ae9a7850');
    box(art,x+16,y+3,w-23,1,'#beaa8160');
  }
  for(let layer=0;layer<3;layer++) {
    const hills = [[0,88]];
    for(let x=0;x<=432;x+=8) {
      const y = 61 + layer*10 + 9*Math.sin(x/28+layer*2) + 6*Math.sin(x/15+layer);
      hills.push([x,y|0],[x+8,y|0]);
    }
    hills.push([432,114],[0,114]);
    polygon(art,hills,['#7d9870','#65885b','#53724c'][layer]);
  }
}

function drawGround() {
  polygon(art,[[0,86],[40,81],[85,88],[130,81],[189,90],[236,84],[275,93],[329,81],[383,81],[432,91],[432,264],[0,264]],terrain[2]);
  for(let i=0;i<4200;i++) {
    const x=rand()*432, y=88+rand()*176;
    const varied = terrain[(rand()*terrain.length)|0];
    box(art,x,y,rand()>.93?5:1+(rand()*3|0),rand()>.85?2:1,varied);
  }
  for(let i=0;i<70;i++) {
    const x=rand()*432,y=95+rand()*169;
    box(art,x,y,1,3,'#819052');
    box(art,x+1,y+1,2,1,'#929760');
  }
  for(let i=0;i<30;i++) {
    const x=i*15+rand()*9;
    pine(art,x,94+rand()*15,.56+rand()*.5,['#79924c','#5a7b46','#44613c']);
  }
  line(art,stream,'#253f38',23);
  line(art,stream,'#437d73',18);
  line(art,stream,'#5a9a89',14);
  line(art,[[194,104],[197,121],[193,136]],'#a8c9a5',1);
  line(art,[[203,202],[203,212],[213,225]],'#a8c9a5',1);
  line(art,[[213,236],[225,247],[229,258]],'#86b0a1',2);
  for(let i=0;i<22;i++) {
    const index = 1+(rand()*(stream.length-2)|0);
    const [x,y] = stream[index];
    box(art,x+rand()*9-5,y+rand()*8-4,2+(rand()*4|0),1,'#8ba797');
  }
  for(const [x,y,s] of [[33,111,.7],[102,110,.7],[123,109,.55],[175,88,.7],[219,106,.65],[284,99,.82],[307,101,1.05],[331,94,.58],[419,120,.75],[18,201,.95],[88,222,.92],[118,237,1],[172,232,.78],[258,242,.95],[287,222,.63],[319,237,1.3],[413,165,.64],[403,249,1.05]]) {
    pine(art,x,y,s,['#85a14b','#5c8146','#406343']);
  }
  for(const [x,y] of [[31,133],[94,158],[119,205],[165,170],[230,216],[272,158],[303,177],[315,119],[342,158],[403,135],[51,223],[367,245]]) bush(art,x,y,.65);
  for(let i=0;i<35;i++) {
    const x = rand()*432, y = 212+rand()*52;
    box(art,x,y,1,3,'#2d4735');
    box(art,x-1,y,3,1,['#e0ac66','#b77c78','#c4be81'][i%3]);
  }
}

const allRoads = paths.flatMap(round => round.flatMap(pair => [pair.A,pair.B])).concat(outerTrail);

function drawRoad(c,roads,tones) {
  const widths = [10,7,4,2];
  for(let i=0;i<widths.length;i++) {
    for(const road of roads) line(c,road,tones[i],widths[i]);
  }
}

function drawRoads() {
  drawRoad(art,allRoads,['#566b36','#86683b','#c09a55','#d6b472']);
  for(const road of allRoads) {
    for(const [x,y] of road.slice(1)) {
      box(art,x-2,y+1,2,1,'#dec38c');
      box(art,x-4,y-1,1,1,'#8c6e42');
    }
  }

  const bridges = [[185,105,27],[192,156,29],[185,212,28]];
  for(const [x,y,w] of bridges) {
    box(art,x,y-4,w,10,'#513d2d');
    box(art,x+1,y-3,w-2,8,'#c49758');
    for(let board=x+3;board<x+w-1;board+=3) box(art,board,y-3,1,8,'#926a42');
    for(const rail of [y-5,y+5]) {
      box(art,x,rail,w,2,'#714e32');
      for(const post of [x,x+w-2]) box(art,post,rail-1,2,3,'#efbb69');
    }
  }
  for(const points of [...junctions.slice(0,3),[finalFork]]) {
    for(const [x,y] of points) {
      polygon(art,[[x-8,y],[x-4,y-5],[x+4,y-5],[x+8,y],[x+4,y+5],[x-4,y+5]],'#d2aa69');
      box(art,x-2,y-1,4,2,'#f2cf87');
      lantern(art,x-7,y-2);
    }
  }
}

function flag(c,x,y,letter) {
  box(c,x-1,y,2,14,'#40352b');
  box(c,x,y,13,10,letter==='A'?'#754831':'#4c4661');
  box(c,x+1,y+1,11,8,letter==='A'?'#ad7649':'#76688a');
  c.fillStyle='#fbe4ad';
  c.font='bold 8px monospace';
  c.fillText(letter,x+4,y+8);
}

function drawPrison(c) {
  box(c,346,79,74,23,'#24382f');
  box(c,353,59,54,37,'#665d51');
  box(c,356,56,48,34,'#979282');
  box(c,357,56,46,5,'#766f62');
  for(const x of [358,365,372,379,386,393,400]) box(c,x,52,5,6,'#8f8776');
  for (let y=63;y<93;y+=6) {
    box(c,354,y,52,1,'#59574e');
    for(let x=356+(y%4)*2;x<403;x+=9) box(c,x,y+1,1,4,'#7a7568');
  }
  for(const x of [347,397]) {
    box(c,x,47,17,51,'#6e6b62');
    box(c,x+2,50,12,46,'#9c9482');
    box(c,x-1,44,19,5,'#686559');
    for(let q=0;q<3;q++) box(c,x+q*6,40,4,6,'#928777');
    box(c,x+5,56,6,11,'#3a3c38');
    box(c,x+7,57,2,9,'#b1a48a');
    box(c,x+4,77,8,1,'#6c6557');
  }
  box(c,372,80,16,17,'#4b463a');
  box(c,374,77,12,4,'#524b3e');
  box(c,375,83,10,14,'#2b302b');
  for(const x of [376,379,382]) box(c,x,84,1,12,'#82735c');
  lantern(c,369,94); lantern(c,392,94);
}

function drawFog(c,time) {
  for(let layer=0;layer<7;layer++) {
    const x=369+layer*7+Math.sin(time/1700+layer*.6)*5;
    const y=199+(layer%4)*7;
    const color=['#a399b5ab','#c5b4d0b3','#9486afbb','#b5a5c9a0'][layer%4];
    box(c,x,y,37-layer*2,7,color);
    box(c,x+5,y-4,23-layer,4,color);
    box(c,x-4,y+7,32-layer*2,4,color);
    box(c,x+10,y+2,17-layer,1,'#e2cee692');
  }
}

function drawArt() {
  drawSky();
  drawGround();
  drawRoads();
  for(const [x,y,s] of [[326,116,.72],[348,158,.79],[372,137,1.12],[387,165,.85],[412,154,.93],[345,190,.83],[401,185,.78],[371,234,.78]]) {
    pine(art,x,y,s,['#88a54c','#628046','#3e5d3b']);
  }
  for(const [x,y] of [[46,252],[59,249],[77,261],[101,259],[264,266],[301,267],[339,263]]) {
    pine(art,x,y,.72,['#779449','#547b42','#39593d']);
  }
  drawRoad(art,Object.values(finalRoads),['#566b36','#9b743c','#caa45e','#e4bb79']);
  art.save();
  art.translate(18,0);
  drawPrison(art);
  art.restore();
}
drawArt();

const sideWidth = 384;
function drawSideScenery(start, groundHeight) {
  const scene = document.createElement('canvas');
  scene.width = sideWidth;
  scene.height = world.height;
  const c = scene.getContext('2d');
  c.translate(-start,0);
  const end = start+sideWidth;
  for(let band=0;band<skyColors.length;band++) {
    box(c,start,band*13,sideWidth,13,skyColors[band]);
  }
  for(let i=0;i<42;i++) {
    box(c,start+rand()*sideWidth,25+rand()*34,rand()>.85?2:1,1,'#e9dca87d');
  }
  for(let layer=0;layer<3;layer++) {
    const hills = [[start,100]];
    for(let x=start;x<=end;x+=8) {
      const y = 61+layer*10+9*Math.sin(x/28+layer*2)+6*Math.sin(x/15+layer);
      hills.push([x,y|0],[x+8,y|0]);
    }
    hills.push([end,114],[start,114]);
    polygon(c,hills,['#7d9870','#65885b','#53724c'][layer]);
  }

  const edge = start<0 ? end : start;
  const ground = [];
  for(let x=start;x<=end;x+=24) {
    ground.push([x,groundHeight+Math.round(Math.sin((x-edge)/16)*5)]);
  }
  ground.push([end,world.height],[start,world.height]);
  polygon(c,ground,terrain[2]);
  for(let i=0;i<2500;i++) {
    box(c,start+rand()*sideWidth,95+rand()*169,1+(rand()*4|0),rand()>.88?2:1,terrain[rand()*terrain.length|0]);
  }
  for(let x=start+6;x<end;x+=13) {
    pine(c,x,98+rand()*14,.48+rand()*.51,['#79924c','#5a7b46','#44613c']);
  }
  for(let i=0;i<42;i++) {
    const x = start+5+rand()*(sideWidth-10);
    const y = 125+rand()*129;
    if(i%3===0) pine(c,x,y,.7+rand()*.42,['#85a14b','#5c8146','#406343']);
    else bush(c,x,y,.55+rand()*.45);
    box(c,x+5,y+3,2,2,['#d7a86a','#dfb572','#a7ba69'][i%3]);
  }
  return scene;
}
const leftScenery = drawSideScenery(-sideWidth,86);
const rightScenery = drawSideScenery(world.width,91);

function sprite(x,y,direction,frame) {
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  polygon(ctx,[[-7,0],[-5,-2],[5,-2],[8,0],[5,2],[-5,2]],'#312c256d');
  ctx.scale(direction,1);
  const pose=[0,2,0,-2][frame];
  box(ctx,-4,-4+Math.max(0,pose),3,4,'#2f3540');
  box(ctx,1,-4+Math.max(0,-pose),3,4,'#212d36');
  box(ctx,-5,-11,10,7,'#925837');
  box(ctx,-3,-10,7,5,'#6e8257');
  box(ctx,-6,-10,3,5,'#513e37');
  box(ctx,3,-10,2,5,'#d9a471');
  box(ctx,-4,-18,8,7,'#e3ac76');
  box(ctx,-5,-18,3,6,'#754936');
  box(ctx,3,-16,2,3,'#edb47b');
  box(ctx,2,-16,1,1,'#3b3029');
  box(ctx,-6,-20,12,3,'#8d5b3b');
  box(ctx,-4,-23,8,4,'#a57246');
  box(ctx,-3,-23,5,2,'#c29253');
  box(ctx,-6,-19,12,1,'#4e4735');
  ctx.restore();
}

const $ = selector => document.querySelector(selector);
const steps = [...document.querySelectorAll('#steps li')];
const buttons = { A: $('#option-a'), B: $('#option-b') };
const routeStatus = $('#map-status');
const question = $('#question');
const questionCard = question.closest('section');
const stage = $('#stage');
const message = $('#message');
const result = $('#result');
const resultsLabels = { A: $('#prison-label'), B: $('#fog-label') };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let answers = [];
let traveled = [];
let position = junctions[0][0];
let aVotes = 0;
let motion;
let frame = 0;
let direction = 1;
let arrived;
let animationFrame;
const fireflies = [[38,129],[92,173],[124,119],[161,184],[222,106],[260,217],[286,105],[315,187],[405,142],[115,218]];

function resizeMap() {
  const width = mapViewport.clientWidth;
  const height = mapViewport.clientHeight;
  if(!width || !height) return;
  const scale = Math.min(width/world.width,height/212);
  canvas.width = Math.ceil(width/scale);
  canvas.height = Math.ceil(height/scale);
  camera.x = Math.floor((canvas.width-world.width)/2);
  camera.y = Math.floor((canvas.height-world.height)/2);

  for(const choice of ['A','B']) {
    const [x,y] = destinations[choice].label;
    const label = resultsLabels[choice];
    label.style.left = (camera.x+x)*100/canvas.width+'%';
    label.style.top = (camera.y+y)*100/canvas.height+'%';
  }
  scheduleFrame();
}

function paintMap() {
  const width = world.width;
  ctx.fillStyle = '#668648';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(camera.x,camera.y);
  for(let offset=0;offset<camera.x;offset+=sideWidth) {
    ctx.drawImage(leftScenery,-offset-sideWidth,0);
    ctx.drawImage(rightScenery,width+offset,0);
  }
  ctx.drawImage(backdrop,0,0);
}

function renderFrame(now) {
  let finish;
  if(motion) {
    const elapsed = Math.max(0, now-motion.start);
    const covered = Math.min(1,elapsed/motion.duration)*motion.length;
    const segment = motion.segments.find(piece => covered <= piece.end) ?? motion.segments.at(-1);
    const progress = Math.min(1,(covered-segment.start)/segment.length);
    position = [segment.a[0]+(segment.b[0]-segment.a[0])*progress,segment.a[1]+(segment.b[1]-segment.a[1])*progress];
    direction = segment.b[0] < segment.a[0] ? -1 : 1;
    frame = Math.floor(elapsed/112)%4;
    if(elapsed >= motion.duration) {
      position = motion.path.at(-1);
      finish = motion.finish;
      traveled.push(motion.path);
      motion = undefined;
      frame = 0;
    }
  }

  paintMap();
  drawFog(ctx,now);
  if(!motion && answers.length<paths.length) {
    const pair = paths[answers.length][aVotes];
    for(const choice of ['A','B']) {
      const [x,y] = pair[choice][2];
      flag(ctx,x-5,y-13,choice);
    }
  }
  for(const road of traveled) line(ctx,road,'#f3c46b8f',2);
  if(motion) {
    line(ctx,motion.path,'#ffe6a296',3);
    box(ctx,position[0]-9,position[1]+3,18,1,'#ffd28596');
  }
  for(let i=0;i<fireflies.length;i++) {
    const [x,y] = fireflies[i];
    const pulse = Math.sin(now/520+i*2.1);
    if(pulse>-.35) box(ctx,x+Math.sin(now/720+i)*3,y+Math.cos(now/940+i)*2,pulse>.7?2:1,1,'#f4d887');
  }
  sprite(...position,direction,frame);
  ctx.restore();
  if(finish) finish();
}

function tick(now) {
  animationFrame = undefined;
  renderFrame(now);
  if(!reducedMotion.matches || motion) scheduleFrame();
}

function scheduleFrame() {
  if(animationFrame === undefined) animationFrame = requestAnimationFrame(tick);
}

function walk(path, finish) {
  let length=0;
  const segments = path.slice(1).map((b,i) => {
    const a = path[i];
    const part = Math.hypot(b[0]-a[0],b[1]-a[1]);
    const segment = {a,b,start:length,end:length+part,length:part};
    length += part;
    return segment;
  });
  motion = {path,segments,length,finish,start:performance.now(),duration:reducedMotion.matches?1:Math.min(1950,720+length*5.6)};
  scheduleFrame();
}

function updateSteps() {
  steps.forEach((step,i) => {
    step.classList.toggle('done',i<answers.length);
    step.querySelector('b').textContent = answers[i] || (i+1);
    if(i===answers.length) step.setAttribute('aria-current','step');
    else step.removeAttribute('aria-current');
  });
}

function showQuestion(focus=false) {
  const index = answers.length;
  const item = questions[index];
  stage.textContent = '第 '+(index+1)+' 题 / 共 3 题';
  question.textContent = item.title;
  $('#options').hidden = false;
  result.hidden = true;
  for(const choice of ['A','B']) {
    buttons[choice].querySelector('span').textContent = item[choice];
    buttons[choice].disabled = false;
    buttons[choice].classList.remove('chosen');
  }
  message.textContent = '选择 A 或 B，小人就会沿着那条路走。';
  routeStatus.textContent = index===0 ? '起点' : '第 '+(index+1)+' 处岔路';
  if(focus) question.focus({preventScroll:true});
}

function showResult(winner,aVotes) {
  const destination = destinations[winner];
  arrived = winner;
  for(const label of Object.values(resultsLabels)) label.hidden = false;
  resultsLabels[winner].classList.add('arrived');
  question.textContent = destination.title;
  stage.textContent = '抵达终点';
  routeStatus.textContent = destination.place;
  $('#options').hidden = true;
  result.hidden = false;
  $('#result-description').textContent = 'A 选了 '+aVotes+' 次，B 选了 '+(questions.length-aVotes)+' 次。';
  message.textContent = '小人已抵达'+destination.place+'。';
  question.focus({preventScroll:true});
}

function choose(choice) {
  const index = answers.length;
  if(motion || arrived || index>=questions.length) return;
  let route = paths[index][aVotes][choice];
  answers.push(choice);
  if(choice==='A') aVotes++;
  if(answers.length===questions.length) {
    route = [...route,...outerTrail[aVotes].slice(1)];
  }
  buttons.A.disabled = true;
  buttons.B.disabled = true;
  buttons[choice].classList.add('chosen');
  routeStatus.textContent = '沿 '+choice+' 路行走';
  message.textContent = '小人正在沿 '+choice+' 路行走……';
  updateSteps();
  const bounds = mapViewport.getBoundingClientRect();
  const followMap = window.matchMedia('(max-width: 860px)').matches
    && (bounds.top < 0 || bounds.bottom > window.innerHeight);
  if(followMap) mapViewport.scrollIntoView({block:'start'});
  walk(route, () => {
    if(answers.length<questions.length) {
      showQuestion(true);
      if(followMap) questionCard.scrollIntoView({block:'start'});
      return;
    }
    const winner = aVotes>questions.length/2 ? 'A' : 'B';
    routeStatus.textContent = '前往终点';
    message.textContent = '三次选择已完成，小人正在前往终点。';
    walk(finalRoads[winner], () => {
      showResult(winner,aVotes);
      if(followMap) questionCard.scrollIntoView({block:'start'});
    });
  });
}

function reset() {
  answers=[];
  traveled=[];
  position=junctions[0][0];
  aVotes=0;
  motion=undefined;
  frame=0;
  direction=1;
  arrived=undefined;
  for(const label of Object.values(resultsLabels)) {
    label.hidden = true;
    label.classList.remove('arrived');
  }
  updateSteps();
  showQuestion(true);
  scheduleFrame();
}

buttons.A.addEventListener('click',()=>choose('A'));
buttons.B.addEventListener('click',()=>choose('B'));
$('#restart').addEventListener('click',reset);
$('#play-again').addEventListener('click',reset);
reducedMotion.addEventListener('change',scheduleFrame);
showQuestion();
new ResizeObserver(resizeMap).observe(mapViewport);
resizeMap();

