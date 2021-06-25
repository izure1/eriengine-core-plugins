import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME FROZEN_FS

precision mediump float;

const float BLUR_SCALE = 0.8;
const float BLINK_TIMESCALE = 1.0;
const float MIN_OPACITY = 0.25;
const vec3 CIRCLE_COLOR = vec3(0.6, 0.8, 0.9);

uniform sampler2D uMainSampler;
uniform float uTime;
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

export class FrozenPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private time: number = 0

  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader,
      uniforms: [
        'uProjectionMatrix',
        'uMainSampler',
        'uTime'
      ]
    } as WebGLPipelineConfig)
  }

  onPreRender(): void {
    this.time += 0.016

    this.set1f('uTime', this.time)
  }
}