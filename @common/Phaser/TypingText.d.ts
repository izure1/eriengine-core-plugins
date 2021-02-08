import Phaser from 'phaser';
import { IntervalManager } from './IntervalManager';
declare class TypingText extends Phaser.GameObjects.Text {
    private textContent;
    private stepper;
    constructor(scene: Phaser.Scene, x: number, y: number, text: string | string[], style: Phaser.Types.GameObjects.Text.TextStyle);
    private registDestroy;
    private destroyStepper;
    startTyping(text: string, speed?: number): IntervalManager;
}
export { TypingText };
