import { Agent, Bounds, MotionStrategy } from "../types";
import { perlin2D } from "../utils";

export class FloralEmergenceStrategy implements MotionStrategy {
    private floatSpeed: number;
    private rotationSpeed: number;

    constructor(floatSpeed: number = 0.005, rotationSpeed: number = 0.002) {
        this.floatSpeed = floatSpeed;
        this.rotationSpeed = rotationSpeed;
    }

    public update(agent: Agent, deltaTime: number, bounds: Bounds): void {
        const t = agent.age / 1000; // time in seconds

        // 1. Lifecycle: Emergence and Disappearance
        // We use a normalized 0-1-0 curve for opacity and scale
        // Lifetime is expected to be around 10-15 seconds
        const lifeRatio = agent.age / agent.lifetime;

        // Appear phase (first 2s)
        if (agent.age < 2000) {
            agent.opacity = (agent.age / 2000);
            agent.scale = (0.5 + (agent.age / 2000) * 0.5);
        }
        // Disappear phase (last 3s)
        else if (lifeRatio > 0.8) {
            const fadeRatio = (1 - lifeRatio) / 0.2;
            agent.opacity = Math.max(0, fadeRatio);
            agent.scale = Math.max(0, 0.7 + fadeRatio * 0.3);
        } else {
            agent.opacity = 1;
            agent.scale = 1;
        }

        // 2. Organic Drifting (Noise based)
        const nx = perlin2D(agent.seed, t * this.floatSpeed) - 0.5;
        const ny = perlin2D(agent.seed + 100, t * this.floatSpeed) - 0.5;

        agent.vx = nx * 8; // Very slow drift
        agent.vy = ny * 8;

        agent.x += agent.vx * (deltaTime / 16.6);
        agent.y += agent.vy * (deltaTime / 16.6);

        // 3. Gentle 3D-like Rotation
        // We oscillate the rotation slightly to simulate depth
        agent.rotation += this.rotationSpeed * (deltaTime / 16.6);
    }
}
