// The same state machine drives geometry, saves and tests. No timed failure or pixel-perfect answer.
export const SYMBOLS = ['○', '☾', '△', '≈', '✦', '⊕'];
export const CODE = [1, 3, 4];
const TARGET_X=.98-Math.sin(.72)*.118, TARGET_Z=.74-Math.cos(.72)*.118;
export const ALIGNMENT = Math.atan2(TARGET_Z, TARGET_X) * 90 / Math.PI;
export const FOCUS = 62;
export const freshState = () => ({version:3, power:false, angle:43, focus:20, rings:[0,0,0], unlocked:false, key:false, complete:false, hint:0});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function restoreState(raw) {
  const s=freshState();
  if (!raw || raw.version!==3) return s;
  for (const k of ['power','unlocked','key','complete']) s[k]=raw[k]===true;
  s.angle=Number.isFinite(raw.angle)?clamp(raw.angle,0,55):s.angle;
  s.focus=Number.isFinite(raw.focus)?clamp(raw.focus,0,100):s.focus;
  if(Array.isArray(raw.rings)&&raw.rings.length===3) s.rings=raw.rings.map(v=>Number.isInteger(v)&&v>=0&&v<6?v:0);
  s.hint=Number.isInteger(raw.hint)?clamp(raw.hint,0,3):0;
  s.key=s.key&&s.unlocked; s.complete=s.complete&&s.key;
  return s;
}
export function opticalReading(s) {
  const a=s.angle*Math.PI/180;
  const direction={x:Math.cos(2*a),z:-Math.sin(2*a)};
  const along=TARGET_X*direction.x-TARGET_Z*direction.z;
  const miss=Math.hypot(TARGET_X-along*direction.x,-TARGET_Z-along*direction.z);
  const alignment=clamp(1-miss/.055,0,1);
  const sharpness=clamp(1-Math.abs(s.focus-FOCUS)/30,0,1);
  return {direction,miss,alignment,sharpness,lit:s.power&&along>0&&miss<.055,readable:s.power&&alignment>.35&&sharpness>.83};
}
export function act(s,action,value) {
  if(s.complete) return 'finished';
  switch(action){
    case 'power': s.power=!s.power;return 'switch';
    case 'angle': {const next=clamp(s.angle+value,0,55);if(next===s.angle)return 'none';s.angle=next;return 'tick';}
    case 'focus': {const next=clamp(s.focus+value,0,100);if(next===s.focus)return 'none';s.focus=next;return 'tick';}
    case 'ring': {const i=value.index;if(!Number.isInteger(i)||i<0||i>2)return 'none';s.rings[i]=(s.rings[i]+(value.step<0?5:1))%6;return 'tick';}
    case 'latch':
      if(s.unlocked)return 'open';
      if(s.rings.every((v,i)=>v===CODE[i])){s.unlocked=true;return 'unlock';}
      return 'wrong';
    case 'key': if(s.unlocked){s.key=true;return 'key';}return 'none';
    case 'beacon': if(s.key&&s.power){s.complete=true;return 'complete';}return s.key?'no-power':'no-key';
    case 'hint': s.hint=Math.min(3,s.hint+1);return 'paper';
    default:return 'none';
  }
}
