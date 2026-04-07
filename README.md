# Bolo

**Record your screen. Speak your mind. Nothing leaves your device.**

Bolo is a single-HTML-file screen recorder. It captures screen + webcam + mic, transcribes audio locally via Whisper, lets you trim and burn captions in via ffmpeg.wasm, and exports a finished file — all in your browser. No account, no server, no upload, no telemetry.

## What it does

- **Screen + webcam + mic capture** via `getDisplayMedia` / `getUserMedia`
- **Drag-to-position picture-in-picture webcam overlay** — size, shape, mirror — composited in-browser via canvas. Position is remembered between sessions.
- **Local Whisper transcription** via Transformers.js. 15 languages, auto-detect, translate-to-English toggle, three model sizes (Tiny / Base / Small).
- **Editable transcript** with click-to-seek timestamps and a live captions overlay during playback.
- **Trim** — drag two handles, click Apply edit. Lossless (`-c copy`), instant.
- **Burn captions into the video** — one checkbox, ffmpeg.wasm re-encodes the file with your edited captions baked into the pixels.
- **SRT / VTT / TXT subtitle export**. Download bundles a same-name `.srt` automatically so VLC, IINA and mpv auto-load it.
- **Persistent recordings gallery** — recent captures live in OPFS (browser-private filesystem), survive reloads, 500 MB cap with FIFO eviction.
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

## Privacy

Your recording, transcript, and edits never leave this page. There is no backend. There never will be. Close the tab and the recordings stay only in your browser's private storage (OPFS) — visible only to you, only on this device. Use Download or Save As to copy them to your real disk.

## Tech

- Vanilla JS + HTML + CSS, single file, no build step
- `MediaRecorder` (WebM / VP9 with VP8 fallback)
- `canvas.captureStream` for screen+webcam compositing
- [Transformers.js](https://github.com/xenova/transformers.js) with `Xenova/whisper-{tiny,base,small}` for local transcription
- [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) (single-threaded core, no SharedArrayBuffer required) for trim + caption burn-in
- [Document Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API) for cross-tab recording control
- [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) for persistent recording gallery
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) for direct-to-disk saves

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

[**naklitechie.github.io/bolo**](https://naklitechie.github.io/bolo/) (once deployed)

## License

MIT — see [LICENSE](LICENSE).

---

Part of the [NakliTechie](https://naklitechie.github.io/) series — single-file, private-by-default browser apps by [Chirag Patnaik](https://github.com/NakliTechie).
