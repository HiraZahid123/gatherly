import { Agent, Bounds, MotionStrategy } from "../types";
import { perlin2D } from "../utils";

export class RandomFloatStrategy implements MotionStrategy {
    private speed: number;
    private intensity: number;
    private noiseScale: number;

    constructor(speed: number = 0.05, intensity: number = 30, noiseScale: number = 0.005) {
        this.speed = speed;
        this.intensity = intensity;
        this.noiseScale = noiseScale;
    }

    public update(agent: Agent, deltaTime: number, bounds: Bounds): void {
        const time = Date.now() * this.speed;

        // Use unique seed offsets for each agent to ensure independent paths
        const nx = perlin2D(agent.seed + time * 0.01, agent.seed * 0.5) - 0.5;
        const ny = perlin2D(agent.seed * 0.5, agent.seed + time * 0.01) - 0.5;

        // Apply noise velocity
        agent.vx = nx * this.intensity;
        agent.vy = ny * this.intensity;

        // Update position
        agent.x += agent.vx * (deltaTime / 16.6); // Normalize to ~60fps
        agent.y += agent.vy * (deltaTime / 16.6);

        // Screen Wrapping
        if (agent.x < -100) agent.x = bounds.width + 100;
        if (agent.x > bounds.width + 100) agent.x = -100;
        if (agent.y < -100) agent.y = bounds.height + 100;
        if (agent.y > bounds.height + 100) agent.y = -100;

        // Subtle rotation based on movement
        agent.rotation += (agent.vx * 0.02);
    }
}
