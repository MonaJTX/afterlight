import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {makeCraft} from './craft.js';
import {buildRoom} from './room.js';
import {buildMachine} from './machine.js';
import {stationControls} from './station-controls.js';
import {act,freshState,restoreState,opticalReading} from './puzzle.js';
import {soundscape} from './sound.js';
import {batchStatic,batchArticulatedParts} from './batch-static.js';
import {addBenchWear} from './workshop-patina.js';
import {animationDelta} from './mechanical-motion.js';

const $=id=>document.getElementById(id),SAVE='afterlight.chapter1.v3';
let state=freshState();try{state=restoreState(JSON.parse(localStorage.getItem(SAVE)));}catch{}
const errors=[];function fail(e){errors.push(String(e));$('error').hidden=false;$('error').textContent='光学室暂时无法显示，请刷新重试。\n'+e;}
window.addEventListener('error',e=>fail(e.message));window.addEventListener('unhandledrejection',e=>fail(e.reason));
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.info.autoReset=false;
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.3;
const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','余光：固定视点光学解谜。点击器物靠近，拖动或滚轮调节旋钮，点击转轮，右键退后，Escape 返回或设置。1 总览，2 光学仪器，3 密码锁，4 信件。');$('stage').append(canvas);
const scene=new THREE.Scene();scene.background=new THREE.Color('#15272e');scene.fog=new THREE.FogExp2('#556c83',.009);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.045,160);
const env=new THREE.Scene();env.background=new THREE.Color('#627376');
function envPanel(c,strength,w,h,p,look){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(strength),side:THREE.DoubleSide}));o.position.set(...p);o.lookAt(...look);env.add(o);}
envPanel('#b4d3dd',2.7,2.4,2.4,[-1.2,2,-3],[0,1,0]);envPanel('#ffe0b3',2.8,1,.5,[1.2,2,0],[0,1,0]);envPanel('#a89478',.3,6,3,[0,1.5,4],[0,1,0]);
const pmrem=new THREE.PMREMGenerator(renderer),initialEnvironment=pmrem.fromScene(env,.03);scene.environment=initialEnvironment.texture;scene.environmentIntensity=.32;pmrem.dispose();
const kit=makeCraft(scene),room=buildRoom(kit,state.complete),machine=buildMachine(kit,scene,state);
addBenchWear(kit);
RectAreaLightUniformsLib.init();scene.add(new THREE.HemisphereLight('#b1bfd4','#574331',.12));
const windowFill=new THREE.RectAreaLight('#9ebbe5',3.4,2.2,2.1);windowFill.position.set(-1.3,2.1,-2.34);windowFill.lookAt(0,1,1);scene.add(windowFill);
// Place the shadow-casting key inside the window's line of sight, clear of the stone lintel.
const windowKey=new THREE.SpotLight('#9cbaf0',34,14,.85,.4,1.4);windowKey.position.set(-1.55,2.65,-3.3);windowKey.target.position.set(-.1,.8,.5);windowKey.castShadow=true;windowKey.shadow.mapSize.set(2048,2048);windowKey.shadow.bias=-.0001;windowKey.shadow.normalBias=.008;scene.add(windowKey,windowKey.target);
// The warm pool is cast by the visible desk lamp, not a second invisible ceiling spotlight.
const warmKey=new THREE.SpotLight('#ffc178',11,7,1.05,.6,1.5);warmKey.position.set(1.09,1.485,-.14);warmKey.target.position.set(-.1,.91,.35);warmKey.castShadow=true;warmKey.shadow.mapSize.set(2048,2048);warmKey.shadow.normalBias=.005;warmKey.shadow.bias=-.00008;scene.add(warmKey,warmKey.target);
const softFill=new THREE.RectAreaLight('#b6c6dd',.9,2.4,1.8);softFill.position.set(0,1.9,1.3);softFill.lookAt(.1,1.15,0);scene.add(softFill);
// Gentle near-field fill for the held letter; it changes with the blacked-out station transition.
const readingFill=new THREE.RectAreaLight('#ffedcb',0,.7,.6);readingFill.position.set(-.65,1.65,1.35);readingFill.lookAt(-.75,1.15,.67);scene.add(readingFill);
const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:4});
const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
const ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.blendIntensity=.45;ao.updateGtaoMaterial({radius:.13,distanceExponent:1.5,thickness:.5,samples:8});ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:4});composer.addPass(ao);
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.095,.5,1.45);composer.addPass(bloom);composer.addPass(new OutputPass());
const grade=new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float v=dot(vUv-.5,vUv-.5);c*=1.-v*.22;gl_FragColor=vec4(c,1.);}'});composer.addPass(grade);
const stations={overview:{position:[1.15,1.58,2.1],look:[-.13,1.26,-.27],fov:42},optics:{position:[.02,2.05,1.88],look:[-.15,1.16,-.02],fov:45},lock:{position:[1,1.7,1.65],look:[.77,1.03,.48],fov:39},note:{position:[-.75,1.72,1.65],look:[-.75,1.12,.65],fov:39}};
const audio=soundscape();let paused=false,saveTimer=0,storageOK=true;
function save(){try{localStorage.setItem(SAVE,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}}
function dispatch(action,value){const result=act(state,action,value);audio.play(result,action,value);machine.feedback?.(result,action,value);saveTimer=.25;canvas.dataset.lastAction=result;if(action==='hint')machine.setHint?.(state.hint);if(result==='complete')canvas.dataset.ending='beacon-restored';}
const controls=stationControls({camera,canvas,targets:machine.targets,stations,onAction:dispatch,onGesture:()=>audio.start(),onStation:n=>{machine.setStation?.(n);if(n==='note')audio.play('paper','note');readingFill.intensity=n==='note'?2.2:0;},onPause:()=>setPaused(!paused)});
function setPaused(v){paused=v;if(v)audio.clearEffects();controls.setPaused(v);$('pause').hidden=!v;if(v)$('resume').focus();else canvas.focus();}
$('resume').onclick=()=>setPaused(false);$('audio').oninput=e=>audio.setVolume(Number(e.target.value));
$('quality').onchange=e=>{const high=e.target.value==='high';renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.5:1));ao.enabled=high;bloom.enabled=high;resize();};
$('restart').onclick=()=>{$('restart-confirm').hidden=false;};$('cancel-restart').onclick=()=>{$('restart-confirm').hidden=true;};
$('confirm-restart').onclick=()=>{Object.assign(state,freshState());audio.clearEffects();save();machine.reset();room.reset(false);machine.setHint?.(0);controls.reset();$('restart-confirm').hidden=true;setPaused(false);};
const merged=batchStatic(kit.root,machine.dynamic)+batchArticulatedParts(machine.dynamic);
// A static local reflection probe sees the actual window, timber and lamp-lit room.
// Hide planar mirrors during capture to avoid recursively rendering their own reflection.
machine.update(0);room.update(0,0,state.complete);
const probeTarget=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});
const probe=new THREE.CubeCamera(.06,100,probeTarget);probe.position.set(-.1,1.72,1.05);
const hiddenReflectors=[];kit.root.traverse(o=>{if(o.isReflector){hiddenReflectors.push([o,o.visible]);o.visible=false;}});
probe.update(renderer,scene);for(const [o,visible] of hiddenReflectors)o.visible=visible;
const roomPMREM=new THREE.PMREMGenerator(renderer),roomEnvironment=roomPMREM.fromCubemap(probeTarget.texture);scene.environment=roomEnvironment.texture;scene.environmentIntensity=.8;roomPMREM.dispose();probeTarget.dispose();initialEnvironment.dispose();
function resize(){renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);}
window.addEventListener('resize',resize);window.addEventListener('pagehide',save);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('图形上下文中断');});
let last=null,elapsed=0,frames=0,samples=[];
function frame(now){requestAnimationFrame(frame);const raw=last===null?0:(now-last)/1000;last=now;const dt=animationDelta(raw);if(document.hidden)return;frames++;if(frames>60&&raw>0&&raw<.5){samples.push(raw*1000);if(samples.length>900)samples.shift();}
 controls.update(dt);if(!paused){elapsed+=dt;machine.update(dt);for(const cue of machine.takeSoundEvents())audio.playCue(cue);room.update(elapsed,dt,state.complete);}if(saveTimer>0){saveTimer-=dt;if(saveTimer<=0)save();}
 const reading=opticalReading(state);canvas.dataset.opticalState=reading.readable?'readable':reading.lit?'focusing':state.power?'aligning':'off';canvas.dataset.rings=state.rings.join(',');canvas.dataset.unlocked=String(state.unlocked);canvas.dataset.complete=String(state.complete);canvas.dataset.angle=state.angle.toFixed(2);canvas.dataset.focus=state.focus.toFixed(1);canvas.dataset.key=String(state.key);canvas.dataset.camera=camera.position.toArray().join(',');
 const beam=machine.getBeamTrace();canvas.dataset.beamHit=beam?String(beam.hit):'off';canvas.dataset.beamDistance=beam?beam.distance.toFixed(3):'0';canvas.dataset.beamPoint=beam?beam.point.toArray().map(v=>v.toFixed(3)).join(','):'';
 const sound=audio.status();canvas.dataset.audioState=sound.state;canvas.dataset.audioVoices=String(sound.active);canvas.dataset.audioCue=sound.lastCue;canvas.dataset.audioCueCount=String(sound.count);canvas.dataset.audioBuffers=String(sound.buffers);
 const endingFeedback=room.getEndingFeedback();canvas.dataset.beaconLevel=endingFeedback.beacon.toFixed(3);canvas.dataset.shipResponse=endingFeedback.response.toFixed(3);
 const motion=machine.getMotion();canvas.dataset.drumAngles=motion.drums.map(v=>v.toFixed(3)).join(',');canvas.dataset.drumTargets=motion.targets.map(v=>v.toFixed(3)).join(',');canvas.dataset.latchAngle=motion.latch.toFixed(3);canvas.dataset.keyAngle=motion.key.toFixed(3);canvas.dataset.drawerTravel=motion.drawer.toFixed(3);
 if(frames%60===0&&samples.length){const sorted=[...samples].sort((a,b)=>a-b);canvas.dataset.frameP95=sorted[Math.floor(sorted.length*.95)].toFixed(1);canvas.dataset.frameP50=sorted[Math.floor(sorted.length*.5)].toFixed(1);}
 renderer.info.reset();composer.render();canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.triangles=String(renderer.info.render.triangles);if(frames===3){$('loading').hidden=true;canvas.focus();}
}
requestAnimationFrame(frame);
window.afterlight={getState:()=>({version:3,...structuredClone(state),reading:opticalReading(state),station:controls.station,camera:camera.position.toArray(),errors:[...errors],storageOK,merged,performance:{frames,p50:samples.length?[...samples].sort((a,b)=>a-b)[Math.floor(samples.length*.5)]:0,p95:samples.length?[...samples].sort((a,b)=>a-b)[Math.floor(samples.length*.95)]:0,calls:renderer.info.render.calls}})};
console.info('AFTERLIGHT V3 — fixed stations, no camera bob, chapter state enabled; merged',merged);
