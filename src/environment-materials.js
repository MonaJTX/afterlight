import * as THREE from 'three';

const noiseGLSL=`
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<4;i++){v+=a*noise2(p);p=r*p*2.03+vec2(7.1,3.7);a*=.5;}return v;}
vec3 stormSky(vec3 d){
  float horizon=exp(-max(d.y,0.)*8.);
  vec2 p=d.xz/(max(.14,d.y+.22))*2.3;
  float cloud=fbm(p+fbm(p*.43)*2.5);
  float lower=fbm(p*1.7+vec2(11.,4.));
  vec3 clear=mix(vec3(.035,.065,.095),vec3(.16,.23,.26),horizon);
  vec3 cloudColor=mix(vec3(.035,.054,.064),vec3(.12,.16,.17),smoothstep(.24,.78,lower));
  return mix(clear,cloudColor,smoothstep(.27,.65,cloud)*.88);
}`;

export function skyMaterial(){return new THREE.ShaderMaterial({side:THREE.BackSide,
  vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 direction;${noiseGLSL}void main(){gl_FragColor=vec4(stormSky(normalize(direction)),1.);}`
});}

export function oceanMaterial(){return new THREE.ShaderMaterial({uniforms:{time:{value:0}},
  vertexShader:`uniform float time;varying vec3 world;void main(){vec3 p=position;p.z=.025*sin(p.x*.8+p.y*.4+time*.5)+.012*sin(p.x*1.7-p.y*.9-time*.7);world=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
  fragmentShader:`uniform float time;varying vec3 world;${noiseGLSL}
  float swell(vec2 p){
    float modulation=fbm(p*.19);
    return sin(p.x*2.1+p.y*.72+time*.53+modulation*.7)*.035
      +sin(p.x*-1.3+p.y*3.2-time*.67+modulation*.3)*.019
      +sin(p.x*5.1+p.y*1.7+time*.91)*.008;
  }
  void main(){
    vec2 p=world.xz;float h=swell(p),eps=.035;
    vec3 n=normalize(vec3((h-swell(p+vec2(eps,0.)))/eps,1.,(h-swell(p+vec2(0.,eps)))/eps));
    vec3 eye=normalize(cameraPosition-world),reflection=reflect(-eye,n);
    float fresnel=.025+.975*pow(1.-max(dot(n,eye),0.),5.);
    vec3 reflected=mix(stormSky(vec3(reflection.x,abs(reflection.y),reflection.z)),vec3(.10,.145,.16),.55);
    vec3 sea=mix(vec3(.015,.038,.043),reflected,fresnel*.85);
    float glint=pow(max(dot(reflect(-normalize(vec3(-.4,.45,-.6)),n),eye),0.),90.);
    sea+=vec3(.045,.06,.065)*glint;
    float distanceFog=1.-exp(-length(cameraPosition-world)*.008);
    sea=mix(sea,vec3(.13,.19,.21),distanceFog);
    gl_FragColor=vec4(sea,1.);
  }`
});}
