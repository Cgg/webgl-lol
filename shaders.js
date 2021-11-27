const vertexShaderSource =
  "    attribute vec3 vertexPos;\n" +
  "    attribute vec2 vertexTexCoord;\n" +
  "    uniform mat4 modelViewMatrix;\n" +
  "    uniform mat4 projectionMatrix;\n" +
  "    varying vec2 vTexCoord;\n" +
  "    void main(void) {\n" +
  "		     // Return the transformed and projected vertex value\n" +
  "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
  "            vec4(vertexPos, 1.0);\n" +
  "        // Output the vertexColor in vColor;\n" +
  "        vTexCoord = vertexTexCoord;\n" +
  "    }\n";

const fragmentShaderSource =
  "    precision mediump float;\n" +
  "    varying vec2 vTexCoord;\n" +
  "    uniform sampler2D uSampler;\n" +
  "    void main(void) {\n" +
  "        // Return the pixel color: always output white\n" +
  "        gl_FragColor = texture2D(uSampler, vec2(vTexCoord.s, vTexCoord.t));\n" +
  "}\n";
