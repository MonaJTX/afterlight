import * as THREE from 'three';
import {hash,textureFrom,paperTexture} from './craft.js';

const mix=(a,b,t)=>a+(b-a)*t;
const clamp=x=>Math.max(0,Math.min(1,x));
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y);x-=ix;y-=iy;x=x*x*(3-2*x);y=y*y*(3-2*y);return mix(mix(hash(ix,iy),hash(ix+1,iy),x),mix(hash(ix,iy+1),hash(ix+1,iy+1),x),y);}
function maps(width,height,pixel,decorate){
  const canvases=Array.from({length:3},()=>Object.assign(document.createElement('canvas'),{width,height}));
  const contexts=canvases.map(c=>c.getContext('2d')),data=contexts.map(c=>c.createImageData(width,height));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const {color,rough,relief}=pixel(x/width,1-y/height,x,y),i=(y*width+x)*4;
    data[0].data.set([...color,255],i);data[1].data.set([rough*255,rough*255,rough*255,255],i);data[2].data.set([relief*255,relief*255,relief*255,255],i);
  }
  contexts.forEach((c,i)=>c.putImageData(data[i],0,0));if(decorate)decorate(contexts,width,height);
  return {map:textureFrom(canvases[0]),roughnessMap:textureFrom(canvases[1],false),bumpMap:textureFrom(canvases[2],false)};
}

export function workshopWallMaterial(){
  // The left atlas half belongs to the window wall; the right half is plain plaster.
  // This prevents window-shaped water damage from appearing on the side/rear walls.
  const textures=maps(3072,1024,(atlasU,v,x,y)=>{
    const windowWall=atlasU<.5,u=(atlasU*2)%1;
    const wx=u*7-3.5,wy=v*3.6;
    const broad=noise(u*13+3,v*8),trowel=noise(u*58,v*28),grain=noise(u*490,v*250);
    // Water damage follows the window reveals and lower wall; it is not repeated on every pier.
    const reveal=Math.max(Math.exp(-Math.pow((wx+2.55)/.24,2)),Math.exp(-Math.pow((wx-.05)/.23,2)));
    const wet=(windowWall?reveal:0)*clamp((3.3-wy)/2.3)*(.4+noise(u*80,v*3)*.6);
    const below=clamp((.82-wy)/.7)*(windowWall&&wx>-2.6&&wx<.1?1:.2);
    const sweep=noise(u*29+noise(u*9,v*5)*.8,v*93);
    const plaster=(broad-.5)*19+(trowel-.5)*9+(grain-.5)*4;
    // An old plaster repair on the left pier has an irregular feathered edge, not a decal rectangle.
    const patchDistance=Math.sqrt(Math.pow((wx+3.04)/.42,2)+Math.pow((wy-1.55)/.55,2));
    const patch=windowWall?clamp((1-patchDistance+(noise(u*95,v*64)-.5)*.26)*5):0;
    const flake=clamp((wet*.55+below*.35+noise(u*135,v*90)*.4-.61)*7);
    const pinholes=Math.pow(clamp((noise(u*640,v*360)-.7)*4),2);
    const paint=[120,124,113],substrate=[145,135,112];
    return {color:paint.map((c,i)=>mix(c+plaster,substrate[i],flake)+patch*(i===2?1:7)-wet*19-below*12-pinholes*4),rough:.84+trowel*.12+wet*.025,relief:.47+(trowel-.5)*.16+(sweep-.5)*.07+(grain-.5)*.09-flake*.18-pinholes*.12+patch*.035};
  },(contexts,w,h)=>{
    // Fine settlement cracks start at masonry openings, with a few short branches.
    const at=(x,y)=>[(x+3.5)/7*w*.5,(1-y/3.6)*h];
    for(const [index,path] of [[[-2.51,3.15],[-2.61,3.29],[-2.64,3.32],[-2.71,3.49]],[[-.01,3.15],[.13,3.24],[.17,3.36],[.27,3.41]],[[-2.51,.78],[-2.59,.61],[-2.55,.5],[-2.64,.36]]].entries()){
      for(let channel=0;channel<3;channel++){
        const c=contexts[channel];c.strokeStyle=channel===0?'rgba(39,49,42,.42)':channel===1?'rgba(250,250,250,.4)':'rgba(32,32,32,.4)';c.lineWidth=channel===0?1.2:1.5;c.beginPath();path.forEach(([x,y],i)=>{const p=at(x,y);i?c.lineTo(...p):c.moveTo(...p);});c.stroke();
        const p=at(...path[2]);c.beginPath();c.moveTo(...p);c.lineTo(p[0]+(index%2?11:-9),p[1]+13);c.stroke();
      }
    }
  });
  return new THREE.MeshStandardMaterial({color:0xffffff,metalness:0,roughness:1,bumpScale:.01,...textures});
}

// Each wall uses a 7 m by 3.6 m region; the window wall alone samples its weathering.
export function wallUV(object,side=false,windowWall=true){
  const {position,uv}=object.geometry.attributes;
  for(let i=0;i<uv.count;i++)uv.setXY(i,((side?position.getZ(i)+object.position.z:position.getX(i)+object.position.x)+3.5)/14+((side||!windowWall)?.5:0),(position.getY(i)+object.position.y)/3.6);
  uv.needsUpdate=true;return object;
}

export function sashMaterial(){
  const textures=maps(256,1024,(u,v,x,y)=>{
    const n=noise(u*21,v*95),end=Math.pow(Math.abs(v-.5)*2,9),edge=Math.pow(Math.abs(u-.5)*2,14);
    const split=clamp((noise(u*49,v*8)-.69)*5)*(end*.8+edge*.3);
    const chips=clamp((noise(u*34,v*149)+end*.38+edge*.18-.91)*6);
    const worn=clamp(chips+split),grain=Math.sin(u*370+noise(u*7,v*18)*3);
    return {color:[67,80,72].map((c,i)=>mix(c+(n-.5)*7,[104,81,52][i]+grain*4,worn)),rough:.53+n*.12+worn*.22,relief:.52+(n-.5)*.03-worn*.13};
  });
  return new THREE.MeshStandardMaterial({color:0xffffff,metalness:0,roughness:1,bumpScale:.0015,...textures});
}

export function sashUV(object,horizontal=false){
  const {position,normal,uv}=object.geometry.attributes,{width,height,depth}=object.geometry.parameters;
  for(let i=0;i<uv.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    const cross=Math.abs(normal.getZ(i))>.7?(horizontal?y/height:x/width):z/depth;
    uv.setXY(i,cross+.5,(horizontal?x/width:y/height)+.5);
  }
  uv.needsUpdate=true;return object;
}

export function addStormBarometer(k){
  const {root,box,cyl,ring,rod,mesh,plate,m,mat}=k;
  const g=new THREE.Group();g.position.set(-2.98,2.06,-2.49);root.add(g);
  box(.48,.61,.055,m.wood,[0,0,0],g,.028);
  const caseBack=cyl(.226,.065,m.black,[0,.035,.055],g);caseBack.rotation.x=Math.PI/2;
  const bezel=ring(.213,.013,m.brass,[0,.035,.098],g);
  ring(.197,.004,m.edge,[0,.035,.104],g);
  const face=paperTexture((c,w,h)=>{
    c.fillStyle='#c1b797';c.fillRect(0,0,w,h);
    const fade=c.createRadialGradient(w*.46,h*.44,100,w/2,h/2,w*.53);fade.addColorStop(0,'rgba(79,56,28,0)');fade.addColorStop(1,'rgba(79,56,28,.25)');c.fillStyle=fade;c.fillRect(0,0,w,h);
    c.translate(w/2,h/2);c.strokeStyle='#424b3d';c.fillStyle='#394639';
    for(let i=0;i<=80;i++){const a=(-135+i*270/80)*Math.PI/180,r=i%10===0?183:202;c.lineWidth=i%10===0?2:1;c.beginPath();c.moveTo(Math.sin(a)*r,-Math.cos(a)*r);c.lineTo(Math.sin(a)*220,-Math.cos(a)*220);c.stroke();if(i%20===0){c.font='27px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(String(27+i/20),Math.sin(a)*160,-Math.cos(a)*160);}}
    c.textAlign='center';c.font='18px Georgia';c.fillText('NORTH CAPE',0,-88);c.font='12px Georgia';c.fillText('COASTAL OBSERVATORY',0,-62);c.font='16px Georgia';c.fillText('STORM     CHANGE     FAIR',0,96);c.font='12px Georgia';c.fillText('INCHES OF MERCURY',0,127);
    c.strokeStyle='rgba(120,56,36,.6)';c.lineWidth=3;c.beginPath();c.arc(0,0,228,2.35,3.35);c.stroke();
  },512,512);
  mesh(new THREE.CircleGeometry(.195,80),mat('#ffffff',0,.9,{map:face}),[0,.035,.096],g);
  const needle=new THREE.Group();needle.position.set(0,.035,.112);needle.rotation.z=.74;g.add(needle);
  rod([0,-.044,0],[0,.16,0],.0028,m.black,needle);const hub=cyl(.012,.008,m.brass,[0,0,0],needle);hub.rotation.x=Math.PI/2;
  const needleTip=new THREE.Shape();needleTip.moveTo(-.007,.12);needleTip.lineTo(0,.175);needleTip.lineTo(.007,.12);needleTip.closePath();mesh(new THREE.ShapeGeometry(needleTip),m.black,[0,0,.001],needle);
  ring(.031,.005,m.brass,[0,.34,-.008],g);box(.038,.052,.018,m.black,[0,.306,-.01],g,.004);
  plate('FALLING  ·  KEEP WATCH',.31,.035,[0,-.235,.031],g,{font:33,bg:'#344239',fg:'#b9b08c'});
}
