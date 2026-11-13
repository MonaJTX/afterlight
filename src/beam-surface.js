import * as THREE from 'three';

export function createBeamTracer(root,excluded=[],maxDistance=12){
  const ray=new THREE.Raycaster(),skip=new Set(excluded),normalMatrix=new THREE.Matrix3();
  function accepted(object,material){
    for(let p=object;p;p=p.parent)if(!p.visible||skip.has(p))return false;
    return material&&material.visible!==false&&!material.transparent&&!material.isShaderMaterial&&!(material.transmission>0);
  }
  return (origin,direction)=>{
    root.updateWorldMatrix(true,true);ray.set(origin,direction.clone().normalize());ray.near=.025;ray.far=maxDistance;
    const candidates=[];root.traverse(o=>{if(o.isMesh&&!o.isReflector){const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>accepted(o,m)))candidates.push(o);}});
    for(const hit of ray.intersectObjects(candidates,false)){
      const material=Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex]:hit.object.material;
      if(!accepted(hit.object,material))continue;
      const normal=hit.face.normal.clone().applyMatrix3(normalMatrix.getNormalMatrix(hit.object.matrixWorld)).normalize();
      if(normal.dot(direction)>0)normal.negate();
      return {hit:true,point:hit.point,normal,distance:hit.distance};
    }
    return {hit:false,point:origin.clone().addScaledVector(direction,maxDistance),normal:null,distance:maxDistance};
  };
}

export function beamMaterial(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 v;varying vec3 n;varying vec3 eye;void main(){v=uv;n=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);eye=-p.xyz;gl_Position=projectionMatrix*p;}',
  fragmentShader:'varying vec2 v;varying vec3 n;varying vec3 eye;void main(){float crossSection=pow(abs(dot(normalize(n),normalize(eye))),1.8);float fade=smoothstep(0.,.04,v.y)*(1.-smoothstep(.85,1.,v.y));gl_FragColor=vec4(vec3(1.,.79,.43),crossSection*fade*.13);}'
});}

export function spotMaterial(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 v;void main(){float r=length(v*2.-1.);float a=(exp(-r*r*12.)*.78+exp(-r*r*3.)*.12)*(1.-smoothstep(.8,1.,r));gl_FragColor=vec4(mix(vec3(1.,.65,.24),vec3(1.,.94,.72),exp(-r*r*15.)),a);}'
});}

export function placeSurfaceSpot(spot,trace,direction){
  spot.visible=trace.hit;if(!trace.hit)return;
  const n=trace.normal,tangent=direction.clone().addScaledVector(n,-direction.dot(n));
  if(tangent.lengthSq()<1e-6)tangent.crossVectors(Math.abs(n.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0),n);
  tangent.normalize();const bitangent=new THREE.Vector3().crossVectors(n,tangent).normalize();
  spot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,bitangent,n));
  spot.position.copy(trace.point).addScaledVector(n,.0015);
  const radius=.009+Math.min(trace.distance,6)*.002,incidence=Math.max(.25,Math.abs(n.dot(direction)));
  spot.scale.set(radius/incidence,radius,1);
}
