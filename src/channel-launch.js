import * as THREE from 'three';
import {paperTexture} from './craft.js';

// A waiting coastal launch gives the restored beacon a visible consequence in the world.
export function buildChannelLaunch(k){
  const {root,mesh,box,cyl,rod,mat,m}=k,g=new THREE.Group();g.position.set(-14,-.35,-36);g.rotation.y=.18;root.add(g);
  const stations=24,profile=[[-1,.16],[-.84,-.12],[-.34,-.42],[.34,-.42],[.84,-.12],[1,.16]],positions=[],indices=[];
  for(let i=0;i<=stations;i++){
    const x=-3.3+i/stations*6.6,beam=.64*Math.pow(Math.max(.015,1-Math.pow(x/3.36,2)),.6);
    const endLift=Math.pow(Math.abs(x)/3.3,5);
    for(const [width,y] of profile)positions.push(x,y+endLift*(y<0?.35:.1),beam*width);
  }
  for(let i=0;i<stations;i++)for(let j=0;j<profile.length-1;j++){
    const a=i*profile.length+j,b=a+profile.length;indices.push(a,a+1,b,b,a+1,b+1);
  }
  const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));hull.setIndex(indices);hull.computeVertexNormals();
  mesh(hull,mat('#253332',.08,.79,{side:THREE.DoubleSide}),[0,0,0],g);
  const deckPoints=[];
  for(let i=0;i<=stations;i++){const x=-3.3+i/stations*6.6;deckPoints.push(new THREE.Vector2(x,.64*Math.pow(Math.max(.015,1-Math.pow(x/3.36,2)),.6)));}
  for(let i=stations;i>=0;i--){const x=-3.3+i/stations*6.6;deckPoints.push(new THREE.Vector2(x,-.64*Math.pow(Math.max(.015,1-Math.pow(x/3.36,2)),.6)));}
  const deck=mesh(new THREE.ShapeGeometry(new THREE.Shape(deckPoints)),mat('#6b6250',0,.92),[0,.16,0],g);deck.rotation.x=-Math.PI/2;
  const rail=mat('#737c70',.25,.72);
  for(const side of [-1,1])for(let i=0;i<stations;i++){
    const point=index=>{const x=-3.3+index/stations*6.6;return[x,.2+.1*Math.pow(Math.abs(x)/3.3,5),.64*Math.pow(Math.max(.015,1-Math.pow(x/3.36,2)),.6)*side];};
    rod(point(i),point(i+1),.018,rail,g);
  }
  box(2.05,.95,.99,mat('#797a6a',.02,.85),[-.35,.64,0],g,.025,1);
  box(2.22,.09,1.15,mat('#253735',.2,.65),[-.35,1.15,0],g,.02,1);
  const windows=mat('#223d3e',.12,.24,{emissive:'#ffd49a',emissiveIntensity:0});
  for(const x of [-.97,-.36,.25])box(.42,.34,.012,windows,[x,.79,.501],g,.014,1);
  box(.012,.34,.55,windows,[.681,.79,0],g,.01,1);
  cyl(.145,.69,mat('#303734',.35,.7),[-.8,1.49,0],g);cyl(.175,.05,m.black,[-.8,1.84,0],g);
  rod([1.35,.17,0],[1.35,2.8,0],.025,rail,g);rod([.87,2.31,0],[1.83,2.31,0],.018,rail,g);
  rod([-2.5,.22,0],[1.35,2.65,0],.006,m.black,g);rod([1.35,2.65,0],[2.9,.22,0],.006,m.black,g);
  const signal=mat('#26312a',.1,.35,{emissive:'#ffdfae',emissiveIntensity:0});cyl(.055,.1,signal,[1.35,2.4,.05],g);
  const glow=paperTexture((c,w,h)=>{const gradient=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gradient.addColorStop(0,'rgba(255,218,152,.55)');gradient.addColorStop(.2,'rgba(255,204,122,.12)');gradient.addColorStop(1,'rgba(255,204,122,0)');c.fillStyle=gradient;c.fillRect(0,0,w,h);},128,128);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));halo.position.set(1.35,2.4,.05);halo.scale.set(1.1,1.1,1);g.add(halo);
  return {update(response){windows.emissiveIntensity=response*2.5;signal.emissiveIntensity=response*4;halo.material.opacity=response;}};
}
