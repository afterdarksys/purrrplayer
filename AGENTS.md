# Purrr Player Agent Notes

Purrr Player is a focused, cat-themed desktop audio player extracted from the reusable GoMeow Studio desktop/audio stack.

## Commands

- `npm run dev` starts the Vite dev server on `http://localhost:1421/`.
- `npm run build` runs TypeScript and builds the frontend.
- `cargo check` from `src-tauri/` validates the Tauri shell.
- `npm run tauri dev` runs the native desktop app.

## Scope

Keep this app focused on local audio playback:

- Open and queue real audio files.
- Play, pause, seek, skip, and adjust volume.
- Show waveform and analyzer visualizations.
- Preserve the Go Meow/OS-default theme selector.
- Keep studio-only features out unless they directly improve playback.

## Source Provenance

The first cut deliberately reused patterns from `/Users/ryan/development/gomeow.media`:

- Tauri + Vite desktop layout.
- Go Meow theme variables and OS-native theme approach.
- Audio file extension support from the desktop bridge.
- Waveform and analyzer ideas from the web/studio components.
- Tauri dialog/store plugin usage.

## Engineering Notes

- The browser/WebView media element handles playback so common platform codecs work without a custom decoder in the first pass.
- WebAudio is used for analyzer data and peak generation.
- The Tauri backend is intentionally minimal. Add native decode/playback only if WebView codec coverage becomes a real blocker.
