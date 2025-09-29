export class Engine {
    constructor(s){this.settings=s;this.canvas=document.createElement('canvas');
        this.canvas.width=s.canvasWidth;this.canvas.height=s.canvasHeight;
        document.body.appendChild(this.canvas);
        this.ctx=this.canvas.getContext('2d');
        this.ctx.font=`${s.cellSize}px ${s.font}`;
        this.ctx.textBaseline='middle';this.ctx.textAlign='center';}

    drawChar(x,y,ch,c="#fff",bg=null,g=true){const size=this.settings.cellSize;
        let px=x,py=y;if(g){px=Math.floor(x)*size+size/2;py=Math.floor(y)*size+size/2;}
        if(bg){this.ctx.fillStyle=bg;this.ctx.fillRect(px-size/2,py-size/2,size,size);}
        this.ctx.fillStyle=c;this.ctx.fillText(ch,px,py);}

    drawText(x,y,t,c="#fff",fs=this.settings.cellSize,g=false){const size=this.settings.cellSize;
        let px=x,py=y;if(g){px=Math.floor(x)*size+size/2;py=Math.floor(y)*size+size/2;}
        this.ctx.fillStyle=c;this.ctx.font=`${fs}px ${this.settings.font}`;
        this.ctx.textAlign="left";this.ctx.textBaseline="top";this.ctx.fillText(t,px,py);
        this.ctx.font=`${this.settings.cellSize}px ${this.settings.font}`;
        this.ctx.textAlign="center";this.ctx.textBaseline="middle";}

    clear(c="#000"){this.ctx.fillStyle=c;this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);}
}
