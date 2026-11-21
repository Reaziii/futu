import type { BaseImageSource, DocumentState, Renderer } from '../types';

const vertexSource = `#version 300 es
in vec2 aPosition;
in vec2 aTexCoord;
out vec2 vTexCoord;
void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentSource = `#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 outColor;

uniform sampler2D uImage;
uniform sampler2D uCurve;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform vec2 uTempTint;

float applyCurve(float value) {
  float coord = clamp(value, 0.0, 1.0);
  return texture(uCurve, vec2(coord, 0.5)).r;
}

vec3 applyCurve(vec3 color) {
  return vec3(applyCurve(color.r), applyCurve(color.g), applyCurve(color.b));
}

vec3 applyExposureContrast(vec3 color) {
  float exposure = pow(2.0, uExposure);
  color *= exposure;
  color = (color - 0.5) * (1.0 + uContrast) + 0.5;
  return color;
}

vec3 applySaturation(vec3 color) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luma), color, 1.0 + uSaturation);
}

vec3 applyTempTint(vec3 color) {
  vec3 tint = vec3(uTempTint.x, 0.0, -uTempTint.x) + vec3(uTempTint.y, -uTempTint.y, 0.0);
  return color + tint * 0.08;
}

void main() {
  vec4 texColor = texture(uImage, vTexCoord);
  vec3 color = texColor.rgb;
  color = applyExposureContrast(color);
  color = applySaturation(color);
  color = applyTempTint(color);
  color = applyCurve(color);
  outColor = vec4(color, texColor.a);
}
`;

export class Webgl2Renderer implements Renderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private imageTexture: WebGLTexture | null = null;
  private curveTexture: WebGLTexture | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private state: DocumentState | null = null;
  private readonly canvas: HTMLCanvasElement;
  private readonly baseImage: BaseImageSource;
  private readonly onModeChange: (mode: 'gpu' | 'cpu' | 'none') => void;
  private readonly onReadyChange: (ready: boolean) => void;

  constructor(
    canvas: HTMLCanvasElement,
    baseImage: BaseImageSource,
    onModeChange: (mode: 'gpu' | 'cpu' | 'none') => void,
    onReadyChange: (ready: boolean) => void
  ) {
    this.canvas = canvas;
    this.baseImage = baseImage;
    this.onModeChange = onModeChange;
    this.onReadyChange = onReadyChange;
  }

  async init() {
    const gl = this.canvas.getContext('webgl2');
    if (!gl) {
      this.onModeChange('cpu');
      return;
    }
    this.gl = gl;
    this.onModeChange('gpu');

    const vertex = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragment = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) {
      this.onModeChange('cpu');
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      this.onModeChange('cpu');
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      this.onModeChange('cpu');
      return;
    }

    this.program = program;
    this.setupGeometry();
    this.setupTextures();

    this.onReadyChange(true);
  }

  setDocumentState(state: DocumentState) {
    this.state = state;
  }

  render() {
    if (!this.gl || !this.program || !this.state) {
      return;
    }

    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    const exposureLoc = gl.getUniformLocation(this.program, 'uExposure');
    const contrastLoc = gl.getUniformLocation(this.program, 'uContrast');
    const saturationLoc = gl.getUniformLocation(this.program, 'uSaturation');
    const tempTintLoc = gl.getUniformLocation(this.program, 'uTempTint');

    gl.uniform1f(exposureLoc, this.state.global.exposure);
    gl.uniform1f(contrastLoc, this.state.global.contrast);
    gl.uniform1f(saturationLoc, this.state.global.saturation + this.state.global.vibrance * 0.5);
    gl.uniform2f(tempTintLoc, this.state.global.temperature, this.state.global.tint);

    this.updateCurveTexture(this.state.toneCurve.lut);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);

    const imageLoc = gl.getUniformLocation(this.program, 'uImage');
    const curveLoc = gl.getUniformLocation(this.program, 'uCurve');
    gl.uniform1i(imageLoc, 0);
    gl.uniform1i(curveLoc, 1);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  async renderExport(width: number, height: number) {
    if (!this.gl || !this.program) {
      throw new Error('Renderer not ready');
    }

    const gl = this.gl;
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error('Failed to create framebuffer');
    }
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    gl.viewport(0, 0, width, height);
    this.render();

    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);

    return new ImageData(new Uint8ClampedArray(pixels), width, height);
  }

  dispose() {
    if (!this.gl) {
      return;
    }
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
    if (this.imageTexture) {
      this.gl.deleteTexture(this.imageTexture);
    }
    if (this.curveTexture) {
      this.gl.deleteTexture(this.curveTexture);
    }
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
    }
    this.onReadyChange(false);
  }

  private compileShader(type: number, source: string) {
    if (!this.gl) {
      return null;
    }
    const shader = this.gl.createShader(type);
    if (!shader) {
      return null;
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      return null;
    }
    return shader;
  }

  private setupGeometry() {
    if (!this.gl || !this.program) {
      return;
    }
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      -1, 1, 0, 1,
      1, -1, 1, 0,
      1, 1, 1, 1
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, 'aPosition');
    const texLoc = gl.getAttribLocation(this.program, 'aTexCoord');

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 16, 8);

    this.vao = vao;
  }

  private setupTextures() {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;

    this.imageTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.baseImage.bitmap);

    this.curveTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const lut = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i += 1) {
      lut[i * 4] = i;
      lut[i * 4 + 1] = i;
      lut[i * 4 + 2] = i;
      lut[i * 4 + 3] = 255;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lut);
  }

  private updateCurveTexture(lut: Uint8Array) {
    if (!this.gl || !this.curveTexture) {
      return;
    }
    const gl = this.gl;
    const data = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i += 1) {
      data[i * 4] = lut[i];
      data[i * 4 + 1] = lut[i];
      data[i * 4 + 2] = lut[i];
      data[i * 4 + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }
}
