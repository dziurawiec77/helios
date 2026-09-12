import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function hash2(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 0.013) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const n00 = hash2(xi, yi, seed);
  const n10 = hash2(xi + 1, yi, seed);
  const n01 = hash2(xi, yi + 1, seed);
  const n11 = hash2(xi + 1, yi + 1, seed);
  return n00 * (1 - u) * (1 - v) + n10 * u * (1 - v) + n01 * (1 - u) * v + n11 * u * v;
}

function fbm(x: number, y: number, seed: number, octaves = 5) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise(x * freq, y * freq, seed + i * 19);
    amp *= 0.5;
    freq *= 2;
  }
  return value;
}

function mix(a: number[], b: number[], t: number) {
  const k = Math.min(1, Math.max(0, t));
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
}

function toTex(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function paintPlanet(
  id: string,
  w: number,
  h: number,
  pixel: (x: number, y: number, u: number, v: number) => [number, number, number, number?],
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    cache.set(id, fallback);
    return fallback;
  }
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const u = x / w;
      const v = y / h;
      const [r, g, b, a] = pixel(x, y, u, v);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a ?? 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = toTex(canvas);
  cache.set(id, tex);
  return tex;
}

export function getBodyTexture(id: string): THREE.CanvasTexture {
  const hit = cache.get(id);
  if (hit) return hit;

  if (id === "saturn-rings") return makeSaturnRings();
  if (id === "earth-clouds") return makeClouds();

  const size = id === "jupiter" || id === "earth" || id === "sun" ? 768 : 512;

  switch (id) {
    case "sun":
      return paintPlanet(id, size, size, (x, y) => {
        const n = fbm(x * 0.02, y * 0.02, 3, 4);
        const c = mix([255, 196, 110], [255, 230, 180], n);
        return [c[0], c[1], c[2]];
      });
    case "mercury":
      return paintPlanet(id, size, size, (x, y) => {
        const n = fbm(x * 0.04, y * 0.04, 11);
        const crater = Math.pow(noise(x * 0.09, y * 0.09, 44), 8);
        const c = mix([92, 86, 80], [168, 160, 150], n);
        const k = crater * 50;
        return [c[0] - k, c[1] - k, c[2] - k];
      });
    case "venus":
      return paintPlanet(id, size, size, (x, y) => {
        const swirl = fbm(x * 0.018 + y * 0.01, y * 0.05, 8);
        const c = mix([214, 176, 118], [240, 220, 176], swirl);
        return [c[0], c[1], c[2]];
      });
    case "earth":
      return paintPlanet(id, size, size, (x, y, u, v) => {
        const lat = v * 2 - 1;
        const land =
          fbm(x * 0.018, y * 0.028, 21) * 0.72 +
          0.18 * Math.sin(u * Math.PI * 2) * (1 - Math.abs(lat));
        const ice = Math.max(0, Math.abs(lat) - 0.72) / 0.28 + fbm(x * 0.05, y * 0.05, 3) * 0.12;
        let c: number[];
        if (ice > 0.42) {
          c = mix([226, 234, 242], [255, 255, 255], ice);
        } else if (land > 0.52) {
          const veg = fbm(x * 0.05, y * 0.05, 77);
          c = mix([62, 96, 52], [142, 128, 72], veg);
        } else {
          const deep = fbm(x * 0.03, y * 0.03, 9);
          c = mix([18, 58, 118], [64, 140, 176], deep);
        }
        return [c[0], c[1], c[2]];
      });
    case "moon":
      return paintPlanet(id, size, size, (x, y) => {
        const n = fbm(x * 0.035, y * 0.035, 18);
        const mare = fbm(x * 0.012, y * 0.012, 5);
        const base = mare > 0.58 ? [92, 90, 86] : [190, 186, 176];
        const c = mix(base, [230, 226, 216], n * 0.4);
        return [c[0], c[1], c[2]];
      });
    case "mars":
      return paintPlanet(id, size, size, (x, y, _u, v) => {
        const n = fbm(x * 0.03, y * 0.03, 31);
        const lat = v * 2 - 1;
        const ice = Math.max(0, Math.abs(lat) - 0.82) / 0.18;
        const c = mix([118, 54, 32], [196, 122, 78], n);
        const out = mix(c, [236, 236, 242], ice);
        return [out[0], out[1], out[2]];
      });
    case "jupiter":
      return paintPlanet(id, size, size, (x, y, u, v) => {
        const bands =
          Math.sin(v * Math.PI * 14 + fbm(x * 0.01, v * 18, 2) * 1.6) * 0.5 + 0.5;
        const pal = mix([214, 168, 114], [232, 214, 176], bands);
        const storm = Math.hypot((u - 0.72) * 2.8, (v - 0.58) * 6.2);
        const c = storm < 1 ? mix([186, 72, 48], pal, storm) : pal;
        return [c[0], c[1], c[2]];
      });
    case "saturn":
      return paintPlanet(id, size, size, (x, y, _u, v) => {
        const bands =
          Math.sin(v * Math.PI * 10 + fbm(x * 0.008, v * 12, 6) * 1.1) * 0.5 + 0.5;
        const c = mix([214, 196, 150], [236, 222, 186], bands);
        return [c[0], c[1], c[2]];
      });
    case "uranus":
      return paintPlanet(id, size, size, (x, y) => {
        const n = fbm(x * 0.012, y * 0.02, 14, 3);
        const c = mix([132, 196, 198], [186, 230, 232], n);
        return [c[0], c[1], c[2]];
      });
    case "neptune":
      return paintPlanet(id, size, size, (x, y, u, v) => {
        const n = fbm(x * 0.02, y * 0.03, 41);
        const c = mix([38, 74, 168], [92, 140, 214], n);
        const spot = Math.hypot((u - 0.35) * 3.4, (v - 0.48) * 7);
        const out = spot < 1 ? mix([18, 32, 92], c, spot) : c;
        return [out[0], out[1], out[2]];
      });
    default:
      return paintPlanet(id, 32, 32, () => [180, 180, 180]);
  }
}

function makeSaturnRings() {
  const w = 8;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return toTex(canvas);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / h;
    let alpha = 0;
    if (t > 0.06 && t < 0.96) {
      alpha = 0.55 + 0.35 * Math.sin(t * 42);
      if (t > 0.46 && t < 0.54) alpha *= Math.abs(t - 0.5) / 0.04;
      if (t > 0.7 && t < 0.74) alpha *= 0.25;
      alpha = Math.max(0, Math.min(1, alpha));
    }
    const col = mix([210, 196, 164], [120, 110, 92], t);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = Math.floor(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = toTex(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  cache.set("saturn-rings", tex);
  return tex;
}

function makeClouds() {
  return paintPlanet("earth-clouds", 512, 512, (x, y) => {
    const n = fbm(x * 0.03, y * 0.04, 90, 4);
    const a = Math.max(0, (n - 0.52) * 3.2);
    return [236, 240, 246, Math.floor(Math.min(1, a) * 210)];
  });
}
