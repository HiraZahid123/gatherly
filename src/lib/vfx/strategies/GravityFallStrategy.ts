import { Agent, Bounds, MotionStrategy } from "../types";

export class GravityFallStrategy implements MotionStrategy {
    private gravity: number;
    private swayIntensity: number;
    private swayFrequency: number;

    constructor(gravity: number = 2, swayIntensity: number = 5, swayFrequency: number = 0.002) {
        this.gravity = gravity;
        this.swayIntensity = swayIntensity;
        this.swayFrequency = swayFrequency;
    }

    public update(agent: Agent, deltaTime: number, bounds: Bounds): void {
        const time = Date.now() * this.swayFrequency;

        // Vertical constant fall
        agent.vy = this.gravity;

        // Horizontal sway using sine
        agent.vx = Math.sin(time + agent.seed) * this.swayIntensity;

        // Update position
        agent.x += agent.vx * (deltaTime / 16.6);
        agent.y += agent.vy * (deltaTime / 16.6);

        // Rotation based on sway
        agent.rotation += agent.vx * 0.05;

        // Reset if it goes off bottom
        if (agent.y > bounds.height + 50) {
            agent.y = -50;
            agent.x = Math.random() * bounds.width;
        }

        // Wrap horizontal edges
        if (agent.x < -50) agent.x = bounds.width + 50;
        if (agent.x > bounds.width + 50) agent.x = -50;
    }
}
