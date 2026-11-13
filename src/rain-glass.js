import * as THREE from 'three';
import {hash,textureFrom} from './craft.js';

// Stationary beads distort only their own small footprint. Camera motion is never used.
export function rainGlassMaterial(){
  const size=512,height=new Float32Array(size*size);
  for(let i=0;i<1600;i++){
    const cx=hash(i,181)*size,cy=hash(i,182)*size;
    const rx=.45+Math.pow(hash(i,183),2)*1.9,ry=rx*(1.3+hash(i,184)*.8);
    for(let y=Math.max(0,Math.floor(cy-ry));y<=Math.min(size-1,Math.ceil(cy+ry));y++)for(let x=Math.max(0,Math.floor(cx-rx));x<=Math.min(size-1,Math.ceil(cx+rx));x++){
      const d=Math.pow((x-cx)/rx,2)+Math.pow((y-cy)/ry,2);
      if(d<1)height[y*size+x]=Math.max(height[y*size+x],Math.sqrt(1-d)*(.4+rx*.16));
    }
  }
  const canvas=Object.assign(document.createElement('canvas'),{width:size,height:size}),ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const at=(a,b)=>height[Math.max(0,Math.min(size-1,b))*size+Math.max(0,Math.min(size-1,a))];
    const dx=(at(x+1,y)-at(x-1,y))*1.8,dy=(at(x,y+1)-at(x,y-1))*1.8,inv=1/Math.sqrt(1+dx*dx+dy*dy);
    pixels.data.set([(1-dx*inv)*127.5,(1+dy*inv)*127.5,(1+inv)*127.5,255],(y*size+x)*4);
  }
  ctx.putImageData(pixels,0,0);
  return new THREE.MeshPhysicalMaterial({color:'#e3ebee',metalness:0,roughness:.035,transmission:.96,thickness:.009,ior:1.47,normalMap:textureFrom(canvas,false),normalScale:new THREE.Vector2(.33,.33),envMapIntensity:.7});
}
