"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, PlaneGeometry, ShaderMaterial, DoubleSide } from "three";

// Two layers: foreground (fast) and background (slow) for parallax depth
const FOREGROUND_COUNT = 60000;
const BACKGROUND_COUNT = 40000;
const PLANE_SIZE = 60;

// Full GLSL Simplex Noise
const noiseGLSL = `
  vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute3(vec3 x) { return mod289_3(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_2(i);
    vec3 p = permute3(permute3(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m = max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m = m*m; m = m*m;
    vec3 xv = 2.0*fract(p*C.www)-1.0;
    vec3 h = abs(xv)-0.5;
    vec3 a0 = xv-floor(xv+0.5);
    m *= 1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x *x0.x  + h.x *x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0*dot(m,g);
  }
`;

// ─── VERTEX SHADER ──────────────────────────────────────────────────────────
const grassVertexShader = `
  varying vec2 vUv;
  varying float vBend;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uSpeedMult;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vec3 basePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    vWorldPos = basePos;

    float t = uTime * uSpeedMult;
    vec2 diag = (basePos.xz + vec2(t * 0.8, t * 0.6)) * 0.07;

    float wave1 = snoise(diag);
    float wave2 = snoise(diag * 2.1 + 3.7) * 0.45;
    float sCurve = wave1 + wave2;

    float slash = sin((basePos.x - basePos.z) * 0.15 + t * 1.2) * 0.5 + 0.5;

    float phase = uv.y * 2.2;
    float sway  = sin(t * 1.5 + sCurve * 2.5 - phase) * sCurve;

    vec3 pos = position;
    pos.x *= (1.0 - uv.y * 0.55);
    pos.z *= (1.0 - uv.y * 0.3);

    float strength = pow(uv.y, 1.8) * sway * 0.9;
    pos.x += strength;
    pos.z += strength * 1.1;

    vBend = clamp(sCurve * 0.5 + 0.5, 0.0, 1.0) * 0.7 + slash * 0.3;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

// ─── FRAGMENT SHADER ─────────────────────────────────────────────────────────
const grassFragmentShader = `
  varying vec2 vUv;
  varying float vBend;
  varying vec3 vWorldPos;
  uniform float uTime;

  ${noiseGLSL}

  vec3 prismatic(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
  }

  void main() {
    vec3 malachite  = vec3(0.04, 0.55, 0.30);
    vec3 emerald    = vec3(0.08, 0.78, 0.38);
    vec3 neonLime   = vec3(0.80, 1.00, 0.00);
    vec3 sunGold    = vec3(1.00, 0.84, 0.00);
    vec3 magenta    = vec3(0.90, 0.10, 0.75);
    vec3 violet     = vec3(0.55, 0.10, 0.90);
    vec3 teal       = vec3(0.00, 0.60, 0.65);

    vec3 baseCol = mix(malachite, emerald, vUv.y);
    baseCol      = mix(baseCol,   neonLime, pow(vUv.y, 2.0));

    vec3 bentCol = mix(baseCol, sunGold, vBend * 0.65);

    float slashBright = sin((vWorldPos.x - vWorldPos.z) * 0.18 + uTime * 1.2) * 0.5 + 0.5;
    bentCol *= mix(0.55, 1.35, slashBright);

    bentCol = mix(teal * 0.5, bentCol, 0.75 + slashBright * 0.25);

    float sparkleNoise = snoise(vWorldPos.xz * 0.4 + uTime * 0.05);
    float sparkleMask  = smoothstep(0.82, 0.95, sparkleNoise);
    vec3 sparkleCol    = mix(magenta, violet, fract(vWorldPos.x * 0.3 + vWorldPos.z * 0.17));
    bentCol = mix(bentCol, sparkleCol, sparkleMask * pow(vUv.y, 3.0) * 0.9);

    float tipMask  = pow(vUv.y, 4.0) * slashBright;
    vec3  prism    = prismatic(vBend * 0.5 + uTime * 0.08);
    bentCol = mix(bentCol, prism, tipMask * 0.35);

    float edgeX = abs(vUv.x - 0.5) * 2.0;
    float celEdge = smoothstep(0.75, 1.0, edgeX);
    bentCol *= mix(1.0, 0.25, celEdge);

    bentCol = pow(bentCol, vec3(0.85));
    bentCol *= mix(0.45, 1.5, vUv.y);

    gl_FragColor = vec4(bentCol, 1.0);
  }
`;

function placeBlades(
    mesh: InstancedMesh,
    count: number,
    planeSize: number,
    scaleRange: [number, number],
    dummy: Object3D
) {
    const gridRes = Math.ceil(Math.sqrt(count));
    const step = planeSize / gridRes;
    let placed = 0;

    for (let i = 0; i < gridRes && placed < count; i++) {
        for (let j = 0; j < gridRes && placed < count; j++) {
            const x = (i * step - planeSize / 2) + (Math.random() - 0.5) * step;
            const z = (j * step - planeSize / 2) + (Math.random() - 0.5) * step;
            const s = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);

            dummy.position.set(x, 0, z);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.scale.set(1, s, 1);
            dummy.updateMatrix();
            mesh.setMatrixAt(placed, dummy.matrix);
            placed++;
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
}

function GrassLayer({
    count,
    speedMult,
    scaleRange,
    planeSize,
}: {
    count: number;
    speedMult: number;
    scaleRange: [number, number];
    planeSize: number;
}) {
    const meshRef = useRef<InstancedMesh>(null);
    const placed = useRef(false);
    const dummy = useMemo(() => new Object3D(), []);

    const { geometry, material } = useMemo(() => {
        const geo = new PlaneGeometry(0.14, 1.0, 1, 12);
        geo.translate(0, 0.5, 0);

        const mat = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSpeedMult: { value: speedMult },
            },
            vertexShader: grassVertexShader,
            fragmentShader: grassFragmentShader,
            side: DoubleSide,
        });

        return { geometry: geo, material: mat };
    }, [speedMult]);

    useFrame((state) => {
        if (!meshRef.current) return;

        if (!placed.current) {
            placeBlades(meshRef.current, count, planeSize, scaleRange, dummy);
            placed.current = true;
        }

        const mat = meshRef.current.material as ShaderMaterial;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
    });

    return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

export default function MeadowTheme() {
    return (
        <>
            <GrassLayer count={BACKGROUND_COUNT} speedMult={0.4} scaleRange={[0.6, 1.1]} planeSize={PLANE_SIZE} />
            <GrassLayer count={FOREGROUND_COUNT} speedMult={1.0} scaleRange={[1.0, 1.8]} planeSize={PLANE_SIZE * 0.7} />
        </>
    );
}
