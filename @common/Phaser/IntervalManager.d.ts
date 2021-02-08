import Phaser from 'phaser';
import { TypedEmitter } from 'tiny-typed-emitter';
interface Events {
    step: (currentStep: number, maxiumStep: number) => void;
    done: (currentStep: number, maxiumStep: number) => void;
}
export declare class IntervalManager extends TypedEmitter<Events> {
    private scene;
    private currentStep;
    private maxiumStep;
    private intervalTime;
    private timeEvent;
    constructor(scene: Phaser.Scene);
    start(interval: number, maxiumStep: number): void;
    finish(): void;
    private destroyTimeEvent;
    private setTimeout;
    destroy(): void;
}
export {};
