// Pure PCM synthesis shared by the game and the review WAV.
export const CUE_DURATIONS=Object.freeze({fine:.11,detent:.18,focus:.15,switch:.2,reject:.32,unlock:.28,drawer:.75,key:.5,paper:.4,complete:4.5});
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/2147483648-1;};}
export function renderCue(name,sampleRate=48000,variant=0){
  if(!Object.hasOwn(CUE_DURATIONS,name)||!Number.isFinite(sampleRate)||sampleRate<8000)throw new RangeError('Invalid audio cue or sample rate');
  const samples=new Float32Array(Math.ceil(CUE_DURATIONS[name]*sampleRate)),rand=random(9173+variant*1777+name.length*101);let low=0;
  function impact(at,level,body,metal=1){
    const first=Math.floor(at*sampleRate),length=Math.min(samples.length-first,Math.ceil(.23*sampleRate));
    for(let i=0;i<length;i++){
      const t=i/sampleRate,n=rand();low+=.17*(n-low);
      const attack=1-Math.exp(-t/.0007),bodyTone=Math.sin(2*Math.PI*body*t)*Math.exp(-t/.034);
      const modes=(Math.sin(2*Math.PI*body*3.71*t)*.35+Math.sin(2*Math.PI*body*7.13*t)*.14)*Math.exp(-t/.018);
      samples[first+i]+=level*attack*(bodyTone*.62+modes*metal+(n-low)*Math.exp(-t/.006)*.42);
    }
  }
  function friction(at,duration,level,texture){
    const first=Math.floor(at*sampleRate),length=Math.min(samples.length-first,Math.ceil(duration*sampleRate));let slow=0,fast=0;
    for(let i=0;i<length;i++){
      const t=i/sampleRate,u=i/length,n=rand();fast+=.44*(n-fast);slow+=.025*(n-slow);
      samples[first+i]+=level*(fast-slow)*Math.pow(Math.sin(Math.PI*u),.8)*(.65+.35*Math.sin(2*Math.PI*texture*t+slow*5));
    }
  }
  switch(name){
    case 'fine':impact(0,.1,540,.6);break;
    case 'detent':impact(0,.27,230,.9);impact(.026,.055,590,.65);break;
    case 'focus':friction(0,.13,.17,37);impact(.002,.035,480,.3);break;
    case 'switch':impact(0,.19,610,.6);impact(.037,.29,145,.35);break;
    case 'reject':impact(0,.24,94,.3);impact(.062,.14,131,.3);impact(.14,.08,108,.3);break;
    case 'unlock':impact(0,.26,160,.75);impact(.105,.19,380,.7);break;
    case 'drawer':friction(0,.58,.32,19);impact(.56,.19,83,.15);break;
    case 'key':impact(0,.17,1260,1);impact(.076,.095,1860,1);impact(.147,.055,1540,.8);break;
    case 'paper':friction(0,.31,.29,23);friction(.16,.21,.18,61);break;
    case 'complete':[196,293.66,392,493.88,587.33].forEach((frequency,index)=>{
      const first=Math.floor(index*.24*sampleRate);
      for(let i=first;i<samples.length;i++){const t=(i-first)/sampleRate,envelope=(1-Math.exp(-t/.018))*Math.exp(-t/1.05);samples[i]+=.06*envelope*(Math.sin(2*Math.PI*frequency*t)+.16*Math.sin(2*Math.PI*frequency*2.003*t));}
    });break;
  }
  // Preserve relative levels; taper boundaries and remove residual DC rather than normalizing each cue.
  let mean=0;for(const value of samples)mean+=value;mean/=samples.length;
  let peak=0;for(let i=0;i<samples.length;i++){const fade=Math.min(1,i/(sampleRate*.001),(samples.length-1-i)/(sampleRate*.006));samples[i]=(samples[i]-mean)*Math.max(0,fade);peak=Math.max(peak,Math.abs(samples[i]));}
  if(peak>.7)for(let i=0;i<samples.length;i++)samples[i]*=.7/peak;
  return samples;
}
export function actionCues(result,action){
  if(result==='tick')return [{name:action==='ring'?'detent':action==='focus'?'focus':'fine',delay:0}];
  if(['wrong','no-key','no-power'].includes(result))return [{name:'reject',delay:0}];
  if(result==='complete')return [{name:'switch',delay:0},{name:'complete',delay:.18}];
  if(['switch','unlock','key','paper'].includes(result))return [{name:result,delay:0}];
  return [];
}
