//! Project-wide file indexing and text search.
//!
//! `list_project_files` powers Quick Open (Ctrl+P); `search_in_files` powers the
//! global search panel (Ctrl+Shift+F). Both walk the project with a shared
//! ignore list so `node_modules` and friends never blow up the index.

use crate::security::path_validator;
use crate::utils;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::{DirEntry, WalkDir};

/// Directories that are never worth indexing.
const IGNORED_DIRS: [&str; 16] = [
    "node_modules",
    ".git",
    ".next",
    "target",
    "dist",
    "build",
    "out",
    ".cache",
    ".turbo",
    "coverage",
    "vendor",
    "__pycache__",
    ".venv",
    "venv",
    ".idea",
    ".svelte-kit",
];

/// Hard caps so a huge monorepo can't hang the UI.
const MAX_INDEXED_FILES: usize = 20_000;
const MAX_SEARCH_MATCHES: usize = 2_000;
const MAX_SEARCHABLE_FILE_BYTES: u64 = 2 * 1024 * 1024; // 2 MB

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexedFile {
    pub name: String,
    pub path: String,
    /// Path relative to the project root, for display in Quick Open.
    pub relative_path: String,
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    /// 1-based line number.
    pub line: usize,
    /// The full line text, trimmed of trailing whitespace.
    pub text: String,
    /// Byte-independent character offset of the match within `text`.
    pub column: usize,
    /// Length of the matched text, in characters.
    pub length: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub path: String,
    pub relative_path: String,
    pub name: String,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchSummary {
    pub results: Vec<SearchResult>,
    pub total_matches: usize,
    pub file_count: usize,
    /// True when a hard cap stopped the search early.
    pub truncated: bool,
}

fn is_ignored(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|name| IGNORED_DIRS.contains(&name))
        .unwrap_or(false)
}

fn relative_to(base: &Path, path: &Path) -> String {
    path.strip_prefix(base)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

/// Build a flat index of every text file in the project, for Quick Open.
#[tauri::command]
pub async fn list_project_files(base_path: String) -> Result<Vec<IndexedFile>, String> {
    let base = PathBuf::from(&base_path)
        .canonicalize()
        .map_err(|e| format!("Invalid project path: {}", e))?;

    let mut files: Vec<IndexedFile> = Vec::new();

    for entry in WalkDir::new(&base)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| !is_ignored(e))
        .filter_map(|e| e.ok())
    {
        if files.len() >= MAX_INDEXED_FILES {
            break;
        }
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        files.push(IndexedFile {
            name,
            relative_path: relative_to(&base, path),
            path: path.to_string_lossy().to_string(),
            extension: utils::get_extension(path),
        });
    }

    // Shallower paths first, then alphabetical - matches what users expect to
    // see at the top of Quick Open before they type anything.
    files.sort_by(|a, b| {
        let depth_a = a.relative_path.matches('/').count();
        let depth_b = b.relative_path.matches('/').count();
        depth_a
            .cmp(&depth_b)
            .then_with(|| a.relative_path.to_lowercase().cmp(&b.relative_path.to_lowercase()))
    });

    Ok(files)
}

/// Search file contents across the project.
#[tauri::command]
pub async fn search_in_files(
    base_path: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    include_pattern: Option<String>,
) -> Result<SearchSummary, String> {
    if query.trim().is_empty() {
        return Ok(SearchSummary {
            results: Vec::new(),
            total_matches: 0,
            file_count: 0,
            truncated: false,
        });
    }

    let base = PathBuf::from(&base_path)
        .canonicalize()
        .map_err(|e| format!("Invalid project path: {}", e))?;

    let needle = if case_sensitive {
        query.clone()
    } else {
        query.to_lowercase()
    };

    // A comma separated list of substrings / extensions, e.g. "ts,tsx,src/lib"
    let includes: Vec<String> = include_pattern
        .unwrap_or_default()
        .split(',')
        .map(|s| s.trim().trim_start_matches("*.").to_lowercase())
        .filter(|s| !s.is_empty())
        .collect();

    let mut results: Vec<SearchResult> = Vec::new();
    let mut total_matches = 0usize;
    let mut truncated = false;

    for entry in WalkDir::new(&base)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| !is_ignored(e))
        .filter_map(|e| e.ok())
    {
        if total_matches >= MAX_SEARCH_MATCHES {
            truncated = true;
            break;
        }
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        if !utils::is_text_file(path) {
            continue;
        }

        // Skip files that are too large to be worth scanning
        if entry.metadata().map(|m| m.len()).unwrap_or(0) > MAX_SEARCHABLE_FILE_BYTES {
            continue;
        }

        let relative = relative_to(&base, path);

        if !includes.is_empty() {
            let relative_lower = relative.to_lowercase();
            let matches_include = includes.iter().any(|inc| relative_lower.contains(inc));
            if !matches_include {
                continue;
            }
        }

        // Binary files fail to decode as UTF-8; skipping them is the right call.
        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let mut matches: Vec<SearchMatch> = Vec::new();

        for (index, line) in content.lines().enumerate() {
            let haystack = if case_sensitive {
                line.to_string()
            } else {
                line.to_lowercase()
            };

            let mut from = 0usize;
            while let Some(found) = haystack[from..].find(&needle) {
                let byte_pos = from + found;

                if whole_word && !is_whole_word(&haystack, byte_pos, needle.len()) {
                    from = byte_pos + needle.len().max(1);
                    continue;
                }

                matches.push(SearchMatch {
                    line: index + 1,
                    text: line.trim_end().to_string(),
                    column: haystack[..byte_pos].chars().count(),
                    length: query.chars().count(),
                });

                total_matches += 1;
                if total_matches >= MAX_SEARCH_MATCHES {
                    truncated = true;
                    break;
                }

                from = byte_pos + needle.len().max(1);
                if from >= haystack.len() {
                    break;
                }
            }

            if truncated {
                break;
            }
        }

        if !matches.is_empty() {
            results.push(SearchResult {
                path: path.to_string_lossy().to_string(),
                relative_path: relative,
                name: entry.file_name().to_string_lossy().to_string(),
                matches,
            });
        }
    }

    results.sort_by(|a, b| a.relative_path.to_lowercase().cmp(&b.relative_path.to_lowercase()));

    let file_count = results.len();

    Ok(SearchSummary {
        results,
        total_matches,
        file_count,
        truncated,
    })
}

/// Replace every occurrence of `query` with `replacement` in a single file.
#[tauri::command]
pub async fn replace_in_file(
    path: String,
    base_path: String,
    query: String,
    replacement: String,
    case_sensitive: bool,
) -> Result<usize, String> {
    if query.is_empty() {
        return Err("Search query cannot be empty".to_string());
    }

    let base = PathBuf::from(&base_path);
    let target = path_validator::validate_path(&base, &PathBuf::from(&path))?;

    let content =
        fs::read_to_string(&target).map_err(|e| format!("Failed to read file: {}", e))?;

    let (updated, count) = if case_sensitive {
        (content.replace(&query, &replacement), content.matches(&query).count())
    } else {
        replace_case_insensitive(&content, &query, &replacement)
    };

    if count > 0 {
        fs::write(&target, updated).map_err(|e| format!("Failed to write file: {}", e))?;
    }

    Ok(count)
}

/// True when the match at `pos` is bounded by non-word characters on both sides.
fn is_whole_word(haystack: &str, pos: usize, len: usize) -> bool {
    let is_word = |c: char| c.is_alphanumeric() || c == '_';

    let before_ok = haystack[..pos].chars().next_back().map_or(true, |c| !is_word(c));
    let after_ok = haystack[pos + len..].chars().next().map_or(true, |c| !is_word(c));

    before_ok && after_ok
}

/// Case-insensitive replace that preserves the untouched parts of the input.
fn replace_case_insensitive(content: &str, query: &str, replacement: &str) -> (String, usize) {
    let lower_content = content.to_lowercase();
    let lower_query = query.to_lowercase();

    let mut out = String::with_capacity(content.len());
    let mut count = 0usize;
    let mut cursor = 0usize;

    while let Some(found) = lower_content[cursor..].find(&lower_query) {
        let start = cursor + found;
        out.push_str(&content[cursor..start]);
        out.push_str(replacement);
        cursor = start + lower_query.len();
        count += 1;
    }

    out.push_str(&content[cursor..]);
    (out, count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_whole_word() {
        assert!(is_whole_word("let foo = 1", 4, 3));
        assert!(!is_whole_word("let foobar = 1", 4, 3));
        assert!(!is_whole_word("let _foo = 1", 5, 3));
        assert!(is_whole_word("foo", 0, 3));
    }

    #[test]
    fn test_replace_case_insensitive() {
        let (out, count) = replace_case_insensitive("Foo foo FOO bar", "foo", "baz");
        assert_eq!(out, "baz baz baz bar");
        assert_eq!(count, 3);
    }
}
