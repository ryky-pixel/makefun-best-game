// Orbital Sentinel — the wave director and the upgrade draft.
// Waves grow in size and speed; between waves the player drafts one of
// three upgrades drawn from the pool, skipping any already maxed out.

import { WAVES, UPGRADES } from './config.js';
import { makeMeteor } from './entities.js';

function typeMixForWave(wave, random) {
  const roll = random.next();
  if (wave <= 1) return roll < 0.8 ? 'rock' : 'shard';
  if (wave <= 3) {
    if (roll < 0.55) return 'rock';
    if (roll < 0.85) return 'shard';
    return 'splitter';
  }
  if (wave <= 6) {
    if (roll < 0.4) return 'rock';
    if (roll < 0.65) return 'shard';
    if (roll < 0.85) return 'splitter';
    return 'boulder';
  }
  if (roll < 0.32) return 'rock';
  if (roll < 0.55) return 'shard';
  if (roll < 0.78) return 'splitter';
  return 'boulder';
}

export function createWaveDirector(random) {
  return {
    wave: 0,
    toSpawn: 0,
    spawned: 0,
    spawnTimer: 0,
    betweenWaves: false,
    startWave(wave) {
      this.wave = wave;
      this.toSpawn = WAVES.countForWave(wave);
      this.spawned = 0;
      this.spawnTimer = 0.6;
      this.betweenWaves = false;
    },
    update(dt, meteors) {
      if (this.spawned >= this.toSpawn) return;
      this.spawnTimer -= dt;
      if (this.spawnTimer > 0) return;
      this.spawnTimer = WAVES.spawnGapForWave(this.wave);
      meteors.push(makeMeteor(random, this.wave, typeMixForWave(this.wave, random)));
      this.spawned += 1;
    },
    isWaveCleared(meteors) {
      return this.spawned >= this.toSpawn && meteors.length === 0;
    },
    remaining() {
      return this.toSpawn - this.spawned;
    },
  };
}

export function drawUpgradeDraft(random, owned) {
  const available = UPGRADES.filter((up) => (owned[up.id] || 0) < up.max);
  const pool = available.length > 0 ? available : UPGRADES;
  const draft = [];
  const copy = [...pool];
  while (draft.length < 3 && copy.length > 0) {
    const index = Math.floor(random.next() * copy.length);
    draft.push(copy.splice(index, 1)[0]);
  }
  return draft;
}

// The live numbers an upgrade changes, derived from the stacks owned.
export function computeStats(owned) {
  const rapid = owned.rapid || 0;
  const heavy = owned.heavy || 0;
  const twin = owned.twin || 0;
  const pierce = owned.pierce || 0;
  const overcharge = owned.overcharge || 0;
  return {
    fireInterval: 0.22 * Math.pow(0.82, rapid),
    boltDamage: 1 + heavy,
    boltsPerShot: 1 + twin,
    boltPierce: pierce,
    scoreMultiplier: 1 + 0.25 * overcharge,
    frostSlow: Math.pow(0.88, owned.frost || 0),
    magnet: (owned.magnet || 0) > 0,
  };
}
