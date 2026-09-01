/* FaultyTerminal — Pure vanilla WebGL (no React, no OGL deps)
   Adapted from React Bits (reactbits.dev) */
(function () {
  const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragmentShader = `
precision mediump float;
varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;
uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle){
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p){
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;
  mat2 m0 = rotate(time * 0.02);
  f += amp * noise(p); p = m0 * p * 2.0; amp *= 0.454545;
  mat2 m1 = rotate(time * 0.02);
  f += amp * noise(p); p = m1 * p * 2.0; amp *= 0.454545;
  mat2 m2 = rotate(time * 0.08);
  f += amp * noise(p);
  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r){
  vec2 o1 = vec2(1.0);
  vec2 o0 = vec2(0.0);
  mat2 r01 = rotate(0.1 * time);
  mat2 r1 = rotate(0.1);
  q = vec2(fbm(p + o1), fbm(r01 * p + o1));
  r = vec2(fbm(r1 * q + o0), fbm(q + o0));
  return fbm(p + r);
}

float digit(vec2 p){
  vec2 grid = uGridMul * 15.0;
  vec2 s = floor(p * grid) / grid;
  p = p * grid;
  vec2 q, r;
  float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
  if(uUseMouse > 0.5){
    vec2 mw = uMouse * uScale;
    float d = distance(s, mw);
    float mi = exp(-d * 8.0) * uMouseStrength * 10.0;
    intensity += mi;
    intensity += sin(d * 20.0 - iTime * 5.0) * 0.1 * mi;
  }
  if(uUsePageLoadAnimation > 0.5){
    float cr = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
    float cd = cr * 0.8;
    float cp = clamp((uPageLoadProgress - cd) / 0.2, 0.0, 1.0);
    intensity *= smoothstep(0.0, 1.0, cp);
  }
  p = fract(p);
  p *= uDigitSize;
  float px5 = p.x * 5.0;
  float py5 = (1.0 - p.y) * 5.0;
  float x = fract(px5);
  float y = fract(py5);
  float i = floor(py5) - 2.0;
  float j = floor(px5) - 2.0;
  float n = i * i + j * j;
  float f = n * 0.0625;
  float isOn = step(0.1, intensity - f);
  float br = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
  return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * br;
}

float onOff(float a, float b, float c){
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look){
  float y = look.y - mod(iTime * 0.25, 1.0);
  float w = 1.0 / (1.0 + 50.0 * y * y);
  return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * w;
}

vec3 getColor(vec2 p){
  float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
  bar *= uScanlineIntensity;
  float d = displace(p);
  p.x += d;
  if(uGlitchAmount != 1.0) p.x += d * (uGlitchAmount - 1.0);
  float middle = digit(p);
  const float off = 0.002;
  float sum = digit(p+vec2(-off,-off))+digit(p+vec2(0,-off))+digit(p+vec2(off,-off))
             +digit(p+vec2(-off,0))+digit(p+vec2(0,0))+digit(p+vec2(off,0))
             +digit(p+vec2(-off,off))+digit(p+vec2(0,off))+digit(p+vec2(off,off));
  return vec3(0.9)*middle + sum*0.1*vec3(1.0)*bar;
}

vec2 barrel(vec2 uv){
  vec2 c = uv*2.0-1.0;
  float r2 = dot(c,c);
  c *= 1.0+uCurvature*r2;
  return c*0.5+0.5;
}

void main(){
  time = iTime * 0.333333;
  vec2 uv = vUv;
  if(uCurvature != 0.0) uv = barrel(uv);
  vec2 p = uv * uScale;
  vec3 col = getColor(p);
  if(uChromaticAberration != 0.0){
    vec2 ca = vec2(uChromaticAberration)/iResolution.xy;
    col.r = getColor(p+ca).r;
    col.b = getColor(p-ca).b;
  }
  col *= uTint;
  col *= uBrightness;
  if(uDither > 0.0){
    float rnd = hash21(gl_FragCoord.xy);
    col += (rnd-0.5)*(uDither*0.003922);
  }
  gl_FragColor = vec4(col,1.0);
}
`;

  function hexToRgb(hex) {
    let h = hex.replace('#','').trim();
    if(h.length===3) h=h.split('').map(c=>c+c).join('');
    const n = parseInt(h.slice(0,6),16);
    return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
  }

  function initFaultyTerminal(container, opts) {
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const gl = container.getContext('webgl') || container.getContext('experimental-webgl');
    if (!gl) return;
    gl.clearColor(0,0,0,1);

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, vertexShader);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShader);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const verts = new Float32Array([-1,-1, 0,0, 1,-1, 1,0, -1,1, 0,1, 1,1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'position');
    const uvLoc = gl.getAttribLocation(prog, 'uv');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

    const u = {};
    ['iTime','iResolution','uScale','uGridMul','uDigitSize','uScanlineIntensity',
     'uGlitchAmount','uFlickerAmount','uNoiseAmp','uChromaticAberration',
     'uDither','uCurvature','uTint','uMouse','uMouseStrength','uUseMouse',
     'uPageLoadProgress','uUsePageLoadAnimation','uBrightness'
    ].forEach(name => { u[name] = gl.getUniformLocation(prog, name); });

    const tint = hexToRgb(opts.tint || '#ffffff');
    const gridMul = opts.gridMul || [2,1];
    gl.uniform2fv(u.uGridMul, new Float32Array(gridMul));
    gl.uniform1f(u.uScale, opts.scale||1);
    gl.uniform1f(u.uDigitSize, opts.digitSize||1.5);
    gl.uniform1f(u.uScanlineIntensity, opts.scanlineIntensity||0.3);
    gl.uniform1f(u.uGlitchAmount, opts.glitchAmount||1);
    gl.uniform1f(u.uFlickerAmount, opts.flickerAmount||1);
    gl.uniform1f(u.uNoiseAmp, opts.noiseAmp||1);
    gl.uniform1f(u.uChromaticAberration, opts.chromaticAberration||0);
    gl.uniform1f(u.uDither, opts.dither||0);
    gl.uniform1f(u.uCurvature, opts.curvature||0.2);
    gl.uniform3f(u.uTint, tint[0], tint[1], tint[2]);
    gl.uniform1f(u.uMouseStrength, opts.mouseStrength||0.2);
    gl.uniform1f(u.uUseMouse, opts.mouseReact ? 1 : 0);
    gl.uniform1f(u.uUsePageLoadAnimation, opts.pageLoadAnimation ? 1 : 0);
    gl.uniform1f(u.uPageLoadProgress, opts.pageLoadAnimation ? 0 : 1);
    gl.uniform1f(u.uBrightness, opts.brightness||1);

    let mouseX = 0.5, mouseY = 0.5, smoothX = 0.5, smoothY = 0.5;
    let loadStart = 0, frozenTime = 0;
    const timeOffset = Math.random() * 100;
    const timeScale = opts.timeScale || 0.3;

    function resize() {
      const w = container.clientWidth * dpr;
      const h = container.clientHeight * dpr;
      container.width = w;
      container.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform3f(u.iResolution, w, h, w/h);
    }
    resize();
    new ResizeObserver(resize).observe(container);

    function onMove(e) {
      const r = container.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = 1 - (e.clientY - r.top) / r.height;
    }
    // Listen on parent section so mouse works even with pointer-events:none
    const mouseTarget = opts.mouseTarget || container;
    if (opts.mouseReact) mouseTarget.addEventListener('mousemove', onMove);

    function frame(t) {
      const raf = requestAnimationFrame(frame);
      if (opts.pageLoadAnimation && loadStart === 0) loadStart = t;
      if (!opts.pause) {
        const elapsed = (t * 0.001 + timeOffset) * timeScale;
        gl.uniform1f(u.iTime, elapsed);
        frozenTime = elapsed;
      } else {
        gl.uniform1f(u.iTime, frozenTime);
      }
      if (opts.pageLoadAnimation && loadStart > 0) {
        gl.uniform1f(u.uPageLoadProgress, Math.min((t - loadStart)/2000, 1));
      }
      if (opts.mouseReact) {
        smoothX += (mouseX - smoothX) * 0.08;
        smoothY += (mouseY - smoothY) * 0.08;
        gl.uniform2f(u.uMouse, smoothX, smoothY);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      container._raf = raf;
    }
    container._raf = requestAnimationFrame(frame);
    container._cleanup = () => {
      cancelAnimationFrame(container._raf);
      if (opts.mouseReact) mouseTarget.removeEventListener('mousemove', onMove);
    };
  }

  function mountTo(containerId, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none;';
    el.appendChild(canvas);
    // Find parent section for mouse events
    const section = el.closest('section');
    if (section) opts.mouseTarget = section;
    initFaultyTerminal(canvas, opts);
  }

  function mount() {
    const termOpts = {
      scale: 1.5,
      gridMul: [2, 1],
      digitSize: 1.2,
      timeScale: 1,
      pause: false,
      scanlineIntensity: 0.15,
      glitchAmount: 1,
      flickerAmount: 1,
      noiseAmp: 1,
      chromaticAberration: 0,
      dither: 0,
      curvature: 0,
      tint: '#D22B1F',
      mouseReact: true,
      mouseStrength: 0.5,
      pageLoadAnimation: true,
      brightness: 0.35
    };
    mountTo('terminal-bg', termOpts);
    mountTo('terminal-bg-work', termOpts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
