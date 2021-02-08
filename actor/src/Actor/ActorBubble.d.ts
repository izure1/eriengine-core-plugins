import Phaser from 'phaser';
import { Actor } from './Actor';
import { BubbleEmotion } from '../eriengine-core-plugin-actor';
import { Point2 } from "../../../@common/Math/MathUtil";
declare enum BubbleEmitterOffset {
    'top' = 0,
    'left' = 1,
    'right' = 2,
    'bottom' = 3,
    'top-left' = 4,
    'top-right' = 5,
    'bottom-left' = 6,
    'bottom-right' = 7
}
declare class ActorBubbleEmitter {
    private actor;
    private offset;
    private baseStyle;
    private appendStyle;
    private image;
    private text;
    private imageTween;
    private textTimeEvent;
    private isNotice;
    private noticeText;
    constructor(actor: Actor);
    private get scene();
    private get currentStyle();
    private generateObjects;
    private updatePosition;
    setAlign(align: 'left' | 'center' | 'right'): this;
    setVertical(vertical: 'top' | 'middle' | 'bottom'): this;
    setBaseTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this;
    clearBaseTextStyle(): this;
    setOffset(offset: Point2 | keyof typeof BubbleEmitterOffset): this;
    private appendTextStyle;
    private showText;
    private clearText;
    private clearTextStyle;
    private clearImageTween;
    private destroyText;
    private destroyImage;
    say(text: string, speed?: number, style?: Phaser.Types.GameObjects.Text.TextStyle): this;
    notice(text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle): this;
    private openEmotion;
    private closeEmotion;
    emotion(key: keyof typeof BubbleEmotion | string | Phaser.Textures.Texture, duration?: number): this;
    update(time: number, delta: number): void;
    destroy(): void;
}
export declare class ActorBubble {
    private actor;
    private emitters;
    static update(bubble: ActorBubble, time: number, delta: number): void;
    static destroy(bubble: ActorBubble): void;
    constructor(actor: Actor);
    private get scene();
    of(key: string): ActorBubbleEmitter;
    private updateTypers;
    private update;
    private destroy;
}
export {};
