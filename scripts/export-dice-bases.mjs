// Rebuild the six un-beveled source polyhedra from the existing geometry definitions.
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildGeometry, facePlacements } from '../src/lib/diceGeometry.ts';

const shapes = {};
for (const name of ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']) {
  const geometry = buildGeometry(name);
  const expanded = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = expanded.getAttribute('position');
  const triangles = [];
  for (let i = 0; i < pos.count; i += 3) {
    triangles.push(Array.from({ length: 3 }, (_, j) => [
      pos.getX(i + j), pos.getY(i + j), pos.getZ(i + j),
    ]));
  }
  const faces = facePlacements(geometry, name).map(face => ({
    normal: face.normal.toArray(), center: face.center.toArray(),
  }));
  shapes[name] = { triangles, faces };
  if (expanded !== geometry) expanded.dispose();
  geometry.dispose();
}
mkdirSync('scripts/.mesh-tmp', { recursive: true });
writeFileSync('scripts/.mesh-tmp/bases.json', JSON.stringify(shapes));
console.log(Object.entries(shapes).map(([n, x]) => n + ': ' + x.triangles.length + ' triangles, ' + x.faces.length + ' faces').join('\n'));
