// Social-framed marketing captures for Bolo's v1.1.0 AI features.
// Headless (no WebGPU), so the AI states are mocked via JS injection — but the
// captions/answers used here are the ACTUAL text FastVLM-0.5B produced during
// verification, so the shots are honest.
//
// Serve Bolo first (any local server; the running COI dev server on :8768 works):
//   node marketing/capture-marketing.mjs
//
// Regenerate this — never hand-edit the PNGs.

import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire('/Users/chiragpatnaik/.nvm/versions/node/v22.19.0/lib/node_modules/_marker');
const { chromium } = require('playwright');

const OUT = 'marketing';
mkdirSync(OUT, { recursive: true });
const URL = process.env.BOLO_URL || 'http://localhost:8768';
const VIEWPORT = { width: 1600, height: 900 }; // X-friendly 16:9

const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await context.newPage();

async function reset() {
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(250);
}

// Studio mode + a post-recording stage showing a realistic "Sales Dashboard" frame.
async function setup() {
  await page.evaluate(() => {
    document.querySelector('#modeChips [data-mode="studio"]').click();
    document.getElementById('panelDone').classList.remove('hidden');
    document.getElementById('labelDone').classList.remove('hidden');
    const se = document.getElementById('stageEmpty'); if (se) se.style.display = 'none';

    // Draw a clean fake dashboard as the recorded frame.
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
    const x = c.getContext('2d');
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, 1920, 1080);
    x.fillStyle = '#0f1c30'; x.fillRect(0, 0, 1920, 96);
    x.fillStyle = '#e6edf6'; x.font = 'bold 42px -apple-system,system-ui,sans-serif';
    x.fillText('Sales Dashboard', 56, 62);
    x.fillStyle = '#7cc4ff'; x.font = '26px -apple-system,system-ui,sans-serif';
    x.fillText('Q3 revenue up 24%', 56, 150);
    const cards = [['Revenue', '$1.24M', '#2dd4bf'], ['Active users', '8,412', '#60a5fa'], ['Conversion', '3.9%', '#f0abfc']];
    cards.forEach(([label, val, col], i) => {
      const cx = 56 + i * 460;
      x.fillStyle = '#111f36'; x.strokeStyle = '#1e3350'; x.lineWidth = 2;
      x.beginPath(); x.roundRect(cx, 200, 420, 200, 16); x.fill(); x.stroke();
      x.fillStyle = '#8aa0bd'; x.font = '24px -apple-system,system-ui'; x.fillText(label, cx + 28, 250);
      x.fillStyle = '#f4f8ff'; x.font = 'bold 58px -apple-system,system-ui'; x.fillText(val, cx + 28, 330);
      x.fillStyle = col; x.fillRect(cx + 28, 356, 120, 6);
    });
    // bar chart
    const bx = 56, by = 470, bw = 1808, bh = 520;
    x.fillStyle = '#0e1a2c'; x.beginPath(); x.roundRect(bx, by, bw, bh, 16); x.fill();
    const bars = [0.35, 0.5, 0.42, 0.62, 0.55, 0.78, 0.7, 0.9];
    bars.forEach((h, i) => {
      const w = 150, gap = (bw - bars.length * w) / (bars.length + 1);
      const px = bx + gap + i * (w + gap);
      const ph = h * (bh - 100);
      const g = x.createLinearGradient(0, by + bh - ph, 0, by + bh);
      g.addColorStop(0, '#3b82f6'); g.addColorStop(1, '#1d4ed8');
      x.fillStyle = g; x.beginPath(); x.roundRect(px, by + bh - 50 - ph, w, ph, 8); x.fill();
    });
    const url = c.toDataURL('image/png');

    const v = document.getElementById('recordedVideo');
    Object.defineProperty(v, 'videoWidth', { configurable: true, value: 1920 });
    Object.defineProperty(v, 'videoHeight', { configurable: true, value: 1080 });
    Object.defineProperty(v, 'currentTime', { configurable: true, value: 4 });
    v.classList.add('on'); v.removeAttribute('controls');
    v.style.cssText = `display:block;position:relative;width:94%;max-width:94%;aspect-ratio:16/9;height:auto;max-height:94%;
      background:#0b1220 url(${url}) center/contain no-repeat;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.5);`;
  });
}

// Populate the AI panels with the real text FastVLM produced.
async function injectAI() {
  await page.evaluate(() => {
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.getElementById('panelInsights').classList.remove('hidden');
    // Visual timeline (real captions)
    const tl = [
      [0, 'A sales dashboard on a dark background — “Sales Dashboard”, “Q3 revenue up 24%”, with metric cards and a bar chart.'],
      [1, 'A settings page: “Notifications”, “Privacy”, “Account”.'],
      [3, 'A red error screen reading “Error: Disk Full — Cannot save the file.”'],
      [4, 'A green confirmation: “Payment Successful — $49.00 charged.”'],
    ];
    document.getElementById('visualTimelineList').innerHTML = tl.map(([t, cap]) =>
      `<div class="chapter" data-time="${t}"><span class="ts">00:0${t}</span><span class="ch-title">${esc(cap)}</span></div>`).join('');
    document.getElementById('btnVisualTimeline').textContent = '👁 Regenerate';
    // Image chat (real Q + real answer)
    document.getElementById('chatQ').value = 'What is this screen showing?';
    document.getElementById('chatAnswer').innerHTML =
      '<div class="insight-summary"><span class="ts">00:04</span> This is a Sales Dashboard showing “Q3 revenue up 24%”, with metric cards for Revenue ($1.24M), Active users (8,412) and Conversion (3.9%), above a bar chart.</div>';
    // Trim selection
    document.getElementById('trimRange').textContent = '00:04 → 00:11';
  });
}

async function shot(name, focusSel) {
  if (focusSel) await page.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), focusSel);
  await page.waitForTimeout(160);
  await page.screenshot({ path: `${OUT}/${name}.png`, type: 'png', fullPage: false });
  console.log('shot:', name);
}

await reset(); await setup(); await injectAI();

// Tweet 1 hero — the "eyes" money shot: dashboard + AI answering about it
await shot('hero-x', '#chatAnswer');
// Tweet 2 — visual timeline populated
await shot('timeline-x', '#visualTimelineList');
// Tweet 3 — trim controls
await shot('trim-x', '#trimControls');

await browser.close();
console.log('\nMarketing captures written to', OUT);
