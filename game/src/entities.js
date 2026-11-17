// Orbital Sentinel — the moving things: meteors, bolts, particles,
// credit orbs and floating score text. Each one is a plain object with
// an update step and the numbers render needs; no DOM, no assets.

import { VIEW, METEOR_TYPES } from './config.js';

function edgeSpawnPoint(random) {
  const side = random.int(0, 3);
  const margin = 30;
  if (side === 0) return { x: random.range(margin, VIEW.width - margin), y: -margin };
  if (side === 1) return { x: random.range(margin, VIEW.width - margin), y: VIEW.height + margin };
  if (side === 2) return { x: -margin, y: random.range(margin, VIEW.height - margin) };
  return { x: VIEW.width + margin, y: random.range(margin, VIEW.height - margin) };
}

export function makeMeteor(random, wave, typeId) {
  const type = METEOR_TYPES[typeId];
  const point = edgeSpawnPoint(random);
  const radius = random.range(type.radiusMin, type.radiusMax);
  const speed = random.range(type.speedMin, type.speedMax) * (1 + (wave - 1) * 0.045);
  const angleToPlanet = Math.atan2(VIEW.planetY - point.y, VIEW.planetX - point.x);
  const aimError = random.range(-0.16, 0.16);
  const angle = angleToPlanet + aimError;
  // A jagged silhouette, fixed at birth so the rock keeps its shape.
  const bumps = [];
  const bumpCount = 9;
  for (let i = 0; i < bumpCount; i += 1) {
    bumps.push(random.range(0.72, 1.12));
  }
  return {
    kind: 'meteor',
    typeId,
    x: point.x,
    y: point.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    hp: type.hp + (wave >= 6 && typeId !== 'shard' ? 1 : 0),
    maxHp: type.hp + (wave >= 6 && typeId !== 'shard' ? 1 : 0),
    speed,
    damage: type.damage,
    score: type.score,
    credits: type.credits,
    color: type.color,
    rotation: random.range(0, Math.PI * 2),
    spin: random.range(-0.9, 0.9),
    bumps,
    wobblePhase: random.range(0, Math.PI * 2),
    wobbleSpeed: random.range(0.6, 1.6),
    slowFactor: 1,
    flash: 0,
    update(dt) {
      this.wobblePhase += dt * this.wobbleSpeed;
      const wobble = Math.sin(this.wobblePhase) * 6;
      const perpendicular = Math.atan2(this.vy, this.vx) + Math.PI / 2;
      this.x += (this.vx + Math.cos(perpendicular) * wobble) * this.slowFactor * dt;
      this.y += (this.vy + Math.sin(perpendicular) * wobble) * this.slowFactor * dt;
      this.rotation += this.spin * dt;
      if (this.flash > 0) this.flash -= dt;
    },
  };
}

export function makeBolt(x, y, angle, speed, damage, pierce) {
  return {
    kind: 'bolt',
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 4,
    damage,
    pierce,
    life: 1.6,
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
    },
  };
}

export function makeParticle(x, y, color, count, speed) {
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = Math.random() * speed;
    parts.push({
      x,
      y,
      vx: Math.cos(angle) * magnitude,
      vy: Math.sin(angle) * magnitude,
      radius: 1.5 + Math.random() * 2.5,
      color,
      life: 0.45 + Math.random() * 0.4,
      maxLife: 0.85,
    });
  }
  return parts;
}

export function makeCreditOrb(x, y, random) {
  return {
    kind: 'orb',
    x,
    y,
    vx: random.range(-30, 30),
    vy: random.range(-30, 30),
    radius: 6,
    value: 1,
    pull: 60,
    update(dt, magnet) {
      const dx = VIEW.planetX - this.x;
      const dy = VIEW.planetY - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = this.pull * (magnet ? 2.4 : 1);
      this.vx += (dx / dist) * pull * dt;
      this.vy += (dy / dist) * pull * dt;
      // Gentle drag so orbs spiral in instead of slingshotting past.
      this.vx *= 1 - 0.4 * dt;
      this.vy *= 1 - 0.4 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    },
  };
}

export function makeFloatingText(x, y, text, color) {
  return {
    x,
    y,
    text,
    color,
    life: 1.0,
    update(dt) {
      this.y -= 34 * dt;
      this.life -= dt;
    },
  };
}
