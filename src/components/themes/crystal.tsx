"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, Environment } from "@react-three/drei";

export default function CrystalTheme() {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 50;
    
    // Create random positions and rotations for the crystals
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 30;
            const y = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 20 - 5;
            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI;
            const rz = Math.random() * Math.PI;
            const scale = 0.5 + Math.random() * 1.5;
            const speed = 0.05 + Math.random() * 0.2;
            temp.push({ x, y, z, rx, ry, rz, scale, speed });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;
        
        const time = state.clock.getElapsedTime();
        
        particles.forEach((particle, i) => {
            const { x, y, z, rx, ry, rz, scale, speed } = particle;
            
            // Gently float upwards and rotate
            const newY = y + time * speed;
            const wrappedY = ((newY + 15) % 30) - 15; // Wrap around
            
            dummy.position.set(x, wrappedY, z);
            dummy.rotation.set(rx + time * speed * 0.5, ry + time * speed * 0.5, rz);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={3} color="#a855f7" />
            <pointLight position={[-10, -10, -10]} intensity={3} color="#3b82f6" />
            <pointLight position={[0, 0, 5]} intensity={2} color="#ec4899" />
            
            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshPhysicalMaterial 
                        color="#ffffff"
                        transmission={0.9} 
                        opacity={1}
                        metalness={0.1}
                        roughness={0.1}
                        ior={1.5} 
                        thickness={2}
                        envMapIntensity={1}
                    />
                </instancedMesh>
            </Float>
        </group>
    );
}
