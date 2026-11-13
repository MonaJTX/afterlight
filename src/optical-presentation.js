import {CODE,SYMBOLS} from './puzzle.js';

export const PLATE_SYMBOLS=CODE.map(index=>SYMBOLS[index]);

export function projectionAppearance(read){
  const illumination=read.lit?Math.pow(read.alignment,.6):0;
  const sharp=Math.max(0,Math.min(1,read.sharpness));
  return {illumination,blur:Math.pow(1-sharp,1.4)*80,inkOpacity:illumination*(.12+.88*Math.min(1,sharp/.85)),
    background:[119,125,110].map((v,i)=>Math.round(v+([203,197,169][i]-v)*illumination))};
}

export function drawPlateNegative(c,w,h){
  c.fillStyle='rgba(16,24,21,.94)';c.fillRect(0,0,w,h);
  c.strokeStyle='#6a786a';c.lineWidth=3;c.strokeRect(20,20,w-40,h-40);
  // The information is a micro-image carried by the plate; the projector supplies magnification.
  c.fillStyle='#7f8d77';c.textAlign='center';c.textBaseline='middle';c.font='16px "Segoe UI Symbol",Georgia';
  PLATE_SYMBOLS.forEach((symbol,i)=>c.fillText(symbol,w/2,h/2+(i-1)*24));
  c.strokeStyle='#576455';c.lineWidth=1;
  for(const x of [w*.36,w*.64])for(const y of [h*.32,h*.68]){c.beginPath();c.moveTo(x-9,y);c.lineTo(x+9,y);c.moveTo(x,y-9);c.lineTo(x,y+9);c.stroke();}
  c.font='16px Georgia';c.fillStyle='#72816f';c.fillText('IV / N.C.   1896',w/2,h-44);
}
