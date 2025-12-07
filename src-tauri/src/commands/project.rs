use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Represents a recent project entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentProject {
    pub name: String,
    pub path: String,
    pub last_opened: String,
}

const MAX_RECENT_PROJECTS: usize = 10;
const RECENT_PROJECTS_FILE: &str = "recent_projects.json";

/// Get the app data directory path
fn get_app_data_dir() -> Result<PathBuf, String> {
    dirs::data_dir()
        .map(|p| p.join("devblitz"))
        .ok_or_else(|| "Could not determine app data directory".to_string())
}

/// Ensure the app data directory exists
fn ensure_app_data_dir() -> Result<PathBuf, String> {
    let dir = get_app_data_dir()?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    Ok(dir)
}

/// Open native folder picker dialog
/// 
/// # Returns
/// The selected folder path, or None if cancelled
#[tauri::command]
pub fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    // Use blocking_pick_folder for synchronous operation
    let result = app
        .dialog()
        .file()
        .set_title("Select Project Folder")
        .blocking_pick_folder();
    
    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Get list of recent projects
/// 
/// # Returns
/// List of recent projects, sorted by last opened (most recent first)
#[tauri::command]
pub async fn get_recent_projects() -> Result<Vec<RecentProject>, String> {
    let app_dir = get_app_data_dir()?;
    let file_path = app_dir.join(RECENT_PROJECTS_FILE);

    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read recent projects: {}", e))?;

    let mut projects: Vec<RecentProject> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse recent projects: {}", e))?;

    // Filter out projects that no longer exist
    projects.retain(|p| PathBuf::from(&p.path).exists());

    // Sort by last opened (most recent first)
    projects.sort_by(|a, b| b.last_opened.cmp(&a.last_opened));

    Ok(projects)
}

/// Add a project to recent projects list
/// 
/// # Arguments
/// * `path` - The project path to add
/// 
/// # Security
/// - Validates the path exists and is a directory
#[tauri::command]
pub async fn add_recent_project(path: String) -> Result<(), String> {
    let project_path = PathBuf::from(&path);

    // Validate the path exists and is a directory
    if !project_path.exists() {
        return Err("Project path does not exist".to_string());
    }

    if !project_path.is_dir() {
        return Err("Project path is not a directory".to_string());
    }

    // Get project name from path
    let name = project_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string());

    // Get current timestamp
    let now = chrono::Utc::now().to_rfc3339();

    let new_project = RecentProject {
        name,
        path: path.clone(),
        last_opened: now,
    };

    // Load existing projects
    let mut projects = get_recent_projects().await.unwrap_or_default();

    // Remove existing entry for this path (if any)
    projects.retain(|p| p.path != path);

    // Add new project at the beginning
    projects.insert(0, new_project);

    // Keep only MAX_RECENT_PROJECTS
    projects.truncate(MAX_RECENT_PROJECTS);

    // Save to file
    let app_dir = ensure_app_data_dir()?;
    let file_path = app_dir.join(RECENT_PROJECTS_FILE);

    let content = serde_json::to_string_pretty(&projects)
        .map_err(|e| format!("Failed to serialize recent projects: {}", e))?;

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to save recent projects: {}", e))?;

    Ok(())
}

/// Remove a project from recent projects list
#[tauri::command]
pub async fn remove_recent_project(path: String) -> Result<(), String> {
    let mut projects = get_recent_projects().await.unwrap_or_default();

    // Remove the project
    projects.retain(|p| p.path != path);

    // Save to file
    let app_dir = ensure_app_data_dir()?;
    let file_path = app_dir.join(RECENT_PROJECTS_FILE);

    let content = serde_json::to_string_pretty(&projects)
        .map_err(|e| format!("Failed to serialize recent projects: {}", e))?;

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to save recent projects: {}", e))?;

    Ok(())
}

/// Validate a project path
/// 
/// # Security
/// - Checks if path exists
/// - Checks if path is a directory
/// - Checks if path is readable
#[tauri::command]
pub async fn validate_project_path(path: String) -> Result<bool, String> {
    let project_path = PathBuf::from(&path);

    // Check existence
    if !project_path.exists() {
        return Ok(false);
    }

    // Check if directory
    if !project_path.is_dir() {
        return Ok(false);
    }

    // Check if readable (try to list contents)
    match fs::read_dir(&project_path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
