//! Mutating file system operations: save, create, rename, delete.
//!
//! Every command validates its target against the open project's root before
//! touching the disk, so the frontend can never be tricked into writing outside
//! the folder the user explicitly opened.

use crate::security::path_validator;
use std::fs;
use std::path::PathBuf;

/// Write content to an existing file (Save).
#[tauri::command]
pub async fn write_file(path: String, base_path: String, content: String) -> Result<(), String> {
    let base = PathBuf::from(&base_path);
    let requested = PathBuf::from(&path);

    // An existing file canonicalizes; a brand new one validates via its parent.
    let target = match path_validator::validate_path(&base, &requested) {
        Ok(p) => p,
        Err(_) => path_validator::validate_new_path(&base, &requested)?,
    };

    fs::write(&target, content).map_err(|e| format!("Failed to write file: {}", e))
}

/// Create a new empty file. Fails if something already exists at that path.
#[tauri::command]
pub async fn create_file(path: String, base_path: String) -> Result<String, String> {
    let base = PathBuf::from(&base_path);
    let target = path_validator::validate_new_path(&base, &PathBuf::from(&path))?;

    if target.exists() {
        return Err(format!(
            "A file or folder named '{}' already exists",
            target.file_name().unwrap_or_default().to_string_lossy()
        ));
    }

    fs::write(&target, "").map_err(|e| format!("Failed to create file: {}", e))?;
    Ok(target.to_string_lossy().to_string())
}

/// Create a new directory. Fails if something already exists at that path.
#[tauri::command]
pub async fn create_directory(path: String, base_path: String) -> Result<String, String> {
    let base = PathBuf::from(&base_path);
    let target = path_validator::validate_new_path(&base, &PathBuf::from(&path))?;

    if target.exists() {
        return Err(format!(
            "A file or folder named '{}' already exists",
            target.file_name().unwrap_or_default().to_string_lossy()
        ));
    }

    fs::create_dir_all(&target).map_err(|e| format!("Failed to create folder: {}", e))?;
    Ok(target.to_string_lossy().to_string())
}

/// Rename or move a file/folder within the project.
#[tauri::command]
pub async fn rename_path(
    path: String,
    new_path: String,
    base_path: String,
) -> Result<String, String> {
    let base = PathBuf::from(&base_path);
    let source = path_validator::validate_path(&base, &PathBuf::from(&path))?;
    let target = path_validator::validate_new_path(&base, &PathBuf::from(&new_path))?;

    if source == target {
        return Ok(target.to_string_lossy().to_string());
    }

    if target.exists() {
        return Err(format!(
            "A file or folder named '{}' already exists",
            target.file_name().unwrap_or_default().to_string_lossy()
        ));
    }

    fs::rename(&source, &target).map_err(|e| format!("Failed to rename: {}", e))?;
    Ok(target.to_string_lossy().to_string())
}

/// Delete a file or a directory (recursively).
#[tauri::command]
pub async fn delete_path(path: String, base_path: String) -> Result<(), String> {
    let base = PathBuf::from(&base_path);
    let target = path_validator::validate_path(&base, &PathBuf::from(&path))?;

    // Refuse to delete the project root itself
    let canonical_base = base
        .canonicalize()
        .map_err(|e| format!("Invalid project path: {}", e))?;
    if target == canonical_base {
        return Err("Cannot delete the project root".to_string());
    }

    if target.is_dir() {
        fs::remove_dir_all(&target).map_err(|e| format!("Failed to delete folder: {}", e))
    } else {
        fs::remove_file(&target).map_err(|e| format!("Failed to delete file: {}", e))
    }
}

/// Duplicate a file, returning the path of the copy.
#[tauri::command]
pub async fn copy_path(
    path: String,
    new_path: String,
    base_path: String,
) -> Result<String, String> {
    let base = PathBuf::from(&base_path);
    let source = path_validator::validate_path(&base, &PathBuf::from(&path))?;
    let target = path_validator::validate_new_path(&base, &PathBuf::from(&new_path))?;

    if source.is_dir() {
        return Err("Copying folders is not supported yet".to_string());
    }

    fs::copy(&source, &target).map_err(|e| format!("Failed to copy: {}", e))?;
    Ok(target.to_string_lossy().to_string())
}

/// Open a path in the OS file manager (Reveal in Finder / Explorer / Files).
#[tauri::command]
pub async fn reveal_in_file_manager(path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    if !target.exists() {
        return Err("Path does not exist".to_string());
    }

    // Reveal the containing folder for files, the folder itself for directories.
    let to_open = if target.is_dir() {
        target.clone()
    } else {
        target.parent().map(|p| p.to_path_buf()).unwrap_or(target)
    };

    let program = if cfg!(target_os = "macos") {
        "open"
    } else if cfg!(target_os = "windows") {
        "explorer"
    } else {
        "xdg-open"
    };

    std::process::Command::new(program)
        .arg(&to_open)
        .spawn()
        .map_err(|e| format!("Failed to open file manager: {}", e))?;

    Ok(())
}
