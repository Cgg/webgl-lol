let modelViewMatrix;
let projectionMatrix;
const ac = new AudioContext();
let canvas;

window.onload = function () {
  canvas = document.getElementById("canvas");
  const wrapper = document.getElementById("wrapper");

  const launchAnimation = () => {
    wrapper.removeEventListener("click", launchAnimation);
    wrapper.classList.remove("interactive");

    const overlay = document.getElementById("overlay");
    overlay.classList.add("hidden");

    canvas.classList.remove("hidden");

    main();
  };

  wrapper.addEventListener("click", launchAnimation);
};

function main() {
  Promise.all([getFile("omar-1.ogg"), getFile("omar-2.ogg")]).then(
    ([omar1, omar2]) => {
      const o1 = ac.createBufferSource();
      const o2 = ac.createBufferSource();
      o1.buffer = omar1;
      o2.buffer = omar2;
      o2.loop = true;
      o1.start(0);
      o2.start(ac.currentTime + omar1.duration + 0.18);
      o1.connect(ac.destination);
      o2.connect(ac.destination);
    }
  );

  let ctx;
  try {
    ctx = initWebGL(canvas);
  } catch (e) {
    console.log(e);
    return;
  }

  ctx.viewport(0, 0, canvas.width, canvas.height);

  modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.5, -0.5, -5]);

  projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    Math.PI / 4,
    canvas.width / canvas.height,
    1,
    10000
  );

  initShader(ctx);
  initTexture(ctx);
  run(ctx, createCube(ctx));
}

function getFile(url) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = () => {
      ac.decodeAudioData(request.response, resolve, () =>
        reject(`Error decoding the file ${url}`)
      );
    };
    request.send();
  });
}

function createCube(gl) {
  const vertexBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
  // prettier-ignore
  const verts = [
    0, 0, 1,   1, 0, 1,   0, 1, 1,    1, 1, 1,   0, 1, 1,   1, 0, 1, // front
    1, 0, 0,   0, 0, 0,   1, 1, 0,    0, 1, 0,   1, 1, 0,   0, 0, 0, // back
    0, 0, 0,   0, 0, 1,   0, 1, 0,    0, 1, 1,   0, 1, 0,   0, 0, 1, // left
    1, 0, 1,   1, 0, 0,   1, 1, 1,    1, 1, 0,   1, 1, 1,   1, 0, 0, // right
    0, 1, 1,   1, 1, 1,   0, 1, 0,    1, 1, 0,   0, 1, 0,   1, 1, 1, // top
    0, 0, 1,   0, 0, 0,   1, 0, 1,    1, 0, 0,   1, 0, 1,   0, 0, 0  // bottom
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  // prettier-ignore
  const vertexTextureCoords = [
    0, 0.5,   1, 0.5,   0, 1,    1, 1,   0, 1,   1, 0.5,
    0, 0.5,   1, 0.5,   0, 1,    1, 1,   0, 1,   1, 0.5,
    0, 0.5,   1, 0.5,   0, 1,    1, 1,   0, 1,   1, 0.5,
    0, 0.5,   1, 0.5,   0, 1,    1, 1,   0, 1,   1, 0.5,
    0, 0.5,   1, 0.5,   0, 1,    1, 1,   0, 1,   1, 0.5,
    0, 0.5,   1, 0.5,   0, 1,    1, 1,   0, 1,   1, 0.5
  ];
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexTextureCoords),
    gl.STATIC_DRAW
  );

  return {
    buffer: vertexBuf,
    vertSize: 3,
    nVerts: 36,

    texCoordBuffer: texCoordBuffer,
    texCoordSize: 2,
    nTexCoords: 36,

    primtype: gl.TRIANGLES,
  };
}

function initWebGL(canvas) {
  let gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  } catch (e) {
    const msg = `WebGL not supported lol: ${e}`;
    console.log(msg);
    throw new Error(msg);
  }

  return gl;
}

function createShader(gl, str, type) {
  const shader =
    type === "fragment"
      ? gl.createShader(gl.FRAGMENT_SHADER)
      : type === "vertex"
      ? gl.createShader(gl.VERTEX_SHADER)
      : null;

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

let shaderProgram,
  shaderVertexPositionAttribute,
  shaderVertexTexCoordAttribute,
  shaderSamplerUniform,
  shaderProjectionMatrixUniform,
  shaderModelViewMatrixUniform;

function initShader(gl) {
  const vertexShader = createShader(gl, vertexShaderSource, "vertex");
  const fragmentShader = createShader(gl, fragmentShaderSource, "fragment");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  shaderVertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexPos"
  );
  gl.enableVertexAttribArray(shaderVertexPositionAttribute);

  shaderVertexTexCoordAttribute = gl.getAttribLocation(
    shaderProgram,
    "vertexTexCoord"
  );
  gl.enableVertexAttribArray(shaderVertexTexCoordAttribute);

  shaderSamplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

  shaderProjectionMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "projectionMatrix"
  );
  shaderModelViewMatrixUniform = gl.getUniformLocation(
    shaderProgram,
    "modelViewMatrix"
  );

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log("Could not initialize shaders.");
  }
}

let webglTexture;

function initTexture(gl) {
  webglTexture = gl.createTexture();
  const vid = document.createElement("video");
  vid.src = "raphi.webm";
  vid.autoplay = true;
  vid.loop = true;

  webglTexture.image = vid;

  gl.bindTexture(gl.TEXTURE_2D, webglTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function updateTexture(gl) {
  gl.bindTexture(gl.TEXTURE_2D, webglTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    webglTexture.image
  );

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function draw(gl, obj) {
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(shaderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
  gl.vertexAttribPointer(
    shaderVertexPositionAttribute,
    obj.vertSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
  gl.vertexAttribPointer(
    shaderVertexTexCoordAttribute,
    obj.texCoordSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
  gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, modelViewMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, webglTexture);
  gl.uniform1i(shaderSamplerUniform, 0);

  gl.drawArrays(obj.primtype, 0, obj.nVerts);
}

const duration = 5000;
let currentTime = Date.now();
const rotationAxis = [1, 1, 0];
function animate() {
  const now = Date.now();
  const deltaT = now - currentTime;
  currentTime = now;
  const fract = deltaT / duration;
  const angle = Math.PI * 2 * fract;
  mat4.rotate(modelViewMatrix, modelViewMatrix, angle, rotationAxis);
}

function run(gl, cube) {
  requestAnimationFrame(function () {
    run(gl, cube);
  });
  updateTexture(gl);
  draw(gl, cube);
  animate();
}
