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
    private remainTime;
    private intervalTime;
    private isRunning;
    private onUpdateCallback;
    constructor(scene: Phaser.Scene);
    start(interval: number, maxiumStep: number): void;
    stop(): void;
    private onUpdate;
    private registUpdateHandler;
    private removeUpdateHandler;
    destroy(): void;
}
export {};
