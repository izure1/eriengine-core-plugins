import { Actor } from './Actor';
declare type UpdateCallback = (time: number, delta: number) => void;
export declare class ActorDot {
    private jobmap;
    private actor;
    static update(dot: ActorDot, time: number, delta: number): void;
    static destroy(dot: ActorDot): void;
    constructor(actor: Actor);
    private get scene();
    private get now();
    start(key: string, duration: number, tickCallback?: UpdateCallback, doneCallback?: UpdateCallback): this;
    has(key: string): boolean;
    stop(key: string): this;
    private update;
    private destroy;
}
export {};
