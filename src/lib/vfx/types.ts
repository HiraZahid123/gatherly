export interface Bounds {
    width: number;
    height: number;
}

export interface Agent {
    id: string;
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    vx: number;
    vy: number;
    rotation: number;
    scale: number;
    opacity: number;
    isActive: boolean;
    lifetime: number;
    age: number;
    color?: string;
    image?: HTMLCanvasElement | HTMLImageElement;
    seed: number;
}

export interface MotionStrategy {
    update(agent: Agent, deltaTime: number, bounds: Bounds): void;
}
