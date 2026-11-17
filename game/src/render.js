// Orbital Sentinel — everything the player sees.
// One canvas, drawn fresh every frame: the starfield, the planet and its
// turret, the meteors, bolts and particles, the HUD, and the title,
// upgrade, victory and game-over screens. Layout numbers for the
// upgrade cards live here too, so clicks and drawing agree.

import { VIEW, PALETTE } from './config.js';

const TAU = Math.PI * 2;

function buildBackground() {
  const off = document.createElement('canvas');
  off.width = VIEW.width;
  off.height = VIEW.height;
  const ctx = off.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, PALETTE.backgroundTop);
  gradient.addColorStop(1, PALETTE.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Soft nebula washes, fixed at boot so the sky never flickers.
  const nebulae = [
    { x: 210, y: 150, r: 260, color: 'rgba(64, 90, 180, 0.16)' },
    { x: 1080, y: 620, r: 300, color: 'rgba(150, 60, 140, 0.12)' },
    { x: 950, y: 120, r: 200, color: 'rgba(40, 140, 160, 0.10)' },
  ];
  for (const nebula of nebulae) {
    const wash = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
    wash.addColorStop(0, nebula.color);
    wash.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(nebula.x - nebula.r, nebula.y - nebula.r, nebula.r * 2, nebula.r * 2);
  }
  // Three depths of stars: far ones dim and small, near ones bright.
  const layers = [
    { count: 130, size: 1, alpha: 0.5 },
    { count: 70, size: 1.6, alpha: 0.75 },
    { count: 28, size: 2.4, alpha: 1 },
  ];
  for (const layer of layers) {
    ctx.fillStyle = PALETTE.star;
    for (let i = 0; i < layer.count; i += 1) {
      const x = Math.random() * VIEW.width;
      const y = Math.random() * VIEW.height;
      ctx.globalAlpha = layer.alpha * (0.5 + Math.random() * 0.5);
      ctx.fillRect(x, y, layer.size, layer.size);
    }
  }
  ctx.globalAlpha = 1;
  return off;
}

let background = null;

export function layoutUpgradeCards() {
  const cardWidth = 300;
  const cardHeight = 190;
  const gap = 36;
  const totalWidth = cardWidth * 3 + gap * 2;
  const startX = (VIEW.width - totalWidth) / 2;
  const y = 300;
  return [0, 1, 2].map((i) => ({
    x: startX + i * (cardWidth + gap),
    y,
    width: cardWidth,
    height: cardHeight,
  }));
}

function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 14);
  ctx.fill();
  ctx.stroke();
}

function drawCenteredText(ctx, text, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawPlanet(ctx, time) {
  const { planetX, planetY, planetRadius } = VIEW;
  // Atmosphere glow.
  const glow = ctx.createRadialGradient(planetX, planetY, planetRadius * 0.8, planetX, planetY, planetRadius * 1.7);
  glow.addColorStop(0, PALETTE.atmosphere);
  glow.addColorStop(1, 'rgba(242, 165, 65, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(planetX, planetY, planetRadius * 1.7, 0, TAU);
  ctx.fill();
  // The planet itself, lit from the upper left.
  const body = ctx.createRadialGradient(planetX - 22, planetY - 26, 8, planetX, planetY, planetRadius);
  body.addColorStop(0, '#ffd98a');
  body.addColorStop(0.55, PALETTE.planet);
  body.addColorStop(1, PALETTE.planetDark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(planetX, planetY, planetRadius, 0, TAU);
  ctx.fill();
  // Craters, placed once per frame from a fixed seed so they do not move.
  ctx.fillStyle = 'rgba(140, 80, 10, 0.35)';
  const craters = [
    [18, 12, 9], [-24, 20, 12], [6, -28, 7], [-8, -8, 5], [30, -6, 6],
  ];
  for (const [dx, dy, r] of craters) {
    ctx.beginPath();
    ctx.arc(planetX + dx, planetY + dy, r, 0, TAU);
    ctx.fill();
  }
  // A slow orbit ring for depth.
  ctx.strokeStyle = 'rgba(159, 176, 216, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(planetX, planetY, planetRadius + 26, (planetRadius + 26) * 0.32, -0.35, 0, TAU);
  ctx.stroke();
  void time;
}

function drawTurret(ctx, aimAngle) {
  const { planetX, planetY } = VIEW;
  ctx.save();
  ctx.translate(planetX, planetY);
  ctx.rotate(aimAngle);
  ctx.fillStyle = '#e8eefc';
  ctx.strokeStyle = '#5a6b96';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, -7, 52, 14, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.bolt;
  ctx.beginPath();
  ctx.arc(52, 0, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#dbe4f7';
  ctx.strokeStyle = '#5a6b96';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(planetX, planetY, 16, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function drawMeteor(ctx, meteor) {
  ctx.save();
  ctx.translate(meteor.x, meteor.y);
  ctx.rotate(meteor.rotation);
  ctx.fillStyle = meteor.color;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const bumps = meteor.bumps;
  for (let i = 0; i < bumps.length; i += 1) {
    const angle = (i / bumps.length) * TAU;
    const r = meteor.radius * bumps[i];
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (meteor.flash > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  }
  ctx.restore();
  // A health bar over anything tougher than one hit.
  if (meteor.maxHp > 1) {
    const barWidth = meteor.radius * 1.6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(meteor.x - barWidth / 2, meteor.y - meteor.radius - 12, barWidth, 5);
    ctx.fillStyle = '#ff8a5a';
    ctx.fillRect(meteor.x - barWidth / 2, meteor.y - meteor.radius - 12, barWidth * (meteor.hp / meteor.maxHp), 5);
  }
}

function drawHud(ctx, game) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`WAVE ${game.wave} / 10`, 28, 34);
  ctx.fillText(`SCORE ${game.score.toLocaleString('en-US')}`, 28, 66);
  ctx.fillStyle = PALETTE.credit;
  ctx.fillText(`◉ ${game.credits}`, 28, 98);
  // Hull bar, top right.
  const barX = VIEW.width - 268;
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('HULL', barX - 12, 34);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.roundRect(barX, 22, 240, 24, 6);
  ctx.fill();
  const hullRatio = Math.max(0, game.hull / game.planet.maxHull);
  ctx.fillStyle = hullRatio > 0.35 ? PALETTE.hull : PALETTE.hullLow;
  ctx.beginPath();
  ctx.roundRect(barX, 22, 240 * hullRatio, 24, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(game.hull)}`, barX + 120, 35);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '16px system-ui, sans-serif';
  const remaining = game.director.remaining() + game.meteors.length;
  ctx.fillText(`Meteors left: ${remaining}`, VIEW.width - 268, 66);
  if (game.muted) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Muted (M)', VIEW.width - 268, 98);
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mouse to aim · hold click to fire · P pause · M mute', VIEW.width / 2, VIEW.height - 18);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(4, 7, 18, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawCenteredText(ctx, 'ORBITAL SENTINEL', VIEW.width / 2, 190, '800 72px system-ui, sans-serif', PALETTE.text);
  drawCenteredText(ctx, 'Hold the line around Haven-9', VIEW.width / 2, 248, '400 26px system-ui, sans-serif', PALETTE.accent);
  drawCenteredText(ctx, 'Meteors are falling on the last colony world. Your turret is its only shield.', VIEW.width / 2, 302, '400 20px system-ui, sans-serif', PALETTE.textDim);
  drawCenteredText(ctx, 'Blast 10 waves. Draft upgrades between waves. Do not let the hull reach zero.', VIEW.width / 2, 332, '400 20px system-ui, sans-serif', PALETTE.textDim);
  drawCenteredText(ctx, 'Mouse aims · hold click to fire · 1 / 2 / 3 drafts an upgrade · P pauses · M mutes', VIEW.width / 2, 522, '700 19px system-ui, sans-serif', PALETTE.text);
  const pulse = 0.65 + 0.35 * Math.sin(game.time * 3);
  ctx.globalAlpha = pulse;
  drawCenteredText(ctx, 'CLICK OR PRESS SPACE TO START', VIEW.width / 2, 584, '800 26px system-ui, sans-serif', PALETTE.accent);
  ctx.globalAlpha = 1;
  if (game.best > 0) {
    drawCenteredText(ctx, `Best score: ${game.best.toLocaleString('en-US')}`, VIEW.width / 2, 640, '400 18px system-ui, sans-serif', PALETTE.textDim);
  }
}

function drawUpgrade(ctx, game) {
  ctx.fillStyle = 'rgba(4, 7, 18, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawCenteredText(ctx, `WAVE ${game.wave} CLEARED`, VIEW.width / 2, 170, '800 44px system-ui, sans-serif', PALETTE.text);
  drawCenteredText(ctx, 'Draft one upgrade — click a card or press 1, 2 or 3', VIEW.width / 2, 224, '400 21px system-ui, sans-serif', PALETTE.textDim);
  const cards = layoutUpgradeCards();
  game.draft.forEach((upgrade, i) => {
    const card = cards[i];
    drawPanel(ctx, card.x, card.y, card.width, card.height);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[${i + 1}]`, card.x + card.width / 2, card.y + 28);
    drawCenteredText(ctx, upgrade.name, card.x + card.width / 2, card.y + 66, '800 24px system-ui, sans-serif', PALETTE.text);
    ctx.font = '400 17px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.textDim;
    wrapText(ctx, upgrade.desc, card.x + card.width / 2, card.y + 104, card.width - 36, 24);
    const owned = game.owned[upgrade.id] || 0;
    drawCenteredText(ctx, `Owned: ${owned} / ${upgrade.max}`, card.x + card.width / 2, card.y + card.height - 26, '400 15px system-ui, sans-serif', PALETTE.textDim);
  });
  drawCenteredText(ctx, `Score ${game.score.toLocaleString('en-US')} · Credits ${game.credits} · Hull ${Math.ceil(game.hull)}`, VIEW.width / 2, 556, '400 19px system-ui, sans-serif', PALETTE.textDim);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(trial).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line !== '') lines.push(line);
  lines.forEach((drawn, i) => {
    ctx.fillText(drawn, x, y + i * lineHeight);
  });
}

function drawEndScreen(ctx, game, won) {
  ctx.fillStyle = 'rgba(4, 7, 18, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const title = won ? 'HAVEN-9 HOLDS' : 'HAVEN-9 HAS FALLEN';
  const color = won ? PALETTE.hull : PALETTE.hullLow;
  drawCenteredText(ctx, title, VIEW.width / 2, 230, '800 60px system-ui, sans-serif', color);
  const sub = won
    ? 'All ten waves broken against your turret. The colony endures.'
    : `The swarm broke through on wave ${game.wave}. The colony will rebuild — and so will you.`;
  drawCenteredText(ctx, sub, VIEW.width / 2, 296, '400 21px system-ui, sans-serif', PALETTE.textDim);
  drawPanel(ctx, VIEW.width / 2 - 320, 350, 640, 150);
  drawCenteredText(ctx, `FINAL SCORE  ${game.score.toLocaleString('en-US')}`, VIEW.width / 2, 396, '800 28px system-ui, sans-serif', PALETTE.text);
  drawCenteredText(ctx, `Waves cleared: ${won ? 10 : game.wave - 1} · Meteors destroyed: ${game.kills} · Credits earned: ${game.creditsEarned}`, VIEW.width / 2, 436, '400 18px system-ui, sans-serif', PALETTE.textDim);
  drawCenteredText(ctx, `Best score: ${Math.max(game.best, game.score).toLocaleString('en-US')}`, VIEW.width / 2, 470, '400 18px system-ui, sans-serif', PALETTE.textDim);
  const pulse = 0.65 + 0.35 * Math.sin(game.time * 3);
  ctx.globalAlpha = pulse;
  drawCenteredText(ctx, 'CLICK OR PRESS SPACE TO PLAY AGAIN', VIEW.width / 2, 566, '800 24px system-ui, sans-serif', PALETTE.accent);
  ctx.globalAlpha = 1;
}

export function drawGame(ctx, game) {
  if (!background) background = buildBackground();
  ctx.save();
  if (game.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  ctx.drawImage(background, 0, 0);
  // Faint orbit guides so the field reads at a glance.
  ctx.strokeStyle = 'rgba(159, 176, 216, 0.10)';
  ctx.lineWidth = 1;
  for (const r of [150, 240, 330]) {
    ctx.beginPath();
    ctx.arc(VIEW.planetX, VIEW.planetY, r, 0, TAU);
    ctx.stroke();
  }
  drawPlanet(ctx, game.time);
  for (const orb of game.orbs) {
    ctx.fillStyle = PALETTE.credit;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 217, 77, 0.35)';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius + 4, 0, TAU);
    ctx.fill();
  }
  for (const meteor of game.meteors) drawMeteor(ctx, meteor);
  drawTurret(ctx, game.aimAngle);
  ctx.strokeStyle = PALETTE.bolt;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const bolt of game.bolts) {
    ctx.beginPath();
    ctx.moveTo(bolt.x - bolt.vx * 0.03, bolt.y - bolt.vy * 0.03);
    ctx.lineTo(bolt.x, bolt.y);
    ctx.stroke();
  }
  for (const parts of game.particles) {
    for (const part of parts) {
      ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.radius, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const text of game.texts) {
    ctx.globalAlpha = Math.max(0, text.life);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  if (game.state === 'playing' || game.state === 'upgrade' || game.paused) drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'upgrade') drawUpgrade(ctx, game);
  if (game.state === 'victory') drawEndScreen(ctx, game, true);
  if (game.state === 'gameover') drawEndScreen(ctx, game, false);
  if (game.paused && game.state === 'playing') {
    ctx.fillStyle = 'rgba(4, 7, 18, 0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    drawCenteredText(ctx, 'PAUSED', VIEW.width / 2, VIEW.height / 2 - 10, '800 54px system-ui, sans-serif', PALETTE.text);
    drawCenteredText(ctx, 'Press P to resume', VIEW.width / 2, VIEW.height / 2 + 44, '400 20px system-ui, sans-serif', PALETTE.textDim);
  }
}
