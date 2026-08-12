//! Git integration, implemented by shelling out to the `git` binary.
//!
//! Every command takes the project root as its working directory, and returns
//! structured data rather than raw porcelain so the UI stays dumb.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitInfo {
    /// False when the folder is not a git work tree at all.
    pub is_repo: bool,
    pub branch: String,
    /// Commits ahead of the upstream branch.
    pub ahead: u32,
    /// Commits behind the upstream branch.
    pub behind: u32,
    pub has_upstream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitFileStatus {
    pub path: String,
    /// Absolute path, so the UI can open the file directly.
    pub absolute_path: String,
    pub name: String,
    /// One of: modified, added, deleted, renamed, untracked, conflicted.
    pub status: String,
    /// True when the change is in the index (staged).
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub staged: Vec<GitFileStatus>,
    pub unstaged: Vec<GitFileStatus>,
}

/// Run a git subcommand in `cwd`, returning stdout on success.
fn git(cwd: &str, args: &[&str]) -> Result<String, String> {
    let dir = PathBuf::from(cwd);
    if !dir.is_dir() {
        return Err("Invalid working directory".to_string());
    }

    let output = Command::new("git")
        .args(args)
        .current_dir(&dir)
        .output()
        .map_err(|e| format!("git is not available: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "git command failed".to_string()
        } else {
            stderr
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Branch name plus ahead/behind counts for the status bar.
#[tauri::command]
pub async fn git_info(base_path: String) -> Result<GitInfo, String> {
    let not_a_repo = GitInfo {
        is_repo: false,
        branch: String::new(),
        ahead: 0,
        behind: 0,
        has_upstream: false,
    };

    if git(&base_path, &["rev-parse", "--is-inside-work-tree"]).is_err() {
        return Ok(not_a_repo);
    }

    // A fresh repo with no commits has no HEAD, so fall back to the symbolic ref.
    let branch = git(&base_path, &["rev-parse", "--abbrev-ref", "HEAD"])
        .map(|s| s.trim().to_string())
        .or_else(|_| {
            git(&base_path, &["symbolic-ref", "--short", "HEAD"]).map(|s| s.trim().to_string())
        })
        .unwrap_or_else(|_| "HEAD".to_string());

    // "<ahead>\t<behind>" when an upstream is configured, error otherwise.
    let (ahead, behind, has_upstream) =
        match git(&base_path, &["rev-list", "--left-right", "--count", "HEAD...@{u}"]) {
            Ok(counts) => {
                let mut parts = counts.split_whitespace();
                let ahead = parts.next().and_then(|v| v.parse().ok()).unwrap_or(0);
                let behind = parts.next().and_then(|v| v.parse().ok()).unwrap_or(0);
                (ahead, behind, true)
            }
            Err(_) => (0, 0, false),
        };

    Ok(GitInfo {
        is_repo: true,
        branch,
        ahead,
        behind,
        has_upstream,
    })
}

/// Working tree status, split into staged and unstaged changes.
#[tauri::command]
pub async fn git_status(base_path: String) -> Result<GitStatus, String> {
    let raw = git(&base_path, &["status", "--porcelain=v1", "-z", "--untracked-files=all"])?;

    let root = PathBuf::from(&base_path);
    let mut staged: Vec<GitFileStatus> = Vec::new();
    let mut unstaged: Vec<GitFileStatus> = Vec::new();

    // -z gives NUL-separated entries; renames add a second NUL-separated path.
    let mut entries = raw.split('\0').filter(|e| !e.is_empty()).peekable();

    while let Some(entry) = entries.next() {
        if entry.len() < 3 {
            continue;
        }

        let bytes: Vec<char> = entry.chars().collect();
        let index_char = bytes[0];
        let tree_char = bytes[1];
        let mut path: String = entry[3..].to_string();

        // For renames git emits "R  new\0old" - consume and ignore the old name.
        if index_char == 'R' || tree_char == 'R' {
            if let Some(old) = entries.peek() {
                if !old.is_empty() {
                    entries.next();
                }
            }
        }

        path = path.replace('\\', "/");
        let name = path.rsplit('/').next().unwrap_or(&path).to_string();
        let absolute_path = root.join(&path).to_string_lossy().to_string();

        // Conflicts are reported with both sides set, or a U on either side.
        let is_conflict = index_char == 'U'
            || tree_char == 'U'
            || (index_char == 'A' && tree_char == 'A')
            || (index_char == 'D' && tree_char == 'D');

        if is_conflict {
            unstaged.push(GitFileStatus {
                path: path.clone(),
                absolute_path: absolute_path.clone(),
                name: name.clone(),
                status: "conflicted".to_string(),
                staged: false,
            });
            continue;
        }

        if index_char == '?' && tree_char == '?' {
            unstaged.push(GitFileStatus {
                path,
                absolute_path,
                name,
                status: "untracked".to_string(),
                staged: false,
            });
            continue;
        }

        if index_char != ' ' && index_char != '?' {
            staged.push(GitFileStatus {
                path: path.clone(),
                absolute_path: absolute_path.clone(),
                name: name.clone(),
                status: status_label(index_char),
                staged: true,
            });
        }

        if tree_char != ' ' && tree_char != '?' {
            unstaged.push(GitFileStatus {
                path,
                absolute_path,
                name,
                status: status_label(tree_char),
                staged: false,
            });
        }
    }

    Ok(GitStatus { staged, unstaged })
}

fn status_label(code: char) -> String {
    match code {
        'M' => "modified",
        'A' => "added",
        'D' => "deleted",
        'R' => "renamed",
        'C' => "copied",
        'T' => "typechange",
        _ => "modified",
    }
    .to_string()
}

/// Stage a single path, or everything when `path` is None.
#[tauri::command]
pub async fn git_stage(base_path: String, path: Option<String>) -> Result<(), String> {
    match path {
        Some(p) => git(&base_path, &["add", "--", &p])?,
        None => git(&base_path, &["add", "-A"])?,
    };
    Ok(())
}

/// Unstage a single path, or everything when `path` is None.
#[tauri::command]
pub async fn git_unstage(base_path: String, path: Option<String>) -> Result<(), String> {
    match path {
        Some(p) => git(&base_path, &["restore", "--staged", "--", &p])?,
        None => git(&base_path, &["reset"])?,
    };
    Ok(())
}

/// Discard working tree changes for a path.
#[tauri::command]
pub async fn git_discard(base_path: String, path: String) -> Result<(), String> {
    git(&base_path, &["checkout", "--", &path])?;
    Ok(())
}

/// Commit whatever is staged. Returns the short commit summary.
#[tauri::command]
pub async fn git_commit(base_path: String, message: String) -> Result<String, String> {
    if message.trim().is_empty() {
        return Err("Commit message cannot be empty".to_string());
    }

    let out = git(&base_path, &["commit", "-m", message.trim()])?;
    Ok(out.trim().to_string())
}

/// Unified diff for one path. Staged diff when `staged` is true.
#[tauri::command]
pub async fn git_diff(base_path: String, path: String, staged: bool) -> Result<String, String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }
    args.push("--");
    args.push(&path);

    git(&base_path, &args)
}

/// Recent commits for the source control panel, newest first.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitCommit {
    pub hash: String,
    pub author: String,
    pub relative_date: String,
    pub subject: String,
}

#[tauri::command]
pub async fn git_log(base_path: String, limit: u32) -> Result<Vec<GitCommit>, String> {
    let limit_arg = format!("-{}", limit.clamp(1, 200));
    // Unit separator between fields keeps parsing safe for any commit subject.
    let raw = git(
        &base_path,
        &["log", &limit_arg, "--pretty=format:%h\u{1f}%an\u{1f}%ar\u{1f}%s"],
    )?;

    Ok(raw
        .lines()
        .filter(|l| !l.trim().is_empty())
        .map(|line| {
            let mut parts = line.split('\u{1f}');
            GitCommit {
                hash: parts.next().unwrap_or("").to_string(),
                author: parts.next().unwrap_or("").to_string(),
                relative_date: parts.next().unwrap_or("").to_string(),
                subject: parts.next().unwrap_or("").to_string(),
            }
        })
        .collect())
}
