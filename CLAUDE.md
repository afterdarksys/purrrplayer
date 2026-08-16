# CLAUDE.md

Purrr Player is the joke-name app that should still work like a real app.

## Product Direction

Build a small, polished local audio player:

- Cat-themed, on-brand, but not noisy.
- Real file playback first.
- Minimal interface by default.
- Advanced controls only when they make playback better.
- Visualizers are part of the fun, not the core architecture.

## Useful Context

The hard parts mostly came from `gomeow.media`, especially its desktop app and audio UI work. Do not copy the full DAW shell into this app. Prefer focused extraction:

- Small Tauri shell.
- Simple React state.
- Native file picker.
- Media element playback.
- WebAudio analyser.
- Theme/preferences store.

## Current First-Pass State

The app supports:

- Opening multiple audio files.
- Drag-and-drop queueing.
- Play/pause/previous/next.
- Seekable waveform.
- Spectrum, bars, and scope visualizers.
- Persisted theme, visualizer mode, reduce-motion, and volume.
- Tauri bundle metadata and generated icons.

## Next Good Work

- Add native app file-open events so double-clicked audio files enter the queue.
- Add metadata extraction for title/artist/album art.
- Add keyboard shortcuts.
- Add a compact mini-player mode.
- Test native playback across MP3, WAV, FLAC, AIFF, OGG, M4A, AAC, Opus, and WebM.
