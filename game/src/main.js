// Orbital Sentinel — boot, the state machine and the game loop.
// Owns the game object, runs one fixed update per animation frame,
// resolves collisions, pays out kills, advances waves and opens the
// upgrade draft, and hands every frame to render.

import { VIEW, PLANET, TURRET, WAVES, SCORE, METEOR_TYPES } from './config.js';
import { makeRandom, seedFromQuery } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { makeBolt, makeParticle, makeCreditOrb, makeFloatingText } from './entities.js';
import { createWaveDirector, drawUpgradeDraft, computeStats } from './waves.js';
import { drawGame, layoutUpgradeCards } from './render.js';
import { readShotParams, stageShot, autopilotAim } from './shots.js';

const BEST_KEY = 'orbital-sentinel-best';

function loadBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Private mode or no storage: the score still shows this session.
  }
}

function createGame(canvas) {
  const random = makeRandom(seedFromQuery());
  const game = {
    canvas,
    random,
    state: 'title',
    paused: false,
    muted: false,
    time: 0,
    score: 0,
    credits: 0,
    creditsEarned: 0,
    hull: PLANET.maxHull,
    planet: PLANET,
    wave: 0,
    kills: 0,
    best: loadBest(),
    owned: {},
    draft: [],
    meteors: [],
    bolts: [],
    particles: [],
    orbs: [],
    texts: [],
    aimAngle: -Math.PI / 2,
    firing: false,
    fireCooldown: 0,
    shake: 0,
    autopilot: false,
    director: createWaveDirector(random),
    audio: createAudio(),
    stats: computeStats({}),
    drawDraft() {
      return drawUpgradeDraft(this.random, this.owned);
    },
  };
  return game;
}

function startRun(game) {
  game.state = 'playing';
  game.score = 0;
  game.credits = 0;
  game.creditsEarned = 0;
  game.hull = PLANET.maxHull;
  game.wave = 0;
  game.kills = 0;
  game.owned = {};
  game.meteors = [];
  game.bolts = [];
  game.particles = [];
  game.orbs = [];
  game.texts = [];
  game.stats = computeStats({});
  game.autopilot = false;
  game.director.startWave(1);
  game.wave = 1;
  game.audio.unlock();
}

function applyUpgrade(game, upgrade) {
  game.owned[upgrade.id] = (game.owned[upgrade.id] || 0) + 1;
  if (upgrade.id === 'repair') {
    game.hull = Math.min(PLANET.maxHull, game.hull + 30);
    game.texts.push(makeFloatingText(VIEW.planetX, VIEW.planetY - 110, '+30 HULL', '#7dff8a'));
  }
  game.stats = computeStats(game.owned);
}

function fireBolts(game) {
  const stats = game.stats;
  const spread = 0.09;
  const count = stats.boltsPerShot;
  for (let i = 0; i < count; i += 1) {
    const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
    const angle = game.aimAngle + offset;
    const startX = VIEW.planetX + Math.cos(angle) * TURRET.barrelLength;
    const startY = VIEW.planetY + Math.sin(angle) * TURRET.barrelLength;
    game.bolts.push(makeBolt(startX, startY, angle, TURRET.baseBoltSpeed, stats.boltDamage, stats.boltPierce));
  }
  game.audio.shoot();
}

function burst(game, x, y, color, count, speed) {
  game.particles.push(makeParticle(x, y, color, count, speed));
}

function destroyMeteor(game, meteor, index) {
  game.meteors.splice(index, 1);
  game.kills += 1;
  const gained = Math.round(meteor.score * game.stats.scoreMultiplier);
  game.score += gained;
  game.texts.push(makeFloatingText(meteor.x, meteor.y, `+${gained}`, '#f2f6ff'));
  burst(game, meteor.x, meteor.y, meteor.color, 14, 160);
  burst(game, meteor.x, meteor.y, '#ffd94d', 6, 90);
  game.audio.explosion();
  const orbCount = Math.min(3, meteor.credits);
  for (let i = 0; i < orbCount; i += 1) {
    game.orbs.push(makeCreditOrb(meteor.x, meteor.y, game.random));
  }
  if (meteor.typeId === 'splitter') {
    for (let i = 0; i < 2; i += 1) {
      const shard = makeMeteorShards(game, meteor);
      if (shard) game.meteors.push(shard);
    }
  }
}

function makeMeteorShards(game, parent) {
  // A splitter breaks into two fast shards flying off at angles.
  const type = METEOR_TYPES.shard;
  const angle = game.random.range(0, Math.PI * 2);
  return {
    kind: 'meteor',
    typeId: 'shard',
    x: parent.x,
    y: parent.y,
    vx: Math.cos(angle) * type.speedMin,
    vy: Math.sin(angle) * type.speedMin,
    radius: game.random.range(type.radiusMin, type.radiusMax),
    hp: 1,
    maxHp: 1,
    speed: type.speedMin,
    damage: type.damage,
    score: type.score,
    credits: 1,
    color: type.color,
    rotation: 0,
    spin: game.random.range(-1.5, 1.5),
    bumps: [1, 0.85, 1.1, 0.8, 1.05, 0.9, 1.15, 0.75, 1],
    wobblePhase: 0,
    wobbleSpeed: 1,
    slowFactor: 1,
    flash: 0,
    update(dt) {
      this.x += this.vx * this.slowFactor * dt;
      this.y += this.vy * this.slowFactor * dt;
      this.rotation += this.spin * dt;
      if (this.flash > 0) this.flash -= dt;
    },
  };
}

function hitPlanet(game, meteor, index) {
  game.meteors.splice(index, 1);
  game.hull -= meteor.damage;
  game.shake = 14;
  burst(game, meteor.x, meteor.y, '#ff8a5a', 18, 200);
  game.audio.planetHit();
  if (game.hull <= 0) {
    game.hull = 0;
    game.state = 'gameover';
    game.audio.defeat();
    if (game.score > game.best) {
      game.best = game.score;
      saveBest(game.score);
    }
  }
}

function updatePlaying(game, dt, input) {
  const stats = game.stats;
  // Aim follows the pointer; the autopilot takes over for staged shots.
  if (game.autopilot) {
    autopilotAim(game);
  } else {
    game.aimAngle = Math.atan2(input.mouse.y - VIEW.planetY, input.mouse.x - VIEW.planetX);
  }
  game.firing = game.autopilot || input.mouse.down;
  game.fireCooldown -= dt;
  if (game.firing && game.fireCooldown <= 0) {
    fireBolts(game);
    game.fireCooldown = stats.fireInterval;
  }
  game.director.update(dt, game.meteors);
  for (const meteor of game.meteors) {
    meteor.slowFactor = stats.frostSlow;
    meteor.update(dt);
  }
  for (const bolt of game.bolts) bolt.update(dt);
  for (const orb of game.orbs) orb.update(dt, stats.magnet);
  game.bolts = game.bolts.filter((bolt) => bolt.life > 0 && bolt.x > -20 && bolt.x < VIEW.width + 20 && bolt.y > -20 && bolt.y < VIEW.height + 20);
  // Bolts against meteors.
  for (let b = game.bolts.length - 1; b >= 0; b -= 1) {
    const bolt = game.bolts[b];
    let consumed = false;
    for (let m = game.meteors.length - 1; m >= 0; m -= 1) {
      const meteor = game.meteors[m];
      const dist = Math.hypot(bolt.x - meteor.x, bolt.y - meteor.y);
      if (dist < bolt.radius + meteor.radius) {
        meteor.hp -= bolt.damage;
        meteor.flash = 0.09;
        if (bolt.pierce > 0) {
          bolt.pierce -= 1;
        } else {
          game.bolts.splice(b, 1);
          consumed = true;
        }
        if (meteor.hp <= 0) destroyMeteor(game, meteor, m);
        break;
      }
    }
    void consumed;
  }
  // Meteors against the planet.
  for (let m = game.meteors.length - 1; m >= 0; m -= 1) {
    const meteor = game.meteors[m];
    const dist = Math.hypot(meteor.x - VIEW.planetX, meteor.y - VIEW.planetY);
    if (dist < PLANET.hitRadius + meteor.radius * 0.6) {
      hitPlanet(game, meteor, m);
      if (game.state !== 'playing') return;
    }
  }
  // Orbs drift home to the planet and pay out on arrival.
  for (let o = game.orbs.length - 1; o >= 0; o -= 1) {
    const orb = game.orbs[o];
    const dist = Math.hypot(orb.x - VIEW.planetX, orb.y - VIEW.planetY);
    if (dist < VIEW.planetRadius + 24) {
      game.orbs.splice(o, 1);
      game.credits += orb.value;
      game.creditsEarned += orb.value;
      game.audio.pickup();
    } else if (orb.x < -40 || orb.x > VIEW.width + 40 || orb.y < -40 || orb.y > VIEW.height + 40) {
      game.orbs.splice(o, 1);
    }
  }
  for (const parts of game.particles) {
    for (const part of parts) {
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
    }
  }
  game.particles = game.particles.filter((parts) => parts.some((part) => part.life > 0));
  for (const text of game.texts) text.update(dt);
  game.texts = game.texts.filter((text) => text.life > 0);
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 30);
  // Wave cleared: bank the bonus, then open the draft.
  if (game.director.isWaveCleared(game.meteors) && game.state === 'playing') {
    const bonus = WAVES.clearBonusCredits(game.wave);
    game.credits += bonus;
    game.creditsEarned += bonus;
    game.score += SCORE.waveClear(game.wave);
    game.audio.waveClear();
    if (game.wave >= WAVES.total) {
      game.state = 'victory';
      game.audio.victory();
      if (game.score > game.best) {
        game.best = game.score;
        saveBest(game.score);
      }
    } else {
      game.draft = game.drawDraft();
      game.state = 'upgrade';
    }
  }
}

function updateUpgrade(game, input) {
  let picked = -1;
  if (input.wasPressed('Digit1')) picked = 0;
  if (input.wasPressed('Digit2')) picked = 1;
  if (input.wasPressed('Digit3')) picked = 2;
  if (input.consumeClick()) {
    const point = input.clickPoint();
    const cards = layoutUpgradeCards();
    cards.forEach((card, i) => {
      if (point.x >= card.x && point.x <= card.x + card.width && point.y >= card.y && point.y <= card.y + card.height) {
        picked = i;
      }
    });
  }
  if (picked >= 0 && picked < game.draft.length) {
    applyUpgrade(game, game.draft[picked]);
    game.draft = [];
    game.wave += 1;
    game.director.startWave(game.wave);
    game.state = 'playing';
  }
}

export function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const game = createGame(canvas);
  // A handle for play-testing and screenshots: lets an automated browser
  // read the state (wave, score, hull) without touching the canvas.
  window.__sentinel = game;
  const input = createInput(canvas);
  const params = readShotParams();
  window.__shotReady = false;
  stageShot(game, params.shot, game.random);

  let last = performance.now();
  let frames = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.time += dt;
    // Global keys work on every screen.
    if (input.wasPressed('KeyM')) {
      game.muted = game.audio.toggleMute();
    }
    if (input.wasPressed('KeyP') && game.state === 'playing') {
      game.paused = !game.paused;
    }
    if (!game.paused) {
      if (game.state === 'title' && (input.wasPressed('Space') || input.wasPressed('Enter') || input.consumeClick())) {
        game.audio.unlock();
        startRun(game);
      } else if (game.state === 'playing') {
        updatePlaying(game, dt, input);
      } else if (game.state === 'upgrade') {
        updateUpgrade(game, input);
      } else if ((game.state === 'victory' || game.state === 'gameover') && (input.wasPressed('Space') || input.wasPressed('Enter') || input.consumeClick())) {
        game.audio.unlock();
        startRun(game);
      }
    }
    drawGame(ctx, game);
    frames += 1;
    if (frames === 2) window.__shotReady = true;
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
