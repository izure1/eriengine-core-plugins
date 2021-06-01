import Phaser from 'phaser'
import { WebGLPipelineConfig } from './Types'

const fragShader = `
#define SHADER_NAME RAINY_FS

precision mediump float;

uniform float u_time;          // a time value passed in by JavaScript
uniform mat4 u_view_inverse;   // view inverse (camera world matrix)
uniform mat4 u_view_projection;// view projection matrix

attribute vec4 a_vertex;       // the unit quad values
attribute vec4 a_position;     // the base position of this particle repeated for
                               // each vertex
attribute vec4 a_velocity;     // velocity for this quad, repeated for each vertex
attribute float a_time_offset; // a time offset for this particle 
                               // repeated for each vertex

// compute a position
float localTime = u_time + a_time_offset;
vec4 base_position = a_position + a_velocity * localTime;

// rotate quad so it's perpendicular to the view
vec4 quadX = viewInverse[0] * a_vertex.x;
vec4 quadZ = viewInverse[1] * a_vertex.y;

// compute the real world position for this vertex
vec4 position = base_position + quadX + quadZ;

// at this point position is the same as any other 'standard' 3d shader
// do with it whatever. Example:
gl_Position = viewProjectionMatrix * position;
`;

export class RainyPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
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

  onPreRender() {
    this.set1f('uResolution', this.renderer.width)
  }
}