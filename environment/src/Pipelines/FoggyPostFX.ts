import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME FOGGY_FS

precision mediump float;

varying vec2 outTexCoord;
uniform sampler2D uMainSampler;
uniform float uTime;

const vec3 color = vec3(1.0, 1.0, 1.0);
const float OPACITY = 0.2;
const int OCTAVES = 4;

float rand(vec2 coord) {
	return fract(sin(dot(coord, vec2(56, 78)) * 1000.0) * 1000.0);
}

float noise(vec2 coord) {
	vec2 i = floor(coord);
	vec2 f = fract(coord);

	// 4 corners of a rectangle surrounding our point
	float a = rand(i);
	float b = rand(i + vec2(1.0, 0.0));
	float c = rand(i + vec2(0.0, 1.0));
	float d = rand(i + vec2(1.0, 1.0));

	vec2 cubic = f * f * (3.0 - 2.0 * f);

	return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec2 coord) {
	float value = 0.0;
	float scale = 0.5;

	for(int i = 0; i < OCTAVES; i++){
		value += noise(coord) * scale;
		coord *= 2.0;
		scale *= 0.5;
	}
	return value;
}

void main() {
	vec2 coord = outTexCoord * 20.0;

	vec2 motion = vec2( fbm(coord + vec2(uTime * -0.5, uTime * 0.5)) );

	float final = fbm(coord + motion) * 0.5;

  vec3 textureColor = texture2D(uMainSampler, outTexCoord).rgb;
  vec3 fogColor = mix(color, textureColor, final);
  vec3 totalColor = mix(textureColor, fogColor, OPACITY);

	gl_FragColor = vec4(totalColor, 1);
}
`;

export class FoggyPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private time: number = 0;

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