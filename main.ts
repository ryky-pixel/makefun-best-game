// Orbital Sentinel — the hand-in program for best-game-01 (Node 22,
// standard library only). It gathers the game and its screenshots into
// /output and writes /output/dossier.json, the summary the judge reads,
// using the vendored make.fun library. Run it twice and the bytes must
// match: the grader runs it twice and compares.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a plain error when the entry is incomplete, instead of
// letting the dossier builder report a missing game or empty screenshots.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the game cannot be handed in.');
}
const { readdirSync } = await import('node:fs');
const shotFiles = readdirSync(join(here, 'screenshots')).filter((name) => !name.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shotFiles.length}.`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (see the kit's gate): only the text cap
// shapes the dossier's bytes; the rest refuse an entry the scorer would
// refuse, so failing here is failing the same way there.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
