import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME FEELING_HIT_FS

precision mediump float;

const float BLUR_SCALE = 0.8;
const float BLINK_TIMESCALE = 1.0;
const float MIN_OPACITY = 0.25;
const vec3 CIRCLE_COLOR = vec3(0.6, 0.8, 0.9);

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uIntensity;
varying vec2 outTexCoord;

vec4 vignette(vec4 color) {
  vec2 position = outTexCoord - vec2(0.5);
  float radius = length(position);
  float vignette = smoothstep(1.0, 1.0 - BLUR_SCALE, radius);

  color.rgb = mix(color.rgb, CIRCLE_COLOR.rgb * max(sin(uTime * BLINK_TIMESCALE), MIN_OPACITY), 1.0 - vignette);

  return color;
}

void main( void )
{
  gl_FragColor = vignette(texture2D(uMainSampler, outTexCoord));
}
`;

export class HitPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  protected time: number = 0
  protected color: number[] = [0, 0, 0, 0]
  protected intensity: number = 1
  protected duration: number = 0

  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader,
      uniforms: [
        'uProjectionMatrix',
        'uMainSampler',
        'uTime',
        'uIntensity'
      ]
    } as WebGLPipelineConfig)
  }

  start(color: Phaser.Types.Display.ColorObject, intensity: number, duration: number): this {
    const { r, g, b, a } = color

    this.color = new Phaser.Display.Color(r, g, b, a).gl
    this.intensity = intensity
    this.duration = duration
    this.time = 0
    
    return this
  }

  onPreRender(): void {
    this.time += 0.016

    this.set1f('uTime', this.time)
  }
}