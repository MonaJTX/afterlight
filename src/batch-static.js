import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function batchStatic(root,dynamic=[]){
 const protectedNodes=new Set(dynamic);if(protectedNodes.has(root))return 0;
 root.updateWorldMatrix(true,true);const toLocal=new THREE.Matrix4().copy(root.matrixWorld).invert(),bins=new Map();
 root.traverse(o=>{if(o===root||!o.isMesh||o.children.length||o.isInstancedMesh||o.isReflector||Array.isArray(o.material)||o.material.isShaderMaterial||o.material.transparent||o.material.visible===false||o.customDepthMaterial)return;
   // Only this assembly's descendants matter. An animated ancestor outside it is retained intact.
   for(let p=o;p&&p!==root;p=p.parent)if(protectedNodes.has(p)||!p.visible)return;
   const key=[o.material.uuid,o.castShadow,o.receiveShadow,o.layers.mask,o.renderOrder].join(':');const bin=bins.get(key)||[];bin.push(o);bins.set(key,bin);
 });
 let removed=0;
 for(const objects of bins.values()){if(objects.length<3)continue;const geos=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toLocal,o.matrixWorld));g.clearGroups();return g;});const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)continue;const result=new THREE.Mesh(merged,objects[0].material);result.castShadow=objects[0].castShadow;result.receiveShadow=objects[0].receiveShadow;result.layers.mask=objects[0].layers.mask;result.renderOrder=objects[0].renderOrder;root.add(result);for(const o of objects)o.removeFromParent();removed+=objects.length-1;}
 return removed;
}

export function batchArticulatedParts(nodes){
 const unique=[...new Set(nodes)],groups=unique.filter(o=>o.isGroup);
 const depth=o=>{let n=0;for(let p=o.parent;p;p=p.parent)n++;return n;};
 groups.sort((a,b)=>depth(b)-depth(a));
 return groups.reduce((count,group)=>count+batchStatic(group,unique.filter(o=>o!==group)),0);
}
