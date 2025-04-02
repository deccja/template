'use server';

/**
 * Server actions for file operations
 * These actions are called from the client to perform file operations
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as fs from '@/server/services/filesystem';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/config';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { DirectoryContents, OperationResult } from '@/types';
import path from 'path';

/**
 * Lists the contents of a directory
 */
export async function getDirectoryContents(
  dirPath: string = ''
): Promise<DirectoryContents> {
  try {
    console.log(`[getDirectoryContents] Fetching contents for directory: "${dirPath}"`);
    
    // Use standard non-recursive listing to only show direct contents
    const contents = await fs.listDirectory(dirPath);
    
    console.log(`[getDirectoryContents] Directory "${dirPath}" has ${contents.items.length} items:`, 
      contents.items.map(item => `${item.name} (${item.isDirectory ? 'dir' : 'file'})`));
    
    return contents;
  } catch (error) {
    console.error('Error getting directory contents:', error);
    return {
      path: dirPath,
      items: [],
      parent: dirPath === '' ? null : dirPath.split('/').slice(0, -1).join('/'),
    };
  }
}

/**
 * Creates a new folder
 */
export async function createFolder(
  dirPath: string,
  folderName: string
): Promise<OperationResult> {
  try {
    // Validate folder name
    if (!folderName || /[<>:"/\\|?*\x00-\x1F]/.test(folderName)) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_NAME,
      };
    }

    const result = await fs.createFolder(dirPath, folderName);
    
    // Revalidate path to update UI
    revalidatePath(`/${dirPath}`);
    
    return result;
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
    };
  }
}

/**
 * Renames a file or folder
 */
export async function renameItem(
  itemPath: string,
  newName: string
): Promise<OperationResult> {
  try {
    // Validate new name
    if (!newName || /[<>:"/\\|?*\x00-\x1F]/.test(newName)) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_NAME,
      };
    }

    const result = await fs.renameItem(itemPath, newName);
    
    // Get parent path for revalidation
    const parentPath = itemPath.split('/').slice(0, -1).join('/');
    
    // Revalidate path to update UI
    revalidatePath(`/${parentPath}`);
    
    return result;
  } catch (error) {
    console.error('Error renaming item:', error);
    return {
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
    };
  }
}

/**
 * Deletes a file or folder
 */
export async function deleteItem(
  itemPath: string
): Promise<OperationResult> {
  try {
    const result = await fs.deleteItem(itemPath);
    
    // Get parent path for revalidation
    const parentPath = itemPath.split('/').slice(0, -1).join('/');
    
    // Revalidate path to update UI
    revalidatePath(`/${parentPath}`);
    
    return result;
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
    };
  }
}

/**
 * Moves a file or folder
 */
export async function moveItem(
  itemPath: string,
  targetPath: string
): Promise<OperationResult> {
  try {
    const result = await fs.moveItem(itemPath, targetPath);
    
    // Get paths for revalidation
    const sourcePath = itemPath.split('/').slice(0, -1).join('/');
    
    // Revalidate both source and target paths to update UI
    revalidatePath(`/${sourcePath}`);
    revalidatePath(`/${targetPath}`);
    
    return result;
  } catch (error) {
    console.error('Error moving item:', error);
    return {
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
    };
  }
}

/**
 * Check if file appears to be an image based on extension
 */
function isImageByExtension(filename: string): boolean {
  const extension = path.extname(filename).toLowerCase().slice(1);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'heic', 'heif'];
  return imageExtensions.includes(extension);
}

/**
 * Uploads files to a directory
 */
export async function uploadFiles(
  formData: FormData
): Promise<OperationResult> {
  try {
    const dirPath = formData.get('dirPath') as string;
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return {
        success: false,
        message: 'No files provided',
      };
    }
    
    // Log upload information for debugging
    console.log(`Starting upload of ${files.length} files to ${dirPath}`);
    console.log(`Total upload size: ${files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)}MB`);
    
    const results: OperationResult[] = [];
    
    // Process files one by one rather than in parallel for better reliability
    for (const file of files) {
      // Log file info for debugging
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size / (1024 * 1024)}MB`);
      
      // Check if MIME type is allowed or if it matches a wildcard
      const isTypeAllowed = ALLOWED_FILE_TYPES.some(allowedType => {
        if (allowedType === 'image/*' && file.type.startsWith('image/')) {
          return true;
        }
        return allowedType === file.type;
      });
      
      // If MIME type isn't explicitly allowed, try checking file extension
      if (!isTypeAllowed && !isImageByExtension(file.name)) {
        console.log(`Invalid file type: ${file.type} for file ${file.name}`);
        results.push({
          success: false,
          message: `File "${file.name}": ${ERROR_MESSAGES.INVALID_FILE_TYPE}`,
        });
        continue;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.log(`File too large: ${file.size / (1024 * 1024)}MB exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        results.push({
          success: false,
          message: `File "${file.name}": ${ERROR_MESSAGES.FILE_TOO_LARGE}`,
        });
        continue;
      }
      
      try {
        console.log(`Converting file ${file.name} to buffer...`);
        // Convert file to buffer with timeout handling
        const arrayBuffer = await file.arrayBuffer();
        console.log(`File ${file.name} converted to arrayBuffer (${arrayBuffer.byteLength} bytes)`);
        
        const buffer = Buffer.from(arrayBuffer);
        console.log(`Buffer created for ${file.name} (${buffer.length} bytes)`);
        
        // Save file
        console.log(`Saving file ${file.name} to ${dirPath}...`);
        const result = await fs.saveFile(dirPath, file.name, buffer);
        console.log(`Save result for ${file.name}: ${result.success ? 'success' : 'failure'}`);
        
        results.push({
          ...result,
          message: result.success 
            ? `File "${file.name}": ${result.message}`
            : `File "${file.name}": ${result.message}`,
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        results.push({
          success: false,
          message: `File "${file.name}": Processing error - ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
        });
      }
    }
    
    // Revalidate path to update UI
    console.log(`Revalidating path: /${dirPath}`);
    revalidatePath(`/${dirPath}`);
    
    // Determine overall success
    const allSucceeded = results.every(result => result.success);
    const someSucceeded = results.some(result => result.success);
    
    if (allSucceeded) {
      console.log('All files uploaded successfully');
      return {
        success: true,
        message: SUCCESS_MESSAGES.FILES_UPLOADED,
        data: { results },
      };
    } else if (someSucceeded) {
      console.log('Some files uploaded successfully');
      return {
        success: true,
        message: 'Some files were uploaded successfully',
        data: { results },
      };
    } else {
      console.log('Failed to upload any files');
      return {
        success: false,
        message: 'Failed to upload any files',
        data: { results },
      };
    }
  } catch (error) {
    console.error('Error in uploadFiles action:', error);
    return {
      success: false,
      message: `${ERROR_MESSAGES.OPERATION_FAILED} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Gets a file's content
 * This is an internal action, not exposed to the client directly
 */
export async function getFileContent(
  filePath: string
): Promise<Buffer> {
  try {
    return await fs.getFileContent(filePath);
  } catch (error) {
    console.error('Error getting file content:', error);
    throw new Error(ERROR_MESSAGES.OPERATION_FAILED);
  }
} 