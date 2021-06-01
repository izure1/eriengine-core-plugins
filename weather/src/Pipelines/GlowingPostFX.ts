import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME GLOWING_FS

precision mediump float;

uniform float     uTime;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main( void )
{
    vec2 uv = outTexCoord;
    //uv.y *= -1.0;
    uv.y += (sin((uv.x + (uTime * 0.5)) * 10.0) * 0.1) + (sin((uv.x + (uTime * 0.2)) * 32.0) * 0.01);
    vec4 texColor = texture2D(uMainSampler, uv);
    gl_FragColor = texColor;
}
`;

export class GlowingPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
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

  onPreRender() {
    this.time += 0.005
    this.set1f('uTime', this.time)
  }
}