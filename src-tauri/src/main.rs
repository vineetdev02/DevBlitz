// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod security;
mod utils;

use commands::{filesystem, project};

fn main() {
    // Force native portal-based file dialogs on Linux (GNOME/KDE)
    // This ensures we get the native file manager dialog instead of GTK's built-in one
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("GTK_USE_PORTAL", "1");
    }

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
