// Adapted from AwfulShading (MIT).
export const streakVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 center = modelViewMatrix * vec4(0., 0., 0., 1.);
    center.xy += position.xy * length(modelMatrix[0].xyz);
    gl_Position = projectionMatrix * center;
  }
`;

export const streakFragment = `
  uniform float uStrength;
  uniform float uAngle;
  uniform float uDirection;
  uniform vec3 uTint;
  varying vec2 vUv;
  float ribbon(float angle, float radius, float orbit, float span, float phase, float width) {
    float along = fract((angle - phase) / 6.2831853);
    float taper = smoothstep(0., .10, along) * (1. - smoothstep(span - .14, span, along));
    float distance = abs(radius - orbit + along * .25);
    return taper * (1. - smoothstep(width * .15, width, distance));
  }
  void main() {
    vec2 p = (vUv - .5) * 2.;
      vec2 spin = vec2(.96 * p.x + .26 * p.y, 1.44 * p.y - .38 * p.x);
      float angle = atan(spin.y, spin.x + .00001) * uDirection;
      float radius = length(spin);
      float phase = uAngle * uDirection * .48;
      float sweep = ribbon(angle, radius, .82, .68, phase, .105)
        + .58 * ribbon(angle, radius, .65, .55, phase + 2.55, .066)
        + .42 * ribbon(angle, radius, .53, .40, phase + 4.1, .055);
      float blur = exp(-5.2 * dot(spin, spin));
      float trail = (.64 * sweep + .22 * blur) * uStrength;
    gl_FragColor = vec4(mix(uTint * .75, vec3(1., .63, .29), .30), min(.8, trail));
    #include <colorspace_fragment>
  }
`;

export const numeralUniforms = `
  uniform float uFade;
  uniform float uInk;
  uniform float uGlint;
    float grain(vec2 cell) {
      return fract(52.9829189 * fract(dot(cell, vec2(.06711056, .00583715))));
    }
`;

export const numeralDissolve = `
  vec2 numeralUv = fract(vMapUv * vec2(8., 4.));
    float drift = .55 * numeralUv.y + .25 * numeralUv.x + .12 * sin(numeralUv.x * 12.);
    float threshold = .12 + .76 * (.48 * grain(floor(numeralUv * 56.))
      + .19 * grain(floor(numeralUv * 23.)) + .33 * drift);
    float reveal = smoothstep(threshold - .065, threshold + .065, uInk);
  diffuseColor.a *= uFade * reveal;
  if (diffuseColor.a <= .001) discard;
`;

export const numeralHighlight = `
    float diagonal = .76 * numeralUv.x + .24 * numeralUv.y;
    float offset = (diagonal - uGlint) * 5.4;
    float gleam = exp(-offset * offset) * smoothstep(.58, .98, uInk);
    totalEmissiveRadiance += vec3(1., .84, .59) * gleam * .44;
`;

export const pigmentUniforms = `
  uniform vec3 uNextTint;
  uniform vec3 uNextDye;
  uniform vec3 uNextRim;
  uniform float uNextDistance;
  uniform float uPaintFlow;
  uniform float uFlowDirection;
    float pigmentFront(vec3 point) {
      float x = point.x * uFlowDirection;
      float curl = sin(point.y * 3.8 - point.z * 2.5 + uPaintFlow * 5.4);
      float fold = sin(point.z * 4.8 + point.y * 2.0 + .75 * curl);
      return clamp(.5 + .235 * x + .09 * point.y - .065 * point.z
        + .112 * curl + .043 * fold, .07, .93);
    }

    float pigmentFill(float front) {
      return smoothstep(front - .024, front + .024, uPaintFlow);
    }
`;

export const pigmentRefraction = `
  if (uPaintFlow > 0.) {
    vec3 point = p / uCastScale;
        vec3 path = ray * material.thickness / uCastScale;
        float nearFront = pigmentFront(point + path * .15);
        float midFront = pigmentFront(point + path * .46);
        float farFront = pigmentFront(point + path * .82);
        float fill = .36 * pigmentFill(nearFront) + .37 * pigmentFill(midFront)
          + .27 * pigmentFill(farFront);
        float seamDistance = min(abs(uPaintFlow - nearFront), abs(uPaintFlow - midFront));
        seam = (1. - smoothstep(.012, .049, seamDistance))
          * (.68 + .32 * sin(p.y * 18. + p.z * 15. + 2. * sin(p.x * 6.)));
    material.attenuationColor = exp(mix(log(material.attenuationColor), log(uNextTint), fill));
    material.attenuationDistance = mix(material.attenuationDistance, uNextDistance, fill);
    dyeDensity = mix(uDyeDensity, uNextDye, fill);
  }
`;
