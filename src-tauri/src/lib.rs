use std::{env, path::PathBuf};

use serde::Serialize;
use tauri::{Emitter, Manager};

const AUDIO_EXTENSIONS: &[&str] = &[
    "mp3", "wav", "flac", "aiff", "aif", "ogg", "oga", "m4a", "aac", "opus", "webm",
];

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CliRequest {
    args: Vec<String>,
    cwd: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CliAudioFile {
    path: String,
    name: String,
}

#[tauri::command]
fn get_initial_cli_request() -> CliRequest {
    CliRequest {
        args: env::args().skip(1).collect(),
        cwd: env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .to_string_lossy()
            .to_string(),
    }
}

#[tauri::command]
fn resolve_audio_files(paths: Vec<String>, cwd: String) -> Vec<CliAudioFile> {
    let cwd = PathBuf::from(cwd);
    paths
        .into_iter()
        .filter_map(|path| {
            let candidate = PathBuf::from(path);
            let candidate = if candidate.is_absolute() {
                candidate
            } else {
                cwd.join(candidate)
            };
            let resolved = candidate.canonicalize().ok()?;
            if !resolved.is_file() || !is_audio_path(&resolved) {
                return None;
            }
            let name = resolved
                .file_name()
                .map(|name| name.to_string_lossy().to_string())
                .unwrap_or_else(|| resolved.to_string_lossy().to_string());
            Some(CliAudioFile {
                path: resolved.to_string_lossy().to_string(),
                name,
            })
        })
        .collect()
}

fn is_audio_path(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            AUDIO_EXTENSIONS
                .iter()
                .any(|allowed| extension.eq_ignore_ascii_case(allowed))
        })
        .unwrap_or(false)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
            let _ = app.emit("cli-request", CliRequest { args, cwd });
        }))
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_initial_cli_request,
            resolve_audio_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running Purrr Player");
}
