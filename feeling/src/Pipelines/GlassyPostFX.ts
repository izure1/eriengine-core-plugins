import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME GLASSY_FS

precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main( void )
{
  vec4 dist = texture2D(uMainSampler, outTexCoord);
  vec2 distorter = dist.rg * vec2(0.05, 0.05);
  gl_FragColor = texture2D(uMainSampler, outTexCoord + distorter);
}
`;

export class GlassyPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
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