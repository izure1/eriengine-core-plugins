import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME GLOOMY_FS

precision mediump float;

//"in" attributes from our vertex shader
varying vec2 outTexCoord;

//declare uniforms
uniform sampler2D uMainSampler;

void main()
{
    vec4 color = texture2D(uMainSampler, outTexCoord);
	  float gray = dot(vec3(color), vec3(0.299, 0.587, 0.114));
	  gl_FragColor = vec4(vec3(gray) * vec3(color), 1.0);
}
`;

export class GloomyPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
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