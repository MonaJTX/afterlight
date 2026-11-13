import * as THREE from 'three';
import {paperTexture,hash} from './craft.js';
import {skyMaterial,oceanMaterial} from './environment-materials.js';
import {tideRecord} from './workshop-patina.js';
import {workshopWallMaterial,wallUV,sashMaterial,sashUV,addStormBarometer} from './architectural-surfaces.js';
import {rainGlassMaterial} from './rain-glass.js';
import {addCoastalHeadland} from './coastal-headland.js';
import {buildChannelLaunch} from './channel-launch.js';

export function buildRoom(k,initialComplete=false){
  const {root,mesh,box,cyl,ring,rod,bolt,plate,cable,m,mat}=k;
  // A smaller keeper's workshop. The window, desk and lamp have believable human dimensions.
  box(7,.18,7,m.black,[0,-.12,0]);
  const floorWoods=Array.from({length:8},(_,i)=>{const material=m.wood.clone();material.color.setScalar(.69+i*.32/7);return material;});
  for(let row=0;row<26;row++)for(let col=0;col<5;col++){
    const x=-3.8+col*1.64+(row%2)*.82,z=-3.4+row*.27;
    const wood=floorWoods[Math.min(7,Math.floor(hash(row,col)*8))];
    const plank=box(1.63,.045,.265,wood,[x,.002,z],root,.004);
    for(const xx of [-.74,.74])for(const zz of [-.095,.095]){const nail=cyl(.003,.002,m.black,[x+xx,.026,z+zz],root,.003,6);}
  }
  const wall=workshopWallMaterial();
  const wallBox=(w,h,d,p,side=false,windowWall=true)=>wallUV(box(w,h,d,wall,p),side,windowWall);
  // Two side piers and lintel leave a genuine opening; no luminous decal over a wall.
  wallBox(1.05,3.6,.32,[-2.98,1.8,-2.7]);wallBox(3.25,3.6,.32,[1.62,1.8,-2.7]);
  wallBox(2.4,.73,.32,[-1.25,.365,-2.7]);wallBox(2.4,.48,.32,[-1.25,3.36,-2.7]);
  wallBox(.2,3.6,6.3,[-3.55,1.8,.25],true);wallBox(.2,3.6,6.3,[3.55,1.8,.25],true);wallBox(7,3.6,.2,[0,1.8,3.5],false,false);
  box(7,.15,6.4,m.wood,[0,3.63,.3]);
  for(const z of [-2.5,.3,3]){box(7.1,.18,.16,m.wood,[0,3.44,z]);for(const x of [-3.4,3.4])box(.16,3.45,.18,m.wood,[x,1.72,z]);}
  for(const y of [.12,.72,.79])box(7,.045,.06,m.wood,[0,y,-2.5]);
  for(let x=-3.3;x<3.5;x+=.4){box(.37,.56,.024,m.enamel,[x,.42,-2.52]);}
  // The protective dado continues around the room, with timber rails at the same heights.
  // Local orientation keeps the timber grain along each rail, including reflected walls.
  for(const [x,z,rotation,length] of [[-3.43,.45,Math.PI/2,6],[3.43,.45,-Math.PI/2,6],[0,3.37,Math.PI,6.86]]){
    const dado=new THREE.Group();dado.position.set(x,0,z);dado.rotation.y=rotation;root.add(dado);
    for(const y of [.12,.72,.79])box(length,.045,.06,m.wood,[0,y,.015],dado,.008,1);
    const count=Math.round(length/.4),pitch=length/count;
    for(let i=0;i<count;i++)box(pitch-.025,.56,.024,m.enamel,[-length/2+pitch*(i+.5),.42,0],dado,.008,1);
  }
  // Window stone reveal, painted timber sash, putty beads, weathered screws.
  for(const x of [-2.5,0])box(.12,2.5,.43,m.stone,[x,1.94,-2.64],root,.018);
  box(2.73,.13,.62,m.stone,[-1.25,.78,-2.5],root,.018);box(2.6,.13,.43,m.stone,[-1.25,3.15,-2.64]);
  const sash=sashMaterial(),putty=mat('#777b67',0,.93);
  for(const x of [-2.42,-1.25,-.08]){sashUV(box(.055,2.29,.12,sash,[x,1.97,-2.54]));rod([x+.025,.82,-2.468],[x+.025,3.1,-2.468],.003,putty);}
  for(const y of [.85,1.96,3.1])sashUV(box(2.4,.055,.12,sash,[-1.25,y,-2.54]),true);
  for(const x of [-2.42,-1.25,-.08])for(const y of [.87,1.94,3.07])bolt([x,y,-2.473],root,.006);
  const weather=paperTexture((c,w,h)=>{for(let i=0;i<170;i++){const x=hash(i,33)*w,y=hash(i,31)*h*.12,len=40+hash(i,32)*h*.82;const g=c.createLinearGradient(0,y,0,y+len);g.addColorStop(0,'rgba(37,43,29,.38)');g.addColorStop(1,'rgba(37,43,29,0)');c.fillStyle=g;c.fillRect(x,y,1+hash(i,34)*7,len);}for(let i=0;i<40;i++){const x=hash(i,41)*w,y=hash(i,42)*h;c.strokeStyle='rgba(40,44,31,.12)';c.lineWidth=.6;c.beginPath();c.moveTo(x,y);for(let j=0;j<6;j++)c.lineTo(x+(hash(i+j,43)-.5)*15,y+j*8);c.stroke();}},512,1024);
  const weatherMat=mat('#ffffff',0,1,{map:weather,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(const x of [-2.63,.14]){const stains=mesh(new THREE.PlaneGeometry(.23,2.3),weatherMat,[x,1.85,-2.533]);stains.castShadow=false;}
  const sillStain=mesh(new THREE.PlaneGeometry(2.28,.42),weatherMat,[-1.25,.55,-2.533]);sillStain.castShadow=false;
  box(.15,.035,.06,m.edge,[-1.22,1.93,-2.43]);rod([-1.27,1.92,-2.4],[-1.17,1.92,-2.4],.008,m.black);
  // Rolled blind and braided pull cord frame the opening without covering the light.
  const blind=cyl(.07,2.58,m.leather,[-1.25,3.13,-2.38]);blind.rotation.z=Math.PI/2;
  rod([.06,3.16,-2.34],[.06,1.8,-2.34],.003,m.paper);cyl(.012,.06,m.wood,[.06,1.78,-2.34]);
  const sea=mesh(new THREE.PlaneGeometry(130,100,128,96),oceanMaterial(),[0,-.6,-28]);sea.rotation.x=-Math.PI/2;sea.castShadow=false;
  const sky=mesh(new THREE.SphereGeometry(90,32,16),skyMaterial(),[0,0,0]);sky.castShadow=false;
  addCoastalHeadland(root);
  const launch=buildChannelLaunch(k);
  for(let i=0;i<9;i++){const rock=mesh(new THREE.IcosahedronGeometry(.7+hash(i,5)*1.3,2),m.stone,[-14+hash(i,7)*4,-.65,-18-hash(i,8)*4]);rock.scale.set(1.3,.35,.8);rock.rotation.y=hash(i,2)*6;}
  const island=mesh(new THREE.IcosahedronGeometry(2.6,2),m.stone,[-12,-.8,-20]);island.scale.set(1.1,.23,.8);
  // Distant lighthouse is a narrative reward, physically situated beyond the glass.
  const tower=new THREE.Group();tower.position.set(-12,-.5,-20);root.add(tower);
  const towerSkin=paperTexture((c,w,h)=>{c.fillStyle='#a2a79e';c.fillRect(0,0,w,h);c.fillStyle='#4b5d5c';c.fillRect(0,h*.23,w,h*.13);for(let j=0;j<30;j++){const y=j*h/30;c.strokeStyle='rgba(52,61,55,.23)';c.lineWidth=1;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();for(let x=(j%2)*48;x<w;x+=96){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h/30);c.stroke();}}for(let i=0;i<180;i++){const x=hash(i,63)*w,y=hash(i,64)*h*.75,len=30+hash(i,65)*170;const g=c.createLinearGradient(0,y,0,y+len);g.addColorStop(0,'rgba(42,53,44,.17)');g.addColorStop(1,'rgba(42,53,44,0)');c.fillStyle=g;c.fillRect(x,y,1+hash(i,66)*7,len);}},512,1024);
  cyl(.45,4.8,mat('#ffffff',0,.91,{map:towerSkin}),[0,2.4,0],tower,.77);cyl(.78,.14,m.black,[0,4.82,0],tower);
  const balcony=ring(.75,.018,m.steel,[0,5.17,0],tower);balcony.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;rod([Math.sin(a)*.75,4.86,Math.cos(a)*.75],[Math.sin(a)*.75,5.17,Math.cos(a)*.75],.015,m.steel,tower);}
  for(const y of [1.6,3.4]){
    const a=.54,r=.77-(y/4.8)*.32+.006,windowG=new THREE.Group();windowG.position.set(Math.sin(a)*r,y,Math.cos(a)*r);windowG.rotation.y=a;tower.add(windowG);
    box(.21,.34,.035,m.stone,[0,0,0],windowG,.025);box(.125,.23,.012,m.black,[0,.015,.025],windowG,.016);box(.24,.035,.08,m.stone,[0,-.17,.025],windowG,.005);
  }
  // A service door and foundation course give the distant landmark a human scale.
  const doorG=new THREE.Group();doorG.rotation.y=.54;doorG.position.set(Math.sin(.54)*.75,.36,Math.cos(.54)*.75);tower.add(doorG);box(.3,.65,.04,m.black,[0,0,0],doorG,.035);box(.35,.045,.11,m.stone,[0,-.32,.03],doorG);
  mesh(new THREE.CylinderGeometry(.4,.4,.75,32,1,true),new THREE.MeshPhysicalMaterial({color:'#aec2bd',transparent:true,opacity:.12,roughness:.12,side:THREE.DoubleSide}),[0,5.22,0],tower);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([Math.sin(a)*.42,4.9,Math.cos(a)*.42],[Math.sin(a)*.42,5.6,Math.cos(a)*.42],.025,m.steel,tower);}
  cyl(.05,.35,m.black,[0,5.7,0],tower,.75);const beaconMat=mat('#bac5ae',.1,.3,{emissive:'#ffd99a',emissiveIntensity:0});cyl(.33,.58,beaconMat,[0,5.2,0],tower);
  const haloTexture=paperTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,226,159,.5)');g.addColorStop(.12,'rgba(255,213,128,.18)');g.addColorStop(1,'rgba(255,197,111,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},256,256);
  const beaconHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));beaconHalo.position.set(-12,4.7,-20);beaconHalo.scale.set(4,4,1);root.add(beaconHalo);
  const beaconLight=new THREE.PointLight('#ffd492',0,55,1.5);beaconLight.position.set(-12,4.7,-20);root.add(beaconLight);
  const glassMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;float hash(float p){return fract(sin(p*127.1)*43758.5453);}void main(){vec2 q=v*vec2(94.,61.);vec2 cell=floor(q),f=fract(q)-.5;float rnd=hash(cell.x+cell.y*73.);f.x+=sin(cell.y*.6)*.08;float d=length(f*vec2(1.5,2.4));float drop=(1.-smoothstep(.15,.19,d))*step(.64,rnd);float edge=smoothstep(.08,.18,d)*drop;float id=floor(v.x*65.);float x=fract(v.x*65.)-.5+sin(v.y*13.+id)*.04;float y=fract(v.y*1.7+time*.045+hash(id)*8.);float trail=exp(-abs(x)*95.)*smoothstep(.08,.75,y)*step(.88,hash(id));float mist=pow(abs(v.x-.5)*2.,6.)*.05;gl_FragColor=vec4(vec3(.49,.65,.7)+edge*.15,.018+edge*.16+drop*.035+trail*.22+mist);}`});
  const pane=mesh(new THREE.PlaneGeometry(2.34,2.24),rainGlassMaterial(),[-1.25,1.97,-2.521]);pane.castShadow=false;
  const glass=mesh(new THREE.PlaneGeometry(2.34,2.24),glassMat,[-1.25,1.97,-2.518]);glass.castShadow=false;
  const rainGeo=new THREE.BufferGeometry(),rainPos=new Float32Array(800*6);
  for(let i=0;i<800;i++){const x=-5+hash(i,10)*8,y=hash(i,11)*9,z=-3-hash(i,12)*10;rainPos.set([x,y,z,x-.035,y+.18,z],i*6);}
  rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#9abfcb',transparent:true,opacity:.12,depthWrite:false}));root.add(rain);
  // Storage is kept quiet and recessive; its density supports the hero rather than competing.
  const shelf=new THREE.Group();shelf.position.set(2.35,0,-2.32);root.add(shelf);
  box(1.2,2.7,.06,m.wood,[0,1.35,-.24],shelf);for(const x of [-.6,.6])box(.065,2.72,.5,m.wood,[x,1.36,0],shelf);
  for(const y of [.16,.86,1.55,2.24,2.73])box(1.26,.065,.55,m.wood,[0,y,0],shelf);
  for(let row=0;row<3;row++)for(let j=0;j<8;j++){
    const h=.29+hash(j,row)*.22,g=new THREE.Group();g.position.set(-.5+j*.13,.91+row*.69+h/2,0);g.rotation.z=(hash(j,row+8)-.5)*.06;shelf.add(g);
    const cover=mat(['#323e35','#4b352b','#303c45','#63513b'][j%4],0,.8);
    box(.09,h,.3,cover,[0,0,0],g);box(.07,h*.93,.27,m.paper,[0,0,-.018],g);box(.094,h,.017,cover,[0,0,.15],g);
    for(const y of [-h*.34,h*.34])box(.095,.008,.003,m.edge,[0,y,.16],g);
  }
  const panel=new THREE.Group();panel.position.set(.64,2.16,-2.49);root.add(panel);box(1.04,.78,.055,m.wood,[0,0,0],panel);
  const chart=tideRecord();
  mesh(new THREE.PlaneGeometry(.94,.67),mat('#ffffff',0,.95,{map:chart}),[0,0,.031],panel);
  addStormBarometer(k);
  // Wall service conduit, clips, porcelain junction and a quiet practical lamp.
  rod([1.38,.1,-2.43],[1.38,3,-2.43],.014,m.black);rod([1.38,3,-2.43],[2,3,-2.43],.014,m.black);
  for(let y=.3;y<3;y+=.45)box(.07,.018,.025,m.steel,[1.38,y,-2.42]);
  const sconce=mesh(new THREE.SphereGeometry(.085,24,12),mat('#ecd8b2',0,.4,{emissive:'#ffbc6c',emissiveIntensity:1.3}),[1.83,2.95,-2.28]);
  cyl(.16,.07,m.enamel,[1.83,3.03,-2.28],root,.08);const practical=new THREE.PointLight('#ffbf76',3.2,4.4,2);practical.position.copy(sconce.position);root.add(practical);
  // Door and latch remain visible in reflections and secondary observation points.
  box(1.2,2.5,.08,m.wood,[1.8,1.25,3.36]);for(const x of [1.13,2.47])box(.1,2.65,.15,m.enamel,[x,1.325,3.3]);box(1.43,.1,.15,m.enamel,[1.8,2.64,3.3]);
  let beaconLevel=initialComplete?1:0,completionAge=initialComplete?4:0;
  beaconHalo.visible=initialComplete;launch.update(initialComplete?1:0);
  return {beaconMat,getEndingFeedback:()=>({beacon:beaconLevel,response:THREE.MathUtils.smoothstep(completionAge,1.6,2.8)}),reset(complete=false){beaconLevel=complete?1:0;completionAge=complete?4:0;launch.update(complete?1:0);},update(t,dt,complete){glassMat.uniforms.time.value=t;sea.material.uniforms.time.value=t;
    completionAge=complete?completionAge+dt:0;beaconLevel=THREE.MathUtils.damp(beaconLevel,complete?1:0,3.5,dt);
    beaconMat.emissiveIntensity=beaconLevel*6;beaconLight.intensity=beaconLevel*18;beaconHalo.visible=beaconLevel>.005;beaconHalo.material.opacity=beaconLevel;
    launch.update(complete?THREE.MathUtils.smoothstep(completionAge,1.6,2.8):0);
    for(let i=0;i<800;i++){const j=i*6,dy=dt*(2+hash(i,10)*2);rainPos[j+1]-=dy;rainPos[j+4]-=dy;if(rainPos[j+1]<-1){rainPos[j+1]+=10;rainPos[j+4]+=10;}}rainGeo.attributes.position.needsUpdate=true;}};
}
