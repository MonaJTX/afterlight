import * as THREE from 'three';
import {hash,textureFrom} from './craft.js';

const mix=(a,b,t)=>a+(b-a)*t;
const clamp=x=>Math.max(0,Math.min(1,x));
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y);x-=ix;y-=iy;x=x*x*(3-2*x);y=y*y*(3-2*y);return mix(mix(hash(ix,iy),hash(ix+1,iy),x),mix(hash(ix,iy+1),hash(ix+1,iy+1),x),y);}

// One atlas for five full-length boards and their apron. Grain never tiles along the desk.
export function benchSurface(){
  const width=2048,height=1024;
  const canvases=Array.from({length:3},()=>Object.assign(document.createElement('canvas'),{width,height}));
  const contexts=canvases.map(c=>c.getContext('2d')),pixels=contexts.map(c=>c.createImageData(width,height));
  const relief=new Float32Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width,v=1-y/height,row=Math.min(5,Math.floor(v*6)),across=v*6-row,seed=13+row*31;
    const waviness=noise(u*3+seed,across*1.7),broad=noise(u*7+seed,across*3);
    let grain=across+(waviness-.5)*.13+.025*Math.sin(u*5+row),knot=0;
    // Sparse, different knots for each board; elongated growth follows the cut of the timber.
    const cx=.15+hash(row,71)*.7,cy=.2+hash(row,73)*.6;
    const dx=(u-cx)/.11,dy=(across-cy)/.2,r=Math.sqrt(dx*dx+dy*dy);
    const influence=Math.exp(-r*r*1.2);
    if(row===1||row===3){grain+=dy*.11*influence;knot=influence;}
    const growth=noise(u*.9+seed,grain*58),fiber=noise(u*17+seed,grain*300);
    const pores=Math.pow(clamp((noise(u*110+seed,grain*420)-.57)*3),3);
    const figure=(growth-.5)*17+(fiber-.5)*6+(broad-.5)*12-knot*13;
    const front=clamp((v-.51)*5)*(1-Math.pow(Math.abs(u-.5)*2,4));
    const handling=front*(.5+noise(u*5,across*2+seed)*.5);
    const boardTone=(hash(row,79)-.5)*13;
    const color=[79,53,34].map((c,j)=>c+(figure+boardTone)*(1-j*.17)-pores*(8-j*2)+handling*(5-j));
    const rough=.57+(growth-.5)*.1+pores*.15+(broad-.5)*.09-handling*.08;
    const i=(y*width+x)*4;
    pixels[0].data.set([...color,255],i);pixels[1].data.set([rough*255,rough*255,rough*255,255],i);
    relief[y*width+x]=(fiber-.5)*.035-pores*.09+(growth-.5)*.018;
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const dx=(relief[y*width+Math.min(width-1,x+1)]-relief[y*width+Math.max(0,x-1)])*2;
    const dy=(relief[Math.min(height-1,y+1)*width+x]-relief[Math.max(0,y-1)*width+x])*2;
    const inv=1/Math.sqrt(1+dx*dx+dy*dy);
    pixels[2].data.set([(1-dx*inv)*127.5,(1+dy*inv)*127.5,(1+inv)*127.5,255],(y*width+x)*4);
  }
  contexts.forEach((c,i)=>c.putImageData(pixels[i],0,0));
  // Small tool scratches collect at the working edge, mostly in the varnish rather than white gouges.
  for(let i=0;i<65;i++){
    const x=(.07+hash(i,87)*.86)*width,y=(.19+hash(i,89)*.25)*height;
    const length=(.003+hash(i,91)*.032)*width,dy=(hash(i,93)-.5)*height*.009;
    for(let map=0;map<2;map++){
      const c=contexts[map];c.strokeStyle=map===0?'rgba(158,122,77,.16)':'rgba(216,216,216,.45)';c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+length,y+dy);c.stroke();
    }
  }
  const [map,roughnessMap,normalMap]=canvases.map((c,i)=>textureFrom(c,i===0));
  return new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,map,roughnessMap,normalMap,normalScale:new THREE.Vector2(.3,.3),metalness:0,roughness:1,clearcoat:.12,clearcoatRoughness:.7});
}

export function benchUV(object){
  const {position,normal,uv}=object.geometry.attributes;
  for(let i=0;i<uv.count;i++){
    const x=position.getX(i)+object.position.x,y=position.getY(i)+object.position.y,z=position.getZ(i)+object.position.z;
    const u=(x+1.525)/3.05;
    const v=Math.abs(normal.getY(i))>.7?(z+.7465)/(5*.277)*5/6:5/6+clamp((y-.68)/.25)/6;
    uv.setXY(i,u,v);
  }
  uv.needsUpdate=true;return object;
}
