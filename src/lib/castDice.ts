// Cast optics adapted from AwfulShading (MIT, Ivan Krushinsky).
// See public/models/cast/awfulshading-code-license.txt.
import {
  Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry,
  ShaderChunk, SRGBColorSpace, TextureLoader, Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { DiceConfig } from './catalog';

const tints: Record<DiceConfig['shell'], string> = {
  '#000000': '#55515e', '#196641': '#58d096', '#A62D35': '#dc5965', '#215BA8': '#6aa7ed',
};

const maxPlanes = 24;

// One cell per value, in row-major order. Ten and twenty are shared with D%.
const labels = [
  ...Array.from({ length: 21 }, (_, index) => String(index)),
  '00', '30', '40', '50', '60', '70', '80', '90',
];
type Point = [number, number, number];
type Marking = { normal: Point; center: Point; up: Point; size: number; label: string };

export async function loadCastDie(config: DiceConfig, basePath: string) {
  const filename = config.shape === 'd%' ? 'd00' : config.shape;
  const [{ scene }, map] = await Promise.all([
    new GLTFLoader().loadAsync(`${basePath}/models/cast/${filename}.glb`),
    new TextureLoader().loadAsync(`${basePath}/numerals/${config.font}.webp`),
  ]);
  map.colorSpace = SRGBColorSpace;
  const { castPlanes: planes, markings } = scene.children[0].userData as {
    castPlanes: number[][]; markings: Marking[];
  };
  const castPlanes = new Float32Array(maxPlanes * 4);
  planes.slice(0, maxPlanes).forEach((plane, index) => castPlanes.set(plane, index * 4));
  const normals = markings.map(marking => new Vector3(...marking.normal));
  const surface = new MeshPhysicalMaterial({
    color: '#fff1ea', transmission: 1, thickness: 1, flatShading: true,
    roughness: 0.088, ior: 1.52, envMapIntensity: 0.58,
  });
  surface.onBeforeCompile = shader => {
    shader.uniforms.uCastPlanes = { value: castPlanes };
    shader.vertexShader = 'varying vec3 vCastPosition;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nvCastPosition = position;',
    );
    // The refracted ray exits the die's convex envelope. Its length controls bulk absorption.
    shader.fragmentShader = `
      varying vec3 vCastPosition;
      uniform vec4 uCastPlanes[${maxPlanes}];

      float pathThroughCast(vec3 start, vec3 ray) {
        float distance = 4.0;
        for (int i = 0; i < ${maxPlanes}; i++) {
          vec4 plane = uCastPlanes[i];
          float slope = dot(plane.xyz, ray);
          if (slope > 0.0001) distance = min(distance, (plane.w - dot(plane.xyz, start)) / slope);
        }
        return clamp(distance, 0.014, 3.4);
      }
    ` + shader.fragmentShader.replace(
      '#include <transmission_fragment>',
      ShaderChunk.transmission_fragment.replace('vec4 transmitted =', `
        vec3 p = vCastPosition;
        vec3 ripple = sin(p.yzx * vec3(6.1, 5.7, 7.3) + p.zxy * 3.1);
        n = normalize(n + normalize(mat3(modelMatrix) * ripple + vec3(0.00001))
          * length(ripple) * 0.016);
        mat3 toLocal = transpose(mat3(modelMatrix));
        vec3 ray = refract(-normalize(toLocal * v), normalize(toLocal * n), 1.0 / material.ior);
        material.thickness = pathThroughCast(p, ray);
        float haze = 1.0 - exp(-material.thickness / material.attenuationDistance * 0.22);
        float transmissionRoughness = mix(material.roughness, 0.21, haze);
        vec4 transmitted =`).replace('n, v, material.roughness,', 'n, v, transmissionRoughness,'),
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
      surface.attenuationColor.set(tints[shell]);
      surface.attenuationDistance = shell === '#000000' ? 1.28 : 1.75;
    },
    dispose() {
      scene.traverse(node => {
        if (node instanceof Mesh) node.geometry.dispose();
      });
      surface.dispose();
      gold.dispose();
      map.dispose();
    },
  };
}
