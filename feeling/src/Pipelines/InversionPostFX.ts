import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME INVERSION_FS;

precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main( void )
{
  vec4 color = texture2D(uMainSampler, outTexCoord);
  gl_FragColor = vec4(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, 1);
}
`;

export class InversionPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader,
      uniforms: [
        'uProjectionMatrix',
        'uMainSampler'
      ]
    } as WebGLPipelineConfig)
  }
}