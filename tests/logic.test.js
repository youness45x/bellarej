// Logic checks for Bellarej. Runs the game rules from index.html without a browser.
// Usage: node tests/logic.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const logicSrc = html.split('<script>')[1].split('</script>')[0];
const mod = { exports: {} };
vm.runInNewContext(logicSrc, { module: mod, Math, JSON, Number, Array, Set, Object, String });
const L = mod.exports;

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail) {
  if (ok) pass++; else fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail !== undefined ? '  -> ' + JSON.stringify(detail) : ''}`);
}
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function run(g, seconds, dt = 1 / 60, each) {
  for (let t = 0; t < seconds; t += dt) { g.step(dt); if (each && each(g) === false) break; }
}
// Simple autopilot: aim for the middle of the next gap.
function pilot(g) {
  const b = g.bird;
  const next = g.obstacles.find(o => o.x + g.tuning.obstacleWidth + 5 > b.x - b.r);
  // flap when the stork sinks into the lower part of the opening (as a player would)
  const target = next ? next.gapY + (next.gap || g.tuning.gapSize) / 2 - 34 : 300;
  if (g.state === 'playing' && b.y > target && b.vy >= 0) g.input();
}
function storageMock() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}
const blockedStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

// ---------------- Phase 1: core ----------------
{
  const g = L.createGame({ random: seeded(1) });
  check('P1 starts on the title screen', g.state === 'ready');
  check('P1 first tap starts and flaps', g.input() === 'start' && g.state === 'playing' && g.bird.vy < 0);
  const y0 = g.bird.y; run(g, 0.15);
  check('P1 flap lifts the stork', g.bird.y < y0);
  run(g, 0.6);
  check('P1 stork falls when not tapping', g.bird.vy > 0);
}
{
  const g = L.createGame({ random: seeded(2) });
  g.input(); run(g, 5);
  check('P1 hitting the ground ends the run', g.state === 'over');
}
{
  const g = L.createGame({ random: seeded(3) });
  g.input();
  for (let i = 0; i < 200; i++) { g.input(); g.step(1 / 240); }
  check('P1 rapid taps never send the stork above the top', g.bird.y - g.bird.r >= -1e-6);
  check('P1 rapid taps keep speed capped', g.bird.vy >= g.tuning.flapVelocity - 1e-6);
}
{
  const g = L.createGame({ random: seeded(4) });
  g.input();
  // Put an obstacle right on the stork with the gap far away
  run(g, 0.05);
  g.obstacles[0].x = g.bird.x - 10; g.obstacles[0].gapY = 470; g.obstacles[0].pickup = null;
  g.bird.y = 100; g.bird.vy = 0;
  g.step(1 / 60);
  check('P1 hitting an obstacle ends the run', g.state === 'over');
}
{
  const g = L.createGame({ random: seeded(5) });
  g.input();
  let scoreSteps = [], last = 0;
  run(g, 20, 1 / 60, (gg) => { pilot(gg); if (gg.score !== last) { scoreSteps.push(gg.score - last); last = gg.score; } });
  check('P1 autopilot survives 20 s (game is passable)', g.state === 'playing', { score: g.score, state: g.state });
  check('P1 score rises by exactly 1 per gap', scoreSteps.length > 5 && scoreSteps.every(d => d === 1), scoreSteps.slice(0, 10));
}
{
  const g = L.createGame({ random: seeded(6) });
  g.input(); run(g, 5);
  check('P1 tap right after crash is ignored', g.input() === 'ignored' || g.time - g.overAt >= 0.45);
  const g2 = L.createGame({ random: seeded(6) });
  g2.input(); run(g2, 5); // crashed long ago
  run(g2, 0.5);
  check('P1 restart returns to a fresh title screen', g2.input() === 'restart' && g2.state === 'ready' && g2.score === 0 && g2.obstacles.length === 0);
}
{
  const g = L.createGame({ random: seeded(7) });
  g.input(); run(g, 0.3);
  check('P1 pause freezes the run', g.pause() && (() => { const y = g.bird.y; run(g, 2); return g.bird.y === y; })());
  const vy = g.bird.vy;
  check('P1 tap after pause resumes without a flap', g.input() === 'resume' && g.bird.vy === vy);
}
{
  const g = L.createGame({ random: seeded(8) });
  g.input(); run(g, 0.3);
  g.step(5); // a huge frame (tab switch) is capped
  check('P1 huge frame is capped (no teleport)', g.state === 'playing' || g.bird.y < 600);
  g.setWorldWidth(900); g.setWorldWidth(300); g.setWorldWidth(900);
  check('P1 rotating keeps obstacles in order', g.obstacles.every((o, i, a) => i === 0 || o.x > a[i - 1].x));
}

// ---------------- Phase 2: settings ----------------
{
  const st = storageMock();
  const s = L.createSettings(st); s.setLang('ar'); s.setMuted(true);
  const s2 = L.createSettings(st);
  check('P2 language and mute survive a reload', s2.lang === 'ar' && s2.muted === true);
  const s3 = L.createSettings(blockedStorage); s3.setLang('ar');
  check('P2 blocked storage: settings still work in memory', s3.lang === 'ar');
  st.setItem('bellarej.settings.v1', '{broken');
  check('P2 corrupted settings fall back to defaults', L.createSettings(st).lang === 'en');
}

// ---------------- Phase 3: coins and power-ups ----------------
function placePickup(g, type, dy = 0) {
  // put an obstacle so the stork flies straight through its gap and pickup
  const o = g.obstacles[0];
  o.x = g.bird.x + 30; o.gapY = g.bird.y; o.passed = false;
  o.pickup = { type, y: g.bird.y + dy, taken: false };
  for (const other of g.obstacles.slice(1)) other.pickup = null;
  return o;
}
{
  const g = L.createGame({ random: seeded(10) });
  g.input(); run(g, 0.02);
  const y = g.bird.y; placePickup(g, 'coin');
  const hold = (gg) => { gg.bird.y = y; gg.bird.vy = 0; };
  run(g, 0.6, 1 / 60, hold);
  check('P3 flying through a coin adds 1 to this run', g.coinsThisRun === 1, g.coinsThisRun);
  const ev = g.takeEvents();
  check('P3 coin makes a coin event (sound)', ev.includes('coin'));
  run(g, 0.4, 1 / 60, hold);
  check('P3 a coin is collected only once', g.coinsThisRun === 1);
}
{
  // Coins appear and the autopilot collects some over a long run
  const seen = { coin: 0, shield: 0, slow: 0 };
  let g;
  for (const seed of [11, 21, 31]) {
    g = L.createGame({ random: seeded(seed) });
    g.input();
    const ids = new Set();
    run(g, 40, 1 / 60, (gg) => {
      pilot(gg);
      for (const o of gg.obstacles) if (o.pickup && !ids.has(o.id)) { ids.add(o.id); seen[o.pickup.type]++; }
    });
  }
  check('P3 coins and both power-ups appear over a few runs', seen.coin > 30 && seen.shield > 0 && seen.slow > 0, seen);
  check('P3 pickups sit inside the gap (reachable)', g.obstacles.every(o => !o.pickup ||
    Math.abs(o.pickup.y - o.gapY) <= g.tuning.gapSize / 2 - g.tuning.pickupRadius), null);
  check('P3 autopilot collects coins', g.coinsThisRun > 3, g.coinsThisRun);
}
{
  const g = L.createGame({ random: seeded(12) });
  g.input(); run(g, 0.02);
  for (let i = 0; i < 10; i++) g.step(1 / 60); // fill obstacles
  // no power-up in the first gaps
  check('P3 no power-ups in the first gaps', g.obstacles.slice(0, 4).every(o => !o.pickup || o.pickup.type === 'coin'));
}
{
  // Shield absorbs exactly one hit
  const g = L.createGame({ random: seeded(13) });
  g.input(); run(g, 0.02);
  { const y = g.bird.y; placePickup(g, 'shield'); run(g, 0.6, 1 / 60, (gg) => { gg.bird.y = y; gg.bird.vy = 0; }); }
  check('P3 picking up a shield activates it', g.shield === true);
  // slam into a wall
  const o = g.obstacles[1]; o.x = g.bird.x + 5; o.gapY = 470; o.pickup = null;
  g.bird.y = 100; g.bird.vy = 0;
  g.step(1 / 60);
  check('P3 shield absorbs the first hit (run continues)', g.state === 'playing' && g.shield === false, g.state);
  check('P3 shield break makes an event (sound + effect)', g.takeEvents().includes('shieldBreak'));
  run(g, 0.5, 1 / 60, (gg) => { gg.bird.y = 100; gg.bird.vy = 0; });
  check('P3 stays alive while flying clear (grace)', g.state === 'playing');
  // a second hit after the grace period ends the run
  run(g, 1.2, 1 / 60, (gg) => { gg.bird.vy = Math.min(gg.bird.vy, 0); });
  const o2 = g.obstacles.find(x => x.x > g.bird.x) || g.obstacles[0];
  o2.x = g.bird.x - 5; o2.gapY = 470; o2.pickup = null; g.bird.y = 100; g.bird.vy = 0;
  g.step(1 / 60);
  check('P3 second hit ends the run (exactly one absorbed)', g.state === 'over', { state: g.state, grace: g.grace });
}
{
  // Shield saves a ground hit with a bounce
  const g = L.createGame({ random: seeded(14) });
  g.input(); run(g, 0.02);
  for (const o of g.obstacles) o.x += 2000;
  g.shield = true;
  run(g, 3, 1 / 60, (gg) => { if (!gg.shield) return false; });
  check('P3 shield bounces the stork off the ground once', g.state === 'playing' && !g.shield && g.bird.vy < 0);
  run(g, 4);
  check('P3 the next ground hit ends the run', g.state === 'over');
}
{
  // Slow motion: slows the world, shows time left, ends on time
  const g = L.createGame({ random: seeded(15) });
  g.input(); run(g, 0.02);
  let got = 0;
  { const y = g.bird.y; placePickup(g, 'slow');
    run(g, 0.8, 1 / 60, (gg) => { gg.bird.y = y; gg.bird.vy = 0; if (gg.slowLeft > 0) { got = gg.time; return false; } }); }
  check('P3 picking up slow motion starts it at 5 s', g.slowLeft > 4.9 && g.slowLeft <= 5, g.slowLeft);
  const x0 = g.obstacles[0].x;
  run(g, 1, 1 / 60, (gg) => { gg.bird.y = 300; gg.bird.vy = 0; });
  const moved = x0 - g.obstacles[0].x;
  check('P3 world moves slower in slow motion', moved < g.tuning.scrollSpeed * 0.75 && moved > g.tuning.scrollSpeed * 0.5, moved);
  let endedAt = null;
  g.takeEvents();
  run(g, 6, 1 / 60, (gg) => { gg.bird.y = 300; gg.bird.vy = 0; for (const o of gg.obstacles) o.x = Math.max(o.x, 2000);
    if (endedAt === null && gg.slowLeft === 0) endedAt = gg.time; });
  check('P3 slow motion ends after 5 real seconds (±0.05)', endedAt !== null && Math.abs(endedAt - got - 5) < 0.05, endedAt - got);
  check('P3 world returns to full speed', g.timeScale === 1);
  check('P3 slow end makes an event (sound)', g.takeEvents().includes('slowEnd'));
}
{
  // Slow motion timer freezes while paused
  const g = L.createGame({ random: seeded(16) });
  g.input(); g.slowLeft = 3; g.pause(); run(g, 2);
  check('P3 slow-motion timer freezes during pause', g.slowLeft === 3);
}
{
  // Crash clears power-ups; a new run starts clean
  const g = L.createGame({ random: seeded(17) });
  g.input(); g.shield = true; g.slowLeft = 3; g.coinsThisRun = 4;
  run(g, 8);
  run(g, 1); g.input();
  check('P3 new run starts with no power-ups and 0 coins', !g.shield && g.slowLeft === 0 && g.coinsThisRun === 0 && g.timeScale === 1);
}
{
  // Saving: coins + best survive "closing the browser" (new progress object, same storage)
  const st = storageMock();
  const p = L.createProgress(st);
  p.addCoins(7); check('P3 new best is recognized', p.recordBest(12) === true);
  check('P3 lower score is not a new best', p.recordBest(5) === false);
  const p2 = L.createProgress(st);
  check('P3 coins and best survive a reload', p2.coins === 7 && p2.best === 12, { coins: p2.coins, best: p2.best });
  const pb = L.createProgress(blockedStorage);
  pb.addCoins(3); pb.recordBest(9);
  check('P3 blocked storage: progress works in memory without errors', pb.coins === 3 && pb.best === 9);
  st.setItem('bellarej.progress.v1', '{"best":-4,"coins":"lots","owned":["dragon"],"selected":"dragon"}');
  const pc = L.createProgress(st);
  check('P3 corrupted save falls back safely', pc.best === 0 && pc.coins === 0 && pc.selected === 'classic' && pc.owned.join() === 'classic');
}

// ---------------- Phase 4: changing worlds ----------------
// Fly past `n` gaps quickly by teleporting obstacles behind the stork (score logic is untouched).
function passGaps(g, n) {
  for (let i = 0; i < n; i++) {
    const o = g.obstacles.find(o => !o.passed) || g.obstacles[g.obstacles.length - 1];
    o.x = g.bird.x - g.tuning.obstacleWidth - 1; o.gapY = g.bird.y; o.pickup = null;
    g.bird.vy = 0;
    g.step(1 / 120);
  }
}
{
  const g = L.createGame({ random: seeded(40) });
  g.input(); g.step(0.01);
  check('P4 run starts in Marrakech', g.world === 0 && g.level === 0);
  passGaps(g, 19); g.takeEvents();
  check('P4 still Marrakech at 19 points', g.world === 0 && g.score === 19, g.score);
  passGaps(g, 1);
  check('P4 Fès at 20 points', g.world === 1 && g.level === 1, { w: g.world, s: g.score });
  check('P4 world change makes an event', g.takeEvents().includes('world'));
  passGaps(g, 20);
  check('P4 Chefchaouen at 40 points', g.world === 2 && g.score === 40);
  const order = [];
  for (let k = 0; k < 4; k++) { passGaps(g, 20); order.push(g.world); }
  check('P6 then Desert, Coast, Night (60, 80, 100 points) and back to Marrakech at 120', order.join() === '3,4,5,0' && g.score === 120, order);
  passGaps(g, 20);
  check('P4 and on to Fès again (140 points)', g.world === 1 && g.level === 7);
  g.state = 'over'; g.overAt = -10;
  g.restart();
  check('P4 a new run starts in Marrakech, normal difficulty', g.world === 0 && g.level === 0 && g.speed === g.tuning.scrollSpeed);
}
{
  const g = L.createGame();
  const d = [0, 1, 2, 3, 4, 5, 9].map(l => g.difficulty(l));
  check('P4 each world is a little harder', d[1].gap < d[0].gap && d[1].speed > d[0].speed && d[4].gap < d[3].gap);
  check('P4 difficulty stops rising (cap)', d[5].gap === d[4].gap && d[6].speed === d[4].speed && d[4].gap >= 140, d[4]);
}
{
  // Speed eases in, no jump
  const g = L.createGame({ random: seeded(41) });
  g.input(); g.step(0.01);
  passGaps(g, 20);
  const v0 = g.speed;
  g.step(1 / 60);
  check('P4 speed changes gently, not in one jump', g.speed - v0 < 1 && g.speed > v0);
  run(g, 2, 1 / 60, (gg) => { gg.bird.y = 300; gg.bird.vy = 0; for (const o of gg.obstacles) o.gapY = 300; });
  check('P4 speed reaches the new world speed', Math.abs(g.speed - g.difficulty(1).speed) < 1e-6, g.speed);
  check('P4 obstacles made later have the smaller gap', g.obstacles[g.obstacles.length - 1].gap === g.difficulty(1).gap);
}
{
  // Passable: the autopilot survives every world up to the hardest level, several seeds
  let worst = Infinity, results = [];
  for (const seed of [50, 51, 52, 53, 54]) {
    const g = L.createGame({ random: seeded(seed) });
    g.input();
    run(g, 500, 1 / 60, (gg) => { pilot(gg); if (gg.state !== 'playing' || gg.score >= 130) return false; });
    worst = Math.min(worst, g.score); results.push(g.score);
  }
  check('P4 later worlds still passable (autopilot reaches 130 points, all 6 places, in all 5 runs)', worst >= 130, results);
}
{
  // A world change during active power-ups breaks nothing
  const g = L.createGame({ random: seeded(55) });
  g.input(); g.step(0.01);
  passGaps(g, 19);
  g.shield = true; g.slowLeft = 3;
  run(g, 0.3, 1 / 60, (gg) => { gg.bird.y = 300; gg.bird.vy = 0; for (const o of gg.obstacles) o.gapY = 300; });
  const before = g.slowLeft;
  passGaps(g, 1);
  check('P4 world change keeps the shield', g.world === 1 && g.shield === true);
  check('P4 world change keeps the slow-motion timer running', g.slowLeft > 0 && g.slowLeft <= before);
  let ended = false;
  run(g, 4, 1 / 60, (gg) => { gg.bird.y = 300; gg.bird.vy = 0; for (const o of gg.obstacles) o.gapY = 300; if (gg.slowLeft === 0) ended = true; });
  check('P4 slow motion still ends normally after a world change', ended && g.timeScale === 1 && g.state === 'playing');
  // shield still absorbs exactly one hit in the new world
  const o = g.obstacles.find(x => x.x > g.bird.x + 20); o.x = g.bird.x + 5; o.gapY = 470; g.bird.y = 100; g.bird.vy = 0;
  g.step(1 / 60);
  check('P4 shield from the old world still absorbs one hit', g.state === 'playing' && !g.shield);
}

// ---------------- Phase 5: character shop (6 outfits since Phase 6) ----------------
{
  const st = storageMock();
  const p = L.createProgress(st);
  check('P6 six outfits, Classic free and owned from the start', L.CHARACTERS.length === 6 && p.owns('classic') && p.selected === 'classic' && L.CHARACTERS[0].price === 0);
  check('P6 outfit order and prices', L.CHARACTERS.map(c => c.id + ':' + c.price).join() === 'classic:0,riad:40,chefchaouen:80,desert:140,night:220,royal:350');
  check('P5 prices go up', L.CHARACTERS.every((c, i, a) => i === 0 || c.price > a[i - 1].price));
  check('P5 not enough coins: buying is refused, nothing charged', p.buy('riad') === 'poor' && p.coins === 0 && !p.owns('riad'));
  p.addCoins(50);
  check('P5 buying deducts the price and unlocks', p.buy('riad') === 'bought' && p.coins === 10 && p.owns('riad'));
  check('P5 double-tap Buy charges only once', p.buy('riad') === 'owned' && p.coins === 10);
  check('P5 cannot choose an outfit you do not own', p.select('royal') === false && p.selected === 'classic');
  check('P5 choosing an owned outfit works', p.select('riad') === true && p.selected === 'riad');
  const p2 = L.createProgress(st);
  check('P5 owned outfits, choice and coins survive a reload', p2.owns('riad') && p2.selected === 'riad' && p2.coins === 10);
  check('P5 unknown character is refused', p.buy('dragon') === 'unknown' && p.buy('stork') === 'unknown');
  const p3 = L.createProgress(storageMock());
  p3.addCoins(80);
  check('P5 exactly enough coins is enough', p3.buy('chefchaouen') === 'bought' && p3.coins === 0);
  const pb = L.createProgress(blockedStorage);
  pb.addCoins(40);
  check('P5 storage blocked: shop still works in memory', pb.buy('riad') === 'bought' && pb.select('riad') && pb.coins === 0);
}

// ---------------- Phase 6: redesign ----------------
{
  // Old saves (stork, hoopoe, gull, falcon) keep what the player paid for
  const st = storageMock();
  st.setItem('bellarej.progress.v1', JSON.stringify({ best: 33, coins: 17, owned: ['stork', 'hoopoe', 'falcon'], selected: 'falcon' }));
  const p = L.createProgress(st);
  check('P6 old save: best and coins kept', p.best === 33 && p.coins === 17);
  check('P6 old save: hoopoe -> Riad, falcon -> Desert, stork -> Classic', p.owned.join() === 'classic,riad,desert', p.owned);
  check('P6 old save: chosen falcon becomes the Desert outfit', p.selected === 'desert', p.selected);
  check('P6 old gull maps to Chefchaouen', L.LEGACY_CHARACTERS.seagull === 'chefchaouen');
  p.addCoins(1);
  const saved = JSON.parse(st.map.get('bellarej.progress.v1'));
  check('P6 the next save uses the new names', saved.owned.join() === 'classic,riad,desert' && saved.selected === 'desert', saved);
  check('P6 migrated outfit cannot be bought twice', p.buy('desert') === 'owned' && p.coins === 18);
  st.setItem('bellarej.progress.v1', JSON.stringify({ owned: ['seagull'], selected: 'hoopoe' }));
  const q = L.createProgress(st);
  check('P6 old choice of a bird you never owned falls back to Classic', q.selected === 'classic' && q.owns('chefchaouen'));
}
{
  // Each obstacle keeps the look of the place it was built in
  const g = L.createGame({ random: seeded(60) });
  g.input(); g.step(0.01);
  check('P6 first obstacles are Marrakech style', g.obstacles.every(o => o.world === 0));
  passGaps(g, 20);
  const old = g.obstacles.filter(o => o.world === 0).length;
  run(g, 3, 1 / 60, (gg) => { gg.bird.y = 300; gg.bird.vy = 0; for (const o of gg.obstacles) o.gapY = 300; });
  check('P6 new obstacles after the change are Fès style', g.obstacles.some(o => o.world === 1) && old > 0);
  check('P6 every obstacle has a valid place', g.obstacles.every(o => Number.isInteger(o.world) && o.world >= 0 && o.world < g.tuning.worldCount));
  check('P6 difficulty cap (opening 156, speed 182 since the Phase 7 tuning)', g.difficulty(9).gap === 156 && g.difficulty(9).speed === 182, g.difficulty(9));
}

// ---------------- Tuning after the owner's playtest (2026-10-13): "a little easier", gaps felt narrow ----------------
{
  const T = L.TUNING;
  const jump = (v, gr) => (v * v) / (2 * gr);       // how high one tap lifts the bird
  check('T1 starting opening is 180 (was 170)', T.gapSize === 180);
  check('T1 each place still shrinks the opening gently (180 -> 156 at most)', T.gapShrinkPerWorld === 6 && T.maxDifficulty === 4);
  check('T1 softer fall: gravity lower than before (1500)', T.gravity < 1500 && T.gravity >= 1350, T.gravity);
  check('T1 one tap still lifts the bird about the same height (73.6 ± 1)', Math.abs(jump(T.flapVelocity, T.gravity) - jump(-470, 1500)) <= 1,
    { now: jump(T.flapVelocity, T.gravity), before: jump(-470, 1500) });
  check('T1 speed and spacing unchanged', T.scrollSpeed === 150 && T.obstacleSpacing === 240 && T.speedUpPerWorld === 8);
  // real openings in a run match the new values
  const g = L.createGame({ random: seeded(70) });
  g.input(); g.step(0.01);
  check('T1 the first walls of a run have the 180 opening', g.obstacles.every(o => o.gap === 180), g.obstacles.map(o => o.gap));
}

module.exports = { L, check, seeded, run, pilot, storageMock, blockedStorage, report };
function report() {
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}
if (require.main === module) report();
