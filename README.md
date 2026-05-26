# Bolo

**Record your screen. Speak your mind. Nothing leaves your device.**

Bolo is a single-HTML-file screen recorder. It captures screen + webcam + mic, transcribes audio locally via Whisper, and exports a finished file — all in your browser. No account, no server, no upload, no telemetry.

## What it does

- **Screen + webcam + mic capture** via `getDisplayMedia` / `getUserMedia`
- **Drag-to-position picture-in-picture webcam overlay** — size, shape, mirror — composited in-browser via canvas. Position is remembered between sessions.
- **Quick / Studio mode toggle** in the header. **Quick** = minimal recorder (Sources / Captions / Record / Download). **Studio** = full surface (adds Looks, follow-cursor, AI insights, annotations, burn-in export with aspect-ratio presets). Defaults to Quick; persists per device.
- **Look presets with live stage preview** — five backgrounds: **None / Studio / Spotlight / Color / Custom**. Studio and Spotlight are Cap-style gradient bundles with padding, rounded corners, and a soft drop shadow. Color opens a picker for any solid hex; Custom takes any uploaded image (cover-fit). Composited live in the recording canvas, and a CSS-only mirror of the active Look paints onto the stage *before* recording so you see what you'll get.
- **Follow-cursor zoom** — optional. Bolo infers the on-screen "interesting region" from frame-to-frame pixel deltas (the browser can't read cursor position from a `getDisplayMedia` stream the way Cap can from a native API) and gently pans + zooms 1.4× toward it. One toggle, no intensity slider.
- **Local Whisper transcription** via Transformers.js. Whisper Small (~250 MB, downloaded once and cached), 15 languages, auto-detect, translate-to-English toggle. Pre-transcription kicks off the moment you stop recording so clicking Generate Captions is usually instant.
- **Editable transcript** with click-to-seek timestamps and a live captions overlay during playback.
- **Local AI insights** — after transcription, click ✨ to generate a short title, a one-paragraph summary, and clickable chapter markers. Qwen 2.5 0.5B Instruct runs on WebGPU via Transformers.js v4 (~350 MB, downloaded once on first use, cached forever).
- **Post-record annotations** — four draw tools (arrow, box, text, **blur**) drawable on the playback. Each is visible for 3 seconds from the moment you draw it. Render as an SVG overlay live (with `backdrop-filter:blur` for the blur tool); bake into the export when you choose "Export with overlays burned in". The blur tool is the OpenScreen-inspired redaction box — drag over a credit card / password / PII region and it pixelates in the export.
- **Burn-in export with aspect-ratio presets** — re-encode the recording with captions and/or annotations baked into the pixels (so the result works on YouTube / Twitter / embedded players where a sidecar `.srt` doesn't). Pick a target aspect ratio — **Native / 1:1 / 9:16 / 16:9** — and the bake pipeline center-crops + re-frames for social. Drives a canvas + MediaRecorder pipeline from the source video's `requestVideoFrameCallback`, with audio passing through via `srcVid.captureStream().getAudioTracks()`. ~1× real-time — a 5-minute recording takes ~5 minutes to bake.
- **SRT / VTT / TXT subtitle export**. Download bundles a same-name `.srt` automatically so VLC, IINA and mpv auto-load it. For caption burn-in, run `ffmpeg -i in.webm -vf subtitles=in.srt out.mp4` at the shell (Bolo's in-browser burn-in is deferred — see *Known limitations*).
- **Persistent recordings gallery** — recent captures live in OPFS (browser-private filesystem), survive reloads, 500 MB cap with FIFO eviction. Transcripts and AI insights persist alongside the blob.
- **Cross-tab control** — recording another tab? Bolo opens a tiny always-on-top Document Picture-in-Picture window with timer + pause + stop, so you can control it from anywhere.
- **3-2-1 countdown**, pause/resume, floating recording control bar, keyboard shortcuts, self-capture detection.
- **File System Access API** — write directly to disk on Chromium, falls back to download elsewhere.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘⇧B` / `Ctrl⇧B` | Start / stop recording |
| `⌘⇧.` / `Ctrl⇧.` | Pause / resume |
| `Esc` | Cancel and discard |

`⌘⇧R` would conflict with browser hard-reload, so we use `B` for Bolo.

## Known limitations

- **Caption + annotation burn-in is real-time, not faster.** The export pipeline plays the recording end-to-end through a hidden video element and re-encodes via MediaRecorder, so a 5-minute recording takes ~5 minutes to bake. The fallback Download button still bundles a sidecar `.srt` for the no-burn-in path.
- **No in-browser trim yet.** `@ffmpeg/ffmpeg` 0.12's ESM wrapper spawns its own class worker from `dist/esm/worker.js`, which contains relative module imports (`./const.js`, `./errors.js`) that can't resolve when the worker is loaded via a cross-origin blob URL. The package was designed to be hosted same-origin. Every CDN-based workaround I tried either hung silently or threw a `SecurityError`. Self-hosting the worker files would break Bolo's single-HTML-file constraint. Workaround that still works: trim externally in QuickTime/VLC. A future investigation may try `mediabunny` or a pure-WebCodecs path.

## Philosophy

Bolo doesn't ask you to pick "Tiny / Base / Small" or "720p / 1080p / 1440p" or "VP8 / VP9". Quality is always the best supported by your browser. The only choices you make are about *intent* — what language are you speaking in, do you want it translated. The rest is noise.

## Privacy

Your recording, transcript, and edits never leave this page. There is no backend. There never will be. Close the tab and the recordings stay only in your browser's private storage (OPFS) — visible only to you, only on this device. Use Download or Save As to copy them to your real disk.

## Tech

- Vanilla JS + HTML + CSS, single file, no build step
- `MediaRecorder` (WebM / VP9 with VP8 fallback)
- `canvas.captureStream` for screen+webcam compositing, Look framing, and cursor-follow zoom (all in one draw loop)
- Frame-diff motion centroid on a 64×36 offscreen canvas for the follow-cursor zoom — sampled at ~5 FPS with low-pass smoothing
- [Transformers.js v2.17](https://github.com/xenova/transformers.js) with `Xenova/whisper-small` for local transcription
- [Transformers.js v4](https://github.com/huggingface/transformers.js) with `onnx-community/Qwen2.5-0.5B-Instruct` (q4f16, WebGPU) for AI insights
- [Document Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API) for cross-tab recording control
- [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) for persistent recording gallery
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) for direct-to-disk saves

## Palette

Coloured with **`scandinavia-10 · POLARNATT`** — Tromsø polar night, no sun for weeks; the coolest dark in the library. Polar-night blue-black body, cool snow ink, brick-red REC dot, teal Save action — the clean studio at 4 PM in January.

Palette pulled from [**Rangrez**](https://github.com/NakliTechie/rangrez), the global colour-palette library that backs all NakliTechie projects.

## Browser support

- **Chrome / Edge 116+** — full feature set including Document PiP cross-tab control and FS API saves
- **Firefox 100+** — works, falls back to in-page floating control bar
- **Safari 16.4+** — works, basic features

## Run locally

```
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). That's it.

Or just open `index.html` directly in Chrome — works from `file://` too.

## Live demo

[**bolo.naklitechie.com**](https://bolo.naklitechie.com/)

## User guide

A walkthrough with screenshots of every feature — Quick / Studio modes, Looks, follow-cursor zoom, captions, AI insights, annotations, blur, burn-in export with aspect-ratio presets, gallery, keyboard shortcuts, privacy.

- **Local**: [`docs/guide.html`](docs/guide.html)
- **Hosted**: [bolo.naklitechie.com/docs/guide.html](https://bolo.naklitechie.com/docs/guide.html)

## License

MIT — see [LICENSE](LICENSE).

---

Part of the [NakliTechie](https://naklitechie.github.io/) series — single-file, private-by-default browser apps by [Chirag Patnaik](https://github.com/NakliTechie).
