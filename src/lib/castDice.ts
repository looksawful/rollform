// Cast optics adapted from AwfulShading (MIT, Ivan Krushinsky).
// See public/models/cast/awfulshading-code-license.txt.
import {
  Color, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry,
  ShaderChunk, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader, Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { DiceConfig } from './catalog';
import { rimFilters } from './rimLight';

const tints: Record<DiceConfig['shell'], string> = {
  '#000000': '#55515e', '#196641': '#58d096', '#A62D35': '#dc5965', '#215BA8': '#6aa7ed',
};

const redTint = new Color(tints['#A62D35']);
const maxPlanes = 24;

// One cell per value, in row-major order. Ten and twenty are shared with D%.
const labels = [
  ...Array.from({ length: 21 }, (_, index) => String(index)),
  '00', '30', '40', '50', '60', '70', '80', '90',
];
type Point = [number, number, number];
type Marking = { normal: Point; center: Point; up: Point; size: number; label: string };

const inclusions = [
  [-0.55, 0.52, 0.76, 0.043], [0.44, 0.65, 0.50, 0.029],
  [-0.18, 0.45, 0.91, 0.019], [0.66, -0.39, 0.69, 0.034],
  [0.73, 0.13, -0.32, 0.025], [-0.49, -0.57, 0.38, 0.032],
  [-0.26, -0.62, -0.72, 0.044], [0.30, 0.34, -0.58, 0.018],
  [0.17, -0.30, 0.64, 0.021],
] as const;

const bubbleFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 normal = normalize(vNormal);
    float fresnel = 1.0 - clamp(dot(normal, normalize(vView)), 0.0, 1.0);
    if (fresnel < 0.32) discard;
    float rim = smoothstep(0.32, 0.76, fresnel);
    float glint = max(0.0, dot(normal, normalize(vec3(-0.8, 0.6, 0.18))));
    gl_FragColor = vec4(mix(vec3(0.026, 0.013, 0.029), vec3(0.72, 0.51, 0.48),
      rim * (0.35 + 0.65 * glint)), 1.0);
    #include <colorspace_fragment>
  }
`;

function castBubbles(castScale: number) {
  const material = new ShaderMaterial({
    toneMapped: false,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;

      void main() {
        // Instances use uniform scale and translation, so their normal directions are unchanged.
        vec4 point = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;
        vView = -point.xyz;
        gl_Position = projectionMatrix * point;
      }
    `,
    fragmentShader: bubbleFragment,
  });
  const bubbles = new InstancedMesh(new SphereGeometry(1, 12, 8), material, inclusions.length);
  const transform = new Matrix4();
  const position = new Vector3();
  inclusions.forEach(([x, y, z, radius], index) => {
    position.set(x, y, z).setLength(0.96 * 0.72 * castScale);
    const size = radius * castScale;
    transform.makeScale(size, size, size).setPosition(position);
    bubbles.setMatrixAt(index, transform);
  });
  return bubbles;
}

export async function loadCastDie(config: DiceConfig, basePath: string, onAssetReady?: () => void) {
  const report = <T,>(asset: Promise<T>) => asset.then(result => {
    onAssetReady?.();
    return result;
  });
  const filename = config.shape === 'd%' ? 'd00' : config.shape;
  const [{ scene }, map] = await Promise.all([
    // The face-marking metadata is absent from meshes cached by the previous release.
    report(new GLTFLoader().loadAsync(`${basePath}/models/cast/${filename}.glb?v=2`)),
    report(new TextureLoader().loadAsync(`${basePath}/numerals/${config.font}.webp`)),
  ]);
  map.colorSpace = SRGBColorSpace;
  const { castPlanes: planes, markings } = scene.children[0].userData as {
    castPlanes: number[][]; markings: Marking[];
  };
  const castPlanes = new Float32Array(maxPlanes * 4);
  planes.slice(0, maxPlanes).forEach((plane, index) => castPlanes.set(plane, index * 4));
  // Scale absorption and inclusions relative to the approved D20 inradius.
  const castScale = Math.min(...planes.map(plane => plane[3])) / 1.335319;
  const normals = markings.map(marking => new Vector3(...marking.normal));
  const surface = new MeshPhysicalMaterial({
    color: '#fff1ea', transmission: 1, thickness: 1, flatShading: true,
    roughness: 0.105, ior: 1.52, envMapIntensity: 0.58,
  });
  const rimFilter = new Vector3(1, 1, 1);
  const dyeDensity = new Vector3();
  surface.onBeforeCompile = shader => {
    shader.uniforms.uCastPlanes = { value: castPlanes };
    shader.uniforms.uRimFilter = { value: rimFilter };
    shader.uniforms.uDyeDensity = { value: dyeDensity };
    shader.uniforms.uCastScale = { value: castScale };
    shader.vertexShader = 'varying vec3 vCastPosition;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nvCastPosition = position;',
    );
    // The refracted ray exits the die's convex envelope. Its length controls bulk absorption.
    shader.fragmentShader = `
      varying vec3 vCastPosition;
      uniform vec4 uCastPlanes[${maxPlanes}];
      uniform vec3 uRimFilter;
      uniform vec3 uDyeDensity;
      uniform float uCastScale;

      float pathThroughCast(vec3 start, vec3 ray) {
        float distance = 4.0;
        for (int i = 0; i < ${maxPlanes}; i++) {
          vec4 plane = uCastPlanes[i];
          float slope = dot(plane.xyz, ray);
          if (slope > 0.0001) distance = min(distance, (plane.w - dot(plane.xyz, start)) / slope);
        }
        return clamp(distance, 0.014, 3.4);
      }

      float dyeConcentration(vec3 p) {
        float warp = sin(p.z * 3.8 + p.y * 2.4) + 0.37 * sin(p.z * 7.7 - p.x * 4.0);
        float vein = sin(p.x * 3.1 - p.y * 1.85 + warp);
        float wisps = sin(p.z * 9.5 + p.y * 6.0 + warp * 3.8);
        return smoothstep(-0.26, 0.70, vein + wisps * 0.17);
      }
    ` + shader.fragmentShader.replace('#include <lights_fragment_end>', `
      #include <lights_fragment_end>
      float grazing = 1.0 - saturate(dot(normal, normalize(vViewPosition)));
      reflectedLight.indirectSpecular *= mix(vec3(1.0), uRimFilter, smoothstep(0.18, 0.75, grazing));
    `).replace(
      '#include <transmission_fragment>',
      ShaderChunk.transmission_fragment.replace('vec4 transmitted =', `
        vec3 p = vCastPosition;
        mat3 toLocal = transpose(mat3(modelMatrix));
        vec3 ray = refract(-normalize(toLocal * v), normalize(toLocal * n), 1.0 / material.ior);
        material.thickness = pathThroughCast(p, ray);
        float opticalDepth = material.thickness / material.attenuationDistance;
        float haze = 1.0 - exp(-opticalDepth * 0.22);
        float castModelScale = length(modelMatrix[0].xyz);
        material.attenuationDistance *= castModelScale;
        float transmissionRoughness = mix(material.roughness, 0.21, haze);
        vec4 transmitted =`).replace('n, v, material.roughness,', 'n, v, transmissionRoughness,')
        .replace('material.transmissionAlpha = mix', `
          float stain = 0.0;
          for (int step = 0; step < 6; step++) {
            vec3 point = p + ray * material.thickness * ((float(step) + 0.5) / 6.0);
            stain += dyeConcentration(point / uCastScale);
          }
          transmitted.rgb *= exp(-opticalDepth * (stain / 6.0) * uDyeDensity);
          // Approximate the tinted skin at the thinnest corners, as in the lab study.
          float skinDepth = 0.22 * uCastScale * exp(-material.thickness * 2.5 / uCastScale);
          transmitted.rgb *= volumeAttenuation(skinDepth * castModelScale,
            material.attenuationColor, material.attenuationDistance);
          material.transmissionAlpha = mix
        `),
    );
  };
  const gold = new MeshStandardMaterial({
    color: '#d49b38', metalness: 0.69, roughness: 0.33, map,
    transparent: true, alphaTest: 0.28,
  });
  scene.traverse(node => {
    if (!(node instanceof Mesh)) return;
    node.material.dispose();
    node.material = surface;
  });
  const bubbles = castBubbles(castScale);
  scene.add(bubbles);
  markings.forEach((marking, index) => {
    const normal = normals[index];
    const up = new Vector3(...marking.up);
    const right = new Vector3().crossVectors(up, normal);
    const geometry = new PlaneGeometry(marking.size, marking.size);
    const uv = geometry.getAttribute('uv');
    const cell = labels.indexOf(marking.label);
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (cell % 8 + uv.getX(i)) / 8, (3 - Math.floor(cell / 8) + uv.getY(i)) / 4);
    }
    const numeral = new Mesh(geometry, gold);
    numeral.position.set(...marking.center);
    numeral.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal));
    scene.add(numeral);
  });

  return {
    scene,
    normals,
    setShell(shell: DiceConfig['shell']) {
      const [r, g, b] = rimFilters[shell];
      rimFilter.set(r, g, b);
      const tint = surface.attenuationColor.set(tints[shell]);
      surface.attenuationDistance = castScale * (shell === '#000000' ? 0.97 : 1.32);
      // Preserve the red study's density and adapt the spectrum to each dye.
      dyeDensity.set(
        0.72 * Math.log(tint.r) / Math.log(redTint.r),
        1.65 * Math.log(tint.g) / Math.log(redTint.g),
        1.26 * Math.log(tint.b) / Math.log(redTint.b),
      );
    },
    dispose() {
      scene.traverse(node => {
        if (node instanceof Mesh) node.geometry.dispose();
      });
      bubbles.dispose();
      bubbles.material.dispose();
      surface.dispose();
      gold.dispose();
      map.dispose();
    },
  };
}
