const vertexShaderSource = `
    attribute vec3 vertexPos;
    attribute vec2 vertexTexCoord;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    varying vec2 vTexCoord;
    void main(void) {
        // Return the transformed and projected vertex value
        gl_Position = projectionMatrix * modelViewMatrix *
        vec4(vertexPos, 1.0);
        // Output the vertexColor in vColor;
        vTexCoord = vertexTexCoord;
    }`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform sampler2D uSampler;
    void main(void) {
        // Return the pixel color: always output white
        gl_FragColor = texture2D(uSampler, vec2(vTexCoord.s, vTexCoord.t));
    }`;
