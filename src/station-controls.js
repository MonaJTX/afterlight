import * as THREE from 'three';

// A stable first-person camera. Pointer movement never implicitly rotates or translates it.
export function stationControls({camera,canvas,targets,stations,onAction,onGesture,onStation,onPause}) {
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let current='overview',held=null,lastX=0,lastY=0,travel=0,next=null,paused=false;
  const fade=document.getElementById('fade');
  function applyStation(name){
    current=name;const s=stations[name];camera.position.set(...s.position);camera.lookAt(...s.look);
    const aspect=innerWidth/innerHeight;
    // Preserve horizontal framing on narrow windows instead of cropping the controls.
    camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(s.fov/2))*Math.max(1,1.45/aspect)));
    camera.aspect=aspect;camera.updateProjectionMatrix();canvas.dataset.station=name;onStation?.(name);
  }
  function go(name){if(!stations[name]||name===current||travel)return;held=null;next=name;travel=.28;fade.style.opacity='1';}
  function pick(e){pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);
    const hits=ray.intersectObjects(targets,true);for(const hit of hits){let o=hit.object;while(o&&!o.userData.control)o=o.parent;if(o?.userData.control){const c=o.userData.control;if(!c.available||c.available(current))return c;}}return null;}
  canvas.addEventListener('pointerdown',e=>{if(paused||travel)return;if(e.button!==0){if(e.button===2)go('overview');return;}canvas.focus();const c=pick(e);lastX=e.clientX;lastY=e.clientY;onGesture();
    if(c){if(c.station&&current!==c.station){go(c.station);return;}held=c;canvas.setPointerCapture(e.pointerId);if(c.kind!=='drag')onAction(c.action,c.value);}
    else if(e.button===2)go('overview');
  });
  canvas.addEventListener('pointermove',e=>{if(paused||travel)return;
    if(held?.kind==='drag'){const delta=(e.clientX-lastX)-(e.clientY-lastY)*.45;onAction(held.action,delta*held.sensitivity);}
    lastX=e.clientX;lastY=e.clientY;
    canvas.style.cursor=held?'grabbing':pick(e)?'pointer':'default';
  });
  function release(){held=null;}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);window.addEventListener('blur',release);
  canvas.addEventListener('wheel',e=>{if(paused||travel)return;const c=pick(e);if(!c)return;e.preventDefault();if(c.station&&c.station!==current){go(c.station);return;}onGesture();if(c.kind==='drag')onAction(c.action,-Math.sign(e.deltaY)*c.wheel);if(c.action==='ring')onAction('ring',{...c.value,step:-Math.sign(e.deltaY)});},{passive:false});
  canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(!paused)go('overview');});
  document.addEventListener('keydown',e=>{if(e.code==='Escape'){if(current!=='overview'&&!paused)go('overview');else onPause();}if(paused)return;
    const names={Digit1:'overview',Digit2:'optics',Digit3:'lock',Digit4:'note'};if(names[e.code])go(names[e.code]);
    if(e.code==='Backspace'){e.preventDefault();go('overview');}
  });
  window.addEventListener('resize',()=>applyStation(current));applyStation('overview');
  return {go,get station(){return current;},setPaused(v){paused=v;release();},update(dt){if(travel>0){const before=travel;travel=Math.max(0,travel-dt);if(before>.14&&travel<=.14)applyStation(next);if(travel===0)fade.style.opacity='0';}},reset(){travel=0;fade.style.opacity='0';applyStation('overview');}};
}
