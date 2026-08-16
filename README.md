# Purrr Player

Purrr Player is a focused, cat-themed desktop audio player for local music files. It is built with Tauri, Vite, React, and TypeScript, with playback handled by the browser/WebView media element so common platform codecs work without a custom decoder.

## Features

- Open and queue local audio files.
- Drag audio files into the player.
- Play, pause, seek, skip tracks, and adjust volume.
- View waveform peaks and live analyzer visualizations.
- Choose between Go Meow and OS-default themes.
- Optional purr interlude between queued songs.

Supported file extensions are `mp3`, `wav`, `flac`, `aiff`, `aif`, `ogg`, `oga`, `m4a`, `aac`, `opus`, and `webm`. Actual playback support depends on the codecs available to the platform WebView.

## Development

Install dependencies:

```sh
npm install
```

Run the frontend dev server:

```sh
npm run dev
```

The Vite app runs at `http://localhost:1421/`.

Run the native Tauri app:

```sh
npm run tauri dev
```

Build the frontend:

```sh
npm run build
```

Validate the Tauri shell:

```sh
cd src-tauri
cargo check
```

## Project Shape

- `src/` contains the React player UI, playback state, preferences, waveform, and visualizer code.
- `src-tauri/` contains the minimal Tauri shell and desktop capabilities.
- WebAudio is used for analyzer data and peak generation.
- Tauri dialog and store plugins are used for native file picking and preferences.

## Scope

Purrr Player is intentionally limited to local audio playback. Studio, publishing, and media-management features belong outside this app unless they directly improve playback.
