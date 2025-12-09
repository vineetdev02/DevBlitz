use crate::security::path_validator;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

/// Represents a file or directory item in the file tree
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_hidden: bool,
    pub extension: Option<String>,
    pub size: Option<u64>,
    pub children_count: Option<usize>,
}

/// File information with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_hidden: bool,
    pub extension: Option<String>,
    pub size: u64,
    pub modified: Option<String>,
    pub created: Option<String>,
    pub is_readonly: bool,
}

/// Read the contents of a directory with security validation
/// 
/// # Arguments
/// * `path` - The directory path to read
/// * `base_path` - The project base path for security validation
/// 
/// # Security
/// - Validates that the requested path is within the base project directory
/// - Prevents directory traversal attacks
#[tauri::command]
pub async fn read_directory(path: String, base_path: String) -> Result<Vec<FileItem>, String> {
    let requested_path = PathBuf::from(&path);
    let base = PathBuf::from(&base_path);

    // Security: Validate path is within project boundaries
    path_validator::validate_path(&base, &requested_path)?;

    // Read directory contents
    let entries = fs::read_dir(&requested_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut items: Vec<FileItem> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let file_name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path();
        let is_directory = metadata.is_dir();
        let is_hidden = file_name.starts_with('.');
        
        // Get extension for files
        let extension = if is_directory {
            None
        } else {
            file_path.extension().map(|e| e.to_string_lossy().to_string())
        };

        // Get children count for directories (shallow count)
        let children_count = if is_directory {
            fs::read_dir(&file_path)
                .ok()
                .map(|entries| entries.count())
        } else {
            None
        };

        // Get file size (only for files)
        let size = if is_directory { None } else { Some(metadata.len()) };

        items.push(FileItem {
            name: file_name,
            path: file_path.to_string_lossy().to_string(),
            is_directory,
            is_hidden,
            extension,
            size,
            children_count,
        });
    }

    // Sort: directories first, then alphabetically
    items.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(items)
}

/// Read the content of a file
/// 
/// # Security
/// - Validates path is within project boundaries
/// - Only reads text files (for now)
#[tauri::command]
pub async fn read_file_content(path: String, base_path: String) -> Result<String, String> {
    let requested_path = PathBuf::from(&path);
    let base = PathBuf::from(&base_path);

    // Security: Validate path
    path_validator::validate_path(&base, &requested_path)?;

    // Read file content
    fs::read_to_string(&requested_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Get detailed file information
#[tauri::command]
pub async fn get_file_info(path: String, base_path: String) -> Result<FileInfo, String> {
    let requested_path = PathBuf::from(&path);
    let base = PathBuf::from(&base_path);

    // Security: Validate path
    path_validator::validate_path(&base, &requested_path)?;

    let metadata = fs::metadata(&requested_path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let file_name = requested_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let is_directory = metadata.is_dir();
    let is_hidden = file_name.starts_with('.');
    
    let extension = if is_directory {
        None
    } else {
        requested_path.extension().map(|e| e.to_string_lossy().to_string())
    };

    let modified = metadata.modified().ok().map(|t| {
        chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339()
    });

    let created = metadata.created().ok().map(|t| {
        chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339()
    });

    let is_readonly = metadata.permissions().readonly();

    Ok(FileInfo {
        name: file_name,
        path: path,
        is_directory,
        is_hidden,
        extension,
        size: metadata.len(),
        modified,
        created,
        is_readonly,
    })
}

/// Count total files in a directory (recursive)
/// Used for status bar display
#[allow(dead_code)]
pub fn count_files_recursive(path: &PathBuf) -> usize {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .count()
}




