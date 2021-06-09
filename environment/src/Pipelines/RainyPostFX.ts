import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME RAINY_FS

precision mediump float;

float OPACITY = 0.3;
float INTENSITY = 0.05;

uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;

void main( void )
{
  vec2 uv = vec2(outTexCoord);
  uv += (texture2D(uMainSampler, uv + vec2(uTime/10.0,uTime/1.0)).rb-vec2(.53))*INTENSITY;

  gl_FragColor = vec4(texture2D(uMainSampler, uv).rgb, 1.0);
}
`;

export class RainyPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private time: number = 0
  private texture!: WebGLTexture
  
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

    this.loadTexture()
  }

  private loadTexture(): void {
    const texture = this.gl.createTexture()
    if (texture === null) {
      throw 'Texture load fail.'
    }

    this.texture = texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
  }

  onPreRender(): void {
    this.time += 0.016

    this.set1f('uTime', this.time)
    this.setTexture2D()

    var a = this.gl.createTexture()
  }
}