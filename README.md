# Bolo

**Record your screen. Speak your mind. Nothing leaves your device.**

Bolo is a single-HTML-file screen recorder. It captures screen + webcam + mic, transcribes audio locally via Whisper, **describes and answers questions about your recording with an on-device vision model**, **trims in the browser**, and exports a finished file — all on your machine. No account, no server, no upload, no telemetry.

## Try it

**→ [bolo.naklitechie.com](https://bolo.naklitechie.com/)** — nothing to install, nothing to sign up for.

Or open `index.html` directly in Chrome — it works from `file://` too.

## What it does

- **Screen + webcam + mic capture** via `getDisplayMedia` / `getUserMedia`
- **Drag-to-position picture-in-picture webcam overlay** — size, shape, mirror — composited in-browser via canvas. Position is remembered between sessions. Optional **dynamic bubble** grows the webcam while you speak and shrinks it on pauses (mic-loudness driven, smoothed).
- **Quick / Studio mode toggle** in the header. **Quick** = minimal recorder (Sources / Captions / Record / Download). **Studio** = full surface (adds Looks, follow-cursor, dynamic webcam bubble, AI insights, annotations, burn-in export with aspect / speed / quality and a background-audio track). Defaults to Quick; persists per device.
- **Look presets with live stage preview** — five backgrounds: **None / Studio / Spotlight / Color / Custom**. Studio and Spotlight are Cap-style gradient bundles with padding, rounded corners, and a soft drop shadow. Color opens a picker for any solid hex; Custom takes any uploaded image (cover-fit). Composited live in the recording canvas, and a CSS-only mirror of the active Look paints onto the stage *before* recording so you see what you'll get.
- **Follow-cursor zoom** — optional. Bolo infers the on-screen "interesting region" from frame-to-frame pixel deltas (the browser can't read cursor position from a `getDisplayMedia` stream the way Cap can from a native API) and gently pans + zooms 1.4× toward it. One toggle, no intensity slider.
- **Local Whisper transcription** via Transformers.js. Whisper Small (~250 MB, downloaded once and cached), 15 languages, auto-detect, translate-to-English toggle. Pre-transcription kicks off the moment you stop recording so clicking Generate Captions is usually instant.
- **Editable transcript** with click-to-seek timestamps and a live captions overlay during playback.
- **Local AI insights** — after transcription, click ✨ to generate a short title, a one-paragraph summary, and clickable chapter markers. Qwen 2.5 0.5B Instruct runs on WebGPU via Transformers.js v4 (~350 MB, downloaded once on first use, cached forever).
- **Visual timeline (on-device vision)** — *Studio.* Click 👁 **Describe key moments** and a small vision-language model (FastVLM-0.5B, WebGPU, ~450 MB once) samples key frames and describes what's on screen at each — a clickable timeline that works **even with no audio**, so a silent screen capture still gets a usable summary. Reads on-screen text well (dashboards, error dialogs, terminals).
- **Ask about a frame** — *Studio.* Pause on any moment, type a question ("what does this error say?", "what's the revenue number?"), and the same on-device vision model answers about what's on screen right then. Shares the visual-timeline model — no extra download.
- **In-browser trim** — scrub the playback, mark in/out from the playhead, then cut. Frame-accurate, re-encoded locally via [mediabunny](https://github.com/Vanilagy/mediabunny) (pure-WebCodecs, no ffmpeg) — usually a second or two, and nothing leaves your device. Replaces the recording in place.
- **Post-record annotations** — four draw tools (arrow, box, text, **blur**) drawable on the playback. Each is visible for 3 seconds from the moment you draw it. Render as an SVG overlay live (with `backdrop-filter:blur` for the blur tool); bake into the export when you choose "Export with overlays burned in". The blur tool is the OpenScreen-inspired redaction box — drag over a credit card / password / PII region and it pixelates in the export.
- **Burn-in export with aspect, speed & quality** — re-encode the recording with captions and/or annotations baked into the pixels (so the result works on YouTube / Twitter / embedded players where a sidecar `.srt` doesn't). Pick a target aspect ratio — **Native / 1:1 / 9:16 / 16:9** (center-cropped + re-framed for social), an export **speed** — **0.5× / 1× / 1.5× / 2×** (time-lapse a slow demo, or slow-mo a fast one, via the source video's `playbackRate`), and a **quality** cap — **Source / 1080p / 720p** (downscale + lower bitrate for a smaller shareable file). Drives a canvas + MediaRecorder pipeline from the source video's `requestVideoFrameCallback`. ~1× real-time — a 5-minute recording takes ~5 minutes to bake. With no transform selected, Export just hands back the untouched recording.
- **Background audio track** — drop in a music bed or voiceover (`🎵 Add music / voiceover`) and it's mixed into the export through an `AudioContext`, with a volume slider balancing it against the original audio. Turns a silent screen capture into a narrated or scored clip — session-only, nothing uploaded.
- **SRT / VTT / TXT subtitle export**. Download bundles a same-name `.srt` automatically so VLC, IINA and mpv auto-load it. For caption burn-in, run `ffmpeg -i in.webm -vf subtitles=in.srt out.mp4` at the shell (Bolo's in-browser burn-in is deferred — see *Known limitations*).
- **Persistent recordings gallery** — recent captures live in OPFS (browser-private filesystem), survive reloads, 500 MB cap with FIFO eviction. Transcripts and AI insights persist alongside the blob.
- **Cross-tab control** — recording another tab? Bolo opens a tiny always-on-top Document Picture-in-Picture window with timer + pause + stop, so you can control it from anywhere.
- **First-run guided tour** — a spotlight walkthrough of sources, the Quick/Studio toggle, record, and help. Shows once, skippable, replayable anytime from **?** → *Take the tour*. State is a single localStorage flag; nothing tracked.
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
- **The vision features need WebGPU + cross-origin isolation.** The visual timeline and frame Q&A run FastVLM on WebGPU; on the deployed site this works out of the box (COOP/COEP headers ship in `_headers`). Serving locally over plain `python3 -m http.server` isn't cross-origin-isolated, so the vision model falls back to a single-threaded path and stalls — use a server that sends `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` for local vision dev. (Whisper captions work either way.)

## Philosophy

Bolo doesn't ask you to pick "Tiny / Base / Small" or "VP8 / VP9". *Recording* quality is always the best supported by your browser. The only choices at capture time are about *intent* — what language are you speaking in, do you want it translated. The rest is noise. The one place a quality knob appears is *export*, and it's still about intent: 720p / 1080p downscales a finished clip so it's small enough to share, not a dial you set before you know what you've got.

## Privacy

Your recording, transcript, and edits never leave this page. There is no backend. There never will be. Close the tab and the recordings stay only in your browser's private storage (OPFS) — visible only to you, only on this device. Use Download or Save As to copy them to your real disk.

## Tech

- Vanilla JS + HTML + CSS, single file, no build step
- `MediaRecorder` (WebM / VP9 with VP8 fallback)
- `canvas.captureStream` for screen+webcam compositing, Look framing, and cursor-follow zoom (all in one draw loop)
- Frame-diff motion centroid on a 64×36 offscreen canvas for the follow-cursor zoom — sampled at ~5 FPS with low-pass smoothing
- [Transformers.js v2.17](https://github.com/xenova/transformers.js) with `Xenova/whisper-small` for local transcription
- [Transformers.js v4](https://github.com/huggingface/transformers.js) with `onnx-community/Qwen2.5-0.5B-Instruct` (q4f16, WebGPU) for AI insights
- [Transformers.js v4](https://github.com/huggingface/transformers.js) with `onnx-community/FastVLM-0.5B-ONNX` (WebGPU) for the visual timeline and frame Q&A — an instruct vision-language model reused for both
- [mediabunny](https://github.com/Vanilagy/mediabunny) (pure-WebCodecs, zero-dependency) for in-browser trim — no ffmpeg, no WASM worker
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

## User guide

A walkthrough with screenshots of every feature — Quick / Studio modes, Looks, follow-cursor zoom, dynamic webcam bubble, captions, AI insights, annotations, blur, burn-in export with aspect / speed / quality, background audio, gallery, keyboard shortcuts, privacy.

- **Local**: [`docs/guide.html`](docs/guide.html)
- **Hosted**: [bolo.naklitechie.com/docs/guide.html](https://bolo.naklitechie.com/docs/guide.html)

## License

MIT — see [LICENSE](LICENSE).

---

Part of the [NakliTechie](https://naklitechie.github.io/) series — single-file, private-by-default browser apps by [Chirag Patnaik](https://github.com/NakliTechie).
