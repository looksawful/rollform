import type { DiceShape } from '@/lib/catalog';

/** Lightweight black-and-white catalog sketches; only the hero owns WebGL. */
export default function DiceGlyph({ shape, inverted = false }: { shape: DiceShape; inverted?: boolean }) {
  const paper = inverted ? '#000000' : '#ffffff';
  const ink = inverted ? '#ffffff' : '#000000';
  const label = shape === 'd%' ? '00' : shape.slice(1);
  const sides: Record<DiceShape, string> = {
    d4: '100,15 15,166 185,166',
    d6: '100,13 184,56 184,148 100,191 16,148 16,56',
    d8: '100,9 185,100 100,191 15,100',
    d10: '100,10 161,49 188,102 144,166 100,190 56,166 12,102 39,49',
    d12: '68,12 132,12 183,53 196,112 162,172 100,193 38,172 4,112 17,53',
    d20: '100,8 173,45 190,124 139,184 61,184 10,124 27,45',
    'd%': '100,10 161,49 188,102 144,166 100,190 56,166 12,102 39,49',
  };
  const facets: Record<DiceShape, string[]> = {
    d4: ['100,15 100,118 15,166','100,15 185,166 100,118','15,166 100,118 185,166'],
    d6: ['100,13 184,56 100,104 16,56','16,56 100,104 100,191 16,148','100,104 184,56 184,148 100,191'],
    d8: ['100,9 100,104 15,100','100,9 185,100 100,104','15,100 100,104 100,191','100,104 185,100 100,191'],
    d10: ['100,10 100,93 39,49','100,10 161,49 100,93','12,102 100,93 56,166','188,102 144,166 100,93','56,166 100,190 100,93','144,166 100,190 100,93'],
    d12: ['100,25 148,62 129,124 71,124 52,62','100,25 52,62 17,53 68,12','100,25 132,12 183,53 148,62','71,124 129,124 162,172 100,193 38,172'],
    d20: ['100,8 27,45 100,83','100,8 173,45 100,83','27,45 10,124 100,83','173,45 190,124 100,83','10,124 61,184 100,83','190,124 139,184 100,83','61,184 100,83 100,191','139,184 100,83 100,191'],
    'd%': ['100,10 100,93 39,49','100,10 161,49 100,93','12,102 100,93 56,166','188,102 144,166 100,93','56,166 100,190 100,93','144,166 100,190 100,93'],
  };
  return <svg viewBox="0 0 200 200" className="dice-glyph" aria-hidden="true" fill="none" stroke={ink} strokeWidth="1.7" strokeLinejoin="round">
    <polygon points={sides[shape]} fill={paper} />
    {facets[shape].map((points, i) => <polygon key={i} points={points} fill="none" />)}
    <text x="100" y="124" fill={ink} stroke="none" fontSize={shape === 'd%' ? '32' : '42'} fontWeight="700" textAnchor="middle" fontFamily="Inter, Arial, sans-serif">{label}</text>
  </svg>;
}
