// Draws the app icons from the game's own bird, so the icon always matches the hero.
// Usage: node tools/make-icons.js   (writes icons/*.png)
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const { serve } = require('../tests/serve');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'icons');
fs.mkdirSync(OUT, { recursive: true });

// size, file, how much of the square the bird may use (maskable icons keep to the central safe zone)
const ICONS = [
  [512, 'icon-512.png', 0.7, false],
  [192, 'icon-192.png', 0.7, false],
  [512, 'icon-maskable-512.png', 0.56, true],
  [180, 'apple-touch-icon.png', 0.7, true],
  [64, 'favicon-64.png', 0.86, false],
];

(async () => {
  const srv = await serve(ROOT);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto(srv.url + 'index.html');
  await page.waitForFunction(() => window.bellarej && window.bellarej.art);
  for (const [size, file, fill, square] of ICONS) {
    const data = await page.evaluate(({ size, fill, square }) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const c = cv.getContext('2d');
      const r = square ? 0 : size * 0.22;        // rounded corners where the system doesn't add its own
      c.beginPath();
      if (r) c.roundRect(0, 0, size, size, r); else c.rect(0, 0, size, size);
      c.clip();
      // Majorelle-blue sky fading to warm sand, like the title screen
      const g = c.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, '#2c84d4'); g.addColorStop(0.62, '#7fc3ee'); g.addColorStop(1, '#f8ddb0');
      c.fillStyle = g; c.fillRect(0, 0, size, size);
      // sun
      c.fillStyle = 'rgba(255, 244, 200, 0.45)'; c.beginPath(); c.arc(size * 0.76, size * 0.27, size * 0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff4cc'; c.beginPath(); c.arc(size * 0.76, size * 0.27, size * 0.13, 0, Math.PI * 2); c.fill();
      // a strip of terracotta rooftops along the bottom (skipped at favicon size, where it would be noise)
      if (size >= 128) {
        c.fillStyle = '#e3965f';
        const n = 6;
        for (let k = 0; k < n; k++) {
          const h = size * (0.1 + ((k * 37) % 5) * 0.025);
          c.fillRect(k * size / n, size - h, size / n + 1, h);
        }
        c.fillStyle = '#c97849';
        for (let k = 0; k < n; k++) c.fillRect(k * size / n + size / n * 0.72, size - size * 0.08, size / n * 0.28, size * 0.08);
      }
      // the hero: the bird drawing is about 52 units wide (scarf to beak) and 52 tall (fez to feet)
      const k = size * fill / 54;
      c.save();
      c.translate(size * 0.5 + 1 * k, size * 0.5 + 6 * k);
      c.rotate(-0.08);
      c.scale(k, k);
      window.bellarej.art.drawBird(c, 'classic', 0.55, 0.4);
      c.restore();
      return cv.toDataURL('image/png');
    }, { size, fill, square });
    fs.writeFileSync(path.join(OUT, file), Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote', file);
  }
  await browser.close();
  await srv.close();
})();
