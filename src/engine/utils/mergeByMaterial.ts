import * as THREE from 'three';

export interface MergedPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export function mergeByMaterial(root: THREE.Object3D): MergedPart[] {
  root.updateMatrixWorld(true);

  interface MaterialGroup {
    material: THREE.Material;
    geometries: THREE.BufferGeometry[];
    matrices: THREE.Matrix4[];
  }

  const groups = new Map<string, MaterialGroup>();

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = Array.isArray(child.material) ? child.material[0] : child.material;
    if (!material) return;

    let entry = groups.get(material.uuid);
    if (!entry) {
      entry = { material, geometries: [], matrices: [] };
      groups.set(material.uuid, entry);
    }
    entry.geometries.push(child.geometry);
    entry.matrices.push(child.matrixWorld.clone());
  });

  const parts: MergedPart[] = [];
  const normalMatrix = new THREE.Matrix3();
  const vec = new THREE.Vector3();

  for (const group of groups.values()) {
    let vertexTotal = 0;
    let indexTotal = 0;
    for (const geometry of group.geometries) {
      const position = geometry.getAttribute('position');
      vertexTotal += position.count;
      indexTotal += geometry.index ? geometry.index.count : position.count;
    }

    const positions = new Float32Array(vertexTotal * 3);
    const normals = new Float32Array(vertexTotal * 3);
    const indices = new Uint32Array(indexTotal);

    let vertexOffset = 0;
    let indexOffset = 0;

    group.geometries.forEach((geometry, i) => {
      const matrix = group.matrices[i]!;
      normalMatrix.getNormalMatrix(matrix);

      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');

      for (let v = 0; v < position.count; v += 1) {
        vec.fromBufferAttribute(position as THREE.BufferAttribute, v).applyMatrix4(matrix);
        positions.set([vec.x, vec.y, vec.z], (vertexOffset + v) * 3);
        if (normal) {
          vec
            .fromBufferAttribute(normal as THREE.BufferAttribute, v)
            .applyMatrix3(normalMatrix)
            .normalize();
          normals.set([vec.x, vec.y, vec.z], (vertexOffset + v) * 3);
        }
      }

      if (geometry.index) {
        for (let i2 = 0; i2 < geometry.index.count; i2 += 1) {
          indices[indexOffset + i2] = vertexOffset + geometry.index.getX(i2);
        }
        indexOffset += geometry.index.count;
      } else {
        for (let i2 = 0; i2 < position.count; i2 += 1) indices[indexOffset + i2] = vertexOffset + i2;
        indexOffset += position.count;
      }

      vertexOffset += position.count;
    });

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    merged.computeBoundingSphere();

    parts.push({ geometry: merged, material: group.material });
  }

  return parts;
}
