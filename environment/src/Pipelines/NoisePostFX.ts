import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME NOISE_FS;

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uSeed;
varying vec2 outTexCoord;

float OPACITY = 0.3;

float rand(vec2 coord) {
	return fract(sin(dot(coord, vec2(uSeed, uSeed * uSeed)) * 1000.0) * 1000.0);
}

void main( void )
{
  vec3 textureColor = texture2D(uMainSampler, outTexCoord).rgb;
  vec3 noiseColor = vec3(rand(outTexCoord));

  gl_FragColor = vec4(mix(textureColor, noiseColor, OPACITY), 1.0);
}
`;

export class NoisePostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader,
      uniforms: [
        'uProjectionMatrix',
        'uMainSampler',
        'uSeed'
      ]
    } as WebGLPipelineConfig)
  }

  onPreRender(): void {
    this.set1f('uSeed', Math.random())
  }
}