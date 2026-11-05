/** Third-party reference photography; none depicts ROLLFORM products or its workshop. */
export const photoCredits = [
  ['Self-made polyhedral dice 01.jpg', 'Stephan Sprinz', 'CC BY 4.0'],
  ['Self-made polyhedral dice 02.jpg', 'Stephan Sprinz', 'CC BY 4.0'],
  ['Role-playing dice.jpg', 'Maria Eklind', 'CC BY-SA 2.0'],
  ['Dice (typical role playing game dice).jpg', 'Diacritica', 'CC BY-SA 3.0'],
  ['Black Polyhedral Game Dice.jpg', 'Dark Elf Dice', 'CC BY-SA 4.0'],
  ['Closeup of D20 with yellow numbers.jpg', 'Dark Elf Dice', 'CC BY-SA 4.0'],
  ['Dice close up.webp', 'PolyhedronPalace', 'CC BY-SA 4.0'],
  ['Glow In The Dark D20 Dice.jpg', 'Dark Elf Dice', 'CC BY-SA 4.0'],
  ['Set of roleplaying dice.jpg', 'Clément Bucco-Lechat', 'CC BY-SA 3.0'],
  ['Pour Epoxy.jpg', 'Ehaynes7928', 'CC BY-SA 3.0'],
] as const;

export const photoPath = (index: number) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/photos/dice-${String(index + 1).padStart(2, '0')}.webp`;
