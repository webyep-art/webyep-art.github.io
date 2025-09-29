import { Engine } from "./Engine/engine.js";
import { Input } from "./Engine/input.js";

const settings={canvasWidth:1920,canvasHeight:1080,cellSize:32,font:"monospace"};
const COLS=10,ROWS=20,COLORS=["#0ff","#f0f","#ff0","#0f0","#f00","#00f","#fa0"];
const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];

const engine=new Engine(settings),input=new Input();
let board=Array.from({length:ROWS},()=>Array(COLS).fill(null)),piece=null,nextPiece=newPiece(),holdPiece=null,holdUsed=false,dropInterval=60,frame=0,score=0,restartAnim=[],paused=false,volume=0.5,volumeDisplay=0;
const stars=[];for(let i=0;i<100;i++)stars.push({x:Math.random()*settings.canvasWidth,y:Math.random()*settings.canvasHeight,char:Math.random()<0.5?'*':'.',alpha:Math.random(),delta:Math.random()*0.02});
const music=new Audio('Assets/ambient/music.mp3');music.loop=true;music.volume=volume;
const soundMerge=new Audio('Assets/sounds/merge.mp3'),soundLine=new Audio('Assets/sounds/line.mp3'),soundRestart=new Audio('Assets/sounds/restart.mp3'),soundDrop=new Audio('Assets/sounds/drop.mp3');
soundMerge.volume = 0.1
soundDrop.volume = 0.1
soundRestart.volume = 0.1
soundLine.volume = 0.1
function startMusic(){music.play().catch(()=>{});document.removeEventListener('keydown',startMusic);document.removeEventListener('click',startMusic);}
document.addEventListener('keydown',startMusic);
document.addEventListener('click',startMusic);
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r') restart();if(e.key.toLowerCase()==='p') paused=!paused;});
document.addEventListener('wheel',e=>{volume=Math.min(1,Math.max(0,volume+(e.deltaY<0?0.05:-0.05)));music.volume=volume;volumeDisplay=30;});

function newPiece(){const id=Math.floor(Math.random()*SHAPES.length);return{x:Math.floor(COLS/2-Math.ceil(SHAPES[id][0].length/2)),y:0,shape:SHAPES[id],color:COLORS[id]};}
function collide(b,p){for(let y=0;y<p.shape.length;y++)for(let x=0;x<p.shape[y].length;x++)if(p.shape[y][x]){let px=p.x+x,py=p.y+y;if(px<0||px>=COLS||py>=ROWS||(py>=0&&b[py][px]))return true;}return false;}
function merge(b,p){p.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v&&p.y+y>=0)b[p.y+y][p.x+x]=p.color;}));soundMerge.play().catch(()=>{});}
function rotate(s){return s[0].map((_,i)=>s.map(r=>r[i])).reverse();}
function rotate180(s){return s.map(r=>[...r].reverse()).reverse();}
function clearLines(){let l=0;for(let y=ROWS-1;y>=0;y--){if(board[y].every(c=>c)){board.splice(y,1);board.unshift(Array(COLS).fill(null));l++;y++;}}score+=l*100;if(l>0){soundLine.play().catch(()=>{});if(dropInterval>10)dropInterval-=2;}}
function hold(){if(holdUsed)return;if(!holdPiece){holdPiece=piece;piece=nextPiece;nextPiece=newPiece();}else{[piece,holdPiece]=[holdPiece,piece];piece.x=Math.floor(COLS/2-Math.ceil(piece.shape[0].length/2));piece.y=0;}holdUsed=true;}
function instantDrop(){while(!collide(board,piece))piece.y++;piece.y--;merge(board,piece);soundDrop.play().catch(()=>{});clearLines();piece=nextPiece;nextPiece=newPiece();holdUsed=false;if(collide(board,piece))restart();}
function handleInput(){if(paused)return;if(input.isKeyPressed("ArrowLeft")){piece.x--;if(collide(board,piece))piece.x++;}if(input.isKeyPressed("ArrowRight")){piece.x++;if(collide(board,piece))piece.x--;}if(input.isKeyPressed("ArrowDown")){piece.y++;if(collide(board,piece)){piece.y--;merge(board,piece);clearLines();piece=nextPiece;nextPiece=newPiece();holdUsed=false;if(collide(board,piece))restart();}}if(input.isKeyPressed("ArrowUp")){let r=rotate(piece.shape),old=piece.shape;piece.shape=r;if(collide(board,piece))piece.shape=old;}if(input.isKeyPressed("z")){let r=rotate180(rotate(piece.shape)),old=piece.shape;piece.shape=r;if(collide(board,piece))piece.shape=old;}if(input.isKeyPressed("x")){let r=rotate180(piece.shape),old=piece.shape;piece.shape=r;if(collide(board,piece))piece.shape=old;}if(input.isKeyPressed("Shift"))hold();if(input.isKeyPressed(" "))instantDrop();}
function getGhostPiece(){const g={...piece,shape:piece.shape};while(!collide(board,g))g.y++;g.y--;return g;}
function update(){if(paused)return;frame++;handleInput();if(frame%dropInterval===0){piece.y++;if(collide(board,piece)){piece.y--;merge(board,piece);clearLines();piece=nextPiece;nextPiece=newPiece();holdUsed=false;if(collide(board,piece))restart();}}restartAnim.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.alpha-=0.02;});restartAnim=restartAnim.filter(s=>s.alpha>0);if(volumeDisplay>0)volumeDisplay--;}
function renderStars(){stars.forEach(s=>{s.alpha+=s.delta;if(s.alpha<=0||s.alpha>=1)s.delta*=-1;engine.ctx.fillStyle=`rgba(255,255,255,${s.alpha})`;engine.ctx.font=`${settings.cellSize/2}px ${settings.font}`;engine.ctx.fillText(s.char,s.x,s.y);});}
function drawPreview(p,x,y,label){const size=settings.cellSize;const w=4,h=4;for(let i=-1;i<=w;i++){engine.drawChar(x+i,y-1,'-','#fff');engine.drawChar(x+i,y+h,'-','#fff');}for(let j=0;j<h;j++){engine.drawChar(x-1,y+j,'|','#fff');engine.drawChar(x+w,y+j,'|','#fff');}engine.drawText(x*size,(y-1)*size-4,label,'#fff',20);if(!p)return;p.shape.forEach((r,dy)=>r.forEach((v,dx)=>{if(v){engine.ctx.fillStyle=p.color;engine.ctx.fillRect((x+dx)*size,(y+dy)*size,size,size);}}));}
function renderVolume(){if(volumeDisplay<=0)return;const cx=settings.canvasWidth-100,cy=100,r=40,segments=24,chars=['|','/','-','\\'],filledCount=Math.round(volume*segments);for(let i=0;i<segments;i++){const angle=(i/segments)*2*Math.PI-Math.PI/2,x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r,char=chars[i%chars.length];engine.drawText(x,y,i<filledCount?char:'.',i<filledCount?'#0ff':'#555',24);}}

function render(){
    engine.clear("#000");renderStars();
    const offsetX=Math.floor((settings.canvasWidth/settings.cellSize-COLS)/2),offsetY=Math.floor((settings.canvasHeight/settings.cellSize-ROWS)/2),size=settings.cellSize;
    for(let x=-1;x<=COLS;x++){engine.drawChar(offsetX+x,offsetY-1,'-','#fff');engine.drawChar(offsetX+x,offsetY+ROWS,'-','#fff');}
    for(let y=0;y<ROWS;y++){engine.drawChar(offsetX-1,offsetY+y,'|','#fff');engine.drawChar(offsetX+COLS,offsetY+y,'|','#fff');}
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(board[y][x]){engine.ctx.fillStyle=board[y][x];engine.ctx.fillRect((offsetX+x)*size,(offsetY+y)*size,size,size);}
    const ghost=getGhostPiece();ghost.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v){engine.ctx.fillStyle='rgba(200,200,200,0.5)';engine.ctx.fillRect((offsetX+ghost.x+x)*size,(offsetY+ghost.y+y)*size,size,size);}}));
    piece.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v){engine.ctx.fillStyle=piece.color;engine.ctx.fillRect((offsetX+piece.x+x)*size,(offsetY+piece.y+y)*size,size,size);}}));
    drawPreview(nextPiece,offsetX-6,offsetY,'NEXT');drawPreview(holdPiece,offsetX-6,offsetY+8,'HOLD (Shift)');
    restartAnim.forEach(s=>{engine.ctx.fillStyle=`rgba(${s.color.r},${s.color.g},${s.color.b},${s.alpha})`;engine.ctx.fillRect((offsetX+s.x)*size,(offsetY+s.y)*size,size,size);});
    const infoX=offsetX+COLS+2,infoY=offsetY,lineHeight=2,controls=["CONTROLS:","← Move Left","→ Move Right","↑ Rotate CW","Z Rotate CCW","X Rotate 180","Shift Hold","Space Instant Drop","R Restart","P Pause","Mouse Wheel Volume"];
    controls.forEach((line,i)=>engine.drawText(infoX*size,(infoY+i*lineHeight)*size,line,'#fff',24));
    engine.drawText(20,20,`SCORE: ${score}`,'#fff',32);
    if(paused){engine.ctx.fillStyle='rgba(0,0,0,0.7)';engine.ctx.fillRect(0,0,settings.canvasWidth,settings.canvasHeight);engine.ctx.fillStyle='#fff';engine.ctx.font='80px monospace';engine.ctx.textAlign='center';engine.ctx.fillText('PAUSED',settings.canvasWidth/2,settings.canvasHeight/2);engine.ctx.textAlign='left';}
    renderVolume();
}

let introStart=null,inIntro=true;
const introTexts=[{text:"made with @Engine",delay:0,color:"#0ff"},{text:"TetroASCII by webyep",delay:2000,color:"#f0f"}];
function renderIntro(timestamp){if(!introStart) introStart=timestamp;const elapsed=timestamp-introStart;engine.clear("#000");renderStars();const cx=settings.canvasWidth/2,cy=settings.canvasHeight/2;introTexts.forEach((t,i)=>{if(elapsed>t.delay){let alpha=Math.min(1,(elapsed-t.delay)/1000);engine.ctx.globalAlpha=alpha;engine.drawText(cx-(t.text.length*20)/2 + 20,cy-40+i*40,t.text,t.color,32);engine.ctx.globalAlpha=1;}});if(elapsed<5000) requestAnimationFrame(renderIntro); else { inIntro=false; gameLoop();}}

function gameLoop(){if(!inIntro){update();render();}requestAnimationFrame(gameLoop);}
function restart(){restartAnim=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(board[y][x]){let c=board[y][x];board[y][x]=null;restartAnim.push({x,y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,alpha:1,color:hexToRgb(c)});}piece=nextPiece;nextPiece=newPiece();holdPiece=null;holdUsed=false;score=0;dropInterval=60;soundRestart.play().catch(()=>{});}
function hexToRgb(hex){let bigint=parseInt(hex.slice(1),16);return{r:(bigint>>16)&255,g:(bigint>>8)&255,b:bigint&255};}

piece=nextPiece;nextPiece=newPiece();
requestAnimationFrame(renderIntro);
