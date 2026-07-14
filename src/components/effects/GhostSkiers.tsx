"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Vector3, CatmullRomCurve3 } from "three";
import { Trail } from "@react-three/drei";
import { LayerMaterial, Color, Depth, Fresnel } from "lamina";

const SKIER_COUNT = 30;
const SPEED = 0.2;

// Create a curvy path down the "mountain"
const curve = new CatmullRomCurve3([
    new Vector3(0, 5, -10),
    new Vector3(-2, 2, -5),
    new Vector3(3, 0, 0),
    new Vector3(-4, -3, 5),
    new Vector3(2, -6, 10),
    new Vector3(0, -10, 15),
]);

export default function GhostSkiers() {
    const meshRef = useRef<InstancedMesh>(null);
    const dummy = useMemo(() => new Object3D(), []);

    // Initial random positions along the curve
    const skiers = useMemo(() => {
        return new Array(SKIER_COUNT).fill(0).map(() => ({
            t: Math.random(), // Position along curve (0-1)
            speed: Math.random() * 0.002 + 0.001, // Random speed
            offset: (Math.random() - 0.5) * 2, // Random lateral offset
        }));
    }, []);

    useFrame(() => {
        if (!meshRef.current) return;

        skiers.forEach((skier, i) => {
            // Update position along curve
            skier.t += skier.speed;
            if (skier.t > 1) skier.t = 0; // Loop back to top

            // Get point on curve
            const position = curve.getPointAt(skier.t);

            // Add lateral movement/sway
            const tangent = curve.getTangentAt(skier.t);
            const normal = new Vector3(0, 1, 0);
            const binormal = new Vector3().crossVectors(tangent, normal);

            // Wobbly movement
            const sway = Math.sin(skier.t * 20 + i) * 0.5;
            position.add(binormal.multiplyScalar(skier.offset + sway));

            // Orient the mesh
            dummy.position.copy(position);
            dummy.lookAt(position.clone().add(tangent));
            dummy.scale.set(0.3, 0.3, 1.2); // Elongated "spirit" shape

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            {/* The Skiers */}
            <instancedMesh ref={meshRef} args={[undefined, undefined, SKIER_COUNT]}>
                <capsuleGeometry args={[0.2, 1, 8, 16]} />
                <LayerMaterial
                    lighting="physical"
                    transmission={1}
                    roughness={0.1}
                    thickness={2}
                >
                    <Depth colorA="#ffffff" colorB="#88ccff" alpha={0.5} mode="add" near={0} far={2} origin={[0, 0, 0]} />
                    <Fresnel color="#ffffff" mode="add" power={2} intensity={2} />
                    <Color color="#aaddff" alpha={0.3} mode="normal" />
                </LayerMaterial>
            </instancedMesh>

            {/* Ghost Trails for a few leading skiers */}
            {/* Note: Trails are expensive, so we just add a few manually for effect instead of all 30 */}
            <Trail width={1.5} length={8} color="#ffffff" attenuation={(t) => t * t}>
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
            </Trail>
        </group>
    );
}
