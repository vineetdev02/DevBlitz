//! Path Security Validator
//! 
//! This module provides security validation for file system paths to prevent
//! directory traversal attacks and unauthorized file access.
//! 
//! # Security Measures
//! - Canonicalizes paths to resolve symlinks and relative paths
//! - Validates that requested paths are within allowed base directories
//! - Blocks common attack patterns (../, absolute paths outside project)

use std::path::{Path, PathBuf};

/// Security error types for path validation
#[derive(Debug)]
pub enum PathSecurityError {
    /// The base path is invalid or cannot be accessed
    InvalidBasePath,
    /// The requested path is invalid or cannot be accessed
    InvalidRequestedPath,
    /// Path traversal attempt detected (e.g., trying to access parent directories)
    PathTraversalAttempt,
    /// The path contains forbidden patterns
    ForbiddenPattern,
}

impl std::fmt::Display for PathSecurityError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PathSecurityError::InvalidBasePath => write!(f, "Invalid base path"),
            PathSecurityError::InvalidRequestedPath => write!(f, "Invalid requested path"),
            PathSecurityError::PathTraversalAttempt => write!(f, "Path traversal attempt detected"),
            PathSecurityError::ForbiddenPattern => write!(f, "Path contains forbidden patterns"),
        }
    }
}

/// Validate that a requested path is safely within the base project directory
/// 
/// # Arguments
/// * `base_path` - The project root directory (trusted boundary)
/// * `requested_path` - The path being requested by the frontend
/// 
/// # Returns
/// * `Ok(PathBuf)` - The validated canonical path
/// * `Err(String)` - Error message if validation fails
/// 
/// # Security
/// This function performs the following security checks:
/// 1. Canonicalizes both paths to resolve any symlinks or relative components
/// 2. Ensures the requested path starts with the base path
/// 3. Blocks any attempt to access files outside the project directory
/// 
/// # Example
/// ```
/// let base = PathBuf::from("/home/user/project");
/// let requested = PathBuf::from("/home/user/project/src/main.rs");
/// assert!(validate_path(&base, &requested).is_ok());
/// 
/// let malicious = PathBuf::from("/home/user/project/../.ssh/id_rsa");
/// assert!(validate_path(&base, &malicious).is_err());
/// ```
pub fn validate_path(base_path: &Path, requested_path: &Path) -> Result<PathBuf, String> {
    // First, check for obvious attack patterns in the raw path string
    let path_str = requested_path.to_string_lossy();
    if contains_forbidden_patterns(&path_str) {
        return Err(PathSecurityError::ForbiddenPattern.to_string());
    }

    // Canonicalize the base path (must succeed - it's our trusted directory)
    let canonical_base = base_path
        .canonicalize()
        .map_err(|_| PathSecurityError::InvalidBasePath.to_string())?;

    // Canonicalize the requested path
    let canonical_requested = requested_path
        .canonicalize()
        .map_err(|_| PathSecurityError::InvalidRequestedPath.to_string())?;

    // Security check: Ensure the requested path is within the base path
    if !canonical_requested.starts_with(&canonical_base) {
        return Err(PathSecurityError::PathTraversalAttempt.to_string());
    }

    Ok(canonical_requested)
}

/// Check for forbidden patterns in path strings
/// 
/// # Arguments
/// * `path` - The path string to check
/// 
/// # Returns
/// * `true` if the path contains forbidden patterns
/// * `false` if the path appears safe
fn contains_forbidden_patterns(path: &str) -> bool {
    // List of patterns that indicate potential attacks
    let forbidden_patterns = [
        // Null bytes (can truncate paths in some systems)
        "\0",
        // Windows alternate data streams
        "::$DATA",
        // Device names (Windows)
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    let path_upper = path.to_uppercase();
    
    for pattern in &forbidden_patterns {
        if path_upper.contains(pattern) {
            return true;
        }
    }

    false
}

/// Validate that a filename is safe
/// 
/// # Arguments
/// * `filename` - The filename to validate
/// 
/// # Returns
/// * `true` if the filename is safe
/// * `false` if the filename contains dangerous characters
pub fn is_safe_filename(filename: &str) -> bool {
    // Empty filenames are not safe
    if filename.is_empty() {
        return false;
    }

    // Check for forbidden characters
    let forbidden_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', '\0'];
    for c in forbidden_chars {
        if filename.contains(c) {
            return false;
        }
    }

    // Check for reserved names (Windows)
    let reserved_names = [
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    let name_upper = filename.to_uppercase();
    let name_without_ext = name_upper.split('.').next().unwrap_or("");
    
    for reserved in &reserved_names {
        if name_without_ext == *reserved {
            return false;
        }
    }

    // Filenames starting with dots are hidden but allowed
    // Filenames starting with spaces or ending with spaces/dots are problematic on Windows
    if filename.starts_with(' ') || filename.ends_with(' ') || filename.ends_with('.') {
        return false;
    }

    true
}

/// Sanitize a path by removing potentially dangerous components
/// 
/// # Arguments
/// * `path` - The path to sanitize
/// 
/// # Returns
/// A sanitized version of the path
#[allow(dead_code)]
pub fn sanitize_path(path: &str) -> String {
    path.replace("..", "")
        .replace("//", "/")
        .replace("\\\\", "\\")
        .trim()
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_filename() {
        assert!(is_safe_filename("document.txt"));
        assert!(is_safe_filename(".gitignore"));
        assert!(is_safe_filename("my-file_v2.rs"));
        
        assert!(!is_safe_filename(""));
        assert!(!is_safe_filename("../passwd"));
        assert!(!is_safe_filename("file:name"));
        assert!(!is_safe_filename("CON"));
        assert!(!is_safe_filename("file "));
    }

    #[test]
    fn test_forbidden_patterns() {
        assert!(contains_forbidden_patterns("file\0name"));
        assert!(contains_forbidden_patterns("file::$DATA"));
        assert!(!contains_forbidden_patterns("normal_file.txt"));
    }
}


