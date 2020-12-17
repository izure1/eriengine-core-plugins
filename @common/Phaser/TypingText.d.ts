import Phaser from 'phaser';
declare class TypingText extends Phaser.GameObjects.Text {
    private textContent;
    private stepper;
    constructor(scene: Phaser.Scene, x: number, y: number, text: string | string[], style: Phaser.Types.GameObjects.Text.TextStyle);
    private registDestroy;
    private destroyStepper;
    typingText(text: string, speed?: number): this;
}
export { TypingText };
