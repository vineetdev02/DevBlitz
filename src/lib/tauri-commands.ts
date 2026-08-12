/**
 * Type-safe Tauri command wrappers
 */

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { FileItem, FileInfo, RecentProject } from '@/types';

// Filesystem commands
export async function readDirectory(path: string, basePath: string): Promise<FileItem[]> {
  return invoke<FileItem[]>('read_directory', { path, basePath });
}

export async function readFileContent(path: string, basePath: string): Promise<string> {
  return invoke<string>('read_file_content', { path, basePath });
}

export async function getFileInfo(path: string, basePath: string): Promise<FileInfo> {
  return invoke<FileInfo>('get_file_info', { path, basePath });
}

// File mutation commands
export async function writeFile(path: string, basePath: string, content: string): Promise<void> {
  return invoke<void>('write_file', { path, basePath, content });
}

export async function createFile(path: string, basePath: string): Promise<string> {
  return invoke<string>('create_file', { path, basePath });
}

export async function createDirectory(path: string, basePath: string): Promise<string> {
  return invoke<string>('create_directory', { path, basePath });
}

export async function renamePath(path: string, newPath: string, basePath: string): Promise<string> {
  return invoke<string>('rename_path', { path, newPath, basePath });
}

export async function deletePath(path: string, basePath: string): Promise<void> {
  return invoke<void>('delete_path', { path, basePath });
}

export async function copyPath(path: string, newPath: string, basePath: string): Promise<string> {
  return invoke<string>('copy_path', { path, newPath, basePath });
}

export async function revealInFileManager(path: string): Promise<void> {
  return invoke<void>('reveal_in_file_manager', { path });
}

// Search commands
export interface IndexedFile {
  name: string;
  path: string;
  relativePath: string;
  extension: string | null;
}

export interface SearchMatch {
  line: number;
  text: string;
  column: number;
  length: number;
}

export interface SearchResult {
  path: string;
  relativePath: string;
  name: string;
  matches: SearchMatch[];
}

export interface SearchSummary {
  results: SearchResult[];
  totalMatches: number;
  fileCount: number;
  truncated: boolean;
}

export async function listProjectFiles(basePath: string): Promise<IndexedFile[]> {
  return invoke<IndexedFile[]>('list_project_files', { basePath });
}

export async function searchInFiles(
  basePath: string,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean; includePattern?: string } = {}
): Promise<SearchSummary> {
  return invoke<SearchSummary>('search_in_files', {
    basePath,
    query,
    caseSensitive: options.caseSensitive ?? false,
    wholeWord: options.wholeWord ?? false,
    includePattern: options.includePattern ?? null,
  });
}

export async function replaceInFile(
  path: string,
  basePath: string,
  query: string,
  replacement: string,
  caseSensitive = false
): Promise<number> {
  return invoke<number>('replace_in_file', {
    path,
    basePath,
    query,
    replacement,
    caseSensitive,
  });
}

// Git commands
export interface GitInfo {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  hasUpstream: boolean;
}

export type GitFileState =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'typechange'
  | 'untracked'
  | 'conflicted';

export interface GitFileStatus {
  path: string;
  absolutePath: string;
  name: string;
  status: GitFileState;
  staged: boolean;
}

export interface GitStatus {
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
}

export interface GitCommit {
  hash: string;
  author: string;
  relativeDate: string;
  subject: string;
}

export async function gitInfo(basePath: string): Promise<GitInfo> {
  return invoke<GitInfo>('git_info', { basePath });
}

export async function gitStatus(basePath: string): Promise<GitStatus> {
  return invoke<GitStatus>('git_status', { basePath });
}

export async function gitStage(basePath: string, path?: string): Promise<void> {
  return invoke<void>('git_stage', { basePath, path: path ?? null });
}

export async function gitUnstage(basePath: string, path?: string): Promise<void> {
  return invoke<void>('git_unstage', { basePath, path: path ?? null });
}

export async function gitDiscard(basePath: string, path: string): Promise<void> {
  return invoke<void>('git_discard', { basePath, path });
}

export async function gitCommit(basePath: string, message: string): Promise<string> {
  return invoke<string>('git_commit', { basePath, message });
}

export async function gitDiff(basePath: string, path: string, staged = false): Promise<string> {
  return invoke<string>('git_diff', { basePath, path, staged });
}

export async function gitLog(basePath: string, limit = 20): Promise<GitCommit[]> {
  return invoke<GitCommit[]>('git_log', { basePath, limit });
}

// Folder picker
export async function selectFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Project Folder',
  });
  
  if (selected && typeof selected === 'string') {
    return selected;
  }
  return null;
}

// Project commands
export async function getRecentProjects(): Promise<RecentProject[]> {
  return invoke<RecentProject[]>('get_recent_projects');
}

export async function addRecentProject(path: string): Promise<void> {
  return invoke<void>('add_recent_project', { path });
}

export async function removeRecentProject(path: string): Promise<void> {
  return invoke<void>('remove_recent_project', { path });
}

export async function validateProjectPath(path: string): Promise<boolean> {
  return invoke<boolean>('validate_project_path', { path });
}

// Terminal commands
export interface CommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCommand(command: string, cwd: string): Promise<CommandOutput> {
  return invoke<CommandOutput>('execute_command', { command, cwd });
}

export async function getUsername(): Promise<string> {
  return invoke<string>('get_username');
}

export async function getHostname(): Promise<string> {
  return invoke<string>('get_hostname');
}

// Check Tauri environment
export function isTauriAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}
