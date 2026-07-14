"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, ShaderMaterial, Vector2 } from "three";

// ─── GLSL: Ribbed Satin Curtain with Wave Animation ──────────────────────────
const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2  uResolution;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    float t = uTime * 0.4;
    vec2 uv = gl_FragCoord.xy / uResolution;
    
    // ── Domain Warping / Organic Movement ────────────────────────────────
    // Use noise to subtly move the coordinate system
    float distortion = noise(uv * 3.0 + t * 0.5) * 0.15;
    vec2 warpedUV = uv + vec2(distortion, distortion * 0.4);

    // ── Rib Grid with Distortion ──────────────────────────────────────────
    float ribCount = 65.0;
    float ribLocal = fract(warpedUV.x * ribCount);

    // ── Cylindrical 3D Shading ────────────────────────────────────────────
    float highlight = pow(cos((ribLocal - 0.5) * 3.14159), 3.0);
    highlight = clamp(highlight, 0.0, 1.0);

    // ── Realistic Weaving Animation ──────────────────────────────────────
    // "Proper graphics" using multiple octaves of overlapping waves
    float w1 = sin(warpedUV.x * 12.0 - t * 1.5) * 0.5 + 0.5; // Vertical flow
    float w2 = cos(warpedUV.y * 8.0 + t * 0.8 + warpedUV.x * 4.0) * 0.5 + 0.5; // Diagonal weave
    float w3 = noise(warpedUV * 4.0 - t * 0.3) * 0.6; // Large scale random shifting
    
    // Complex interference for a "liquid satin" feel
    float waveMod = (w1 * 0.4 + w2 * 0.4 + w3 * 0.2);
    waveMod = pow(waveMod, 1.2); 

    // ── Vertical Gradient (Atmosphere) ────────────────────────────────────
    float topLight = pow(1.0 - uv.y, 0.8);
    float vertGrad = mix(0.75, 1.15, topLight); // Brighter top (0.75 instead of 0.6)

    // ── Compose Cinematic Colors ──────────────────────────────────────────
    // Slightly brighter midnight base for clarity
    vec3 baseColor       = vec3(0.06, 0.06, 0.09);
    // Steel highlights for the ribs
    vec3 ribHighlight    = vec3(0.28, 0.30, 0.35);
    // Subtle oceanic / violet shimmer for the waves
    vec3 waveHighlight   = vec3(0.18, 0.22, 0.30);
    // Primary "weaving" shine
    vec3 silkGlow        = vec3(0.24, 0.26, 0.32);

    vec3 col = baseColor
             + (ribHighlight * highlight * 0.8)
             + (waveHighlight * highlight * (waveMod * 0.7))
             + (silkGlow * pow(waveMod, 2.0) * 0.4);

    // Add a very subtle pulsing glow to the whole fabric
    col += vec3(0.02, 0.02, 0.03) * sin(t * 0.5) * waveMod;

    col *= vertGrad;

    // ── Crisp Deep Shadows between ribs ───────────────────────────────────
    float edgeShadow = smoothstep(0.0, 0.1, ribLocal) * smoothstep(1.0, 0.9, ribLocal);
    col *= mix(0.3, 1.0, edgeShadow);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export default function StreakTheme() {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<ShaderMaterial | null>(null);
  const { size } = useThree();

  useEffect(() => {
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(size.width, size.height) },
      },
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    matRef.current = mat;
    if (meshRef.current) meshRef.current.material = mat;

    return () => mat.dispose();
  }, []);

  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uResolution.value.set(state.size.width, state.size.height);
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
