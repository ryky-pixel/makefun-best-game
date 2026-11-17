// Orbital Sentinel — a small seeded random number generator.
// Screenshots and replays can pass a seed so a scene plays out the same
// way every time; normal play seeds from the clock.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  // mulberry32: tiny, fast, good enough for spawning and wobble.
  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(min, max) {
      return min + next() * (max - min);
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    chance(p) {
      return next() < p;
    },
  };
}

export function seedFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  if (raw === null || raw === '') return (Math.random() * 0xffffffff) >>> 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed >>> 0 : (Math.random() * 0xffffffff) >>> 0;
}
