//! Utility functions for DevBlitz
//! 
//! This module contains helper functions used across the application.

use std::path::Path;

/// Get file extension from a path
pub fn get_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
}

/// Check if a file is likely a text file based on extension
pub fn is_text_file(path: &Path) -> bool {
    let text_extensions = [
        // Code files
        "rs", "js", "ts", "jsx", "tsx", "py", "rb", "go", "java", "c", "cpp", "h", "hpp",
        "cs", "php", "swift", "kt", "scala", "clj", "ex", "exs", "erl", "hs", "ml", "fs",
        "lua", "pl", "pm", "r", "jl", "nim", "zig", "v", "d", "dart", "groovy", "vb",
        // Web files
        "html", "htm", "css", "scss", "sass", "less", "vue", "svelte", "astro",
        // Config files
        "json", "yaml", "yml", "toml", "ini", "cfg", "conf", "env", "properties",
        // Markup
        "md", "markdown", "rst", "adoc", "tex", "txt", "rtf",
        // Data
        "xml", "csv", "tsv", "sql",
        // Shell
        "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd",
        // Docker/DevOps
        "dockerfile", "containerfile", "vagrantfile", "jenkinsfile",
        // Git
        "gitignore", "gitattributes", "gitmodules",
        // Others
        "lock", "log", "editorconfig", "prettierrc", "eslintrc", "babelrc",
    ];

    match get_extension(path) {
        Some(ext) => text_extensions.contains(&ext.as_str()),
        None => {
            // Check for files without extensions that are typically text
            let filename = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");
            
            let text_filenames = [
                "Makefile", "Dockerfile", "Containerfile", "Vagrantfile", "Gemfile",
                "Rakefile", "Procfile", "Brewfile", "LICENSE", "README", "CHANGELOG",
                "AUTHORS", "CONTRIBUTORS", "COPYING", "INSTALL", "NEWS", "TODO",
            ];
            
            text_filenames.contains(&filename) || filename.starts_with('.')
        }
    }
}

/// Format file size in human-readable format
pub fn format_file_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_is_text_file() {
        assert!(is_text_file(&PathBuf::from("main.rs")));
        assert!(is_text_file(&PathBuf::from("index.html")));
        assert!(is_text_file(&PathBuf::from("Makefile")));
        assert!(is_text_file(&PathBuf::from(".gitignore")));
    }

    #[test]
    fn test_format_file_size() {
        assert_eq!(format_file_size(500), "500 B");
        assert_eq!(format_file_size(1024), "1.00 KB");
        assert_eq!(format_file_size(1536), "1.50 KB");
        assert_eq!(format_file_size(1048576), "1.00 MB");
    }
}


