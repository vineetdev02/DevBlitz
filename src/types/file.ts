/**
 * File and directory types for DevBlitz
 */

/**
 * Represents a file or directory item in the file tree
 */
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isHidden: boolean;
  extension: string | null;
  size: number | null;
  childrenCount: number | null;
}

/**
 * Extended file information with metadata
 */
export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  isHidden: boolean;
  extension: string | null;
  size: number;
  modified: string | null;
  created: string | null;
  isReadonly: boolean;
}

/**
 * File tree node with children (for expanded directories)
 */
export interface FileTreeNode extends FileItem {
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  depth: number;
}

/**
 * File type based on extension
 */
export type FileType =
  | 'code'
  | 'config'
  | 'markup'
  | 'style'
  | 'image'
  | 'document'
  | 'data'
  | 'binary'
  | 'unknown';

/**
 * Get file type from extension
 */
export function getFileType(extension: string | null): FileType {
  if (!extension) return 'unknown';
  
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'rs', 'py', 'rb', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt'];
  const configExtensions = ['json', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'conf', 'env'];
  const markupExtensions = ['html', 'htm', 'md', 'markdown', 'rst', 'txt'];
  const styleExtensions = ['css', 'scss', 'sass', 'less', 'stylus'];
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  const dataExtensions = ['csv', 'tsv', 'sql'];

  const ext = extension.toLowerCase();
  
  if (codeExtensions.includes(ext)) return 'code';
  if (configExtensions.includes(ext)) return 'config';
  if (markupExtensions.includes(ext)) return 'markup';
  if (styleExtensions.includes(ext)) return 'style';
  if (imageExtensions.includes(ext)) return 'image';
  if (documentExtensions.includes(ext)) return 'document';
  if (dataExtensions.includes(ext)) return 'data';
  
  return 'unknown';
}

/**
 * Sort file items (directories first, then alphabetically)
 */
export function sortFileItems(items: FileItem[]): FileItem[] {
  return [...items].sort((a, b) => {
    // Directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    // Then alphabetically (case-insensitive)
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

/**
 * Filter hidden files
 */
export function filterHiddenFiles(items: FileItem[], showHidden: boolean): FileItem[] {
  if (showHidden) return items;
  return items.filter(item => !item.isHidden);
}

