/**
 * Type-safe Tauri command wrappers
 * These functions provide a typed interface to Rust backend commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { FileItem, FileInfo, RecentProject } from '@/types';

/**
 * Read directory contents
 * @param path - Directory path to read
 * @param basePath - Project base path for security validation
 */
export async function readDirectory(
  path: string,
  basePath: string
): Promise<FileItem[]> {
  return invoke<FileItem[]>('read_directory', { path, basePath });
}

/**
 * Read file content
 * @param path - File path to read
 * @param basePath - Project base path for security validation
 */
export async function readFileContent(
  path: string,
  basePath: string
): Promise<string> {
  return invoke<string>('read_file_content', { path, basePath });
}

/**
 * Get detailed file information
 * @param path - File path
 * @param basePath - Project base path for security validation
 */
export async function getFileInfo(
  path: string,
  basePath: string
): Promise<FileInfo> {
  return invoke<FileInfo>('get_file_info', { path, basePath });
}

/**
 * Open native folder picker dialog
 * @returns Selected folder path or null if cancelled
 */
export async function selectFolder(): Promise<string | null> {
  return invoke<string | null>('select_folder');
}

/**
 * Get list of recent projects
 */
export async function getRecentProjects(): Promise<RecentProject[]> {
  return invoke<RecentProject[]>('get_recent_projects');
}

/**
 * Add a project to recent projects list
 * @param path - Project path to add
 */
export async function addRecentProject(path: string): Promise<void> {
  return invoke<void>('add_recent_project', { path });
}

/**
 * Remove a project from recent projects list
 * @param path - Project path to remove
 */
export async function removeRecentProject(path: string): Promise<void> {
  return invoke<void>('remove_recent_project', { path });
}

/**
 * Validate a project path
 * @param path - Path to validate
 * @returns true if path is valid and accessible
 */
export async function validateProjectPath(path: string): Promise<boolean> {
  return invoke<boolean>('validate_project_path', { path });
}

/**
 * Check if running in Tauri environment
 */
export function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Error wrapper for Tauri commands
 */
export class TauriCommandError extends Error {
  constructor(
    public command: string,
    message: string
  ) {
    super(`[${command}] ${message}`);
    this.name = 'TauriCommandError';
  }
}

/**
 * Safe command execution with error handling
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TauriCommandError(command, message);
  }
}

