/**
 * Licensed photo assets from Pexels (attribution not required):
 * https://www.pexels.com/license/
 * Dice IDs: 7061817, 6215969, 3649115, 7150643, 3649095,
 * 3857508, 6215967, 5749830, 26614954.
 * Workshop IDs: 7256642, 7256567.
 */
export const photoPath = (index: number) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/dice-${String(index + 1).padStart(2, '0')}.webp`;
