// Keep the physical rotation continuous while saved symbols wrap from 5 back to 0.
// Each accepted action contributes one detent, including several actions in one frame.
export function animationDelta(seconds){return Number.isFinite(seconds)?Math.max(0,Math.min(seconds,.04)):0;}

export function drumMotion(values){
  const step=Math.PI/3,angles=values.map(v=>v*step),targets=[...angles];
  return {
    angles,targets,
    turn(index,direction){if(Number.isInteger(index)&&index>=0&&index<angles.length)targets[index]+=(direction<0?-1:1)*step;},
    update(dt){const blend=1-Math.exp(-16*Math.max(0,dt));for(let i=0;i<angles.length;i++)angles[i]+=(targets[i]-angles[i])*blend;},
    reset(next){for(let i=0;i<angles.length;i++)angles[i]=targets[i]=next[i]*step;}
  };
}
