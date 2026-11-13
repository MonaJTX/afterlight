import * as THREE from 'three';
import {paperTexture,hash,textureFrom} from './craft.js';

export function keeperLetterTexture(){return paperTexture((c,w,h)=>{
  c.fillStyle='#e3d4b0';c.fillRect(0,0,w,h);
  const edge=c.createRadialGradient(w*.48,h*.46,w*.21,w*.5,h*.5,w*.71);edge.addColorStop(0,'rgba(106,67,25,0)');edge.addColorStop(.72,'rgba(106,67,25,.02)');edge.addColorStop(1,'rgba(106,67,25,.2)');c.fillStyle=edge;c.fillRect(0,0,w,h);
  for(let i=0;i<24000;i++){
    const x=hash(i,221)*w,y=hash(i,222)*h;c.strokeStyle=i%3?'rgba(75,57,30,.025)':'rgba(255,247,222,.13)';c.lineWidth=.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+hash(i,223)*5,y+hash(i,224)*2);c.stroke();
  }
  for(const f of [.34,.67]){
    const y=h*f,g=c.createLinearGradient(0,y-8,0,y+7);g.addColorStop(0,'rgba(74,57,31,0)');g.addColorStop(.45,'rgba(74,57,31,.07)');g.addColorStop(.55,'rgba(255,247,216,.18)');g.addColorStop(1,'rgba(74,57,31,0)');c.fillStyle=g;c.fillRect(0,y-8,w,15);
  }
  c.strokeStyle='rgba(87,72,47,.5)';c.lineWidth=1.5;c.strokeRect(40,40,w-80,h-80);
  c.fillStyle='#4d4c3c';c.font='28px Georgia';c.fillText('NORTH CAPE  /  18 OCTOBER 1896',85,100);
  c.strokeStyle='rgba(87,72,47,.35)';c.beginPath();c.moveTo(85,133);c.lineTo(w-85,133);c.stroke();
  c.fillStyle='#222a23';c.font='60px "Microsoft YaHei",serif';c.fillText('留给下一位守灯人',85,210);
  c.font='44px "Microsoft YaHei",serif';
  const lines=['风暴切断了航道。','今晚，船只看不到北岬。','底片上的信号，藏着主闸钥匙。','','接通电源，转动方位轮。','让光经过反射镜，落进接收孔。','调焦，直到三个记号清晰。','由上至下读，从左到右写。','','取出钥匙，重新点亮灯塔。','灯亮后，等一等海上的回应。'];
  lines.forEach((line,i)=>c.fillText(line,85,295+i*56));
  // A service stamp sits in the unused margin, never under the instructions.
  c.save();c.translate(978,824);c.rotate(-.12);c.strokeStyle='rgba(120,49,29,.47)';c.fillStyle='rgba(120,49,29,.6)';c.lineWidth=3;c.beginPath();c.arc(0,0,65,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,59,0,Math.PI*2);c.stroke();c.font='18px Georgia';c.textAlign='center';c.fillText('NORTH CAPE',0,-19);c.font='24px "Microsoft YaHei"';c.fillText('值守留档',0,15);c.restore();
  c.fillStyle='#3b4034';c.font='32px "Microsoft YaHei",serif';c.fillText('点击器物靠近 · 拖动旋钮',85,h-105);c.fillText('右键或 Esc 退后 · 1–4 切换观察位置',85,h-55);
},1200,1050);}

export function buildKeeperLetter(k,map){
  const group=new THREE.Group();k.root.add(group);
  const nx=48,ny=42,geo=new THREE.PlaneGeometry(.62,.5425,nx,ny),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const u=p.getX(i)/.62+.5,v=p.getY(i)/.5425+.5;
    const edge=Math.pow(Math.abs(u-.5)*2,7)*(.001+.0015*Math.sin(v*9)**2);
    const curl=Math.pow(u,9)*Math.pow(v,8)*.006;
    const fold=.0006*Math.exp(-Math.pow((v-.33)*110,2))+.0006*Math.exp(-Math.pow((v-.66)*110,2));
    p.setZ(i,.001+edge+curl+fold);
    if(i%(nx+1)===0||i%(nx+1)===nx)p.setX(i,p.getX(i)+(hash(i,231)-.5)*.0005);
  }
  geo.computeVertexNormals();
  const fiberCanvas=Object.assign(document.createElement('canvas'),{width:256,height:256}),ctx=fiberCanvas.getContext('2d'),pixels=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const g=122+hash(x,y)*12;pixels.data.set([g,g,g,255],(y*256+x)*4);}ctx.putImageData(pixels,0,0);
  const front=k.mesh(geo,new THREE.MeshStandardMaterial({map,roughness:.96,metalness:0,bumpMap:textureFrom(fiberCanvas,false),bumpScale:.00012}),[0,0,0],group);
  const back=geo.clone();back.translate(0,0,-.0007);k.mesh(back,k.mat('#d4c29b',0,.98,{side:THREE.BackSide}),[0,0,0],group);
  const perimeter=[];for(let x=0;x<=nx;x++)perimeter.push(x);for(let y=1;y<=ny;y++)perimeter.push(y*(nx+1)+nx);for(let x=nx-1;x>=0;x--)perimeter.push(ny*(nx+1)+x);for(let y=ny-1;y>0;y--)perimeter.push(y*(nx+1));
  const rim=[];
  for(let i=0;i<perimeter.length;i++){
    const a=new THREE.Vector3().fromBufferAttribute(p,perimeter[i]),b=new THREE.Vector3().fromBufferAttribute(p,perimeter[(i+1)%perimeter.length]),c=b.clone(),d=a.clone();c.z-=.0007;d.z-=.0007;
    rim.push(...a,...b,...c,...a,...c,...d);
  }
  const edgeGeo=new THREE.BufferGeometry();edgeGeo.setAttribute('position',new THREE.Float32BufferAttribute(rim,3));edgeGeo.computeVertexNormals();k.mesh(edgeGeo,k.mat('#b9a57e',0,.98,{side:THREE.DoubleSide}),[0,0,0],group);
  return group;
}
