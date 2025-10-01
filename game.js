import { Engine } from "./Engine/engine.js";
import { Input } from "./Engine/input.js";

const settings={canvasWidth:1920,canvasHeight:1080,cellSize:32,font:"monospace"};
const COLS=10,ROWS=20,COLORS=["#0ff","#f0f","#ff0","#0f0","#f00","#00f","#fa0"],
SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];

const engine=new Engine(settings),input=new Input();
let board=Array.from({length:ROWS},()=>Array(COLS).fill(null)),piece=null,nextPiece=newPiece(),holdPiece=null,holdUsed=false,dropInterval=60,frame=0,score=0,restartAnim=[],paused=false,volume=0.5,volumeDisplay=0,gameState="menu",selectedOption=0,menuOptions=["START GAME","VOLUME","HIGH SCORES","EXIT"],level=1,linesCleared=0,highScores=[0,0,0,0,0],adjustingVolume=false,showHighScores=false;
const stars=[];for(let i=0;i<100;i++)stars.push({x:Math.random()*settings.canvasWidth,y:Math.random()*settings.canvasHeight,char:Math.random()<0.5?'*':'.',alpha:Math.random(),delta:Math.random()*0.02});
const music=new Audio('Assets/ambient/music.mp3');music.loop=true;music.volume=volume;

function getCookie(name){
    const c=document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
    return c?JSON.parse(decodeURIComponent(c.pop())):null;
}
function setCookie(name,value,days=365){
    const d=new Date();
    d.setTime(d.getTime()+days*24*60*60*1000);
    document.cookie=`${name}=${encodeURIComponent(JSON.stringify(value))};expires=${d.toUTCString()};path=/`;
}

function loadGameData(){
    const data=getCookie("tetroascii_data");
    if(data){
        level=data.level||1;
        linesCleared=data.linesCleared||0;
        highScores=data.highScores||[0,0,0,0,0];
        volume=data.volume||0.5;
        music.volume=volume;
    }
}

function saveGameData(){
    setCookie("tetroascii_data",{level,linesCleared,highScores,volume});
}

function startMusic(){
    music.play().catch(()=>{});
    document.removeEventListener('keydown',startMusic);
    document.removeEventListener('click',startMusic);
}
document.addEventListener('keydown',startMusic);
document.addEventListener('click',startMusic);

document.addEventListener('keydown',e=>{
    if(showHighScores){
        showHighScores=false;
        return;
    }
    if(e.key==="r"||e.key==="R") restart();
    if(e.key==="p"||e.key==="P"){if(gameState==="playing")paused=!paused;}
    if(gameState==="menu"){
        if(adjustingVolume){
            if(e.key==="ArrowLeft"){
                volume=Math.max(0,volume-0.05);
                music.volume=volume;
                volumeDisplay=30;
                saveGameData();
            }
            if(e.key==="ArrowRight"){
                volume=Math.min(1,volume+0.05);
                music.volume=volume;
                volumeDisplay=30;
                saveGameData();
            }
            if(e.key==="Enter"||e.key==="Escape"||e.key==="ArrowUp"||e.key==="ArrowDown"){
                adjustingVolume=false;
                if(e.key==="ArrowUp") selectedOption=(selectedOption-1+menuOptions.length)%menuOptions.length;
                if(e.key==="ArrowDown") selectedOption=(selectedOption+1)%menuOptions.length;
            }
        }else{
            if(e.key==="ArrowUp") selectedOption=(selectedOption-1+menuOptions.length)%menuOptions.length;
            if(e.key==="ArrowDown") selectedOption=(selectedOption+1)%menuOptions.length;
            if(e.key==="Enter") handleMenuSelect();
            if(e.key==="ArrowLeft"&&selectedOption===1){
                volume=Math.max(0,volume-0.05);
                music.volume=volume;
                volumeDisplay=30;
                saveGameData();
            }
            if(e.key==="ArrowRight"&&selectedOption===1){
                volume=Math.min(1,volume+0.05);
                music.volume=volume;
                volumeDisplay=30;
                saveGameData();
            }
        }
    }
});

document.addEventListener('wheel',e=>{
    if(showHighScores) return;
    if(gameState==="menu"&&(selectedOption===1||adjustingVolume)){
        volume=Math.min(1,Math.max(0,volume+(e.deltaY<0?0.05:-0.05)));
        music.volume=volume;
        volumeDisplay=30;
        saveGameData();
    }else if(gameState==="playing"){
        volume=Math.min(1,Math.max(0,volume+(e.deltaY<0?0.05:-0.05)));
        music.volume=volume;
        volumeDisplay=30;
        saveGameData();
    }
});

function newPiece(){
    const id=Math.floor(Math.random()*SHAPES.length);
    return{
        x:Math.floor(COLS/2-Math.ceil(SHAPES[id][0].length/2)),
        y:0,
        shape:SHAPES[id],
        color:COLORS[id]
    };
}

function collide(b,p){
    for(let y=0;y<p.shape.length;y++){
        for(let x=0;x<p.shape[y].length;x++){
            if(p.shape[y][x]){
                let px=p.x+x,py=p.y+y;
                if(px<0||px>=COLS||py>=ROWS||(py>=0&&b[py][px])){
                    return true;
                }
            }
        }
    }
    return false;
}

function merge(b,p){
    p.shape.forEach((r,y)=>r.forEach((v,x)=>{
        if(v&&p.y+y>=0){
            b[p.y+y][p.x+x]=p.color;
        }
    }));
}

function rotate(s){
    return s[0].map((_,i)=>s.map(r=>r[i])).reverse();
}

function rotate180(s){
    return s.map(r=>[...r].reverse()).reverse();
}

function clearLines(){
    let l=0;
    for(let y=ROWS-1;y>=0;y--){
        if(board[y].every(c=>c)){
            board.splice(y,1);
            board.unshift(Array(COLS).fill(null));
            l++;
            y++;
        }
    }
    if(l>0){
        linesCleared+=l;
        level=Math.floor(linesCleared/10)+1;
        dropInterval=Math.max(10,60-level*3);
        score+=l*100*level;
        saveGameData();
    }
}

function hold(){
    if(holdUsed) return;
    if(!holdPiece){
        holdPiece=piece;
        piece=nextPiece;
        nextPiece=newPiece();
    }else{
        [piece,holdPiece]=[holdPiece,piece];
        piece.x=Math.floor(COLS/2-Math.ceil(piece.shape[0].length/2));
        piece.y=0;
    }
    holdUsed=true;
}

function instantDrop(){
    while(!collide(board,piece)) piece.y++;
    piece.y--;
    merge(board,piece);
    clearLines();
    piece=nextPiece;
    nextPiece=newPiece();
    holdUsed=false;
    if(collide(board,piece)) gameOver();
}

function handleInput(){
    if(paused) return;
    if(input.isKeyPressed("ArrowLeft")){
        piece.x--;
        if(collide(board,piece)) piece.x++;
    }
    if(input.isKeyPressed("ArrowRight")){
        piece.x++;
        if(collide(board,piece)) piece.x--;
    }
    if(input.isKeyPressed("ArrowDown")){
        piece.y++;
        if(collide(board,piece)){
            piece.y--;
            merge(board,piece);
            clearLines();
            piece=nextPiece;
            nextPiece=newPiece();
            holdUsed=false;
            if(collide(board,piece)) gameOver();
        }
    }
    if(input.isKeyPressed("ArrowUp")){
        let r=rotate(piece.shape),old=piece.shape;
        piece.shape=r;
        if(collide(board,piece)) piece.shape=old;
    }
    if(input.isKeyPressed("z")){
        let r=rotate180(rotate(piece.shape)),old=piece.shape;
        piece.shape=r;
        if(collide(board,piece)) piece.shape=old;
    }
    if(input.isKeyPressed("x")){
        let r=rotate180(piece.shape),old=piece.shape;
        piece.shape=r;
        if(collide(board,piece)) piece.shape=old;
    }
    if(input.isKeyPressed("Shift")) hold();
    if(input.isKeyPressed(" ")) instantDrop();
}

function getGhostPiece(){
    const g={...piece,shape:piece.shape};
    while(!collide(board,g)) g.y++;
    g.y--;
    return g;
}

function update(){
    if(paused||gameState!=="playing") return;
    frame++;
    handleInput();
    if(frame%dropInterval===0){
        piece.y++;
        if(collide(board,piece)){
            piece.y--;
            merge(board,piece);
            clearLines();
            piece=nextPiece;
            nextPiece=newPiece();
            holdUsed=false;
            if(collide(board,piece)) gameOver();
        }
    }
    restartAnim.forEach(s=>{
        s.x+=s.vx;
        s.y+=s.vy;
        s.alpha-=0.02;
    });
    restartAnim=restartAnim.filter(s=>s.alpha>0);
    if(volumeDisplay>0) volumeDisplay--;
}

function renderStars(){
    stars.forEach(s=>{
        s.alpha+=s.delta;
        if(s.alpha<=0||s.alpha>=1) s.delta*=-1;
        engine.ctx.fillStyle=`rgba(255,255,255,${s.alpha})`;
        engine.ctx.font=`${settings.cellSize/2}px ${settings.font}`;
        engine.ctx.fillText(s.char,s.x,s.y);
    });
}

function drawPreview(p,x,y,label){
    const size=settings.cellSize;
    const w=4,h=4;
    for(let i=-1;i<=w;i++){
        engine.drawChar(x+i,y-1,'-','#fff');
        engine.drawChar(x+i,y+h,'-','#fff');
    }
    for(let j=0;j<h;j++){
        engine.drawChar(x-1,y+j,'|','#fff');
        engine.drawChar(x+w,y+j,'|','#fff');
    }
    engine.drawText(x*size,(y-1)*size-4,label,'#fff',20);
    if(!p) return;
    p.shape.forEach((r,dy)=>r.forEach((v,dx)=>{
        if(v){
            engine.ctx.fillStyle=p.color;
            engine.ctx.fillRect((x+dx)*size,(y+dy)*size,size,size);
        }
    }));
}

function renderVolume(){
    if(volumeDisplay<=0) return;
    const cx=settings.canvasWidth-100,cy=gameState==="menu"?settings.canvasHeight/2+100:100,r=40,segments=24,chars=['|','/','-','\\'],filledCount=Math.round(volume*segments);
    for(let i=0;i<segments;i++){
        const angle=(i/segments)*2*Math.PI-Math.PI/2,x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r,char=chars[i%chars.length];
        engine.drawText(x,y,i<filledCount?char:'.',i<filledCount?'#0ff':'#555',24);
    }
}

function renderMenu(){
    engine.clear("#000");
    renderStars();
    const cx=600,cy=settings.canvasHeight/2;
    const time=Date.now()*0.001;


    for(let i=0;i<"TETROASCII".length;i++){
        const char="TETROASCII"[i];
        const x=200+i*60;
        const y=cy-250+Math.sin(time*2+i)*10;
        const hue=(time*50+i*30)%360;
        engine.drawText(x,y,char,`hsl(${hue},100%,60%)`,72);
    }
    engine.drawText(200,cy-150,"CLASSIC TETRIS EXPERIENCE",'#fff',24);

    menuOptions.forEach((option,i)=>{
        const isSelected=i===selectedOption;
        const isVolume=option==="VOLUME";
        const color=isSelected?'#f0f':'#fff';
        const bgColor=isSelected?'rgba(255,0,255,0.2)':'transparent';
        const y=cy-50+i*80;

        if(isSelected){
            engine.ctx.fillStyle=bgColor;
            engine.ctx.fillRect(cx-400,y-30,400,60);
        }

        let text=option;
        if(isVolume){
            text+=` [${Math.round(volume*100)}%]`;
            if(isSelected){
                text+=" ◄►";
                engine.drawText(cx-380,y+30,"USE ARROWS OR MOUSE WHEEL",'#0ff',18);
            }
        }

        engine.drawText(cx-350,y,text,color,36);
        const icons=["▶","🔊","🏆","🚪"];
        engine.drawText(cx-400,y,icons[i],color,36);
    });


    engine.drawText(cx-400,cy+350,`LEVEL: ${level}   LINES: ${linesCleared}   BEST: ${Math.max(...highScores)}`,'#0ff',24);
    engine.drawText(cx-400,cy+400,"USE ARROW KEYS AND ENTER TO NAVIGATE",'#fff',18);

    renderVolume();
}

function handleMenuSelect(){
    switch(selectedOption){
        case 0: gameState="playing";piece=nextPiece;nextPiece=newPiece();break;
        case 1: adjustingVolume=!adjustingVolume;break;
        case 2: showHighScores=true;break;
        case 3: if(confirm("Exit game?")) window.close();break;
    }
}

function renderHighScores(){
    engine.ctx.fillStyle='rgba(0,0,0,0.9)';
    engine.ctx.fillRect(settings.canvasWidth/2-300,settings.canvasHeight/2-200,600,400);
    engine.drawText(settings.canvasWidth/2-100,settings.canvasHeight/2-150,"HIGH SCORES",'#ff0',48);


    const sortedScores=[...highScores].sort((a,b)=>b-a).slice(0,5);
    sortedScores.forEach((score,i)=>{
        const medal=["🥇","🥈","🥉","4️⃣","5️⃣"][i];
        const y=settings.canvasHeight/2-60+i*40;
        engine.drawText(settings.canvasWidth/2-120,y,`${medal} ${score} POINTS`,'#fff',24);
    });

    engine.drawText(settings.canvasWidth/2-180,settings.canvasHeight/2+250,"PRESS ANY KEY TO CONTINUE",'#0ff',24);
}

function gameOver(){
    highScores.push(score);
    highScores.sort((a,b)=>b-a);
    highScores.splice(5);
    saveGameData();
    gameState="menu";
    restart();
}

function renderGame(){
    const offsetX=Math.floor((settings.canvasWidth/settings.cellSize-COLS)/2),
    offsetY=Math.floor((settings.canvasHeight/settings.cellSize-ROWS)/2),
    size=settings.cellSize;


    for(let x=-1;x<=COLS;x++){
        engine.drawChar(offsetX+x,offsetY-1,'-','#fff');
        engine.drawChar(offsetX+x,offsetY+ROWS,'-','#fff');
    }
    for(let y=0;y<ROWS;y++){
        engine.drawChar(offsetX-1,offsetY+y,'|','#fff');
        engine.drawChar(offsetX+COLS,offsetY+y,'|','#fff');
    }


    for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
            if(board[y][x]){
                engine.ctx.fillStyle=board[y][x];
                engine.ctx.fillRect((offsetX+x)*size,(offsetY+y)*size,size,size);
            }
        }
    }


    const ghost=getGhostPiece();
    ghost.shape.forEach((r,y)=>r.forEach((v,x)=>{
        if(v){
            engine.ctx.fillStyle='rgba(200,200,200,0.3)';
            engine.ctx.fillRect((offsetX+ghost.x+x)*size,(offsetY+ghost.y+y)*size,size,size);
        }
    }));

    piece.shape.forEach((r,y)=>r.forEach((v,x)=>{
        if(v){
            engine.ctx.fillStyle=piece.color;
            engine.ctx.fillRect((offsetX+piece.x+x)*size,(offsetY+piece.y+y)*size,size,size);
        }
    }));


    drawPreview(nextPiece,offsetX-6,offsetY,'NEXT');
    drawPreview(holdPiece,offsetX-6,offsetY+8,'HOLD (Shift)');


    restartAnim.forEach(s=>{
        engine.ctx.fillStyle=`rgba(${s.color.r},${s.color.g},${s.color.b},${s.alpha})`;
        engine.ctx.fillRect((offsetX+s.x)*size,(offsetY+s.y)*size,size,size);
    });


    const infoX=offsetX+COLS+2,infoY=offsetY,lineHeight=2;
    const controls=["CONTROLS:","←→ Move","↑ Rotate CW","Z Rotate CCW","X Rotate 180","Shift Hold","Space Drop","R Restart","P Pause","Wheel Volume"];
    controls.forEach((line,i)=>engine.drawText(infoX*size,(infoY+i*lineHeight)*size,line,'#fff',24));


    engine.drawText(20,20,`SCORE: ${score}`,'#0ff',32);
    engine.drawText(20,60,`LEVEL: ${level}`,'#f0f',32);
    engine.drawText(20,100,`LINES: ${linesCleared}`,'#ff0',32);
    engine.drawText(20,140,`NEXT LEVEL: ${Math.max(0,10-(linesCleared%10))}`,'#0f0',32);

    if(paused){
        engine.ctx.fillStyle='rgba(0,0,0,0.7)';
        engine.ctx.fillRect(0,0,settings.canvasWidth,settings.canvasHeight);
        engine.ctx.fillStyle='#fff';
        engine.ctx.font='80px monospace';
        engine.ctx.textAlign='center';
        engine.ctx.fillText('PAUSED',settings.canvasWidth/2,settings.canvasHeight/2);
        engine.ctx.textAlign='left';
    }
    renderVolume();
}

let introStart=null,inIntro=true;
const introTexts=[{text:"made with GDevelop",delay:0,color:"#0ff"},{text:"TetroASCII by webyep",delay:2000,color:"#f0f"}];

function renderIntro(timestamp){
    if(!introStart) introStart=timestamp;
    const elapsed=timestamp-introStart;
    engine.clear("#000");
    renderStars();
    const cx=settings.canvasWidth/2,cy=settings.canvasHeight/2;
    introTexts.forEach((t,i)=>{
        if(elapsed>t.delay){
            let alpha=Math.min(1,(elapsed-t.delay)/1000);
            alpha*=Math.min(1,(5000-elapsed+t.delay)/1000);
            engine.ctx.globalAlpha=alpha;
            engine.drawText(cx-(t.text.length*20)/2+20,cy-40+i*40,t.text,t.color,32);
            engine.ctx.globalAlpha=1;
        }
    });
    if(elapsed<5000) requestAnimationFrame(renderIntro);
    else { inIntro=false; gameLoop(); }
}

function gameLoop(){
    if(!inIntro){
        update();
        engine.clear("#000");
        renderStars();
        if(showHighScores){
            renderHighScores();
        }else{
            if(gameState==="menu") renderMenu();
            else if(gameState==="playing") renderGame();
        }
    }
    requestAnimationFrame(gameLoop);
}

function restart(){
    restartAnim=[];
    for(let y=0;y<ROWS;y++){
        for(let x=0;x<COLS;x++){
            if(board[y][x]){
                let c=board[y][x];
                board[y][x]=null;
                restartAnim.push({
                    x,y,
                    vx:(Math.random()-0.5)*6,
                    vy:(Math.random()-0.5)*6,
                    alpha:1,
                    color:hexToRgb(c)
                });
            }
        }
    }
    piece=nextPiece;
    nextPiece=newPiece();
    holdPiece=null;
    holdUsed=false;
    score=0;
    dropInterval=Math.max(10,60-level*3);
}

function hexToRgb(hex){
    let bigint=parseInt(hex.slice(1),16);
    return{
        r:(bigint>>16)&255,
        g:(bigint>>8)&255,
        b:bigint&255
    };
}

loadGameData();
requestAnimationFrame(renderIntro);
