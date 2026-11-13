import {renderCue,actionCues} from './sound-synthesis.js';

export function soundscape(){
  let context,master,volume=.4,lastTick=-1,lastCue='',cueCount=0;
  const buffers=new Map(),voices=new Set();
  function start(){
    if(context){context.resume().catch(()=>{});return;}
    context=new AudioContext();master=context.createGain();master.gain.value=volume;master.connect(context.destination);
    const b=context.createBuffer(1,context.sampleRate*5,context.sampleRate),data=b.getChannelData(0);let low=0;
    for(let i=0;i<data.length;i++){const n=Math.random()*2-1;low=(low+.028*n)/1.028;data[i]=n*.04+low*.6;}
    const rain=context.createBufferSource();rain.buffer=b;rain.loop=true;
    const f=context.createBiquadFilter();f.type='lowpass';f.frequency.value=1700;
    const a=context.createGain();a.gain.value=.25;rain.connect(f).connect(a).connect(master);rain.start();
  }
  function playCue(name,{delay=0,pan=0}={}){
    if(!context)return;
    if(voices.size>=16){const oldest=voices.values().next().value;oldest.source.stop();oldest.cleanup();}
    const variant=cueCount%3,key=name+'/'+variant;
    if(!buffers.has(key)){const pcm=renderCue(name,context.sampleRate,variant),buffer=context.createBuffer(1,pcm.length,context.sampleRate);buffer.copyToChannel(pcm,0);buffers.set(key,buffer);}
    const source=context.createBufferSource(),panner=context.createStereoPanner();source.buffer=buffers.get(key);panner.pan.value=Math.max(-1,Math.min(1,pan));
    source.playbackRate.value=['detent','fine','focus'].includes(name)?.98+Math.random()*.04:1;
    source.connect(panner).connect(master);
    const voice={source,cleanup(){source.disconnect();panner.disconnect();voices.delete(voice);}};
    source.onended=voice.cleanup;voices.add(voice);source.start(context.currentTime+delay);lastCue=name;cueCount++;
  }
  function play(result,action,value){
    if(!context)return;
    if(result==='tick'&&action!=='ring'){if(context.currentTime-lastTick<.055)return;lastTick=context.currentTime;}
    const pan=action==='ring'?(value.index-1)*.18:action==='power'?-.3:action==='focus'?.25:action==='angle'?-.12:0;
    for(const cue of actionCues(result,action))playCue(cue.name,{delay:cue.delay,pan});
  }
  function clearEffects(){for(const voice of [...voices]){voice.source.stop();voice.cleanup();}lastTick=-1;}
  return {start,play,playCue,clearEffects,setVolume(v){volume=v;if(context)master.gain.setTargetAtTime(volume,context.currentTime,.1);},
    status:()=>({state:context?.state||'not-started',active:voices.size,lastCue,count:cueCount,buffers:buffers.size})};
}

