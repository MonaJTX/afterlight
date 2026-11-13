import {RepeatWrapping} from 'three';
// Correlated albedo / roughness / relief: the same pores and tarnish affect light response.
// Generated once on load, never per frame. Values describe the material, not baked lighting.
export function buildSurfaceMaps(kind,{noise,hash,textureFrom}) {
  const size=kind==='wood'?1024:512;
  const canvases=Array.from({length:4},()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;});
  const contexts=canvases.map(c=>c.getContext('2d'));
  const pixels=contexts.map(c=>c.createImageData(size,size)),height=new Float32Array(size*size);
  const base={wood:[68,43,27],enamel:[25,39,35],brass:[143,108,57],steel:[94,102,105],plaster:[137,145,140],stone:[93,102,104],leather:[60,39,27]}[kind];
  const clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,i=(y*size+x)*4;
    const broad=noise(u*7,v*7),medium=noise(u*31,v*31),fine=hash(x,y);
    let color=[...base],rough=.7,relief=0,metal=0;
    if(kind==='wood'){
      let warp=v+.012*Math.sin(u*10+noise(u*3,v*4)*5)+.007*noise(u*8,v*6),knotMask=0,knotRing=0;
      for(const [cx,cy] of [[.24,.29],[.79,.76]]){
        const dx=(u-cx)/.19,dy=(v-cy)/.075,r=Math.sqrt(dx*dx+dy*dy);
        const influence=Math.exp(-r*r*.8);warp+=dy*.018*influence;
        knotMask=Math.max(knotMask,influence);knotRing+=Math.sin(r*29+medium*2)*influence;
      }
      const bands=Math.sin(warp*180+noise(u*5,v*8)*3),fiber=Math.sin(warp*1750+noise(u*13,v*110)*4);
      const pores=smooth(.66,.79,noise(u*65,warp*520));
      const figure=bands*5+knotRing*3+(broad-.5)*13+(medium-.5)*5;
      const darkPore=pores*19+smooth(.82,1,knotMask)*14;
      color=base.map((c,j)=>c+figure*(1-j*.12)+fiber*1.8-darkPore*(1-j*.16));
      rough=.61+broad*.18+pores*.11-knotMask*.045;
      relief=fiber*.025+bands*.06-pores*.2;
    }else if(kind==='brass'||kind==='steel'){
      const tarnish=smooth(.48,.78,broad*.65+medium*.35);
      const machining=Math.sin(v*size*2.2+noise(u*10,v*8)*2);
      const oxide=kind==='brass'?[78,78,49]:[52,57,55],oxidation=tarnish*(kind==='brass'?.38:.55);
      color=base.map((c,j)=>c*(1-oxidation)+oxide[j]*oxidation+(fine-.5)*4+machining*.8);
      rough=(kind==='brass'?.34:.37)+tarnish*.27+(medium-.5)*.08;
      metal=.95-tarnish*.38;relief=(fine-.5)*.018+machining*.012-tarnish*.04;
    }else if(kind==='enamel'){
      // Orange peel belongs to the coating; occasional pits cluster, rather than peppering every pixel.
      const pit=smooth(.78,.94,medium)*smooth(.85,1,fine);
      color=base.map((c,j)=>c+(broad-.5)*7+(medium-.5)*2-pit*(5-j));
      rough=.49+broad*.17+pit*.22;relief=(medium-.5)*.055-pit*.15;metal=.05;
    }else{
      const grain=(broad-.5)*15+(medium-.5)*9+(fine-.5)*4;
      color=base.map(c=>c+grain);rough={plaster:.94,stone:.89,leather:.77}[kind]+(medium-.5)*.09;
      relief=(medium-.5)*.15+(fine-.5)*.04;
    }
    pixels[0].data.set([...color,255],i);
    pixels[1].data.set([rough*255,rough*255,rough*255,255],i);
    pixels[3].data.set([metal*255,metal*255,metal*255,255],i);
    height[y*size+x]=relief;
  }
  // Finite differences produce normals which follow the actual grain and pore relief.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=(height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size])*2.2;
    const dy=(height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x])*2.2;
    const inverse=1/Math.sqrt(1+dx*dx+dy*dy);
    pixels[2].data.set([(1-dx*inverse)*127.5,(1+dy*inverse)*127.5,(1+inverse)*127.5,255],(y*size+x)*4);
  }
  contexts.forEach((c,i)=>c.putImageData(pixels[i],0,0));
  // Sparse hairline scratches affect both color and roughness; wood scratches follow the grain.
  if(['wood','steel','brass','enamel'].includes(kind))for(let i=0;i<110;i++){
    const x=hash(i,41)*size,y=hash(i,47)*size,length=(.008+hash(i,49)*.06)*size;
    for(const map of [0,1]){
      const c=contexts[map];c.strokeStyle=map===0?(kind==='wood'?'rgba(27,17,10,.24)':'rgba(184,174,146,.16)'):'rgba(220,220,220,.45)';
      c.lineWidth=.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+length,y+(hash(i,48)-.5)*size*.004);c.stroke();
    }
  }
  const maps=canvases.map((c,i)=>textureFrom(c,i===0));
  maps.forEach(t=>{t.wrapS=t.wrapT=RepeatWrapping;});
  return {map:maps[0],roughnessMap:maps[1],normalMap:maps[2],metalnessMap:maps[3]};
}
