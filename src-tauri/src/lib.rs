// DevBlitz Library
// This file is required for Tauri 2.0 mobile support and library builds

mod commands;
mod security;
mod utils;

use commands::{filesystem, project};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Filesystem commands
            filesystem::read_directory,
            filesystem::read_file_content,
            filesystem::get_file_info,
            // Project commands
            project::select_folder,
            project::get_recent_projects,
            project::add_recent_project,
            project::remove_recent_project,
            project::validate_project_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DevBlitz");
}

