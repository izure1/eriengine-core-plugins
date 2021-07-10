import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME FEELING_FLASH_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uStartTime;
uniform float uIntensity;
uniform float uDuration;
uniform float uCircleScale;
uniform vec3 uAmbientColor;

float endTime = uStartTime + uDuration;
varying vec2 outTexCoord;

vec4 vignette(vec4 color) {
  float t = (uTime - uStartTime) / uDuration;
  float tRad = 1.0 - sin(radians(90.0 * t));

  vec2 position = outTexCoord - vec2(0.5);
  
  float radius = length(position);
  float vignette = smoothstep(1.0, 1.0 - uCircleScale, radius);

  color.rgb = mix(color.rgb, uAmbientColor.rgb * uIntensity, (1.0 - vignette) * tRad);

  return color;
}

void main( void )
{
  gl_FragColor = endTime < uTime ?
    texture2D(uMainSampler, outTexCoord) :
    vignette(texture2D(uMainSampler, outTexCoord));
}
`;

export class FlashPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  protected time: number = 0
  protected intensity: number = 1
  protected duration: number = 0
  protected startTime: number = 0
  protected circleScale: number = 0.7
  protected ambientColor: [number, number, number] = [0, 0, 0]
  private step: number = 1000 / 60

  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader,
      uniforms: [
        'uProjectionMatrix',
        'uMainSampler',
        'uTime',
        'uStartTime',
        'uIntensity',
        'uDuration',
        'uCircleScale',
        'uAmbientColor'
      ]
    } as WebGLPipelineConfig)
  }

  /**
   * 화면에 비네트 효과로 번쩍임 효과를 시작합니다.
   * @param ambientColor 비네트 색상입니다.
   * @param circleScale 비네트 원형의 크기입니다. 이 값은 `0 ~ 1` 사이의 실수를 가집니다. 가령 이 값이 0.7 이라면 화면의 70% 크기의 원형의 비네트 효과가 됩니다.
   * @param intensity 색상의 강도입니다.
   * @param duration 비네트 효과가 작동할 시간(ms)입니다.
   */
  start(ambientColor: Phaser.Display.Color, circleScale: number, intensity: number, duration: number): this {
    const { redGL, greenGL, blueGL } = ambientColor

    this.startTime = this.time
    this.intensity = intensity
    this.duration = duration
    this.circleScale = circleScale
    this.ambientColor = [redGL, greenGL, blueGL]
    
    return this
  }

  onPreRender(): void {
    this.time += this.step

    this.set1f('uTime', this.time)
    this.set1f('uStartTime', this.startTime)
    this.set1f('uDuration', this.duration)
    this.set1f('uIntensity', this.intensity)
    this.set1f('uCircleScale', this.circleScale)
    this.set3f('uAmbientColor', ...this.ambientColor)
  }
}