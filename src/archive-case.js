import * as THREE from 'three';

function roundedOutline(w,h,r,x=0,y=0,Path=THREE.Shape){
  const p=new Path(),a=x-w/2,b=y-h/2;
  p.moveTo(a+r,b);p.lineTo(a+w-r,b);p.quadraticCurveTo(a+w,b,a+w,b+r);
  p.lineTo(a+w,b+h-r);p.quadraticCurveTo(a+w,b+h,a+w-r,b+h);
  p.lineTo(a+r,b+h);p.quadraticCurveTo(a,b+h,a,b+h-r);
  p.lineTo(a,b+r);p.quadraticCurveTo(a,b,a+r,b);p.closePath();return p;
}

export function archiveLidGeometry(){
  const shape=roundedOutline(.95,.4,.018);
  for(const x of [-.235,0,.235])shape.holes.push(roundedOutline(.172,.18,.014,x,-.045,THREE.Path));
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2,curveSegments:6,steps:1});
  geo.rotateX(-Math.PI/2);return geo;
}

export function buildArchiveCase(k,lock){
  const {box,mesh,cyl,rod,m}=k;
  // Separate sheet-metal walls leave a mechanism well above the key drawer.
  for(const x of [-.46,.46])box(.02,.18,.39,m.enamel,[x,0,0],lock,.007);
  box(.92,.18,.018,m.enamel,[0,0,-.186],lock,.006);
  box(.92,.152,.018,m.enamel,[0,.011,.186],lock,.006);
  for(const x of [-.427,.427])box(.07,.078,.018,m.enamel,[x,-.05,.186],lock,.004);
  box(.92,.014,.37,m.black,[0,-.093,0],lock,.003);
  for(const x of [-.417,.417])for(const z of [-.153,.153])cyl(.018,.015,m.rubber,[x,-.107,z],lock,.018,24);
  box(.9,.009,.35,m.black,[0,-.012,0],lock,.002);
  mesh(archiveLidGeometry(),m.enamel,[0,.086,0],lock);
  // A continuous stationary spindle supports the rotating sleeves.
  rod([-.35,.075,.045],[.35,.075,.045],.008,m.steel,lock);
  for(const x of [-.235,0,.235]){
    const rim=roundedOutline(.194,.202,.018);
    rim.holes.push(roundedOutline(.172,.18,.014,0,0,THREE.Path));
    const lip=new THREE.ExtrudeGeometry(rim,{depth:.003,bevelEnabled:true,bevelThickness:.0008,bevelSize:.0008,bevelSegments:1,curveSegments:6,steps:1});lip.rotateX(-Math.PI/2);
    mesh(lip,m.black,[x,.105,.045],lock);
    for(const side of [-1,1]){
      const bx=x+side*.087;
      box(.023,.043,.052,m.black,[bx,.078,.045],lock,.006);
      const journal=cyl(.019,.021,m.brass,[bx,.075,.045],lock,.019,32);journal.rotation.z=Math.PI/2;
      box(.027,.007,.063,m.steel,[bx,.109,.045],lock,.003);
      for(const z of [.022,.068]){
        cyl(.0034,.0022,m.steel,[bx,.114,z],lock,.0034,12);
        box(.0045,.0008,.0009,m.black,[bx,.1155,z],lock,0);
      }
    }
  }
}

export function addDrumGrip(k,drum){
  for(const x of [-.071,.071]){
    const band=k.ring(.075,.003,k.m.brass,[x,0,0],drum);band.rotation.y=Math.PI/2;
    for(let i=0;i<36;i++){
      const a=i*Math.PI/18,y=Math.sin(a)*.077,z=Math.cos(a)*.077;
      k.rod([x-.003,y,z],[x+.003,y,z],.0012,k.m.steel,drum);
    }
  }
}
