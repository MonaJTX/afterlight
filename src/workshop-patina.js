import * as THREE from 'three';
import {paperTexture,hash} from './craft.js';

export function addBenchWear(k){
  // The wear has a cause and a location: handwheel arcs, tools, and an old cup at the back edge.
  const map=paperTexture((c,w,h)=>{
    const at=(x,z)=>[(x/3.05+.5)*w,(.5+(z+.06)/1.38)*h];
    const [cx,cy]=at(-1.17,-.49);
    for(let j=0;j<4;j++){
      c.strokeStyle=`rgba(38,25,13,${.08-j*.012})`;c.lineWidth=2+j*2;
      c.beginPath();c.ellipse(cx+j,cy,48+j,48+j,0,.25,5.9);c.stroke();
    }
    for(const [x,z,r] of [[-.23,.38,105],[-1.05,-.21,125],[.83,.25,120]]){
      const [px,py]=at(x,z),g=c.createRadialGradient(px,py,8,px,py,r);
      g.addColorStop(0,'rgba(32,29,18,.16)');g.addColorStop(1,'rgba(32,29,18,0)');c.fillStyle=g;c.fillRect(px-r,py-r,r*2,r*2);
    }
    const [wx,wy]=at(-.23,.37);
    for(let i=0;i<32;i++){
      c.strokeStyle=i%3?'rgba(35,23,13,.17)':'rgba(199,157,98,.13)';c.lineWidth=.6+hash(i,4);
      c.beginPath();c.ellipse(wx,wy,80+i*.8,75+i*.6,0,hash(i,5)*5,hash(i,5)*5+.35+hash(i,6));c.stroke();
    }
    for(let i=0;i<180;i++){
      const x=hash(i,12)*w,y=h*(.62+hash(i,13)*.37);
      c.strokeStyle=i%3?'rgba(37,24,13,.17)':'rgba(207,161,103,.16)';c.lineWidth=.4+hash(i,9);
      c.beginPath();c.moveTo(x,y);c.lineTo(x+5+hash(i,14)*30,y+(hash(i,15)-.5)*9);c.stroke();
    }
  },2048,1024);
  const wear=k.mesh(new THREE.PlaneGeometry(3.045,1.375),new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.88,polygonOffset:true,polygonOffsetFactor:-1}),[0,.931,-.06]);
  wear.rotation.x=-Math.PI/2;wear.castShadow=false;
}

export function tideRecord(){return paperTexture((c,w,h)=>{
  c.fillStyle='#afa58a';c.fillRect(0,0,w,h);
  for(let i=0;i<18000;i++){c.fillStyle=`rgba(57,42,21,${hash(i,3)*.07})`;c.fillRect(hash(i,4)*w,hash(i,5)*h,1,1);}
  const wash=c.createLinearGradient(0,0,w,h);wash.addColorStop(0,'rgba(86,61,29,.16)');wash.addColorStop(.5,'rgba(86,61,29,0)');wash.addColorStop(1,'rgba(86,61,29,.13)');c.fillStyle=wash;c.fillRect(0,0,w,h);
  c.strokeStyle='#5d604f';c.lineWidth=2;c.strokeRect(26,26,w-52,h-52);
  c.fillStyle='#3c4b42';c.font='33px Georgia';c.fillText('NORTH CAPE · COASTAL SERVICE',60,80);
  c.font='19px Georgia';c.fillText('KEEPER’S WEATHER REGISTER     /     OCTOBER 1896',60,119);
  c.strokeStyle='rgba(76,85,68,.35)';c.lineWidth=1;
  for(let x=85;x<930;x+=42){c.beginPath();c.moveTo(x,170);c.lineTo(x,480);c.stroke();}
  for(let y=170;y<490;y+=31){c.beginPath();c.moveTo(85,y);c.lineTo(925,y);c.stroke();}
  c.fillStyle='#5c6351';c.font='16px Georgia';c.fillText('BAROMETRIC PRESSURE',85,155);c.fillText('LOW',35,475);c.fillText('HIGH',35,185);
  for(let row=0;row<2;row++){
    c.strokeStyle=row?'#80533e':'#3e574c';c.lineWidth=row?2:3;c.beginPath();
    for(let x=85;x<925;x+=3){const t=(x-85)/840;const y=220+Math.sin(t*9+row)*36+Math.sin(t*29)*8+t*t*(row?110:210);c.lineTo(x,y);}c.stroke();
  }
  c.font='italic 23px Georgia';c.fillStyle='#484e40';c.fillText('Wind veering north-east. Visibility falling.',85,535);
  c.fillText('Keep the harbour signal burning through the night.',85,573);
  c.save();c.translate(770,617);c.rotate(-.1);c.strokeStyle='rgba(116,53,35,.6)';c.fillStyle='rgba(116,53,35,.65)';c.lineWidth=3;c.strokeRect(-120,-27,240,45);c.font='24px Georgia';c.textAlign='center';c.fillText('GALE WARNING',0,3);c.restore();
},1000,700);}

export function addArchiveDetails(k,lock){
  const {box,cyl,rod,bolt,plate,mesh,m}=k;
  // The lid is an assembled service part: hinge barrels, folded corner straps and a carrying bail.
  for(const x of [-.31,.31]){
    box(.085,.006,.08,m.steel,[x,.109,-.145],lock,.002);
    for(let j=0;j<5;j++){const barrel=cyl(.012,.017,j%2?m.brass:m.steel,[x+(j-2)*.017,.1,-.203],lock);barrel.rotation.z=Math.PI/2;}
    for(const dx of [-.025,.025]){const screw=cyl(.005,.003,m.steel,[x+dx,.114,-.125],lock, .005,12);}
  }
  for(const x of [-.459,.459]){
    box(.012,.12,.042,m.steel,[x,0,-.13],lock,.003);
    box(.012,.12,.042,m.steel,[x,0,.13],lock,.003);
  }
  const handleX=-.484;
  for(const z of [-.095,.095]){box(.02,.038,.038,m.brass,[handleX,0,z],lock,.004);rod([handleX,0,z],[handleX-.05,-.035,z],.007,m.black,lock);}
  rod([handleX-.05,-.035,-.095],[handleX-.05,-.035,.095],.009,m.black,lock);
  plate('NORTH CAPE  ·  SIGNAL ARCHIVE',.59,.027,[-.045,.032,.2005],lock,{font:22,bg:'#26362f',fg:'#a59d78'});
  const chips=paperTexture((c,w,h)=>{
    for(let i=0;i<160;i++){
      const x=hash(i,31)*w,y=i%2?hash(i,32)*h*.13:h*(.87+hash(i,32)*.13),s=2+hash(i,33)*9;
      if(hash(i,34)<.4)continue;
      c.fillStyle='rgba(66,41,24,.55)';c.fillRect(x-1,y-1,s+2,2+hash(i,36)*4);
      c.fillStyle='rgba(150,144,116,.65)';c.fillRect(x,y,s,1+hash(i,35)*2);
    }
    for(let i=0;i<40;i++){
      const x=w*(.82+hash(i,43)*.14),y=h*(.17+hash(i,44)*.42);
      c.strokeStyle='rgba(183,172,141,.18)';c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+hash(i,45)*18,y+hash(i,46)*4);c.stroke();
    }
  },1600,260);
  const finish=mesh(new THREE.PlaneGeometry(.87,.13),new THREE.MeshStandardMaterial({map:chips,transparent:true,depthWrite:false,roughness:.64,metalness:.45,polygonOffset:true,polygonOffsetFactor:-1}),[0,0,.196],lock);finish.castShadow=false;
}
