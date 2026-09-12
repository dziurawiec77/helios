import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, useCursor } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BODIES, BODY_BY_ID, hitRadius, type BodyDef, type BodyId } from "@/lib/solar/bodies";
import { bodyObjects, inputFlags, registerBody, simClock, SPACE } from "@/lib/solar/runtime";
import { useSolarStore } from "@/lib/solar/store";
import { getBodyTexture } from "@/lib/solar/textures";

const MAPS: Record<string, string> = {
  sun: "/maps/sun.jpg",
  mercury: "/maps/mercury.jpg",
  venus: "/maps/venus.jpg",
  earth: "/maps/earth.jpg",
  moon: "/maps/moon.jpg",
  mars: "/maps/mars.jpg",
  jupiter: "/maps/jupiter.jpg",
  saturn: "/maps/saturn.jpg",
  uranus: "/maps/uranus.jpg",
  neptune: "/maps/neptune.jpg",
};

const mapCache = new Map<string, THREE.Texture>();

function useOptionalMap(url: string | null) {
  const [tex, setTex] = useState<THREE.Texture | null>(() =>
    url ? (mapCache.get(url) ?? null) : null,
  );

  useEffect(() => {
    if (!url) {
      setTex(null);
      return;
    }
    const hit = mapCache.get(url);
    if (hit) {
      setTex(hit);
      return;
    }
    let dead = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        if (dead) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        mapCache.set(url, t);
        setTex(t);
      },
      undefined,
      () => {
        if (!dead) setTex(null);
      },
    );
    return () => {
      dead = true;
    };
  }, [url]);

  return tex;
}

const OVERVIEW_POS = new THREE.Vector3(18, 15, 52);
const _offset = new THREE.Vector3();
const _world = new THREE.Vector3();
const _prevTarget = new THREE.Vector3();
const _dummy = new THREE.Object3D();

type ControlsApi = {
  target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  autoRotate: boolean;
  enableRotate: boolean;
  enabled: boolean;
  update: () => void;
};

const ATM_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const ATM_FRAG = /* glsl */ `
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float f = pow(1.0 - abs(dot(vNormal, vView)), 2.4);
  gl_FragColor = vec4(uColor, f * 0.22);
}
`;

const GLOW_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float f = pow(1.0 - abs(dot(vNormal, vView)), 1.6);
  gl_FragColor = vec4(uColor, f * 0.62);
}
`;

function noopRaycast() {}

function hash2(x: number, y: number, seed: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 0.013) * 43758.5453;
  return n - Math.floor(n);
}

function Atmosphere({ radius, color }: { radius: number; color: string }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) } }),
    [color],
  );
  return (
    <mesh scale={1.08} raycast={noopRaycast}>
      <sphereGeometry args={[radius, 32, 24]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        vertexShader={ATM_VERT}
        fragmentShader={ATM_FRAG}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

function OrbitPath({ radius, active }: { radius: number; active: boolean }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const n = 160;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color={active ? SPACE.orbitActive : SPACE.orbit}
      lineWidth={active ? 1.05 : 0.7}
      transparent
      opacity={active ? 0.55 : 0.22}
      depthWrite={false}
      toneMapped={false}
    />
  );
}

function BodyLabel({ body, selected }: { body: BodyDef; selected: boolean }) {
  const group = useRef<THREE.Group>(null);
  const showLabels = useSolarStore((s) => s.showLabels);

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    g.getWorldPosition(_world);
    const dist = camera.position.distanceTo(_world);
    const tooClose = dist < body.radius * 3.2 + 1.2;
    const tooFar = dist > 180;
    const selectedId = useSolarStore.getState().selectedId;
    const related =
      selected ||
      selectedId === body.id ||
      selectedId === body.parent ||
      (selectedId === "earth" && body.id === "moon");
    const hideMoon = Boolean(body.parent) && !related && dist > 8;
    g.visible = (showLabels || related) && !tooClose && !tooFar && !hideMoon;
  });

  return (
    <group ref={group} position={[0, body.radius + 0.4, 0]}>
      <Html
        center
        sprite
        distanceFactor={22}
        pointerEvents="none"
        zIndexRange={[1, 1]}
        style={{ pointerEvents: "none" }}
      >
        <span className={selected ? "planet-label planet-label-active" : "planet-label"}>
          {body.name}
        </span>
      </Html>
    </group>
  );
}

function PlanetMesh({ body }: { body: BodyDef }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectedId = useSolarStore((s) => s.selectedId);
  const selected = selectedId === body.id;
  useCursor(hovered);

  const fileMap = useOptionalMap(MAPS[body.id] ?? MAPS.mercury);
  const nightMap = useOptionalMap(body.id === "earth" ? "/maps/earth-night.png" : null);
  const cloudTex = useOptionalMap(body.clouds ? "/maps/earth-clouds.png" : null);
  const map = fileMap ?? getBodyTexture(body.id);
  const night = body.id === "earth" ? nightMap : null;
  const cloudMap = body.clouds ? cloudTex : null;
  const ringMap = useMemo(
    () => (body.hasRings ? getBodyTexture("saturn-rings") : null),
    [body.hasRings],
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const { paused, speed } = useSolarStore.getState();
    if (paused) return;
    const spin = (Math.PI * 2 * d * speed) / body.rotationPeriod;
    if (meshRef.current) meshRef.current.rotation.y += spin;
    if (cloudsRef.current) cloudsRef.current.rotation.y += spin * 1.35;
  });

  const onPick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const store = useSolarStore.getState();
    store.select(store.selectedId === body.id ? null : body.id);
  };

  return (
    <group rotation={[0, 0, body.tilt]}>
      <mesh
        ref={meshRef}
        onClick={onPick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[body.radius, 48, 32]} />
        <meshStandardMaterial
          map={map}
          roughness={0.38}
          metalness={0.08}
          emissiveMap={night ?? map}
          emissive={night ? "#ffc98a" : "#ffffff"}
          emissiveIntensity={night ? 1.35 : 0.28}
        />
      </mesh>
      <mesh
        onClick={onPick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hitRadius(body), 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {body.atmosphere ? <Atmosphere radius={body.radius} color={body.atmosphere} /> : null}
      {cloudMap ? (
        <mesh ref={cloudsRef} raycast={noopRaycast}>
          <sphereGeometry args={[body.radius * 1.02, 32, 24]} />
          <meshStandardMaterial
            map={cloudMap}
            transparent
            opacity={0.42}
            depthWrite={false}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ) : null}
      {ringMap ? (
        <mesh rotation-x={Math.PI / 2} raycast={noopRaycast}>
          <ringGeometry args={[body.radius * 1.35, body.radius * 2.35, 96]} />
          <meshBasicMaterial
            map={ringMap}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      <BodyLabel body={body} selected={selected} />
    </group>
  );
}

function Sun() {
  const groupRef = useRef<THREE.Group>(null);
  const selected = useSolarStore((s) => s.selectedId) === "sun";
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const fileMap = useOptionalMap(MAPS.sun);
  const map = fileMap ?? getBodyTexture("sun");
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color("#e8b06a") } }),
    [],
  );
  const body = BODY_BY_ID.sun;

  useEffect(() => {
    registerBody("sun", groupRef.current);
    return () => registerBody("sun", null);
  }, []);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const { paused, speed } = useSolarStore.getState();
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += (Math.PI * 2 * d * speed) / body.rotationPeriod;
  });

  const onPick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const store = useSolarStore.getState();
    store.select(store.selectedId === "sun" ? null : "sun");
  };

  return (
    <group rotation={[0, 0, body.tilt]}>
    <group ref={groupRef}>
      <mesh
        onClick={onPick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[body.radius, 48, 32]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh scale={1.12} raycast={noopRaycast}>
        <sphereGeometry args={[body.radius, 32, 24]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          vertexShader={GLOW_VERT}
          fragmentShader={GLOW_FRAG}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.32} raycast={noopRaycast}>
        <sphereGeometry args={[body.radius, 24, 16]} />
        <meshBasicMaterial
          color="#e0a060"
          transparent
          opacity={0.045}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#f3d7a8" intensity={56} decay={0.28} distance={200} />
      <BodyLabel body={body} selected={selected} />
    </group>
    </group>
  );
}

function isFocusLocked(body: BodyDef, selectedId: BodyId | null) {
  if (!selectedId || selectedId === "sun") return false;
  if (body.id === selectedId || body.parent === selectedId) return true;
  const sel = BODIES.find((b) => b.id === selectedId);
  if (!sel?.parent) return false;
  return body.id === sel.parent || body.parent === sel.parent;
}

function OrbitingBody({ body }: { body: BodyDef }) {
  const pivot = useRef<THREE.Group>(null);
  const holder = useRef<THREE.Group>(null);
  const hold = useRef(0);
  const selected = useSolarStore((s) => s.selectedId) === body.id;
  const showOrbits = useSolarStore((s) => s.showOrbits);

  useEffect(() => {
    registerBody(body.id, holder.current);
    return () => registerBody(body.id, null);
  }, [body.id]);

  useFrame((_, delta) => {
    if (!pivot.current) return;
    const { paused, speed, selectedId } = useSolarStore.getState();
    if (isFocusLocked(body, selectedId) && !paused) {
      hold.current += Math.min(delta, 0.1) * speed;
    }
    const t = simClock.time - hold.current;
    pivot.current.rotation.y = (t / body.orbitPeriod) * Math.PI * 2 + body.phase;
  });

  const moons = BODIES.filter((b) => b.parent === body.id);

  return (
    <group rotation={[body.inclination, 0, 0]}>
      {showOrbits ? <OrbitPath radius={body.orbitRadius} active={selected} /> : null}
      <group ref={pivot}>
        <group ref={holder} position={[body.orbitRadius, 0, 0]}>
          <PlanetMesh body={body} />
          {moons.map((moon) => (
            <OrbitingBody key={moon.id} body={moon} />
          ))}
        </group>
      </group>
    </group>
  );
}

function AsteroidBelt() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 320;
  const data = useMemo(() => {
    const out: { r: number; a: number; y: number; s: number; spin: number }[] = [];
    for (let i = 0; i < count; i++) {
      const n = hash2(i, 3, 99);
      const n2 = hash2(i, 7, 12);
      const n3 = hash2(i, 11, 4);
      out.push({
        r: 23.6 + n * 3.4,
        a: n2 * Math.PI * 2,
        y: (n3 - 0.5) * 0.5,
        s: 0.018 + hash2(i, 19, 2) * 0.04,
        spin: 0.035 + n * 0.04,
      });
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const d = Math.min(delta, 0.1);
    const { paused, speed } = useSolarStore.getState();
    for (let i = 0; i < count; i++) {
      const a = data[i];
      if (!paused) a.a += a.spin * speed * d;
      _dummy.position.set(Math.cos(a.a) * a.r, a.y, Math.sin(a.a) * a.r);
      _dummy.rotation.set(a.a, a.a * 0.4, a.y);
      _dummy.scale.setScalar(a.s);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} raycast={noopRaycast}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a4640" roughness={0.96} metalness={0.02} />
    </instancedMesh>
  );
}

function Starfield() {
  const geom = useMemo(() => {
    const n = 5600;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const milky = i < 1400;
      const r = 80 + hash2(i, 1, 8) * 180;
      const theta = hash2(i, 2, 3) * Math.PI * 2;
      const phi = milky
        ? Math.PI / 2 + (hash2(i, 4, 5) - 0.5) * 0.28
        : Math.acos(2 * hash2(i, 4, 5) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const t = hash2(i, 9, 1);
      if (t < 0.12) {
        colors[i * 3] = 0.72;
        colors[i * 3 + 1] = 0.82;
        colors[i * 3 + 2] = 1;
      } else if (t < 0.2) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.88;
        colors[i * 3 + 2] = 0.72;
      } else {
        const v = 0.72 + hash2(i, 6, 2) * 0.28;
        colors[i * 3] = v;
        colors[i * 3 + 1] = v;
        colors[i * 3 + 2] = v;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <points geometry={geom} frustumCulled={false} raycast={noopRaycast}>
      <pointsMaterial
        size={1.15}
        vertexColors
        sizeAttenuation={false}
        transparent
        opacity={0.88}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function SimulationClock() {
  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const { paused, speed } = useSolarStore.getState();
    if (!paused) simClock.time += d * speed;
  });
  return null;
}

function CameraRig({ reduceMotion }: { reduceMotion: boolean }) {
  const { camera } = useThree();
  const lastId = useRef<BodyId | null>(null);
  const lastNonce = useRef(0);
  const easingDist = useRef(false);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const controls = state.controls as unknown as ControlsApi | undefined;
    if (!controls) return;

    const { selectedId, viewNonce } = useSolarStore.getState();
    const followT = 1 - Math.exp(-3.2 * d);
    const distT = 1 - Math.exp(-2.2 * d);

    if (viewNonce !== lastNonce.current) {
      lastNonce.current = viewNonce;
      easingDist.current = true;
    }
    if (selectedId !== lastId.current) {
      lastId.current = selectedId;
      easingDist.current = true;
    }

    controls.autoRotate = !selectedId && !reduceMotion && !inputFlags.dragging;

    if (selectedId) {
      const obj = bodyObjects.get(selectedId);
      const def = BODY_BY_ID[selectedId];
      if (obj && def) {
        obj.getWorldPosition(_world);
        _prevTarget.copy(controls.target);
        controls.target.lerp(_world, followT);
        camera.position.add(_offset.copy(controls.target).sub(_prevTarget));

        const desired = Math.max(def.radius * 3.8, 2.8);
        controls.minDistance = Math.max(def.radius * 2.4, 1.4);
        controls.maxDistance = desired * 4.5;

        if (easingDist.current) {
          _offset.copy(camera.position).sub(controls.target);
          const len = Math.max(_offset.length(), 0.001);
          const next = THREE.MathUtils.lerp(len, desired, distT);
          _offset.multiplyScalar(next / len);
          camera.position.copy(controls.target).add(_offset);
          if (Math.abs(next - desired) < 0.08) easingDist.current = false;
        }
      }
    } else {
      controls.minDistance = 12;
      controls.maxDistance = 140;
      if (easingDist.current) {
        controls.target.lerp(_world.set(0, 0, 0), distT);
        camera.position.lerp(OVERVIEW_POS, distT);
        if (camera.position.distanceTo(OVERVIEW_POS) < 0.4) easingDist.current = false;
      }
    }
  });

  return null;
}

function Scene({ reduceMotion }: { reduceMotion: boolean }) {
  const planets = BODIES.filter((b) => !b.parent && b.id !== "sun");

  return (
    <>
      <color attach="background" args={[SPACE.bg]} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={["#6a7a98", "#1a140e", 0.62]} />
      <Starfield />
      <SimulationClock />
      <Sun />
      {planets.map((body) => (
        <OrbitingBody key={body.id} body={body} />
      ))}
      <AsteroidBelt />
      <CameraRig reduceMotion={reduceMotion} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!reduceMotion}
        autoRotateSpeed={0.14}
        minPolarAngle={0.42}
        maxPolarAngle={Math.PI / 2 - 0.08}
        minDistance={12}
        maxDistance={140}
        onStart={() => {
          inputFlags.dragging = true;
        }}
        onEnd={() => {
          inputFlags.dragging = false;
        }}
      />
    </>
  );
}

export function SolarSystem() {
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [mobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches,
  );

  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        camera={{ position: [18, 15, 52], fov: 38, near: 0.1, far: 420 }}
        dpr={mobile ? [1, 1.25] : [1, 1.75]}
        gl={{
          antialias: !mobile,
          alpha: false,
          preserveDrawingBuffer: !mobile,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.32,
          powerPreference: mobile ? "low-power" : "high-performance",
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
        }}
        onPointerMissed={() => {
          if (!inputFlags.dragging) useSolarStore.getState().select(null);
        }}
      >
        <Scene reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
