// Headless capture for the Bolo user guide.
// Run while Bolo is served at http://localhost:8765 (e.g. `python3 -m http.server 8765`).
//   npx playwright install chromium  (one-time)
//   node docs/capture-screenshots.mjs
//
// Bolo is single-file and has no fixtures, so every "post-recording" state below
// is mocked via JS injection: we toggle CSS visibility, override video dimensions,
// and inject fake transcript / insights / annotations into the DOM directly.

import { createRequire } from 'module';
import { mkdirSync } from 'fs';
// Playwright lives in node 22.19's global modules; resolve from there.
const require = createRequire('/Users/chiragpatnaik/.nvm/versions/node/v22.19.0/lib/node_modules/_marker');
const { chromium } = require('playwright');

const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const URL = process.env.BOLO_URL || 'http://localhost:8765';
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await context.newPage();

// Boilerplate: load and reset to a known clean state
async function reset() {
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(150);
}

// Mock the recording stage with a synthetic "screen content" image, the
// recordedVideo element fakes dimensions so the annotation overlay can align.
async function mockPostRecording() {
  await page.evaluate(() => {
    document.querySelector('#modeChips [data-mode="studio"]').click();
    // Force panelDone + labelDone visible
    document.getElementById('panelDone').classList.remove('hidden');
    document.getElementById('labelDone').classList.remove('hidden');
    // Hide the empty state
    document.getElementById('stageEmpty').style.display = 'none';
    // Fake the recordedVideo as a gradient backdrop sized to a 16:9 area inside the stage
    const v = document.getElementById('recordedVideo');
    Object.defineProperty(v, 'videoWidth',  { configurable: true, value: 1920 });
    Object.defineProperty(v, 'videoHeight', { configurable: true, value: 1080 });
    Object.defineProperty(v, 'currentTime', { configurable: true, value: 12 });
    v.classList.add('on');
    v.removeAttribute('controls');
    v.style.cssText = `
      display: block; position: relative;
      width: 92%; max-width: 92%; height: 92%; max-height: 92%;
      background: linear-gradient(135deg, #1c2a44 0%, #233454 35%, #3b3a64 70%, #4a3a52 100%);
      border-radius: 12px;
    `;
  });
}

async function shot(name) {
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88, fullPage: false });
  console.log('shot:', name);
}

// v1.1.0: a realistic "Sales Dashboard" recorded frame so the on-device vision
// captions/answers make sense. (Headless has no WebGPU, so the AI panels are
// staged with the ACTUAL text FastVLM produced during verification.)
async function mockDashboardRecording() {
  await page.evaluate(() => {
    document.querySelector('#modeChips [data-mode="studio"]').click();
    document.getElementById('panelDone').classList.remove('hidden');
    document.getElementById('labelDone').classList.remove('hidden');
    const se = document.getElementById('stageEmpty'); if (se) se.style.display = 'none';
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
    const x = c.getContext('2d');
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, 1920, 1080);
    x.fillStyle = '#0f1c30'; x.fillRect(0, 0, 1920, 96);
    x.fillStyle = '#e6edf6'; x.font = 'bold 42px -apple-system,system-ui,sans-serif'; x.fillText('Sales Dashboard', 56, 62);
    x.fillStyle = '#7cc4ff'; x.font = '26px -apple-system,system-ui'; x.fillText('Q3 revenue up 24%', 56, 150);
    [['Revenue', '$1.24M', '#2dd4bf'], ['Active users', '8,412', '#60a5fa'], ['Conversion', '3.9%', '#f0abfc']].forEach(([l, v, col], i) => {
      const cx = 56 + i * 460; x.fillStyle = '#111f36'; x.strokeStyle = '#1e3350'; x.lineWidth = 2;
      x.beginPath(); x.roundRect(cx, 200, 420, 200, 16); x.fill(); x.stroke();
      x.fillStyle = '#8aa0bd'; x.font = '24px -apple-system,system-ui'; x.fillText(l, cx + 28, 250);
      x.fillStyle = '#f4f8ff'; x.font = 'bold 58px -apple-system,system-ui'; x.fillText(v, cx + 28, 330);
      x.fillStyle = col; x.fillRect(cx + 28, 356, 120, 6);
    });
    const bx = 56, by = 470, bw = 1808, bh = 520; x.fillStyle = '#0e1a2c'; x.beginPath(); x.roundRect(bx, by, bw, bh, 16); x.fill();
    [0.35, 0.5, 0.42, 0.62, 0.55, 0.78, 0.7, 0.9].forEach((h, i) => {
      const w = 150, gap = (bw - 8 * w) / 9, px = bx + gap + i * (w + gap), ph = h * (bh - 100);
      const g = x.createLinearGradient(0, by + bh - ph, 0, by + bh); g.addColorStop(0, '#3b82f6'); g.addColorStop(1, '#1d4ed8');
      x.fillStyle = g; x.beginPath(); x.roundRect(px, by + bh - 50 - ph, w, ph, 8); x.fill();
    });
    const url = c.toDataURL('image/png');
    const v = document.getElementById('recordedVideo');
    Object.defineProperty(v, 'videoWidth', { configurable: true, value: 1920 });
    Object.defineProperty(v, 'videoHeight', { configurable: true, value: 1080 });
    Object.defineProperty(v, 'currentTime', { configurable: true, value: 4 });
    v.classList.add('on'); v.removeAttribute('controls');
    v.style.cssText = `display:block;position:relative;width:94%;max-width:94%;aspect-ratio:16/9;height:auto;max-height:94%;
      background:#0b1220 url(${url}) center/contain no-repeat;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.5);`;
  });
}

// v1.0.0 shots — skip with NEW_ONLY=1 for a scoped v1.1.0 re-capture.
if (!process.env.NEW_ONLY) {
// ---------- 1) Empty idle state ----------
await reset();
await shot('01-empty');

// ---------- 2) Studio mode (just toggled) ----------
await page.evaluate(() => {
  document.querySelector('#modeChips [data-mode="studio"]').click();
});
await shot('02-studio-mode');

// ---------- 3) Spotlight Look applied to the stage ----------
await page.evaluate(() => {
  document.querySelector('#lookChips [data-look="spotlight"]').click();
});
await shot('03-look-spotlight');

// ---------- 4) Studio Look ----------
await page.evaluate(() => {
  document.querySelector('#lookChips [data-look="studio"]').click();
});
await shot('04-look-studio');

// ---------- 5) Post-record with playback area ----------
await reset();
await mockPostRecording();
await shot('05-post-record');

// ---------- 6) Transcript + AI insights populated ----------
await page.evaluate(() => {
  // Reveal transcript
  document.getElementById('panelTranscript').classList.remove('hidden');
  document.getElementById('transcriptList').innerHTML = `
    <div class="seg"><span class="ts">00:00</span><span class="txt">Welcome back. Today I'm walking through the new dashboard.</span></div>
    <div class="seg"><span class="ts">00:08</span><span class="txt">First, the inbox view — every message in one stream.</span></div>
    <div class="seg"><span class="ts">00:17</span><span class="txt">Filters live in the left rail. Click any to scope.</span></div>
    <div class="seg"><span class="ts">00:24</span><span class="txt">For team workspaces, the settings page is where you invite people.</span></div>
    <div class="seg"><span class="ts">00:32</span><span class="txt">Last thing — keyboard shortcuts are listed under ? at any time.</span></div>
  `;
  document.getElementById('segCount').textContent = '5 segments';

  // Reveal insights panel populated
  document.getElementById('panelInsights').classList.remove('hidden');
  document.getElementById('insightTitle').textContent = 'Onboarding to the new dashboard';
  document.getElementById('insightSummary').textContent =
    'A short walkthrough of the inbox view, the filter rail, the team-workspace invite flow, and where the keyboard shortcuts live.';
  document.getElementById('chaptersList').innerHTML = `
    <div class="chapter" data-time="0"><span class="ts">00:00</span><span class="ch-title">Inbox tour</span></div>
    <div class="chapter" data-time="84"><span class="ts">01:24</span><span class="ch-title">Filter rail</span></div>
    <div class="chapter" data-time="192"><span class="ts">03:12</span><span class="ch-title">Inviting a teammate</span></div>
    <div class="chapter" data-time="246"><span class="ts">04:06</span><span class="ch-title">Keyboard shortcuts</span></div>
  `;
  document.getElementById('insightsBody').style.display = 'block';

  // Scroll the sidebar to the insights panel
  document.querySelector('.sidebar').scrollTop = 380;
});
await shot('06-transcript-insights');

// ---------- 7) Annotations + blur on the playback ----------
await page.evaluate(() => {
  // Reveal the annotations panel and the overlay
  document.getElementById('panelAnnotations').classList.remove('hidden');
  document.getElementById('annotList').innerHTML = `
    <div class="annot-item"><span class="annot-icon">↗</span><span class="annot-desc">arrow</span><span class="annot-ts">00:08 → 00:11</span><button class="annot-del">✕</button></div>
    <div class="annot-item"><span class="annot-icon">▭</span><span class="annot-desc">box</span><span class="annot-ts">00:12 → 00:15</span><button class="annot-del">✕</button></div>
    <div class="annot-item"><span class="annot-icon">🅰</span><span class="annot-desc">"Click here"</span><span class="annot-ts">00:14 → 00:17</span><button class="annot-del">✕</button></div>
    <div class="annot-item"><span class="annot-icon">🌫</span><span class="annot-desc">blur</span><span class="annot-ts">00:16 → 00:19</span><button class="annot-del">✕</button></div>
  `;
  document.getElementById('annotCount').textContent = '4';

  // Position the SVG overlay manually on top of our fake video rect
  const svg = document.getElementById('annotOverlay');
  const stage = document.getElementById('stage');
  const v = document.getElementById('recordedVideo');
  const sr = stage.getBoundingClientRect();
  const vr = v.getBoundingClientRect();
  svg.style.left   = (vr.left - sr.left) + 'px';
  svg.style.top    = (vr.top  - sr.top)  + 'px';
  svg.style.width  = vr.width + 'px';
  svg.style.height = vr.height + 'px';
  svg.setAttribute('viewBox', '0 0 1920 1080');
  svg.classList.add('on');
  svg.innerHTML = `
    <rect x="240" y="220" width="520" height="280" fill="none" stroke="#d8482a" stroke-width="9"/>
    <line x1="900" y1="700" x2="1480" y2="430" stroke="#d8482a" stroke-width="11" stroke-linecap="round"/>
    <polygon points="1480,430 1432,452 1452,418" fill="#d8482a"/>
    <rect x="200" y="820" width="380" height="84" fill="rgba(0,0,0,0.78)" rx="10"/>
    <text x="232" y="876" fill="white" font-size="38" font-weight="700" font-family="-apple-system,system-ui">Click here</text>
    <foreignObject x="1080" y="540" width="640" height="240">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;background:rgba(20,20,28,0.12);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border:1px dashed rgba(216,72,42,0.55);box-sizing:border-box;"></div>
    </foreignObject>
  `;

  document.querySelector('.sidebar').scrollTop = 820;
});
await shot('07-annotations-blur');

// ---------- 8) Burn-in export with aspect chips ----------
await page.evaluate(() => {
  document.getElementById('exportWrap').classList.remove('hidden');
  document.getElementById('btnExportBaked').textContent = '🎬 Export with captions + annotations burned in';
  document.querySelector('.sidebar').scrollTop = 540;
});
await shot('08-burn-in-export');

// ---------- 9) History gallery with badges ----------
await page.evaluate(() => {
  document.getElementById('panelHistory').classList.remove('hidden');
  document.getElementById('labelHistory').classList.remove('hidden');
  document.getElementById('histCount').textContent = '3 of 5';
  document.getElementById('historyList').innerHTML = `
    <div class="hist-item active">
      <div class="hist-info">
        <div class="hist-name">bolo-2026-05-25-1430.webm</div>
        <div class="hist-meta">4.2 MB · 14:30 · captions · ✨ insights · ✎ 4 annot</div>
      </div>
      <button class="hist-btn">▶</button><button class="hist-btn">↓</button><button class="hist-btn">✕</button>
    </div>
    <div class="hist-item">
      <div class="hist-info">
        <div class="hist-name">bolo-2026-05-25-1212.webm</div>
        <div class="hist-meta">2.1 MB · 12:12 · captions</div>
      </div>
      <button class="hist-btn">▶</button><button class="hist-btn">↓</button><button class="hist-btn">✕</button>
    </div>
    <div class="hist-item">
      <div class="hist-info">
        <div class="hist-name">bolo-2026-05-24-0945.webm</div>
        <div class="hist-meta">812 KB · 09:45</div>
      </div>
      <button class="hist-btn">▶</button><button class="hist-btn">↓</button><button class="hist-btn">✕</button>
    </div>
  `;
  // Scroll all the way to the bottom of the sidebar
  document.querySelector('.sidebar').scrollTop = 99999;
});
await shot('09-gallery');
} // end v1.0.0 block

// ---------- 10) Trim (mediabunny) ----------
await reset();
await mockDashboardRecording();
await page.evaluate(() => {
  document.getElementById('trimRange').textContent = '00:04 → 00:11';
  document.getElementById('trimControls').scrollIntoView({ block: 'center' });
});
await shot('10-trim');

// ---------- 11) Visual timeline (FastVLM) ----------
await page.evaluate(() => {
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  document.getElementById('panelInsights').classList.remove('hidden');
  const tl = [
    [0, 'A sales dashboard on a dark background — “Sales Dashboard”, “Q3 revenue up 24%”, with metric cards and a bar chart.'],
    [1, 'A settings page: “Notifications”, “Privacy”, “Account”.'],
    [3, 'A red error screen reading “Error: Disk Full — Cannot save the file.”'],
    [4, 'A green confirmation: “Payment Successful — $49.00 charged.”'],
  ];
  document.getElementById('visualTimelineList').innerHTML = tl.map(([t, cap]) =>
    `<div class="chapter" data-time="${t}"><span class="ts">00:0${t}</span><span class="ch-title">${esc(cap)}</span></div>`).join('');
  document.getElementById('btnVisualTimeline').textContent = '👁 Regenerate';
  document.getElementById('panelInsights').scrollIntoView({ block: 'start' });
});
await shot('11-visual-timeline');

// ---------- 12) Ask about this frame (image chat) ----------
await page.evaluate(() => {
  document.getElementById('chatQ').value = 'What is this screen showing?';
  document.getElementById('chatAnswer').innerHTML =
    '<div class="insight-summary"><span class="ts">00:04</span> This is a Sales Dashboard showing “Q3 revenue up 24%”, with metric cards for Revenue ($1.24M), Active users (8,412) and Conversion (3.9%), above a bar chart.</div>';
  document.getElementById('chatAnswer').scrollIntoView({ block: 'center' });
});
await shot('12-image-chat');

await browser.close();
console.log('\nAll screenshots written to', OUT);
