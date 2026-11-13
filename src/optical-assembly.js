import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

function carrierPlate(width,height,hole,depth){
  const s=new THREE.Shape(),x=width/2,y=height/2,c=.024;
  s.moveTo(-x+c,-y);s.lineTo(x-c,-y);s.lineTo(x,-y+c);s.lineTo(x,y-c);s.lineTo(x-c,y);s.lineTo(-x+c,y);s.lineTo(-x,y-c);s.lineTo(-x,-y+c);s.closePath();
  const aperture=new THREE.Path();aperture.absarc(0,0,hole,0,Math.PI*2,true);s.holes.push(aperture);
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2,steps:1,curveSegments:48});
}

export function buildMirrorCarrier(k,pivot){
  const {mesh,box,cyl,rod,ring,knob,plate,m}=k;
  // A front and rear carrier, separated by spring-loaded fine screws. The yaw bearing remains below.
  mesh(carrierPlate(.33,.33,.126,.014),m.enamel,[0,0,-.021],pivot);
  mesh(carrierPlate(.32,.32,.128,.011),m.black,[0,0,-.064],pivot);
  ring(.126,.0035,m.edge,[0,0,.002],pivot);
  const mirror=new Reflector(new THREE.CircleGeometry(.121,96),{textureWidth:768,textureHeight:768,color:0x9faeac,clipBias:.003});mirror.position.z=.002;pivot.add(mirror);
  for(const [x,y] of [[-.143,.143],[.143,.143],[.143,-.143]]){
    rod([x,y,-.078],[x,y,.035],.0045,m.steel,pivot);
    const spring=[];for(let i=0;i<=100;i++){const t=i/100,a=t*Math.PI*12;spring.push(new THREE.Vector3(x+Math.cos(a)*.008,y+Math.sin(a)*.008,-.053+t*.032));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spring),100,.0013,5,false),m.steel,[0,0,0],pivot);
    knob([x,y,.025],pivot,.016);
  }
  // Short trunnions and substantial cheeks distinguish this from a freestanding household mirror.
  for(const x of [-.184,.184]){
    box(.035,.18,.064,m.enamel,[x,-.134,-.035],pivot,.006);
    const bearing=cyl(.029,.038,m.brass,[x,-.035,-.035],pivot);bearing.rotation.z=Math.PI/2;
    const cap=cyl(.018,.044,m.steel,[x,-.035,-.035],pivot);cap.rotation.z=Math.PI/2;
  }
  box(.395,.025,.095,m.enamel,[0,-.224,-.035],pivot,.008);
  cyl(.028,.12,m.steel,[0,-.19,-.035],pivot);
  plate('N.C.  /  REFLECTOR IV',.22,.022,[0,-.15,-.004],pivot,{font:42,bg:'#263a35',fg:'#bdb28e'});
  return mirror;
}

export function buildReceiverHousing(k,group){
  const {box,cyl,rod,bolt,plate,m}=k;
  // A wooden optical chamber with a recessed ground-glass back and a shallow glare hood.
  box(.62,.59,.19,m.wood,[0,.14,-.05],group,.009);
  for(const x of [-.282,.282])box(.022,.546,.012,m.enamel,[x,.14,.052],group,.003);
  for(const y of [-.135,.416])box(.58,.022,.012,m.enamel,[0,y,.052],group,.003);
  for(const x of [-.286,.286])for(const y of [-.135,.416])bolt([x,y,.061],group,.005);
  // The hood leaves the optical inlet and all symbols unobstructed at the fixed observation point.
  box(.65,.015,.125,m.black,[0,.443,.09],group,.004);
  for(const x of [-.318,.318])box(.014,.38,.1,m.black,[x,.25,.09],group,.004);
  for(const x of [-.304,.304]){
    box(.018,.12,.14,m.black,[x,-.065,-.055],group,.003);
    for(const y of [-.09,.03])bolt([x,y,.04],group,.004);
  }
  // Sliding feet on a rigid cross-brace, with collar clamps and levelling screws.
  for(const x of [-.19,.19]){
    cyl(.027,.045,m.enamel,[x,-.19,0],group);
    rod([x,-.155,0],[x,-.34,0],.017,m.steel,group);
    const clamp=cyl(.011,.032,m.brass,[x,-.19,.038],group);clamp.rotation.x=Math.PI/2;
  }
  box(.56,.03,.3,m.enamel,[0,-.325,0],group,.009);
  for(const x of [-.225,.225])for(const z of [-.11,.11])cyl(.018,.013,m.steel,[x,-.344,z],group);
  plate('GROUND GLASS  /  IV',.23,.021,[0,.404,.066],group,{font:37,bg:'#263a35',fg:'#c4bb98'});
}
