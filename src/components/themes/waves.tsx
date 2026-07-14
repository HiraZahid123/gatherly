"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function WavesTheme() {
    const geometryRef = useRef<THREE.PlaneGeometry>(null);

    useFrame((state) => {
        if (!geometryRef.current) return;
        const time = state.clock.getElapsedTime();
        const position = geometryRef.current.attributes.position;
        
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            
            // Calculate wave height based on x, y, and time
            const waveX1 = 0.5 * Math.sin(x * 0.2 + time * 0.7);
            const waveX2 = 0.25 * Math.sin(x * 0.3 - time * 0.5);
            const waveY1 = 0.5 * Math.sin(y * 0.2 + time * 0.8);
            const waveY2 = 0.25 * Math.sin(y * 0.4 - time * 0.4);
            
            const z = waveX1 + waveX2 + waveY1 + waveY2;
            position.setZ(i, z);
        }
        
        position.needsUpdate = true;
        geometryRef.current.computeVertexNormals();
    });

    return (
        <group rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -2, -5]}>
            <ambientLight intensity={0.2} />
            <directionalLight position={[0, 10, 5]} intensity={1} color="#0ea5e9" />
            <pointLight position={[0, 2, 2]} intensity={2} color="#38bdf8" />
            <pointLight position={[10, 5, -5]} intensity={1.5} color="#818cf8" />

            <mesh>
                <planeGeometry ref={geometryRef} args={[50, 50, 64, 64]} />
                <meshStandardMaterial 
                    color="#0284c7" 
                    roughness={0.1}
                    metalness={0.8}
                    wireframe={false}
                />
            </mesh>
            
            {/* Overlay wireframe for a cool techy look */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[50, 50, 64, 64]} />
                <meshBasicMaterial 
                    color="#38bdf8" 
                    wireframe={true}
                    transparent
                    opacity={0.15}
                />
            </mesh>
        </group>
    );
}
