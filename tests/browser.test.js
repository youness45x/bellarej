// Browser checks for Bellarej: runs the real page in headless Chromium.
// Usage: node tests/browser.test.js [phase]   (screenshots go to tests/shots/)
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');

// Since Phase 7 the game is checked on a real local web address, like the live site
// (offline mode and installing don't work on a plain file).
const ROOT = path.join(__dirname, '..');
const { serve } = require('./serve');
let FILE;
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const PHASE = Number(process.argv[2] || 7);

let pass = 0, fail = 0;
const lines = [];
function check(name, ok, detail) {
  if (ok) pass++; else fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail !== undefined ? '  -> ' + JSON.stringify(detail) : ''}`);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };
const DESKTOP = { viewport: { width: 1280, height: 800 } };

async function open(browser, opts = {}, init) {
  const ctx = await browser.newContext(opts);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForFunction(() => window.bellarej && window.bellarej.game);
  return { ctx, page, errors };
}
// A real browser profile on disk, so "close the browser and reopen it" is tested for real.
const os = require('os');
async function openProfile(dir) {
  const ctx = await chromium.launchPersistentContext(dir, { ...PHONE, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = ctx.pages()[0] || await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForFunction(() => window.bellarej && window.bellarej.game);
  return { ctx, page, errors };
}
const G = (page, fn, arg) => page.evaluate(fn, arg);
const visible = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); return !!el && !el.closest('[hidden]') && el.getClientRects().length > 0; }, sel);
const text = (page, sel) => page.evaluate(s => document.querySelector(s).textContent, sel);

// Keep the stork alive in place: hold it in the middle and move obstacles out of the way.
const HOLD = () => {
  const g = window.bellarej.game;
  clearInterval(window.__hold);
  window.__hold = setInterval(() => {
    g.bird.y = 300; g.bird.vy = 0;
    // only pickups a check placed on purpose; the game's own random coins would make counts vary
    for (const o of g.obstacles) { o.gapY = 300; if (o.pickup && !o.pickup.placed) o.pickup = null; }
  }, 4);
};
const RELEASE = () => clearInterval(window.__hold);

async function startRun(page) {
  await page.locator('#play').click();
  await page.waitForFunction(() => window.bellarej.game.state === 'playing');
}
async function waitOver(page) {
  await G(page, RELEASE);
  await page.waitForFunction(() => window.bellarej.game.state === 'over', null, { timeout: 8000 });
}
async function backToTitle(page) {
  await sleep(500);
  await page.locator('#again').click();
  await page.waitForFunction(() => window.bellarej.game.state === 'ready');
  await sleep(100); // the screen catches up on the next frame
}

(async () => {
  const site = await serve(ROOT);
  FILE = site.url + 'index.html';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

  // ------------------------------------------------------------- Phase 1 + 2 (phone)
  {
    const { ctx, page, errors } = await open(browser, PHONE);
    await page.screenshot({ path: `${SHOTS}/title-en.png` });
    check('P2 title screen shows Play', await visible(page, '#play'));
    await page.touchscreen.tap(195, 500);
    await page.waitForFunction(() => window.bellarej.game.state === 'playing');
    check('P1 tap on the screen starts and flaps', await G(page, () => window.bellarej.game.bird.vy < 0));
    await sleep(700);
    check('P1 stork falls when you stop tapping', await G(page, () => window.bellarej.game.bird.vy > 0));
    for (let i = 0; i < 15; i++) await page.touchscreen.tap(195, 500);
    check('P1 rapid taps never escape off the top', await G(page, () => window.bellarej.game.bird.y >= window.bellarej.game.bird.r - 0.001));
    await G(page, () => window.dispatchEvent(new Event('blur')));
    await sleep(100);
    check('P1 leaving the tab pauses', await G(page, () => window.bellarej.game.state === 'paused'));
    check('P1 pause screen shown', await visible(page, '#paused h2'));
    await page.touchscreen.tap(195, 500);
    check('P1 tap resumes', await G(page, () => window.bellarej.game.state === 'playing'));
    await page.setViewportSize({ width: 844, height: 390 });
    await sleep(150);
    await page.setViewportSize({ width: 390, height: 844 });
    check('P1 rotating mid-run keeps the game running', await G(page, () => ['playing', 'over'].includes(window.bellarej.game.state)));
    await waitOver(page);
    check('P1 game over panel shown', await visible(page, '#over .panel'));
    await page.touchscreen.tap(195, 120);
    check('P1 instant tap after crash does not skip the result', await G(page, () => window.bellarej.game.state === 'over'));
    await backToTitle(page);
    check('P1 Play again returns to title with score 0', await G(page, () => window.bellarej.game.score === 0));
    check('P2 sounds played (flap, crash)', await G(page, () => window.bellarej.sound.played.flap > 0 && window.bellarej.sound.played.crash > 0),
      await G(page, () => ({ ...window.bellarej.sound.played, state: window.bellarej.sound.state })));
    // mute
    await page.locator('#sound').click();
    const before = await G(page, () => window.bellarej.sound.played.flap);
    await startRun(page); await page.touchscreen.tap(195, 500); await sleep(100);
    check('P2 mute silences sounds', await G(page, (b) => window.bellarej.sound.played.flap === b, before));
    await waitOver(page); await backToTitle(page);
    // Arabic
    await page.locator('#lang').click();
    check('P2 Arabic flips the page right-to-left', await G(page, () => document.documentElement.dir === 'rtl'));
    check('P2 Arabic title text', (await text(page, '#ready h1')) === 'بلّارج');
    await page.screenshot({ path: `${SHOTS}/title-ar.png` });
    await page.reload(); await page.waitForFunction(() => window.bellarej);
    check('P2 language and mute survive a reload', await G(page, () => window.bellarej.settings.lang === 'ar' && window.bellarej.settings.muted === true));
    // restore
    await page.locator('#lang').click(); await page.locator('#sound').click();
    check('P1/P2 no script errors (phone)', errors.length === 0, errors);
    await ctx.close();
  }

  // ------------------------------------------------------------- Phase 3
  if (PHASE >= 3) {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bellarej-profile-'));
    const { ctx, page, errors } = await openProfile(profile);
    await startRun(page);
    await G(page, HOLD);
    // a coin right in front of the stork
    await G(page, () => {
      const g = window.bellarej.game, o = g.obstacles[0];
      o.x = g.bird.x + 40; o.pickup = { type: 'coin', y: 300, taken: false, placed: true };
    });
    await page.waitForFunction(() => window.bellarej.game.coinsThisRun === 1, null, { timeout: 3000 }).catch(() => {});
    check('P3 collecting a coin adds to the total', await G(page, () => window.bellarej.progress.coins === 1 && document.getElementById('hud-coin-n').textContent === '1'),
      await G(page, () => [window.bellarej.progress.coins, document.getElementById('hud-coin-n').textContent]));
    check('P3 coin is saved immediately', await G(page, () => JSON.parse(localStorage.getItem('bellarej.progress.v1')).coins === 1));
    check('P3 coin sound played', await G(page, () => window.bellarej.sound.played.coin === 1));

    // shield
    await G(page, () => {
      const g = window.bellarej.game, o = g.obstacles[1];
      o.x = g.bird.x + 40; o.pickup = { type: 'shield', y: 300, taken: false, placed: true };
    });
    await page.waitForFunction(() => window.bellarej.game.shield, null, { timeout: 3000 }).catch(() => {});
    check('P3 shield indicator shows when the shield is on', await visible(page, '#pw-shield'));
    await sleep(150);
    await page.screenshot({ path: `${SHOTS}/shield-on.png` });
    // fly into a wall
    await G(page, RELEASE);
    await G(page, () => {
      const g = window.bellarej.game;
      const o = g.obstacles.find(x => x.x > g.bird.x + 20);
      o.x = g.bird.x + 5; o.gapY = 470; o.pickup = null; g.bird.y = 120; g.bird.vy = 0;
    });
    await page.waitForFunction(() => !window.bellarej.game.shield, null, { timeout: 2000 }).catch(() => {});
    check('P3 shield absorbs the hit: run continues', await G(page, () => window.bellarej.game.state === 'playing' && !window.bellarej.game.shield),
      await G(page, () => window.bellarej.game.state));
    await sleep(60);
    await page.screenshot({ path: `${SHOTS}/shield-break.png` });
    check('P3 shield indicator disappears after the hit', !(await visible(page, '#pw-shield')));
    check('P3 shield break sound played', await G(page, () => window.bellarej.sound.played.shieldBreak === 1));
    await G(page, HOLD);
    await sleep(1300); // grace period over
    await G(page, RELEASE);
    await G(page, () => {
      const g = window.bellarej.game;
      const o = g.obstacles.find(x => x.x > g.bird.x + 20);
      o.x = g.bird.x + 5; o.gapY = 470; o.pickup = null; g.bird.y = 120; g.bird.vy = 0;
    });
    await page.waitForFunction(() => window.bellarej.game.state === 'over', null, { timeout: 2000 }).catch(() => {});
    check('P3 second hit ends the run (exactly one absorbed)', await G(page, () => window.bellarej.game.state === 'over'));
    await sleep(300);
    await page.screenshot({ path: `${SHOTS}/over-en.png` });
    check('P3 game over shows coins earned', (await text(page, '#coins-over')) === '+1', await text(page, '#coins-over'));
    await backToTitle(page);

    // slow motion
    await startRun(page);
    await G(page, HOLD);
    await G(page, () => {
      const g = window.bellarej.game, o = g.obstacles[0];
      o.x = g.bird.x + 40; o.pickup = { type: 'slow', y: 300, taken: false, placed: true };
    });
    await page.waitForFunction(() => window.bellarej.game.slowLeft > 0, null, { timeout: 3000 });
    const t0 = Date.now();
    check('P3 slow-motion timer shows 5', await visible(page, '#pw-slow') && (await text(page, '#slow-left')) === '5');
    await sleep(900);
    await page.screenshot({ path: `${SHOTS}/slow.png` });
    check('P3 world really slows down', await G(page, () => window.bellarej.game.timeScale <= 0.61));
    await sleep(1300);
    check('P3 timer counts down (shows 3)', (await text(page, '#slow-left')) === '3', await text(page, '#slow-left'));
    await page.waitForFunction(() => window.bellarej.game.slowLeft === 0, null, { timeout: 6000 });
    const took = (Date.now() - t0) / 1000;
    check('P3 slow motion ends on time (5 s ± 0.25)', Math.abs(took - 5) < 0.25, took);
    await sleep(100);
    check('P3 timer hides when slow motion ends', !(await visible(page, '#pw-slow')));
    await sleep(400);
    check('P3 world back to full speed', await G(page, () => window.bellarej.game.timeScale === 1));
    // score some points for a best score
    await G(page, () => { window.bellarej.game.score = 7; });
    await waitOver(page);
    await sleep(300);
    check('P3 new best badge on a record', await visible(page, '#newbest'));
    const finalScore = await G(page, () => window.bellarej.game.score);
    check('P3 best score shown on game over', finalScore >= 7 && (await text(page, '#best-over')) === String(finalScore), [finalScore, await text(page, '#best-over')]);
    await backToTitle(page);
    const savedCoins = await G(page, () => window.bellarej.progress.coins);
    check('P3 title shows best and coins', (await text(page, '#best-ready')) === String(finalScore) && (await text(page, '#coins-ready')) === String(savedCoins) && savedCoins >= 1,
      [await text(page, '#best-ready'), await text(page, '#coins-ready'), savedCoins]);
    // close the browser tab entirely and come back
    await ctx.close(); // the whole browser closes
    const { ctx: ctx2, page: page2 } = await openProfile(profile);
    check('P3 best score and coins survive closing the browser', await G(page2, (s) => window.bellarej.progress.best === s.b && window.bellarej.progress.coins === s.c, { b: finalScore, c: savedCoins }), { b: finalScore, c: savedCoins });
    await page2.screenshot({ path: `${SHOTS}/title-progress.png` });
    // Arabic game over
    await page2.locator('#lang').click();
    await startRun(page2); await waitOver(page2); await sleep(300);
    await page2.screenshot({ path: `${SHOTS}/over-ar.png` });
    check('P3 Arabic game over labels', (await text(page2, '#over .label')) === 'النتيجة');
    await ctx2.close();
    check('P3 no script errors', errors.length === 0, errors);

    // storage blocked (private mode)
    const blocked = await open(browser, PHONE, () => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError: blocked'); } });
    });
    await startRun(blocked.page);
    await G(blocked.page, HOLD);
    await G(blocked.page, () => {
      const g = window.bellarej.game, o = g.obstacles[0];
      o.x = g.bird.x + 40; o.pickup = { type: 'coin', y: 300, taken: false, placed: true };
    });
    await sleep(800);
    check('P3 storage blocked: game still plays and counts coins', await G(blocked.page, () => window.bellarej.game.state === 'playing' && window.bellarej.progress.coins === 1));
    await waitOver(blocked.page); await backToTitle(blocked.page);
    check('P3 storage blocked: no errors through a full run', blocked.errors.length === 0, blocked.errors);
    await blocked.ctx.close();
  }

  // ------------------------------------------------------------- Phase 4
  if (PHASE >= 4) {
    const { ctx, page, errors } = await open(browser, PHONE);
    const reachScore = async (n) => {
      await G(page, (n) => {
        const g = window.bellarej.game;
        const o = g.obstacles.find(o => !o.passed);
        if (o) { o.x = g.bird.x - g.tuning.obstacleWidth + 8; o.gapY = g.bird.y; }   // about to be passed, lined up
        g.score = n - 1;
      }, n);
      await page.waitForFunction((n) => window.bellarej.game.score >= n, n, { timeout: 5000 }).catch(async (e) => {
        console.log('DEBUG reachScore', n, JSON.stringify(await G(page, () => {
          const g = window.bellarej.game;
          return { state: g.state, score: g.score, birdX: g.bird.x, obs: g.obstacles.map(o => ({ x: Math.round(o.x), passed: o.passed })), shop: window.bellarej.shopOpen };
        })));
        throw e;
      });
    };
    const scene = () => G(page, () => ({ world: window.bellarej.scene.world, k: window.bellarej.scene.k, from: window.bellarej.scene.from }));
    await startRun(page);
    await G(page, HOLD);
    // power-ups running while the place changes
    await G(page, () => { const g = window.bellarej.game; g.shield = true; g.slowLeft = 4; });
    await reachScore(20);
    await sleep(120);
    check('P4 Fès begins at 20 points', await G(page, () => window.bellarej.game.world === 1));
    check('P4 place name shown ("Fès")', (await text(page, '#world-name')) === 'Fès' && await G(page, () => document.getElementById('world-name').classList.contains('show')));
    check('P4 scenes fade gradually (not a jump)', await G(page, () => window.bellarej.blending));
    await page.waitForFunction(() => window.bellarej.scene.k > 0.25, null, { timeout: 3000 });
    const mid = await scene();
    await page.screenshot({ path: `${SHOTS}/blend-mid.png` });
    check('P4 mid-fade: Marrakech fading into Fès', mid.from === 0 && mid.world === 1 && mid.k > 0.2 && mid.k < 0.8, mid);
    const pw = await G(page, () => ({ shield: window.bellarej.game.shield, slowLeft: window.bellarej.game.slowLeft, shieldShown: !document.getElementById('pw-shield').hidden }));
    check('P4 power-ups survive the place change', pw.shield && pw.slowLeft > 0 && pw.shieldShown, pw);
    await page.waitForFunction(() => window.bellarej.scene.k === 1, null, { timeout: 4000 }).catch(() => {});
    const done = await scene();
    check('P4 fade finishes on Fès', done.world === 1 && done.k === 1 && done.from === 1, done);
    await page.screenshot({ path: `${SHOTS}/world1-fes.png` });
    await page.waitForFunction(() => window.bellarej.game.slowLeft === 0, null, { timeout: 5000 });
    check('P4 slow motion ends normally in the new place', await G(page, () => window.bellarej.game.state === 'playing'));
    const names = ['Marrakech', 'Fès', 'Chefchaouen', 'Desert', 'Coast', 'Night'];
    const files = ['world0-marrakech', 'world1-fes', 'world2-chefchaouen', 'world3-desert', 'world4-coast', 'world5-night'];
    const seen = [];
    for (let w = 2; w <= 6; w++) {
      await reachScore(20 * w);
      await sleep(200);
      const shown = await text(page, '#world-name');
      await sleep(1700);
      const sc = await scene();
      seen.push(`${sc.world}:${shown}`);
      if (w < 6) await page.screenshot({ path: `${SHOTS}/${files[w]}.png` });
    }
    check('P6 Chefchaouen, Desert, Coast, Night, then back to Marrakech (40..120 points)',
      seen.join() === `2:${names[2]},3:${names[3]},4:${names[4]},5:${names[5]},0:${names[0]}`, seen);
    check('P4 world chime played (6 changes)', await G(page, () => window.bellarej.sound.played.world === 6));
    check('P4 obstacles in later places have the smaller gap', await G(page, () => window.bellarej.game.obstacles.some(o => o.gap < window.bellarej.game.tuning.gapSize)));
    check('P6 obstacles keep the look of the place they were built in', await G(page, () => window.bellarej.game.obstacles.every(o => o.world >= 0 && o.world < 6)));
    // a later place, then crash: title returns to Marrakech
    await reachScore(80);
    await G(page, () => { window.bellarej.game.shield = false; });
    await waitOver(page); await backToTitle(page);
    await sleep(1200);
    check('P4 title screen after a run is back to Marrakech', await G(page, () => window.bellarej.game.world === 0 && window.bellarej.scene.world === 0 && window.bellarej.scene.k === 1));
    // Arabic place name
    await page.locator('#lang').click();
    await startRun(page); await G(page, HOLD);
    await reachScore(20); await sleep(200);
    check('P4 Arabic place name', (await text(page, '#world-name')) === 'فاس', await text(page, '#world-name'));
    await page.screenshot({ path: `${SHOTS}/fes-ar.png` });
    await G(page, RELEASE); await waitOver(page); await backToTitle(page);
    await page.locator('#lang').click();
    check('P4 no script errors', errors.length === 0, errors);
    await ctx.close();
  }

  // ------------------------------------------------------------- Phase 5
  if (PHASE >= 5) {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bellarej-shop-'));
    let { ctx, page, errors } = await openProfile(profile);
    const cardInfo = () => G(page, () => [...document.querySelectorAll('#shop-grid .card')].map(c => ({
      name: c.querySelector('.name').textContent, btn: c.querySelector('button').textContent.trim(),
      disabled: c.querySelector('button').disabled, need: c.querySelector('.need').textContent, chosen: c.classList.contains('chosen'),
    })));
    check('P5 Shop button on the title screen', await visible(page, '#shop-open') && (await text(page, '#shop-open')) === 'Shop');
    await page.locator('#shop-open').tap();
    await sleep(150);
    let cards = await cardInfo();
    check('P6 shop shows 6 outfits with names', cards.length === 6 && cards.map(c => c.name).join() === 'Classic,Riad,Chefchaouen,Desert,Night,Royal', cards.map(c => c.name));
    check('P5 shop shows prices', cards.slice(1).map(c => c.btn).join() === 'Buy 40,Buy 80,Buy 140,Buy 220,Buy 350', cards.map(c => c.btn));
    check('P5 the free Classic outfit is chosen', cards[0].chosen && cards[0].btn === 'Chosen');
    check('P5 not enough coins: Buy disabled with a clear message', cards[1].disabled && cards[1].need === 'Need 40 more coins', cards[1]);
    await page.screenshot({ path: `${SHOTS}/shop-poor.png` });
    // taps and keys in the shop never start a run
    await page.touchscreen.tap(20, 830);
    await page.keyboard.press('Space');
    await sleep(100);
    check('P5 tapping around the shop never starts a run', await G(page, () => window.bellarej.game.state === 'ready' && window.bellarej.shopOpen));
    await page.keyboard.press('Escape');
    await sleep(100);
    check('P5 Escape / Back closes the shop', await G(page, () => !window.bellarej.shopOpen) && await visible(page, '#play'));
    // earn coins, then buy
    await G(page, () => window.bellarej.progress.addCoins(60));
    await page.locator('#shop-open').tap();
    await sleep(100);
    cards = await cardInfo();
    check('P5 with enough coins, Buy is enabled', !cards[1].disabled && cards[1].need === '' && (await text(page, '#shop-coins')) === '60');
    check('P5 still not enough for Desert: message shows the gap', cards[3].disabled && cards[3].need === 'Need 80 more coins', cards[3]);
    // double tap: two clicks fired back to back
    await G(page, () => { const b = document.querySelectorAll('#shop-grid .card button')[1]; b.click(); b.click(); });
    await sleep(100);
    cards = await cardInfo();
    check('P5 double-tap Buy charges only once (60 -> 20)', await G(page, () => window.bellarej.progress.coins === 20) && (await text(page, '#shop-coins')) === '20',
      await G(page, () => window.bellarej.progress.coins));
    check('P5 bought outfit is unlocked and chosen', cards[1].chosen && cards[1].btn === 'Chosen' && !cards[0].chosen && cards[0].btn === 'Choose');
    check('P5 purchase sound played once', await G(page, () => window.bellarej.sound.played.buy === 1));
    await sleep(200);
    await page.screenshot({ path: `${SHOTS}/shop-bought.png` });
    // switch back and forth
    await page.locator('#shop-grid .card button').first().tap();
    check('P5 choosing another owned outfit works', await G(page, () => window.bellarej.progress.selected === 'classic'));
    await page.locator('#shop-grid .card button').nth(1).tap();
    await page.locator('#shop-close').tap();
    await sleep(100);
    check('P5 title shows the new coin total', (await text(page, '#coins-ready')) === '20');
    // the chosen bird is used in the game
    await startRun(page);
    await G(page, HOLD);
    await sleep(300);
    check('P5 the chosen outfit flies in the game', await G(page, () => window.bellarej.progress.selected === 'riad'));
    await page.screenshot({ path: `${SHOTS}/riad-in-game.png` });
    await G(page, RELEASE); await waitOver(page); await backToTitle(page);
    check('P5 shop button only on the title screen', await G(page, () => !document.getElementById('shop-open').closest('[hidden]')));
    // remembered after closing the browser
    await ctx.close();
    ({ ctx, page, errors } = await openProfile(profile));
    check('P5 chosen outfit and purchase remembered after closing the browser',
      await G(page, () => window.bellarej.progress.selected === 'riad' && window.bellarej.progress.owns('riad') && window.bellarej.progress.coins === 20));
    // Arabic shop
    await page.locator('#lang').tap();
    await page.locator('#shop-open').tap();
    await sleep(200);
    cards = await cardInfo();
    check('P5 Arabic shop: names and buttons', cards[1].name === 'رياض' && cards[1].btn === 'مختار' && cards[2].need === 'ينقصك من العملات: 60', cards);
    check('P5 Arabic shop is right-to-left', await G(page, () => getComputedStyle(document.querySelector('#shop .panel')).direction === 'rtl'));
    await page.screenshot({ path: `${SHOTS}/shop-ar.png` });
    await page.locator('#shop-close').tap();
    await page.locator('#lang').tap();
    // landscape phone: the shop fits or scrolls, Back stays reachable
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('#shop-open').tap();
    await sleep(200);
    await page.screenshot({ path: `${SHOTS}/shop-landscape.png` });
    check('P6 landscape: no outfit name is cut off', await G(page, () => [...document.querySelectorAll('#shop-grid .name')].every(n => n.scrollWidth <= n.clientWidth + 1)));
    check('P6 landscape: all six outfits in one row', await G(page, () => new Set([...document.querySelectorAll('#shop-grid .card')].map(c => Math.round(c.getBoundingClientRect().top))).size === 1));
    await page.locator('#shop-close').scrollIntoViewIfNeeded();
    check('P5 landscape: Back button reachable', await G(page, () => { const r = document.getElementById('shop-close').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }));
    await page.locator('#shop-close').tap();
    check('P5 no script errors', errors.length === 0, errors);
    await ctx.close();

    // storage blocked: the shop still works for this visit
    const blocked = await open(browser, PHONE, () => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError: blocked'); } });
    });
    await G(blocked.page, () => window.bellarej.progress.addCoins(50));
    await blocked.page.locator('#shop-open').tap();
    await blocked.page.locator('#shop-grid .card button').nth(1).tap();
    check('P5 storage blocked: buying works and nothing breaks', await G(blocked.page, () => window.bellarej.progress.selected === 'riad') && blocked.errors.length === 0, blocked.errors);
    await blocked.ctx.close();
  }

  // ------------------------------------------------------------- Phase 6: redesign
  if (PHASE >= 6) {
    const overlap = (page, a, b) => G(page, ([a, b]) => {
      // the score box is as wide as the screen, so measure the digits themselves
      const box = (sel) => { const el = document.querySelector(sel); if (sel !== '#score') return el.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
      const r1 = box(a), r2 = box(b);
      return !(r1.right <= r2.left || r2.right <= r1.left || r1.bottom <= r2.top || r2.bottom <= r1.top);
    }, [a, b]);
    const inView = (page, sel) => G(page, (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }, sel);
    const heroClear = (page) => G(page, () => {
      // top of the fez on screen vs bottom of the ribbon under the logo
      const b = window.bellarej, st = document.getElementById('stage').getBoundingClientRect();
      const k = st.height / 640, hs = b.view.heroScale;
      const fezTop = (b.game.bird.y + (b.view.heroLift || 0) - 34 * hs) * k;
      const rib = document.querySelector('.ribbon').getBoundingClientRect();
      const birdLeft = (b.game.bird.x - 30 * hs) * k, birdRight = (b.game.bird.x + 26 * hs) * k;
      return { ok: fezTop >= rib.bottom || birdRight <= rib.left || birdLeft >= rib.right, fezTop: Math.round(fezTop), ribbonBottom: Math.round(rib.bottom) };
    });
    const { ctx, page, errors } = await open(browser, PHONE);
    await sleep(400);
    // Title screen like the sheet
    check('P6 title: golden logo, ribbon subtitle, "Tap to play"', await visible(page, '#logo-svg') && (await text(page, '.ribbon span')) === 'Fly through Morocco' && (await text(page, '#play')) === 'Tap to play');
    check('P6 title: logo frame fitted to the word', await G(page, () => document.getElementById('logo-svg').getAttribute('viewBox') !== '0 0 520 200'));
    check('P6 title: the hero is shown big', await G(page, () => window.bellarej.view.heroScale > 1.7), await G(page, () => window.bellarej.view.heroScale));
    check('P6 title: logo, menu and corner buttons all on screen', await inView(page, '#logo-svg') && await inView(page, '#play') && await inView(page, '#shop-open') && await inView(page, '#lang') && await inView(page, '#sound'));
    check('P6 title: logo does not overlap the corner buttons', !(await overlap(page, '#logo-svg', '#lang')) && !(await overlap(page, '#logo-svg', '#sound')));
    await page.screenshot({ path: `${SHOTS}/p6-title.png` });
    { const h = await heroClear(page); check('P6 title: the big bird sits clear of the logo and ribbon', h.ok, h); }
    // In a run: pause button, big score, crown best, coins
    await G(page, () => window.bellarej.progress.recordBest(32));
    await startRun(page);
    await G(page, HOLD);
    await sleep(400);
    check('P6 run: hero shrinks to play size', await G(page, () => Math.abs(window.bellarej.view.heroScale - 1) < 0.02), await G(page, () => window.bellarej.view.heroScale));
    check('P6 run: pause button shown, sound button hidden', await visible(page, '#pause') && !(await visible(page, '#sound')));
    check('P6 run: crown shows the best score (32)', await visible(page, '#hud-best') && (await text(page, '#hud-best-n')) === '32');
    await G(page, () => { window.bellarej.game.score = 140; });
    await sleep(100);
    check('P6 run: crown follows a new record live', (await text(page, '#hud-best-n')) === '140');
    check('P6 run: 3-digit score does not touch the pause button or the crown', !(await overlap(page, '#score', '#pause')) && !(await overlap(page, '#score', '#hud-best')),
      await G(page, () => ['#score', '#pause', '#hud-best'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; })));
    await G(page, () => { window.bellarej.game.score = 12; });
    await page.screenshot({ path: `${SHOTS}/p6-run.png` });
    // Pause button: pauses without a flap, shows the sound button, a tap resumes
    const flap0 = await G(page, () => window.bellarej.game.lastFlapAt);
    await page.locator('#pause').tap();
    await sleep(80);
    check('P6 pause button pauses the run', await G(page, () => window.bellarej.game.state === 'paused'));
    check('P6 pause button never flaps', await G(page, (f) => window.bellarej.game.lastFlapAt === f && window.bellarej.game.bird.vy >= 0, flap0),
      await G(page, () => [window.bellarej.game.lastFlapAt, window.bellarej.game.bird.vy]));
    check('P6 paused: sound button available', await visible(page, '#sound') && await visible(page, '#paused h2'));
    const mutedBefore = await G(page, () => window.bellarej.settings.muted);
    await page.locator('#sound').tap();
    check('P6 paused: sound button mutes without resuming', await G(page, (m) => window.bellarej.settings.muted === !m && window.bellarej.game.state === 'paused', mutedBefore));
    await page.locator('#sound').tap();
    await page.screenshot({ path: `${SHOTS}/p6-paused.png` });
    await page.touchscreen.tap(195, 500);
    check('P6 tap resumes after the pause button', await G(page, () => window.bellarej.game.state === 'playing'));
    await G(page, HOLD);
    // every outfit and every place draws without errors
    for (const id of ['classic', 'riad', 'chefchaouen', 'desert', 'night', 'royal']) {
      await G(page, (id) => { window.bellarej.progress.owns(id) || window.bellarej.progress.addCoins(400); window.bellarej.progress.buy(id); window.bellarej.progress.select(id); }, id);
      await sleep(60);
    }
    await G(page, () => { for (const o of window.bellarej.game.obstacles) o.world = o.id % 6; });
    await sleep(300);
    await page.screenshot({ path: `${SHOTS}/p6-mixed-walls.png` });
    check('P6 all outfits and all wall styles draw without errors', errors.length === 0, errors);
    await G(page, () => window.bellarej.progress.select('classic'));
    await G(page, RELEASE); await waitOver(page); await sleep(300);
    await page.screenshot({ path: `${SHOTS}/p6-over.png` });
    check('P6 game over panel fits on screen', await inView(page, '#over .panel'));
    await backToTitle(page);
    // shop with six outfits
    await page.locator('#shop-open').tap(); await sleep(250);
    await page.screenshot({ path: `${SHOTS}/p6-shop.png` });
    check('P6 shop: six outfits in two rows of three (phone)', await G(page, () => {
      const tops = [...document.querySelectorAll('#shop-grid .card')].map(c => Math.round(c.getBoundingClientRect().top));
      return tops.length === 6 && new Set(tops).size === 2;
    }));
    check('P6 shop: Back button on screen', await inView(page, '#shop-close'));
    check('P6 shop: no outfit name is cut off', await G(page, () => [...document.querySelectorAll('#shop-grid .name')].every(n => n.scrollWidth <= n.clientWidth + 1)),
      await G(page, () => [...document.querySelectorAll('#shop-grid .name')].map(n => [n.textContent, n.scrollWidth, n.clientWidth])));
    check('P6 shop: card texts do not spill out of their cards', await G(page, () => [...document.querySelectorAll('#shop-grid .card')].every(c => {
      const r = c.getBoundingClientRect();
      return [...c.children].every(ch => { const q = ch.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; });
    })));
    await page.locator('#shop-close').tap();
    // Arabic title
    await page.locator('#lang').tap(); await sleep(300);
    check('P6 Arabic title: logo, subtitle and button', (await text(page, '#ready h1')) === 'بلّارج' && (await text(page, '.ribbon span')) === 'حلّق عبر المغرب' && (await text(page, '#play')) === 'انقر للعب');
    check('P6 Arabic: logo does not overlap the corner buttons', !(await overlap(page, '#logo-svg', '#lang')) && !(await overlap(page, '#logo-svg', '#sound')));
    await page.screenshot({ path: `${SHOTS}/p6-title-ar.png` });
    { const h = await heroClear(page); check('P6 Arabic title: the big bird sits clear of the logo and ribbon', h.ok, h); }
    await page.locator('#lang').tap();
    // Landscape title and run
    await page.setViewportSize({ width: 844, height: 390 });
    await sleep(400);
    await page.screenshot({ path: `${SHOTS}/p6-title-landscape.png` });
    { const h = await heroClear(page); check('P6 landscape title: the bird sits clear of the logo and ribbon', h.ok, h); }
    check('P6 landscape title: everything on screen', await inView(page, '#logo-svg') && await inView(page, '#play') && await inView(page, '#shop-open'));
    check('P6 landscape title: logo clear of the menu', !(await overlap(page, '#logo-svg', '#play')) && !(await overlap(page, '.ribbon', '#ready .stats')));
    await startRun(page); await G(page, HOLD); await sleep(400);
    await page.screenshot({ path: `${SHOTS}/p6-run-landscape.png` });
    check('P6 landscape run: score clear of pause and crown', !(await overlap(page, '#score', '#pause')) && !(await overlap(page, '#score', '#hud-best')));
    await G(page, RELEASE); await waitOver(page); await sleep(300);
    check('P6 landscape: game over panel fits', await inView(page, '#over .panel'));
    await page.screenshot({ path: `${SHOTS}/p6-over-landscape.png` });
    check('P6 no script errors', errors.length === 0, errors);
    await ctx.close();

    // An old save from before the redesign keeps everything it paid for
    const old = await open(browser, PHONE, () => {
      try { if (!localStorage.getItem('__seeded')) { localStorage.setItem('__seeded', '1'); localStorage.setItem('bellarej.progress.v1', JSON.stringify({ best: 21, coins: 9, owned: ['stork', 'hoopoe', 'seagull'], selected: 'seagull' })); } } catch (e) {}
    });
    await old.page.locator('#shop-open').tap(); await sleep(200);
    const oc = await G(old.page, () => [...document.querySelectorAll('#shop-grid .card')].map(c => c.querySelector('button').textContent.trim()));
    check('P6 old save: hoopoe and gull became Riad and Chefchaouen (owned), gull choice kept', oc.slice(0, 3).join() === 'Choose,Choose,Chosen' && oc[3] === 'Buy 140', oc);
    check('P6 old save: best 21 and 9 coins kept', await G(old.page, () => window.bellarej.progress.best === 21 && window.bellarej.progress.coins === 9));
    check('P6 old save: no errors', old.errors.length === 0, old.errors);
    await old.ctx.close();
  }

  // ------------------------------------------------------------- Phase 7: installable app, offline
  if (PHASE >= 7) {
    const pngSize = (f) => { const b = fs.readFileSync(path.join(ROOT, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    // A copy of the app in a temporary folder, so the "new version" check can change files safely.
    const APP = ['index.html', 'sw.js', 'manifest.webmanifest', 'fonts/baloo-bhaijaan-2.woff', 'fonts/OFL.txt',
      'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'];
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bellarej-app-'));
    for (const f of APP) { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); }
    const app = await serve(tmp);
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bellarej-pwa-'));
    let ctx = await chromium.launchPersistentContext(profile, { ...PHONE });
    let page = ctx.pages()[0] || await ctx.newPage();
    const errors = [], outside = [];
    const watch = (pg) => {
      pg.on('pageerror', e => errors.push(String(e)));
      pg.on('console', m => { if (m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED|net::ERR_/.test(m.text())) errors.push(m.text()); });
    };
    ctx.on('request', r => { if (!r.url().startsWith(app.url) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) outside.push(r.url()); });
    watch(page);
    await page.goto(app.url);
    await page.waitForFunction(() => window.bellarej && window.bellarej.game);

    // App description and icons
    const man = await G(page, async () => { const l = document.querySelector('link[rel=manifest]'); return l ? (await fetch(l.href)).json() : null; });
    check('P7 app description (manifest) linked and readable', !!man && man.name === 'Bellarej' && man.start_url === './' && man.scope === './' && man.display === 'fullscreen', man);
    const icons = (man && man.icons) || [];
    const iconOk = icons.length === 3 && icons.every(i => { const [w, h] = pngSize(i.src); return `${w}x${h}` === i.sizes; }) &&
      icons.some(i => i.purpose === 'maskable') && icons.some(i => i.sizes === '192x192') && icons.some(i => i.sizes === '512x512');
    check('P7 icons: 192, 512 and a maskable 512, real sizes match', iconOk, icons.map(i => [i.src, i.sizes, pngSize(i.src).join('x')]));
    check('P7 iPhone home-screen icon (180) and app tags present', pngSize('icons/apple-touch-icon.png').join() === '180,180' &&
      await G(page, () => !!document.querySelector('link[rel=apple-touch-icon]') && document.querySelector('meta[name=apple-mobile-web-app-capable]').content === 'yes'));

    // Offline helper installs and takes over
    await G(page, () => navigator.serviceWorker.ready.then(() => true));
    await page.reload(); await page.waitForFunction(() => window.bellarej && window.bellarej.game);
    check('P7 offline helper is active and controls the page', await G(page, () => !!navigator.serviceWorker.controller));
    const cached = await G(page, async () => { const keys = await caches.keys(); const c = await caches.open(keys[0]); return { keys, urls: (await c.keys()).map(r => new URL(r.url).pathname) }; });
    check('P7 the game, font and icons are saved on the device', cached.keys.length === 1 && cached.keys[0] === 'bellarej-7.0.0' &&
      APP.filter(f => f !== 'fonts/OFL.txt' && f !== 'sw.js').every(f => cached.urls.includes('/' + f)), cached);
    await G(page, () => document.fonts.ready);
    check('P7 the game font comes from the game itself (works offline)', await G(page, () => [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Baloo Bhaijaan 2' && f.status === 'loaded')));
    check('P7 nothing is loaded from other websites', outside.length === 0, outside);

    // Airplane mode
    await G(page, () => window.bellarej.progress.addCoins(7));
    await ctx.setOffline(true);
    await page.reload(); await page.waitForFunction(() => window.bellarej && window.bellarej.game, null, { timeout: 8000 });
    check('P7 offline: the game opens', await visible(page, '#play') && (await text(page, '#play')) === 'Tap to play');
    await G(page, () => document.fonts.ready);
    check('P7 offline: the real font is used', await G(page, () => document.fonts.check('800 40px "Baloo Bhaijaan 2"') && [...document.fonts].some(f => f.status === 'loaded')));
    await startRun(page); await G(page, HOLD); await sleep(400);
    check('P7 offline: a run plays', await G(page, () => window.bellarej.game.state === 'playing' && window.bellarej.game.obstacles.length > 0));
    await page.screenshot({ path: `${SHOTS}/p7-offline-run.png` });
    await G(page, RELEASE); await waitOver(page); await backToTitle(page);
    // fully close the app and open it again, still offline
    await ctx.close();
    ctx = await chromium.launchPersistentContext(profile, { ...PHONE, offline: true });
    page = ctx.pages()[0] || await ctx.newPage(); watch(page);
    await page.goto(app.url); await page.waitForFunction(() => window.bellarej && window.bellarej.game, null, { timeout: 8000 });
    check('P7 offline: closing and reopening the app works, progress kept', await G(page, () => window.bellarej.progress.coins === 7 && !!navigator.serviceWorker.controller));

    // A new version arrives on the next launch while online, and old saved copies are cleared.
    // (The player closes the app; a new version is published; they open it again with internet.)
    await ctx.close();
    fs.writeFileSync(path.join(tmp, 'index.html'), fs.readFileSync(path.join(tmp, 'index.html'), 'utf8').replace('<title>Bellarej</title>', '<title>Bellarej</title>\n<meta name="bellarej-build" content="check-update">'));
    fs.writeFileSync(path.join(tmp, 'sw.js'), fs.readFileSync(path.join(tmp, 'sw.js'), 'utf8').replace("const VERSION = 'bellarej-7.0.0';", "const VERSION = 'bellarej-7.0.1-check';"));
    ctx = await chromium.launchPersistentContext(profile, { ...PHONE });
    page = ctx.pages()[0] || await ctx.newPage(); watch(page);
    await page.goto(app.url); await page.waitForFunction(() => window.bellarej && window.bellarej.game);
    check('P7 update: the new version shows on the next launch', await G(page, () => !!document.querySelector('meta[name="bellarej-build"]')));
    // poll from here: a waitForFunction with an async test counts as true immediately
    for (let i = 0; i < 40 && (await G(page, () => caches.keys())).join() !== 'bellarej-7.0.1-check'; i++) await sleep(200);
    check('P7 update: the old saved copy is replaced', (await G(page, () => caches.keys())).join() === 'bellarej-7.0.1-check', await G(page, () => caches.keys()));
    check('P7 update: progress survives an update', await G(page, () => window.bellarej.progress.coins === 7));

    // Install button (Android / computer): the browser's install offer, opened by our button
    check('P7 no Install button until the browser offers installing', !(await visible(page, '#install')));
    await G(page, () => {
      window.__prompted = 0;
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { window.__prompted++; return Promise.resolve(); };
      window.dispatchEvent(e);
    });
    await sleep(50);
    check('P7 Install button appears when installing is possible', await visible(page, '#install') && (await text(page, '#install')) === 'Install app');
    await page.screenshot({ path: `${SHOTS}/p7-title-install.png` });
    await G(page, () => { const b = document.getElementById('install'); b.click(); b.click(); });
    await sleep(80);
    check('P7 Install opens the browser offer once (double tap safe), then the button hides', await G(page, () => window.__prompted === 1) && !(await visible(page, '#install')), await G(page, () => window.__prompted));
    check('P7 tapping Install never starts a run', await G(page, () => window.bellarej.game.state === 'ready'));
    await G(page, () => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => Promise.resolve(); window.dispatchEvent(e); window.dispatchEvent(new Event('appinstalled')); });
    await sleep(50);
    check('P7 after installing, the button stays hidden', !(await visible(page, '#install')));
    check('P7 no script errors (app, offline, update)', errors.length === 0, errors);
    await ctx.close();

    // Already running as an installed app: no Install button, even if the browser offers it
    {
      const c = await browser.newContext(PHONE);
      await c.addInitScript(() => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => /display-mode: (standalone|fullscreen)/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : mm(q); });
      const pg = await c.newPage();
      await pg.goto(app.url); await pg.waitForFunction(() => window.bellarej && window.bellarej.game);
      await G(pg, () => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => Promise.resolve(); window.dispatchEvent(e); });
      await sleep(50);
      check('P7 inside the installed app there is no Install button', !(await visible(pg, '#install')));
      await c.close();
    }

    // iPhone: no install offer exists, so the button explains Share -> Add to Home Screen
    {
      const c = await browser.newContext({ ...PHONE, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
      const pg = await c.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
      await pg.goto(app.url); await pg.waitForFunction(() => window.bellarej && window.bellarej.game);
      check('P7 iPhone: Install button shown', await visible(pg, '#install') && await G(pg, () => window.bellarej.installMode === 'ios'));
      await pg.locator('#install').tap(); await sleep(80);
      check('P7 iPhone: tapping it shows how to add to the home screen', await visible(pg, '#install-hint') && (await text(pg, '#install-hint')).includes('Add to Home Screen'));
      const hb = await G(pg, () => { const r = document.getElementById('install-hint').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await pg.touchscreen.tap(hb[0], hb[1]); await sleep(80);
      check('P7 iPhone: tapping the explanation never starts a run', await G(pg, () => window.bellarej.game.state === 'ready'));
      check('P7 iPhone: everything still fits on the title screen', await G(pg, () => ['#play', '#shop-open', '#install', '#install-hint'].every(s => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; })));
      await pg.screenshot({ path: `${SHOTS}/p7-iphone-hint.png` });
      await pg.locator('#lang').tap(); await sleep(80);
      check('P7 iPhone: Arabic button and explanation', (await text(pg, '#install')) === 'ثبّت التطبيق' && (await text(pg, '#install-hint')).includes('إضافة إلى الشاشة الرئيسية'));
      await pg.screenshot({ path: `${SHOTS}/p7-iphone-hint-ar.png` });
      await pg.locator('#lang').tap();
      // sideways
      await pg.setViewportSize({ width: 844, height: 390 }); await sleep(300);
      await pg.screenshot({ path: `${SHOTS}/p7-iphone-landscape.png` });
      check('P7 iPhone sideways: menu, Install and explanation all on screen, not overlapping', await G(pg, () => {
        const ids = ['#play', '#shop-open', '#install', '#install-hint', '#logo-svg'];
        const rs = ids.map(s => document.querySelector(s).getBoundingClientRect());
        const inView = rs.every(r => r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth);
        const apart = rs.every((a, i) => rs.every((b, j) => i >= j || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top));
        return inView && apart;
      }), await G(pg, () => ['#play', '#shop-open', '#install', '#install-hint', '#logo-svg'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [s, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; })));
      check('P7 iPhone: no script errors', errs.length === 0, errs);
      await c.close();
    }
    await app.close();

    // The Claude preview copy: same game, without the app parts
    {
      require('child_process').execFileSync('python3', [path.join(ROOT, 'tools', 'build-preview.py')]);
      const prev = fs.readFileSync(path.join(ROOT, 'build', 'preview.html'), 'utf8');
      check('P7 preview copy has no app parts and loads the font from Google', !/manifest|<!doctype|<body>|fonts\/baloo/.test(prev) && prev.includes('fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2'));
      const c = await browser.newContext(PHONE);
      const pg = await c.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
      await pg.goto('file://' + path.join(ROOT, 'build', 'preview.html')); await pg.waitForFunction(() => window.bellarej && window.bellarej.game);
      await startRun(pg); await sleep(200);
      check('P7 preview copy still plays, with no offline helper', await G(pg, () => window.bellarej.game.state === 'playing' && !navigator.serviceWorker.controller) && errs.length === 0, errs);
      await c.close();
    }
  }

  // ------------------------------------------------------------- Desktop: keyboard + smoothness
  {
    const { ctx, page, errors } = await open(browser, DESKTOP);
    await page.keyboard.press('Space');
    check('P1 Space starts and flaps (desktop)', await G(page, () => window.bellarej.game.state === 'playing' && window.bellarej.game.bird.vy < 0));
    await page.keyboard.press('KeyM');
    check('P2 M key toggles sound', await G(page, () => window.bellarej.settings.muted === true));
    await page.keyboard.press('KeyM');
    await page.keyboard.press('KeyP');
    check('P6 P key pauses (desktop)', await G(page, () => window.bellarej.game.state === 'paused'));
    await page.keyboard.press('Space');
    check('P6 Space resumes after P', await G(page, () => window.bellarej.game.state === 'playing'));
    await G(page, HOLD);
    await G(page, () => { const g = window.bellarej.game; g.shield = true; g.slowLeft = 3; });
    // frames per second, normal and with a 4x slower CPU
    const fps = () => page.evaluate(() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }
      requestAnimationFrame(f);
    }));
    const normal = await fps();
    await page.setViewportSize({ width: 390, height: 844 });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const slow = await fps();
    // the heaviest moment: a change of place draws two whole scenes while one fades into the other
    await G(page, () => { const g = window.bellarej.game; const o = g.obstacles.find(o => !o.passed); o.x = g.bird.x - g.tuning.obstacleWidth + 8; o.gapY = g.bird.y; g.score = 19; });
    await page.waitForFunction(() => window.bellarej.blending, null, { timeout: 3000 });
    const fading = await fps();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    // the fade lasts 1.5 s; on a 4x slower CPU without a graphics chip it may dip a little, never below 35 fps
    check(`Smooth during a place change: ${fading.toFixed(0)} fps phone-size at 4x slower CPU (1.5 s)`, fading > 35, fading);
    check(`Smooth: ${normal.toFixed(0)} fps desktop, ${slow.toFixed(0)} fps phone-size at 4x slower CPU`, normal > 50 && slow > 50, { normal, slow });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: `${SHOTS}/desktop.png` });
    check('Desktop: no script errors', errors.length === 0, errors);
    await ctx.close();
  }

  await browser.close();
  await site.close();
  console.log(lines.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
