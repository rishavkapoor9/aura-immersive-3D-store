import * as THREE from 'three';

export function createStoreMaterials() {
  return {
    wall: new THREE.MeshStandardMaterial({ color: 0x191c22, roughness: 0.92, metalness: 0.05 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0x0e1014, roughness: 0.98 }),
    woodSlat: new THREE.MeshStandardMaterial({ color: 0x5a4130, roughness: 0.68 }),
    woodPanel: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.72, metalness: 0.08 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.72 }),
    beam: new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.9, metalness: 0.2 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.85, metalness: 0.12 }),
    counter: new THREE.MeshStandardMaterial({
      color: 0x20242b,
      roughness: 0.4,
      metalness: 0.4,
      envMapIntensity: 1.1,
    }),
    counterTop: new THREE.MeshStandardMaterial({
      color: 0x2c313a,
      roughness: 0.28,
      metalness: 0.55,
      envMapIntensity: 1.2,
    }),
    stoneTop: new THREE.MeshStandardMaterial({
      color: 0x9aa2ab,
      roughness: 0.2,
      metalness: 0.6,
      envMapIntensity: 1.3,
    }),
    checkoutTop: new THREE.MeshStandardMaterial({
      color: 0xa9b2bc,
      roughness: 0.18,
      metalness: 0.65,
      envMapIntensity: 1.4,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0x7d858f,
      metalness: 0.85,
      roughness: 0.28,
      envMapIntensity: 1.3,
    }),
    column: new THREE.MeshStandardMaterial({ color: 0x1c2027, roughness: 0.55, metalness: 0.3 }),
    inlay: new THREE.MeshStandardMaterial({
      color: 0xc9d2dc,
      roughness: 0.3,
      metalness: 0.5,
      envMapIntensity: 1.2,
    }),
    rug: new THREE.MeshStandardMaterial({ color: 0x39332c, roughness: 1 }),
    planter: new THREE.MeshStandardMaterial({
      color: 0x1a1d23,
      roughness: 0.5,
      metalness: 0.35,
      envMapIntensity: 0.9,
    }),
    planterRim: new THREE.MeshStandardMaterial({
      color: 0xb8c2cc,
      roughness: 0.24,
      metalness: 0.9,
      envMapIntensity: 1.4,
    }),
    soil: new THREE.MeshStandardMaterial({ color: 0x1d2a1c, roughness: 1 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x2f5c33, roughness: 0.88 }),
    shrub: new THREE.MeshStandardMaterial({ color: 0x38663a, roughness: 0.9 }),
    signSide: new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.9 }),
    emissiveStrip: new THREE.MeshBasicMaterial({ color: 0xffdcae }),
    downlight: new THREE.MeshBasicMaterial({ color: 0xfff1dc }),
    cove: new THREE.MeshBasicMaterial({ color: 0xffe9cc }),
    niche: new THREE.MeshStandardMaterial({
      color: 0x0e1116,
      roughness: 0.9,
      emissive: 0x2a4562,
      emissiveIntensity: 0.45,
    }),
    conveyor: new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.95 }),
    basket: new THREE.MeshStandardMaterial({ color: 0x2b6b4a, roughness: 0.8 }),
    invisible: new THREE.MeshBasicMaterial({ visible: false }),
  };
}

export type StoreMaterials = ReturnType<typeof createStoreMaterials>;
