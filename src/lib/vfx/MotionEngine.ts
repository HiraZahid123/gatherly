import { Agent, Bounds, MotionStrategy } from "./types";

export class MotionEngine {
    private pool: Agent[];
    private activeCount: number = 0;
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
        this.pool = Array.from({ length: maxSize }, (_, i) => ({
            id: `agent-${i}`,
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            vx: 0,
            vy: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            isActive: false,
            lifetime: 0,
            age: 0,
            seed: Math.random() * 1000,
        }));
    }

    public spawn(config: Partial<Agent>): Agent | null {
        // Find an inactive agent in the pool
        const agent = this.pool.find(a => !a.isActive);
        if (!agent) return null;

        Object.assign(agent, {
            x: config.x ?? 0,
            y: config.y ?? 0,
            prevX: config.x ?? 0,
            prevY: config.y ?? 0,
            vx: config.vx ?? 0,
            vy: config.vy ?? 0,
            rotation: config.rotation ?? 0,
            scale: config.scale ?? 1,
            opacity: config.opacity ?? 1,
            isActive: true,
            lifetime: config.lifetime ?? Infinity,
            age: 0,
            color: config.color,
            image: config.image,
            seed: Math.random() * 1000,
        });

        this.activeCount++;
        return agent;
    }

    public update(deltaTime: number, bounds: Bounds, strategy: MotionStrategy) {
        for (const agent of this.pool) {
            if (!agent.isActive) continue;

            agent.prevX = agent.x;
            agent.prevY = agent.y;
            agent.age += deltaTime;

            // Kill if lifetime exceeded
            if (agent.age > agent.lifetime) {
                this.deactivate(agent);
                continue;
            }

            // Apply behavioral strategy
            strategy.update(agent, deltaTime, bounds);
        }
    }

    public deactivate(agent: Agent) {
        if (agent.isActive) {
            agent.isActive = false;
            this.activeCount--;
        }
    }

    public getActiveAgents(): Agent[] {
        return this.pool.filter(a => a.isActive);
    }

    public clear() {
        this.pool.forEach(a => { a.isActive = false; });
        this.activeCount = 0;
    }
}
