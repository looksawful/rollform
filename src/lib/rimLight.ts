import { DataTexture, DataUtils, EquirectangularReflectionMapping, HalfFloatType, LinearFilter, RGBAFormat } from 'three';
import type { DiceConfig } from './catalog';

// Linear RGB filters for the rear strip. The large front key remains neutral.
export const rimFilters = {
  '#000000': [0.78, 0.87, 1],
  '#196641': [0.38, 1, 0.66],
  '#A62D35': [1, 0.39, 0.36],
  '#215BA8': [0.37, 0.67, 1],
} as const satisfies Record<DiceConfig['shell'], readonly [number, number, number]>;

export function colorRimLight(source: DataTexture, shell: DiceConfig['shell']) {
  const { data, width, height } = source.image;
  const pixels = new Uint16Array(data as Uint16Array);
  const filter = rimFilters[shell];
  // Match the direction of the rear strip baked into catalog-rim.hdr.
  const azimuth = 139 * Math.PI / 180;
  const elevation = 23 * Math.PI / 180;
  for (let y = 0; y < height; y++) {
    const latitude = (0.5 - (y + 0.5) / height) * Math.PI;
    for (let x = 0; x < width; x++) {
      const longitude = ((x + 0.5) / width - 0.5) * 2 * Math.PI;
      const horizontal = Math.PI / 2 - longitude - azimuth;
      const across = Math.cos(latitude) * Math.sin(horizontal);
      const depth = Math.cos(latitude) * Math.cos(horizontal);
      const vertical = Math.sin(latitude) * Math.cos(elevation) - depth * Math.sin(elevation);
      const forward = Math.sin(latitude) * Math.sin(elevation) + depth * Math.cos(elevation);
      if (forward <= 0) continue;
      const u = Math.atan2(across, forward) / 0.28;
      const v = Math.atan2(vertical, forward) / 0.61;
      const weight = Math.exp(-0.5 * (u * u + v * v));
      const index = (y * width + x) * 4;
      filter.forEach((channel, c) => {
        const radiance = DataUtils.fromHalfFloat(pixels[index + c]);
        pixels[index + c] = DataUtils.toHalfFloat(radiance * (1 - weight * (1 - channel)));
      });
    }
  }

  const texture = new DataTexture(pixels, width, height, RGBAFormat, HalfFloatType);
  texture.colorSpace = source.colorSpace;
  texture.flipY = source.flipY;
  texture.mapping = EquirectangularReflectionMapping;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
