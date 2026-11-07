// Cast optics adapted from AwfulShading (MIT, Ivan Krushinsky).
// See public/models/cast/awfulshading-code-license.txt.
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial, ShaderChunk, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { DiceConfig } from './catalog';

export type CastFinish = 'epoxy' | 'resin';

const tints: Record<DiceConfig['shell'], string> = {
  '#000000': '#55515e', '#196641': '#58d096', '#A62D35': '#dc5965', '#215BA8': '#6aa7ed',
};

const maxPlanes = 24;

export async function loadCastDie(shape: DiceConfig['shape'], basePath: string) {
  const filename = shape === 'd%' ? 'd00' : shape;
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const { scene } = await loader.loadAsync(`${basePath}/models/cast/${filename}.glb`);
  const planes: number[][] = scene.children[0].userData.castPlanes;
  const castPlanes = new Float32Array(maxPlanes * 4);
  planes.slice(0, maxPlanes).forEach((plane, index) => castPlanes.set(plane, index * 4));
  // The four largest planes of the elongated D4 bear the numbers.
  const normals = (shape === 'd4' ? planes.slice(0, 4) : planes)
    .map(([x, y, z]) => new Vector3(x, y, z).normalize());
  const haze = { value: 0.065 };
  const surface = new MeshPhysicalMaterial({
    color: '#fff1ea', transmission: 1, thickness: 1,
  });
  surface.onBeforeCompile = shader => {
    shader.uniforms.uCastPlanes = { value: castPlanes };
    shader.uniforms.uCastHaze = haze;
    shader.vertexShader = 'varying vec3 vCastPosition;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nvCastPosition = position;',
    );
    // The refracted ray exits the die's convex envelope. Its length controls bulk absorption.
    shader.fragmentShader = `
      varying vec3 vCastPosition;
      uniform vec4 uCastPlanes[${maxPlanes}];
      uniform float uCastHaze;

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
        float haze = 1.0 - exp(-material.thickness / material.attenuationDistance * uCastHaze);
        float transmissionRoughness = mix(material.roughness, 0.21, haze);
        vec4 transmitted =`).replace('n, v, material.roughness,', 'n, v, transmissionRoughness,'),
    );
  };
  const gold = new MeshStandardMaterial({
    color: '#d49b38', metalness: 0.69, roughness: 0.33, transparent: true,
  });
  const meshes: Mesh[] = [];
  const engravings: Mesh[] = [];
  scene.traverse(node => {
    if (!(node instanceof Mesh)) return;
    meshes.push(node);
    if (node.material.name === 'engraving') engravings.push(node);
    node.material.dispose();
    node.material = surface;
  });

  return {
    scene,
    normals,
    setFinish(finish: CastFinish, shell: DiceConfig['shell']) {
      const resin = finish === 'resin';
      const redEpoxy = !resin && shell === '#A62D35';
      const black = shell === '#000000';
      surface.attenuationColor.set(redEpoxy ? '#ed4d68' : tints[shell]);
      surface.attenuationDistance = resin ? (black ? 1.28 : 1.75) : (redEpoxy ? 1.55 : black ? 1.02 : 1.46);
      surface.roughness = resin ? 0.088 : redEpoxy ? 0.046 : 0.045;
      surface.ior = resin ? 1.52 : 1.55;
      surface.envMapIntensity = redEpoxy ? 0.42 : 0.58;
      haze.value = resin ? 0.22 : 0.065;
      engravings.forEach(mesh => { mesh.material = redEpoxy ? surface : gold; });
    },
    dispose() {
      meshes.forEach(mesh => mesh.geometry.dispose());
      surface.dispose();
      gold.dispose();
    },
  };
}
