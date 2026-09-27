import * as THREE from 'three';

const createCanvas = (width: number, height = width) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
};

const maxAnisotropy = (renderer: THREE.WebGLRenderer, cap = 16) =>
  Math.min(cap, renderer.capabilities.getMaxAnisotropy());

export function createFloorTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const size = 1024;
  const { canvas, ctx } = createCanvas(size);
  const tile = size / 4;

  ctx.fillStyle = '#22252b';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      const base = Math.floor(36 * (0.94 + Math.random() * 0.12));
      ctx.fillStyle = `rgb(${base},${base + 2},${base + 6})`;
      ctx.fillRect(i * tile, j * tile, tile, tile);

      for (let k = 0; k < 90; k += 1) {
        const r = 6 + Math.random() * 40;
        ctx.fillStyle = `rgba(${140 + Math.random() * 60 | 0},${145 + Math.random() * 60 | 0},${
          160 + Math.random() * 60 | 0
        },${Math.random() * 0.05})`;
        ctx.beginPath();
        ctx.ellipse(
          i * tile + Math.random() * tile,
          j * tile + Math.random() * tile,
          r,
          r * 0.55,
          Math.random() * 3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(10,11,14,.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(i * tile, j * tile, tile, tile);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 9);
  texture.anisotropy = maxAnisotropy(renderer);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSignTexture(renderer: THREE.WebGLRenderer, label: string): THREE.Texture {
  const { canvas, ctx } = createCanvas(1024, 200);
  ctx.fillStyle = '#0d0f13';
  ctx.fillRect(0, 0, 1024, 200);
  ctx.fillStyle = '#f2f5fa';
  ctx.font = '600 78px "Space Grotesk", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '12px';
  ctx.fillText(label, 512, 104);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = maxAnisotropy(renderer, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBrandTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const width = 1024;
  const height = 460;
  const { canvas, ctx } = createCanvas(width, height);

  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.62);
  vignette.addColorStop(0, 'rgba(150,190,235,.07)');
  vignette.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2 - 80;

  ctx.strokeStyle = 'rgba(214,232,248,.78)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx - 232, cy + 4, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e8f1fb';
  ctx.beginPath();
  ctx.arc(cx - 232, cy + 4, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eef4fb';
  ctx.font = '500 108px "Space Grotesk", Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '34px';
  ctx.fillText('AURA', cx - 158, cy + 6);

  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '0px';
  ctx.strokeStyle = 'rgba(160,190,220,.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 240, cy + 92);
  ctx.lineTo(cx + 250, cy + 92);
  ctx.stroke();

  ctx.fillStyle = 'rgba(150,175,200,.62)';
  ctx.font = '400 26px Inter, sans-serif';
  ctx.textAlign = 'center';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '11px';
  ctx.fillText('CONCEPT STORE', cx + 4, cy + 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = maxAnisotropy(renderer, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHotspotTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = createCanvas(size);
  const c = size / 2;
  const k = size / 256;

  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, 'rgba(255,255,255,0)');
  glow.addColorStop(0.52, 'rgba(190,230,255,.22)');
  glow.addColorStop(0.72, 'rgba(150,210,255,.11)');
  glow.addColorStop(1, 'rgba(150,210,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255,255,255,.94)';
  ctx.lineWidth = 7 * k;
  ctx.beginPath();
  ctx.arc(c, c, 80 * k, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.36)';
  ctx.lineWidth = 3 * k;
  ctx.beginPath();
  ctx.arc(c, c, 58 * k, 0, Math.PI * 2);
  ctx.stroke();

  const core = ctx.createRadialGradient(c, c, 0, c, c, 30 * k);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.55, 'rgba(255,255,255,.95)');
  core.addColorStop(1, 'rgba(190,230,255,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(c, c, 30 * k, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = maxAnisotropy(renderer, 8);
  return texture;
}

export function createLightPoolTexture(): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = createCanvas(size);
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, 'rgba(255,244,226,.60)');
  gradient.addColorStop(0.35, 'rgba(255,238,214,.26)');
  gradient.addColorStop(0.7, 'rgba(255,232,206,.07)');
  gradient.addColorStop(1, 'rgba(255,230,200,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createContactShadowTexture(): THREE.Texture {
  const size = 128;
  const { canvas, ctx } = createCanvas(size);
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, 'rgba(0,0,0,.55)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,.22)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createThresholdTexture(): THREE.Texture {
  const { canvas, ctx } = createCanvas(256, 64);
  const gradient = ctx.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, 'rgba(110,220,170,0)');
  gradient.addColorStop(0.45, 'rgba(120,230,180,.55)');
  gradient.addColorStop(0.55, 'rgba(120,230,180,.55)');
  gradient.addColorStop(1, 'rgba(110,220,170,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const size = 256;
  const faces: HTMLCanvasElement[] = [];

  for (let face = 0; face < 6; face += 1) {
    const { canvas, ctx } = createCanvas(size);
    if (face === 2) {
      // +Y ceiling
      ctx.fillStyle = '#20242c';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fff0d8';
      for (let y = 24; y < size; y += 52) ctx.fillRect(12, y, size - 24, 10);
    } else if (face === 3) {
      // -Y floor
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, size, size);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#2b3038');
      gradient.addColorStop(0.45, '#171a20');
      gradient.addColorStop(1, '#0d0f13');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(255,214,166,.42)';
      ctx.fillRect(0, 40, size, 12);
      ctx.fillStyle = 'rgba(150,200,255,.10)';
      ctx.fillRect(0, 148, size, 60);
    }
    faces.push(canvas);
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();
  const target = pmrem.fromCubemap(cubeTexture);
  pmrem.dispose();
  return target.texture;
}
