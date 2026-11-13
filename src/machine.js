import * as THREE from 'three';
import {addArchiveDetails} from './workshop-patina.js';
import {buildMirrorCarrier,buildReceiverHousing} from './optical-assembly.js';
import {keeperLetterTexture,buildKeeperLetter} from './keeper-letter.js';
import {createBeamTracer,beamMaterial,spotMaterial,placeSurfaceSpot} from './beam-surface.js';
import {buildArchiveCase,addDrumGrip} from './archive-case.js';
import {benchSurface,benchUV} from './bench-surface.js';
import {drumMotion} from './mechanical-motion.js';
import {PLATE_SYMBOLS,projectionAppearance,drawPlateNegative} from './optical-presentation.js';
import {paperTexture,hash} from './craft.js';
import {SYMBOLS,opticalReading} from './puzzle.js';

export function buildMachine(k,scene,state){
  const{root,mesh,box,cyl,ring,rod,bolt,plate,knob,cable,m,mat}=k;
  const dynamic=[],targets=[];
  function control(obj,data){obj.userData.control=data;targets.push(obj);dynamic.push(obj);return obj;}
  function stationHit(p,size,station){const o=box(...size,new THREE.MeshBasicMaterial({visible:false}),p);control(o,{station,action:'none'});}
  // Five full-length boards share an atlas with separate grain and a worn working edge.
  const benchFinish=benchSurface();
  for(let i=0;i<5;i++)benchUV(box(3.05,.1,.273,benchFinish,[0,.88,-.61+i*.277],root,.012));
  box(3.12,.035,1.43,m.black,[0,.815,-.06]);benchUV(box(3.06,.15,.06,benchFinish,[0,.76,.64]));
  for(const x of [-1.36,1.36])for(const z of [-.62,.5]){box(.095,.8,.095,m.wood,[x,.4,z]);cyl(.07,.07,m.black,[x,.045,z]);}
  plate('北 岬 灯 塔   /   光 学 值 守 台',.72,.075,[0,.76,.674],root,{font:38});
  // The lamp is an actual work light, with enamel shade, porcelain socket and articulated arm.
  const lamp=new THREE.Group();lamp.position.set(1.32,.94,-.17);root.add(lamp);
  cyl(.15,.035,m.enamel,[0,0,0],lamp);cyl(.045,.05,m.edge,[0,.03,0],lamp);
  rod([0,.05,0],[.02,.44,0],.013,m.steel,lamp);rod([.02,.44,0],[-.22,.72,.02],.013,m.steel,lamp);
  for(const p of [[.02,.44,.01],[-.22,.72,.02]]){const joint=cyl(.032,.045,m.enamel,p,lamp);joint.rotation.x=Math.PI/2;bolt([p[0],p[1],p[2]+.025],lamp);}
  const shade=mesh(new THREE.CylinderGeometry(.065,.19,.14,48,1,true),new THREE.MeshStandardMaterial({color:'#294b40',roughness:.36,metalness:.35,side:THREE.DoubleSide}),[-.22,.67,.02],lamp);shade.rotation.z=-.22;
  const inner=mesh(new THREE.CircleGeometry(.173,48),mat('#e3d7b5',0,.7),[-.235,.603,.02],lamp);inner.rotation.x=Math.PI/2;
  const bulb=mesh(new THREE.SphereGeometry(.035,24,12),mat('#ffdb9c',0,.3,{emissive:'#ffd49b',emissiveIntensity:3}),[-.23,.59,.02],lamp);dynamic.push(bulb);
  const light=new THREE.PointLight('#ffd6a0',.9,3.5,2);light.position.set(1.08,1.49,-.15);scene.add(light);
  cable([[1.32,.94,-.17],[1.43,.94,-.3],[1.5,.94,-.5],[1.53,.88,-.62],[1.55,.2,-.62],[1.4,.04,-1]]);
  // A rigid optical rail with dovetail carriages, slotted feet and engraved index.
  box(1.87,.065,.34,m.enamel,[-.34,.98,.08],root,.018);
  for(const z of [-.03,.19])rod([-1.22,1.03,z],[.52,1.03,z],.013,m.steel);
  for(const x of [-1.2,.52])for(const z of [-.06,.22])bolt([x,1.012,z]);
  const scale=paperTexture((c,w,h)=>{c.fillStyle='#a99361';c.fillRect(0,0,w,h);c.strokeStyle='#393b2d';c.fillStyle='#252e28';c.font='28px Georgia';for(let i=0;i<100;i++){let x=20+i*(w-40)/100;c.lineWidth=1;c.beginPath();c.moveTo(x,2);c.lineTo(x,i%10===0?32:18);c.stroke();if(i%10===0)c.fillText(String(i),x,67);}},1600,90);
  mesh(new THREE.PlaneGeometry(1.7,.08),mat('#ffffff',.5,.5,{map:scale}),[-.35,.988,.253]);
  // Lamp barrel along X. Ring variation, mount seams, cooling fins, screw heads and braided wire.
  const source=new THREE.Group();source.position.set(-1.02,1.28,.12);root.add(source);
  const xc=(r,len,material,x)=>{const o=cyl(r,len,material,[x,0,0],source);o.rotation.z=Math.PI/2;return o;};
  box(.24,.04,.28,m.enamel,[0,-.22,0],source);rod([0,-.2,0],[0,-.08,0],.025,m.edge,source);
  xc(.115,.34,m.enamel,-.05);for(let i=0;i<12;i++){xc(.124,.005,m.black,-.19+i*.014);xc(.125,.0012,m.steel,-.19+i*.014);}
  xc(.102,.08,m.brass,.15);xc(.106,.012,m.edge,.185);xc(.072,.03,m.black,.203);
  const lensMat=mat('#97c5c9',.3,.15,{emissive:'#ffe7bd',emissiveIntensity:0});const lens=mesh(new THREE.CircleGeometry(.058,64),lensMat,[.22,0,0],source);lens.rotation.y=Math.PI/2;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;const b=cyl(.005,.009,m.steel,[.193,Math.sin(a)*.085,Math.cos(a)*.085],source,.005,6);b.rotation.z=Math.PI/2;}
  plate('N.C. / 04',.11,.035,[0,.03,.116],source,{font:72});
  cable([[-1.2,1.25,.12],[-1.35,1.04,.2],[-1.36,.94,.48],[-1.08,.94,.52]]);
  // Reachable toggle with two detents. The label is in the world rather than an overlay.
  const powerGroup=new THREE.Group();powerGroup.position.set(-1.06,.955,.48);root.add(powerGroup);
  box(.28,.035,.17,m.enamel,[0,0,0],powerGroup);
  const lever=new THREE.Group();lever.position.set(0,.025,0);powerGroup.add(lever);rod([0,0,0],[0,.075,0],.008,m.steel,lever);mesh(new THREE.SphereGeometry(.016,20,12),m.paper,[0,.075,0],lever);
  control(powerGroup,{action:'power',available:n=>n!=='note'&&n!=='lock'});dynamic.push(lever);
  plate('电源  /  I · O',.26,.065,[-1.06,.938,.61],root,{font:48,rotation:-Math.PI/2});
  // Goniometer with a compact, spring-loaded optical carrier.
  const center=new THREE.Vector3(-.23,1.28,.12);
  cyl(.255,.035,m.black,[-.23,.962,.12]);cyl(.237,.025,m.enamel,[-.23,.992,.12]);cyl(.218,.008,m.brass,[-.23,1.008,.12]);
  for(let i=0;i<100;i++){const a=i*Math.PI/50;const tooth=box(.008,.017,.012,m.brass,[-.23+Math.sin(a)*.235,.994,.12+Math.cos(a)*.235]);tooth.rotation.y=a;}
  const dialTex=paperTexture((c,w,h)=>{c.fillStyle='#a89a73';c.fillRect(0,0,w,h);c.translate(w/2,h/2);c.strokeStyle='#3d4133';c.fillStyle='#2e382e';for(const r of [480,450,360]){c.beginPath();c.arc(0,0,r,0,7);c.stroke();}for(let i=0;i<180;i++){c.save();c.rotate(i*Math.PI/90);c.lineWidth=i%5===0?2:1;c.beginPath();c.moveTo(0,-450);c.lineTo(0,i%5===0?-402:-428);c.stroke();if(i%15===0){c.font='26px Georgia';c.textAlign='center';c.fillText(String(i*2),0,-370);}c.restore();}},1024,1024);
  const dial=mesh(new THREE.CircleGeometry(.212,96),mat('#ffffff',.4,.65,{map:dialTex}),[-.23,1.014,.12]);dial.rotation.x=-Math.PI/2;
  const mirrorPivot=new THREE.Group();mirrorPivot.position.copy(center);root.add(mirrorPivot);dynamic.push(mirrorPivot);
  const pointer=box(.006,.003,.16,m.black,[0,-.26,.11],mirrorPivot);box(.016,.005,.024,m.edge,[0,-.259,.196],mirrorPivot);
  buildMirrorCarrier(k,mirrorPivot);
  const turnWheel=knob([-.23,1.055,.46],root,.06);control(turnWheel,{station:'optics',kind:'drag',action:'angle',sensitivity:.13,wheel:.35});
  rod([-.23,1.055,.41],[-.23,1.055,.18],.013,m.steel);
  const thread=[];for(let i=0;i<=420;i++){const t=i/420,a=t*Math.PI*28;thread.push(new THREE.Vector3(-.23+Math.cos(a)*.021,1.055+Math.sin(a)*.021,.25+t*.126));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(thread),420,.0024,6,false),m.brass);
  for(const z of [.247,.383]){box(.09,.065,.028,m.enamel,[-.23,1.045,z]);const bearing=ring(.026,.005,m.edge,[-.23,1.055,z+.015]);for(const x of [-.266,-.194])bolt([x,1.065,z+.016],root,.004);}
  plate('01   方 位',.24,.055,[-.23,.94,.58],root,{rotation:-Math.PI/2,font:56});
  control(mirrorPivot,{station:'optics',kind:'drag',action:'angle',sensitivity:.13,wheel:.35});
  // The receiving chamber and ground glass screen. A small focus knob moves a real lens carriage.
  const screenG=new THREE.Group();screenG.position.set(.75,1.28,-.62);screenG.rotation.y=-.72;root.add(screenG);
  buildReceiverHousing(k,screenG);
  box(.47,.37,.015,m.black,[0,.21,.052],screenG);
  const projectionCanvas=document.createElement('canvas');projectionCanvas.width=900;projectionCanvas.height=700;const projectionTexture=new THREE.CanvasTexture(projectionCanvas);projectionTexture.colorSpace=THREE.SRGBColorSpace;
  const projectionMat=mat('#ffffff',0,.83,{map:projectionTexture,emissive:'#d8edc9',emissiveMap:projectionTexture,emissiveIntensity:0});
  mesh(new THREE.PlaneGeometry(.44,.3422),projectionMat,[0,.21,.062],screenG);
  const aperture=cyl(.043,.065,m.brass,[0,0,.083],screenG);aperture.rotation.x=Math.PI/2;
  const focusCollar=cyl(.048,.017,m.black,[0,0,.08],screenG);focusCollar.rotation.x=Math.PI/2;dynamic.push(focusCollar);for(let i=0;i<32;i++){const a=i*Math.PI/16;rod([Math.sin(a)*.048,Math.cos(a)*.048,.075],[Math.sin(a)*.048,Math.cos(a)*.048,.086],.001,m.steel,screenG);}
  const apertureFace=mesh(new THREE.CircleGeometry(.031,48),m.black,[0,0,.118],screenG);
  const focusWheel=knob([.27,-.09,.11],screenG,.034);control(focusWheel,{station:'optics',kind:'drag',action:'focus',sensitivity:.36,wheel:1});
  plate('02  调 焦',.17,.041,[.17,-.112,.062],screenG,{font:68});
  control(screenG,{station:'optics',action:'none'});
  // A glass negative slot with a real retaining clip and a translucent plate at its edge.
  box(.32,.018,.07,m.black,[.21,1.18,-.2]);const negative=paperTexture(drawPlateNegative,512,420);
  const slideGlass=mesh(new THREE.BoxGeometry(.22,.15,.003),new THREE.MeshPhysicalMaterial({color:'#9caea5',roughness:.12,transmission:.45,thickness:.006,map:negative}),[.21,1.26,-.2]);
  for(const x of [.095,.325])box(.008,.17,.012,m.brass,[x,1.26,-.2]);box(.23,.012,.012,m.brass,[.21,1.345,-.2]);plate('底片 IV',.10,.025,[.21,1.33,-.193],root,{font:84});
  // The cipher box: not an arbitrary numerical keypad. Three segmented drums match the projected symbols.
  const lock=new THREE.Group();lock.position.set(.77,1.045,.39);root.add(lock);
  buildArchiveCase(k,lock);
  for(const z of [-.19,.19])box(.9,.003,.008,m.brass,[0,.106,z],lock);for(const x of [-.45,.45])box(.008,.003,.38,m.brass,[x,.106,0],lock);
  for(const x of [-.43,.43])for(const y of [-.06,.06])bolt([x,y,.203],lock,.006);
  addArchiveDetails(k,lock);
  const drums=[],drumRotation=drumMotion(state.rings);
  for(let i=0;i<3;i++){
    const g=new THREE.Group();g.position.set(-.235+i*.235,.075,.045);lock.add(g);drums.push(g);dynamic.push(g);
    const drumTexture=paperTexture((c,w,h)=>{c.fillStyle='#a6956c';c.fillRect(0,0,w,h);for(let j=0;j<6;j++){c.save();c.translate((j+.5)*w/6,h/2);c.rotate(Math.PI/2);c.fillStyle='#273a32';c.textAlign='center';c.textBaseline='middle';c.font='210px "Segoe UI Symbol",Georgia';c.fillText(SYMBOLS[j],0,0);c.restore();c.strokeStyle='#645c44';c.lineWidth=4;c.strokeRect(j*w/6+7,18,w/6-14,h-36);}for(let j=0;j<900;j++){c.fillStyle=`rgba(39,31,15,${hash(j,11)*.11})`;c.fillRect(hash(j,14)*w,hash(j,15)*h,1,1);}},2048,512);
    const drum=cyl(.075,.13,[mat('#ffffff',.78,.49,{map:drumTexture}),m.brass,m.brass],[0,0,0],g);drum.rotation.z=Math.PI/2;
    addDrumGrip(k,g);
    const click=box(.15,.18,.19,new THREE.MeshBasicMaterial({visible:false}),[-.235+i*.235,.075,.045],lock);
    control(click,{station:'lock',action:'ring',value:{index:i,step:1}});
    box(.008,.01,.014,m.black,[-.235+i*.235,.11,.127],lock); // index marker
  }
  plate('由 上 至 下  ·  从 左 到 右',.64,.048,[0,-.04,.204],lock,{font:39});
  const latch=knob([.37,.025,.221],lock,.029);control(latch,{station:'lock',action:'latch'});
  box(.0025,.012,.0015,m.edge,[0,.014,.024],latch,.0005); // visible index follows the unlocking turn
  const indicatorMat=mat('#42291c',.1,.35,{emissive:'#ff702e',emissiveIntensity:0});const indicator=mesh(new THREE.SphereGeometry(.009,16,8),indicatorMat,[.37,.069,.205],lock);
  const lid=new THREE.Group();lid.position.set(0,-.09,.16);lock.add(lid);box(.77,.045,.32,m.wood,[0,0,-.12],lid,.01);box(.77,.05,.025,m.enamel,[0,0,.047],lid);
  for(const x of [-.378,.378])box(.014,.04,.31,m.wood,[x,.04,-.12],lid,.003);
  box(.75,.04,.014,m.wood,[0,.04,-.272],lid,.003);box(.75,.035,.012,m.wood,[0,.025,.035],lid,.003);dynamic.push(lid);
  const keyGroup=new THREE.Group();keyGroup.position.set(0,-.060,.11);keyGroup.rotation.x=-Math.PI/2;lock.add(keyGroup);ring(.035,.007,m.brass,[0,0,0],keyGroup);rod([.03,0,0],[.15,0,0],.008,m.brass,keyGroup);for(const x of [.12,.145])box(.012,.028,.016,m.brass,[x,-.01,0],keyGroup);
  control(keyGroup,{station:'lock',action:'key',available:()=>state.unlocked&&!state.key&&drawer>.16});
  // Picking a key includes its ring opening; players should not need pixel-precise metal hits.
  box(.205,.085,.032,new THREE.MeshBasicMaterial({visible:false}),[.06,0,0],keyGroup,0);
  plate('03   信 号 锁',.4,.055,[.77,.94,.66],root,{rotation:-Math.PI/2,font:48});
  control(lock,{station:'lock',action:'none'});
  // Final key switch is visibly keyed, not another mystery control.
  const beaconSwitch=new THREE.Group();beaconSwitch.position.set(-.75,.98,-.42);root.add(beaconSwitch);box(.27,.1,.2,m.enamel,[0,0,0],beaconSwitch);
  const keyhole=mesh(new THREE.CircleGeometry(.018,32),m.black,[0,.012,.104],beaconSwitch);ring(.032,.005,m.brass,[0,.012,.105],beaconSwitch);
  const inserted=new THREE.Group();inserted.position.set(0,.012,.13);beaconSwitch.add(inserted);rod([0,0,-.03],[0,0,.04],.008,m.brass,inserted);
  const keyBow=ring(.035,.006,m.brass,[0,0,.075],inserted);keyBow.rotation.x=Math.PI/2;dynamic.push(inserted);
  plate('灯 塔 主 闸',.23,.035,[0,-.028,.105],beaconSwitch,{font:58});control(beaconSwitch,{station:'optics',action:'beacon'});
  // A readable opening letter and maintenance card: all narrative and hints are physical objects.
  const noteTex=keeperLetterTexture();
  const note=buildKeeperLetter(k,noteTex);note.rotation.set(-Math.PI/2,0,-.1);
  // Put the letter forward of the rail, clear of the lamp controls.
  note.position.set(-.77,.946,.34);note.scale.setScalar(.72);control(note,{station:'note',action:'none'});
  const hintTex=paperTexture((c,w,h)=>{c.fillStyle='#7d5140';c.fillRect(0,0,w,h);c.fillStyle='#ddd0ad';c.textAlign='center';c.font='36px "Microsoft YaHei"';c.fillText('维护备忘',w/2,65);c.font='24px "Microsoft YaHei"';c.fillText('需要时翻阅',w/2,110);},500,160);
  const hint=mesh(new THREE.PlaneGeometry(.30,.096),mat('#ffffff',0,.9,{map:hintTex}),[-.81,.949,.61]);hint.rotation.x=-Math.PI/2;control(hint,{station:'note',action:'hint'});
  // Small support props with deliberate spacing and material contrast.
  for(let i=0;i<2;i++){box(.39,.055,.25,m.paper,[-1.18,1.0+i*.066,-.43]);box(.4,.008,.26,m.leather,[-1.18,1.03+i*.066,-.43]);}
  rod([-.65,.948,-.55],[-.25,.948,-.58],.006,m.edge);rod([-.65,.948,-.55],[-.43,.948,-.39],.006,m.steel);
  for(let i=0;i<4;i++)ring(.014+i*.001,.002,m.brass,[.3+hash(i,2)*.2,.95,.46+hash(i,5)*.12]).rotation.x=-Math.PI/2;
  const cup=cyl(.066,.11,m.enamel,[-1.34,1.0,-.03],root,.06);ring(.066,.003,m.edge,[-1.34,1.055,-.03]).rotation.x=-Math.PI/2;ring(.038,.008,m.enamel,[-1.42,1.0,-.03]).rotation.y=Math.PI/2;
  // Photometric beam: a narrow core and very faint envelope, not an opaque laser rod.
  const beams=[];const beamMat=beamMaterial();
  for(let i=0;i<2;i++){const b=mesh(new THREE.CylinderGeometry(.006,.006,1,20,1,true),beamMat,[0,0,0]);b.castShadow=false;beams.push(b);dynamic.push(b);}
  function segment(b,a,end){b.position.copy(a).add(end).multiplyScalar(.5);b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(a).normalize());b.scale.y=a.distanceTo(end);}
  const spot=mesh(new THREE.PlaneGeometry(2,2),spotMaterial(),[0,0,0]);spot.castShadow=false;dynamic.push(spot);
  const traceBeam=createBeamTracer(root,[mirrorPivot]),beamDirection=new THREE.Vector3();let lastBeamKey='',beamTrace=null;
  let lastProjection='',drawer=state.unlocked?.25:0,rejectTime=0,beaconRejectTime=0,latchAngle=state.unlocked?-.72:0,keyAngle=state.complete?-Math.PI/2:0,currentStation='overview';
  let drawerSoundPlayed=state.unlocked;const soundEvents=[];
  const hints=['','先接通左侧电源。转动「方位」，让光进入接收孔。','屏幕亮起后调焦。清晰的三个记号，由上至下读取。','三只转轮对应上、中、下的记号。按右侧锁扣确认。'];
  function drawProjection(read){const key=[read.lit,Math.round(read.sharpness*24),Math.round(read.alignment*24),state.hint,state.complete].join('/');if(key===lastProjection)return;lastProjection=key;
    const appearance=projectionAppearance(read);
    const c=projectionCanvas.getContext('2d'),w=900,h=700;c.fillStyle=`rgb(${appearance.background.join(',')})`;c.fillRect(0,0,w,h);
    const falloff=c.createRadialGradient(w*.5,h*.5,60,w*.5,h*.5,570);falloff.addColorStop(0,'rgba(255,244,205,.08)');falloff.addColorStop(1,'rgba(34,39,24,.25)');c.fillStyle=falloff;c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(62,77,55,.17)';c.lineWidth=1;for(let x=45;x<w;x+=90){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=35;y<h;y+=70){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    if(read.lit){c.save();c.filter=`blur(${appearance.blur}px)`;c.globalAlpha=appearance.inkOpacity;c.fillStyle='#10231c';c.textAlign='center';c.font='30px Georgia';c.fillText('PLATE IV  /  NORTH CAPE',w/2,70);c.font='175px "Segoe UI Symbol",Georgia';PLATE_SYMBOLS.forEach((s,i)=>c.fillText(s,w/2,245+i*170));c.font='22px "Microsoft YaHei"';c.fillText('上 → 下',w/2,660);c.restore();}
    else{c.fillStyle='rgba(37,51,35,.45)';c.textAlign='center';c.font='22px Georgia';c.fillText('IV  ·  N.C.',450,660);}projectionTexture.needsUpdate=true;
  }
  function update(dt){const read=opticalReading(state);mirrorPivot.rotation.y=state.angle*Math.PI/180;turnWheel.rotation.z=-state.angle*.17;focusWheel.rotation.z=-state.focus*.09;focusCollar.position.z=.075+state.focus*.0003;lever.rotation.x=state.power?-.5:.5;
    lensMat.emissiveIntensity=state.power?3:0;projectionMat.emissiveIntensity=projectionAppearance(read).illumination*.65;beams.forEach(b=>b.visible=state.power);spot.visible=false;
    const beamKey=[state.angle,state.focus,state.power,currentStation,state.unlocked,state.key].join('/');
    if(state.power){beamDirection.set(read.direction.x,0,read.direction.z);if(beamKey!==lastBeamKey){beamTrace=traceBeam(center,beamDirection);lastBeamKey=beamKey;}segment(beams[0],new THREE.Vector3(-.8,1.28,.12),center);segment(beams[1],center,beamTrace.point);placeSurfaceSpot(spot,beamTrace,beamDirection);}else lastBeamKey='';
    drumRotation.update(dt);drums.forEach((g,i)=>g.rotation.x=drumRotation.angles[i]);
    rejectTime=Math.max(0,rejectTime-dt);beaconRejectTime=Math.max(0,beaconRejectTime-dt);
    latchAngle=THREE.MathUtils.damp(latchAngle,state.unlocked?-.72:0,14,dt);
    indicatorMat.emissiveIntensity=rejectTime>0?2:state.unlocked?.3:0;latch.rotation.z=latchAngle+(rejectTime>0?Math.sin(rejectTime*60)*.08:0);
    drawer=THREE.MathUtils.damp(drawer,state.unlocked&&Math.abs(latchAngle)>.5?.25:0,4,dt);lid.position.z=.16+drawer;keyGroup.position.z=.11+drawer;keyGroup.visible=state.unlocked&&!state.key;inserted.visible=state.key;
    if(!drawerSoundPlayed&&drawer>.001){drawerSoundPlayed=true;soundEvents.push('drawer');}
    keyAngle=THREE.MathUtils.damp(keyAngle,state.complete?-Math.PI/2:0,9,dt);inserted.rotation.z=keyAngle+(beaconRejectTime>0?Math.sin(beaconRejectTime*45)*.07:0);
    drawProjection(read);return read;
  }
  const noteStart=note.position.clone(),noteRot=note.rotation.clone();
  let hintMap;
  function setHint(n){if(hintMap)hintMap.dispose();hintMap=paperTexture((c,w,h)=>{c.fillStyle='#c0ad83';c.fillRect(0,0,w,h);c.fillStyle='#36483d';c.textAlign='center';c.font='30px "Microsoft YaHei"';c.fillText(n?'维护备忘  '+n+' / 3':'维护备忘 · 点击翻阅',w/2,48);c.font='23px "Microsoft YaHei"';const chunks=[['如果一时没有头绪，','可以在这里寻找提示。'],['先接通左侧电源，转动「方位」。','让光经过反射镜，进入接收孔。'],['屏幕亮起后调焦。','清晰的三个记号，由上至下读取。'],['三只转轮对应上、中、下的记号。','按右侧锁扣确认。']][n]||[];chunks.forEach((s,i)=>c.fillText(s,w/2,98+i*36));},700,210);hint.material.map=hintMap;hint.material.needsUpdate=true;}
  function setStation(n){currentStation=n;if(n==='note'){note.position.set(-.75,1.2,.65);note.rotation.set(-.36,-.08,-.035);note.scale.setScalar(1);hint.position.set(-.75,.89,.86);hint.rotation.set(-.5,0,0);hint.scale.set(1.6,1.6,1);}else{note.position.copy(noteStart);note.rotation.copy(noteRot);note.scale.setScalar(.72);hint.position.set(-.81,.949,.61);hint.rotation.set(-Math.PI/2,0,0);hint.scale.setScalar(1);}}
  setHint(state.hint);
  return {targets,dynamic,update,hints,noteTex,projectionTexture,control,setStation,setHint,getBeamTrace:()=>state.power?beamTrace:null,
    getMotion:()=>({drums:drumRotation.angles,targets:drumRotation.targets,latch:latch.rotation.z,key:keyAngle,drawer}),
    takeSoundEvents(){return soundEvents.splice(0);},
    reset(){drumRotation.reset(state.rings);drawer=state.unlocked?.25:0;latchAngle=state.unlocked?-.72:0;keyAngle=state.complete?-Math.PI/2:0;rejectTime=beaconRejectTime=0;drawerSoundPlayed=state.unlocked;soundEvents.length=0;lastProjection='';lastBeamKey='';update(0);},
    feedback(type,action,value){if(type==='tick'&&action==='ring')drumRotation.turn(value.index,value.step);if(type==='wrong')rejectTime=.5;if(type==='no-power')beaconRejectTime=.5;}};
}
