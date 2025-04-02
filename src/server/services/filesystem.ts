/**
 * Filesystem service
 * Abstracts file operations using Node.js fs module
 */

import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { FileItem, DirectoryContents, OperationResult } from '@/types';
import { DATA_PATH } from '@/config';
import { Readable } from 'stream';

/**
 * Ensures the data directory exists
 */
export async function ensureDataDirectory(): Promise<void> {
  try {
    await fsPromises.mkdir(DATA_PATH, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw new Error('Failed to create data directory');
  }
}

/**
 * Validates and normalizes a file path to prevent path traversal attacks
 */
export function normalizePath(inputPath: string): string {
  console.log(`[normalizePath] Input path: "${inputPath}"`);
  
  // Handle empty or root paths
  if (!inputPath || inputPath === '' || inputPath === '/') {
    return '';
  }
  
  // Remove leading slashes and normalize path
  let normalizedPath = inputPath.replace(/^\/+/, '');
  
  // Use Node.js path normalization but keep relative paths as they are
  normalizedPath = path.normalize(normalizedPath);
  
  // Prevent path traversal
  if (normalizedPath.includes('..')) {
    throw new Error('Invalid path');
  }
  
  // Remove any "./" at the beginning which path.normalize might add
  normalizedPath = normalizedPath.replace(/^\.\//, '');
  
  console.log(`[normalizePath] Normalized path: "${normalizedPath}"`);
  return normalizedPath;
}

/**
 * Gets the absolute path from a relative path
 */
export function getAbsolutePath(relativePath: string): string {
  const normalizedPath = normalizePath(relativePath);
  return path.join(DATA_PATH, normalizedPath);
}

/**
 * Gets file statistics
 */
export async function getStats(filePath: string): Promise<fs.Stats> {
  try {
    const absolutePath = getAbsolutePath(filePath);
    return await fsPromises.stat(absolutePath);
  } catch (error) {
    console.error('Error getting file stats:', error);
    throw new Error('Failed to get file stats');
  }
}

/**
 * Lists directory contents
 */
export async function listDirectory(dirPath: string): Promise<DirectoryContents> {
  try {
    await ensureDataDirectory();
    
    console.log(`[filesystem.ts:listDirectory] Raw dirPath: "${dirPath}"`);
    
    const normalizedPath = normalizePath(dirPath);
    console.log(`[filesystem.ts:listDirectory] Normalized path: "${normalizedPath}"`);
    
    const absolutePath = getAbsolutePath(normalizedPath);
    console.log(`[filesystem.ts:listDirectory] Absolute path: "${absolutePath}"`);
    
    // Check if directory exists, if not return empty
    try {
      const stats = await fsPromises.stat(absolutePath);
      if (!stats.isDirectory()) {
        console.log(`[filesystem.ts:listDirectory] Path is not a directory: "${absolutePath}"`);
        throw new Error('Path is not a directory');
      }
      console.log(`[filesystem.ts:listDirectory] Directory exists: "${absolutePath}"`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`[filesystem.ts:listDirectory] Directory does not exist: "${absolutePath}"`);
        return {
          path: normalizedPath,
          items: [],
          parent: normalizedPath === '' ? null : path.dirname(normalizedPath),
        };
      }
      console.error(`[filesystem.ts:listDirectory] Error checking directory: "${absolutePath}"`, error);
      throw error;
    }
    
    // Read directory contents
    console.log(`[filesystem.ts:listDirectory] Reading directory: "${absolutePath}"`);
    const files = await fsPromises.readdir(absolutePath);
    console.log(`[filesystem.ts:listDirectory] Found ${files.length} items in directory: "${absolutePath}"`);
    
    // Get file stats and create FileItem objects
    const items = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(normalizedPath, file);
        const absoluteFilePath = getAbsolutePath(filePath);
        
        try {
          const stats = await fsPromises.stat(absoluteFilePath);
          
          return {
            name: file,
            path: filePath,
            type: stats.isDirectory() ? 'folder' : getMimeType(file),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modifiedAt: stats.mtime,
            url: stats.isDirectory() ? undefined : `/api/file/${encodeURIComponent(filePath)}`,
          } as FileItem;
        } catch (error) {
          console.error(`Error getting stats for ${file}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null items (files with errors)
    const validItems = items.filter(Boolean) as FileItem[];
    console.log(`[filesystem.ts:listDirectory] Processed ${validItems.length} valid items in directory: "${absolutePath}"`);
    
    return {
      path: normalizedPath,
      items: validItems,
      parent: normalizedPath === '' ? null : path.dirname(normalizedPath),
    };
  } catch (error) {
    console.error(`[filesystem.ts:listDirectory] Error listing directory: "${dirPath}"`, error);
    throw new Error('Failed to list directory');
  }
}

/**
 * Creates a new folder
 */
export async function createFolder(dirPath: string, folderName: string): Promise<OperationResult> {
  try {
    const normalizedPath = normalizePath(dirPath);
    const folderPath = path.join(normalizedPath, folderName);
    const absolutePath = getAbsolutePath(folderPath);
    
    // Check if folder already exists
    try {
      await fsPromises.stat(absolutePath);
      return {
        success: false,
        message: 'A folder with this name already exists',
      };
    } catch (error) {
      // If error is not ENOENT, rethrow
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Create folder
    await fsPromises.mkdir(absolutePath, { recursive: true });
    
    return {
      success: true,
      message: 'Folder created successfully',
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      success: false,
      message: 'Failed to create folder',
    };
  }
}

/**
 * Deletes a file or folder
 */
export async function deleteItem(itemPath: string): Promise<OperationResult> {
  try {
    const normalizedPath = normalizePath(itemPath);
    const absolutePath = getAbsolutePath(normalizedPath);
    
    // Check if item exists
    try {
      const stats = await fsPromises.stat(absolutePath);
      
      // Delete based on item type
      if (stats.isDirectory()) {
        await fsPromises.rm(absolutePath, { recursive: true, force: true });
      } else {
        await fsPromises.unlink(absolutePath);
      }
      
      return {
        success: true,
        message: 'Item deleted successfully',
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          success: false,
          message: 'Item not found',
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      message: 'Failed to delete item',
    };
  }
}

/**
 * Renames a file or folder
 */
export async function renameItem(itemPath: string, newName: string): Promise<OperationResult> {
  try {
    const normalizedPath = normalizePath(itemPath);
    const absolutePath = getAbsolutePath(normalizedPath);
    
    // Get directory and new path
    const dirPath = path.dirname(normalizedPath);
    const newPath = path.join(dirPath, newName);
    const absoluteNewPath = getAbsolutePath(newPath);
    
    // Check if target already exists
    try {
      await fsPromises.stat(absoluteNewPath);
      return {
        success: false,
        message: 'An item with this name already exists',
      };
    } catch (error) {
      // If error is not ENOENT, rethrow
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Rename item
    await fsPromises.rename(absolutePath, absoluteNewPath);
    
    return {
      success: true,
      message: 'Item renamed successfully',
      data: {
        newPath,
      },
    };
  } catch (error) {
    console.error('Error renaming item:', error);
    return {
      success: false,
      message: 'Failed to rename item',
    };
  }
}

/**
 * Moves a file or folder
 */
export async function moveItem(itemPath: string, targetPath: string): Promise<OperationResult> {
  try {
    const normalizedItemPath = normalizePath(itemPath);
    const normalizedTargetPath = normalizePath(targetPath);
    
    const absoluteItemPath = getAbsolutePath(normalizedItemPath);
    
    // Get item name and new path
    const itemName = path.basename(normalizedItemPath);
    const newPath = path.join(normalizedTargetPath, itemName);
    const absoluteNewPath = getAbsolutePath(newPath);
    
    // Check if target already exists
    try {
      await fsPromises.stat(absoluteNewPath);
      return {
        success: false,
        message: 'An item with this name already exists in the target folder',
      };
    } catch (error) {
      // If error is not ENOENT, rethrow
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Move item
    await fsPromises.rename(absoluteItemPath, absoluteNewPath);
    
    return {
      success: true,
      message: 'Item moved successfully',
      data: {
        newPath,
      },
    };
  } catch (error) {
    console.error('Error moving item:', error);
    return {
      success: false,
      message: 'Failed to move item',
    };
  }
}

/**
 * Saves an uploaded file
 */
export async function saveFile(
  dirPath: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<OperationResult> {
  try {
    const normalizedPath = normalizePath(dirPath);
    const filePath = path.join(normalizedPath, fileName);
    const absolutePath = getAbsolutePath(filePath);
    
    // Ensure the target directory exists
    const dirAbsolutePath = path.dirname(absolutePath);
    await fsPromises.mkdir(dirAbsolutePath, { recursive: true });
    
    console.log(`Saving file to ${absolutePath} (${fileBuffer.length} bytes)`);
    
    // Check if file already exists
    try {
      await fsPromises.stat(absolutePath);
      return {
        success: false,
        message: 'A file with this name already exists',
      };
    } catch (error) {
      // If error is not ENOENT, rethrow
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // For large files, use a write stream instead of writeFile for better reliability
    if (fileBuffer.length > 5 * 1024 * 1024) { // 5MB
      return await saveFileThroughStream(absolutePath, fileBuffer, filePath);
    } else {
      // For smaller files, use the standard approach
      await fsPromises.writeFile(absolutePath, fileBuffer);
      
      return {
        success: true,
        message: 'File saved successfully',
        data: {
          path: filePath,
        },
      };
    }
  } catch (error) {
    console.error(`Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    return {
      success: false,
      message: 'Failed to save file',
    };
  }
}

/**
 * Save large file using streams for better reliability
 */
async function saveFileThroughStream(
  absolutePath: string, 
  fileBuffer: Buffer,
  relativePath: string
): Promise<OperationResult> {
  return new Promise((resolve) => {
    // Create a read stream from the buffer
    const readStream = new Readable();
    readStream.push(fileBuffer);
    readStream.push(null); // Signal the end of the stream
    
    // Create a write stream to the file
    const writeStream = fs.createWriteStream(absolutePath);
    
    // Track whether the operation completed
    let completed = false;
    
    // Set up timeout to handle hanging streams
    const timeout = setTimeout(() => {
      if (!completed) {
        console.error('File write operation timed out');
        writeStream.destroy();
        completed = true;
        resolve({
          success: false,
          message: 'File upload timed out',
        });
      }
    }, 30000); // 30 seconds timeout
    
    // Handle write stream events
    writeStream.on('error', (err) => {
      if (!completed) {
        console.error('Error writing file:', err);
        clearTimeout(timeout);
        completed = true;
        resolve({
          success: false,
          message: `Error writing file: ${err.message}`,
        });
      }
    });
    
    writeStream.on('finish', () => {
      if (!completed) {
        console.log(`File saved successfully via stream: ${absolutePath}`);
        clearTimeout(timeout);
        completed = true;
        resolve({
          success: true,
          message: 'File saved successfully',
          data: {
            path: relativePath,
          },
        });
      }
    });
    
    // Pipe the buffer through the streams
    readStream.pipe(writeStream);
  });
}

/**
 * Gets a file's content
 */
export async function getFileContent(filePath: string): Promise<Buffer> {
  try {
    const normalizedPath = normalizePath(filePath);
    const absolutePath = getAbsolutePath(normalizedPath);
    
    return await fsPromises.readFile(absolutePath);
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error('Failed to read file');
  }
}

/**
 * Lists directory contents recursively
 * This retrieves all files and subdirectories at any nesting level
 */
export async function listDirectoryRecursively(dirPath: string): Promise<DirectoryContents> {
  try {
    await ensureDataDirectory();
    
    const normalizedPath = normalizePath(dirPath);
    const absolutePath = getAbsolutePath(normalizedPath);
    
    // Check if directory exists, if not return empty
    try {
      const stats = await fsPromises.stat(absolutePath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          path: normalizedPath,
          items: [],
          parent: normalizedPath === '' ? null : path.dirname(normalizedPath),
        };
      }
      throw error;
    }
    
    // Read directory contents
    const files = await fsPromises.readdir(absolutePath);
    
    // Get file stats and create FileItem objects for all items including nested ones
    const items: FileItem[] = [];
    
    for (const file of files) {
      const filePath = path.join(normalizedPath, file);
      const absoluteFilePath = getAbsolutePath(filePath);
      
      try {
        const stats = await fsPromises.stat(absoluteFilePath);
        
        // Create the file/folder item
        const item: FileItem = {
          name: file,
          path: filePath,
          type: stats.isDirectory() ? 'folder' : getMimeType(file),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modifiedAt: stats.mtime,
          url: stats.isDirectory() ? undefined : `/api/file/${encodeURIComponent(filePath)}`,
        };
        
        items.push(item);
        
        // If it's a directory, recursively get its contents
        if (stats.isDirectory()) {
          const subDirContents = await listDirectoryRecursively(filePath);
          items.push(...subDirContents.items);
        }
      } catch (error) {
        console.error(`Error getting stats for ${file}:`, error);
      }
    }
    
    return {
      path: normalizedPath,
      items: items,
      parent: normalizedPath === '' ? null : path.dirname(normalizedPath),
    };
  } catch (error) {
    console.error('Error listing directory recursively:', error);
    throw new Error('Failed to list directory recursively');
  }
}

/**
 * Gets a file's MIME type based on extension
 */
function getMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
} 