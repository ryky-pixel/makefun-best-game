// Orbital Sentinel — screenshot and demo staging.
// A plain load opens the title screen. A load with ?shot= jumps straight
// into a staged scene so screenshots show the whole loop: the title, a
// live wave, the upgrade draft, a victory or a defeat. ?seed= pins the
// random stream so a staged scene plays out the same way every time.
// In a staged combat scene an autopilot aims and fires, so the frame is
// alive instead of a frozen pose.

import { VIEW } from './config.js';
import { makeMeteor } from './entities.js';

export function readShotParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get('shot'),
    seed: params.get('seed'),
  };
}

// Stage one of the named scenes on a fresh game object. Returns true
// when a scene was staged, false for a normal title-screen load.
export function stageShot(game, shot, random) {
  if (shot === 'start' || shot === null || shot === undefined) {
    game.state = 'title';
    return shot === 'start';
  }
  if (shot === 'play') {
    game.state = 'playing';
    game.wave = 3;
    game.score = 1250;
    game.credits = 42;
    game.hull = 78;
    game.director.startWave(3);
    game.director.spawned = 8;
    game.director.toSpawn = 12;
    // Meteors already mid-flight, at several ranges and angles.
    const staged = [
      { typeId: 'rock', x: 180, y: 130 },
      { typeId: 'shard', x: 1090, y: 190 },
      { typeId: 'boulder', x: 240, y: 620 },
      { typeId: 'splitter', x: 980, y: 660 },
      { typeId: 'rock', x: 640, y: 90 },
      { typeId: 'shard', x: 120, y: 420 },
    ];
    for (const spot of staged) {
      const meteor = makeMeteor(random, 3, spot.typeId);
      meteor.x = spot.x;
      meteor.y = spot.y;
      const angle = Math.atan2(VIEW.planetY - spot.y, VIEW.planetX - spot.x);
      meteor.vx = Math.cos(angle) * meteor.speed;
      meteor.vy = Math.sin(angle) * meteor.speed;
      game.meteors.push(meteor);
    }
    game.autopilot = true;
    game.texts.push({ x: 700, y: 300, text: '+50', color: '#f2f6ff', life: 0.8, update(dt) { this.y -= 34 * dt; this.life -= dt; } });
    return true;
  }
  if (shot === 'upgrade') {
    game.state = 'upgrade';
    game.wave = 4;
    game.score = 2480;
    game.credits = 61;
    game.hull = 86;
    game.draft = game.drawDraft();
    return true;
  }
  if (shot === 'victory') {
    game.state = 'victory';
    game.wave = 10;
    game.score = 8450;
    game.kills = 96;
    game.creditsEarned = 214;
    game.best = 8450;
    return true;
  }
  if (shot === 'end') {
    game.state = 'gameover';
    game.wave = 7;
    game.score = 3120;
    game.kills = 58;
    game.creditsEarned = 131;
    game.best = 8450;
    return true;
  }
  game.state = 'title';
  return false;
}

// The autopilot: aim at the nearest meteor and hold fire. Used only for
// staged combat screenshots, never in normal play.
export function autopilotAim(game) {
  if (game.meteors.length === 0) return;
  let nearest = game.meteors[0];
  let nearestDist = Infinity;
  for (const meteor of game.meteors) {
    const dist = Math.hypot(meteor.x - VIEW.planetX, meteor.y - VIEW.planetY);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = meteor;
    }
  }
  game.aimAngle = Math.atan2(nearest.y - VIEW.planetY, nearest.x - VIEW.planetX);
  game.firing = true;
}
