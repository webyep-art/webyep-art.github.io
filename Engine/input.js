export class Input {
    constructor(){this.keys={};this.keysPressed=new Set();this.mouse={x:0,y:0,pressed:false};
        document.addEventListener('keydown',e=>this.keys[e.key]=true);
        document.addEventListener('keyup',e=>{this.keys[e.key]=false;this.keysPressed.add(e.key);});
        document.addEventListener('mousedown',()=>this.mouse.pressed=true);
        document.addEventListener('mouseup',()=>this.mouse.pressed=false);
        document.addEventListener('mousemove',e=>{this.mouse.x=e.clientX;this.mouse.y=e.clientY;});}
    isKeyDown(k){return!!this.keys[k];}
    isKeyPressed(k){if(this.keysPressed.has(k)){this.keysPressed.delete(k);return true;}return false;}
}
