// Orbital Sentinel — tuning and constants.
// One place for every number that shapes the game, so balance lives here
// and the other modules only read it.

export const VIEW = {
  width: 1280,
  height: 800,
  planetX: 640,
  planetY: 410,
  planetRadius: 64,
};

export const PLANET = {
  maxHull: 100,
  // A meteor that reaches this ring around the planet hits the hull.
  hitRadius: VIEW.planetRadius,
};

export const TURRET = {
  baseFireInterval: 0.22, // seconds between bolts
  baseBoltSpeed: 560,
  baseBoltDamage: 1,
  baseBoltsPerShot: 1,
  barrelLength: 52,
};

export const METEOR_TYPES = {
  rock: { radiusMin: 18, radiusMax: 26, hp: 2, speedMin: 42, speedMax: 62, damage: 10, score: 50, credits: 3, color: '#b0713c' },
  shard: { radiusMin: 10, radiusMax: 14, hp: 1, speedMin: 95, speedMax: 125, damage: 6, score: 40, credits: 2, color: '#d98a4b' },
  boulder: { radiusMin: 30, radiusMax: 40, hp: 5, speedMin: 28, speedMax: 38, damage: 18, score: 120, credits: 8, color: '#8a5a2e' },
  splitter: { radiusMin: 21, radiusMax: 24, hp: 3, speedMin: 48, speedMax: 58, damage: 12, score: 90, credits: 5, color: '#c65b7c' },
};

export const WAVES = {
  total: 10,
  // Meteors in wave n: 6 + 2n. Spawn gap shrinks as waves go on.
  countForWave: (wave) => 6 + wave * 2,
  spawnGapForWave: (wave) => Math.max(0.45, 1.15 - wave * 0.07),
  clearBonusCredits: (wave) => 10 + wave * 2,
};

export const UPGRADES = [
  { id: 'rapid', name: 'Rapid Cycler', desc: 'Fire 18% faster.', max: 3 },
  { id: 'heavy', name: 'Heavy Rounds', desc: 'Bolts deal +1 damage.', max: 3 },
  { id: 'twin', name: 'Twin Barrels', desc: 'Fire one extra bolt per shot.', max: 2 },
  { id: 'repair', name: 'Repair Plating', desc: 'Restore 30 hull right now.', max: 3 },
  { id: 'magnet', name: 'Magnet Coil', desc: 'Credit orbs fly in twice as fast.', max: 2 },
  { id: 'frost', name: 'Frost Field', desc: 'All meteors drift 12% slower.', max: 3 },
  { id: 'pierce', name: 'Piercing Rounds', desc: 'Bolts punch through one extra meteor.', max: 2 },
  { id: 'overcharge', name: 'Overcharge', desc: 'Score from every kill +25%.', max: 3 },
];

export const SCORE = {
  waveClear: (wave) => wave * 150,
};

export const PALETTE = {
  backgroundTop: '#070b1a',
  backgroundBottom: '#0d1530',
  star: '#dfe9ff',
  planet: '#f2a541',
  planetDark: '#c97b1e',
  atmosphere: 'rgba(242, 165, 65, 0.22)',
  bolt: '#6ff2ff',
  credit: '#ffd94d',
  hull: '#7dff8a',
  hullLow: '#ff5a5a',
  text: '#f2f6ff',
  textDim: '#9fb0d8',
  panel: 'rgba(10, 16, 38, 0.88)',
  panelEdge: '#2c3d6e',
  accent: '#6ff2ff',
};
