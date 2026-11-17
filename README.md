# Orbital Sentinel

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/ryky-pixel/makefun-best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/ryky-pixel/makefun-best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Orbital Sentinel is a complete arcade defense game. Meteors are falling on Haven-9, the last colony world, and your turret is its only shield: aim with the mouse, hold click to fire, blast ten waves of rock, shards, boulders and splitters, and draft an upgrade between waves — faster fire, heavier rounds, twin barrels, repairs, a magnet coil, a frost field, piercing rounds or overcharge. Survive all ten waves to win; if the hull reaches zero, the colony falls.

## Run it

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080
```

Or serve the `game/` folder with any static file server and open `index.html`. No build step, no network requests, no assets to download: the game is plain HTML, CSS and ES modules plus synthesized Web Audio sound.

## Controls

- Mouse — aim the turret
- Hold click — fire
- Space / Enter — start, restart
- 1 / 2 / 3 — draft an upgrade (or click a card)
- P — pause, M — mute

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ms4sty1v&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
