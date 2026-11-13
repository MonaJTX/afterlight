import * as THREE from 'three';
import {hash} from './craft.js';

// A low distant promontory, behind the lighthouse island. Its shoreline is geometry,
// so the same land/water relationship is retained in the room's reflections.
export function addCoastalHeadland(root){
  const columns=100,rows=12,positions=[],colors=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    const u=i/columns,v=j/rows,x=-67+u*66;
    const taper=Math.pow(Math.max(0,Math.sin(u*Math.PI)),.65);
    const crest=(3.4+1.8*Math.sin(u*11+.5)+.7*Math.sin(u*31)) * taper;
    const shore=-57+Math.sin(u*9)*4+Math.sin(u*27)*1.1;
    const z=shore-v*17;
    // Narrow steep seaward face; the ridge broadens into the land behind it.
    const slope=v<.25?v/.25:1-(v-.25)*.68;
    const fractures=(hash(i,17)-.5)*.65*taper;
    const y=-.84+Math.max(0,crest+fractures)*slope;
    positions.push(x,y,z);
    const wet=1-THREE.MathUtils.smoothstep(y,-.5,1.1),variation=(hash(i,23)-.5)*.04;
    const color=new THREE.Color().setRGB(.15+variation,.17+variation,.165+variation).multiplyScalar(1-wet*.37);
    colors.push(color.r,color.g,color.b);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
    const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const coast=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,color:0xffffff,roughness:.96,metalness:0}));
  coast.name='distant coastal headland';coast.castShadow=false;coast.receiveShadow=true;root.add(coast);return coast;
}
