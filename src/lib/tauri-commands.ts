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
