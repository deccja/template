/**
 * Custom hook for file uploads with progress tracking
 */

'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { FileUpload, OperationResult } from '@/types';
import { uploadFiles } from '@/server/actions/file-actions';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/config';
import { ERROR_MESSAGES } from '@/lib/constants';
import { getFileExtension } from '@/lib/utils';

interface UseFileUploadProps {
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (result: OperationResult) => void;
  onUploadError?: (error: string) => void;
}

export function useFileUpload({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
}: UseFileUploadProps = {}) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Get current directory path from pathname
  const getCurrentPath = (): string => {
    // Remove leading slash and decode URI components
    return pathname === '/' ? '' : decodeURIComponent(pathname.slice(1));
  };

  /**
   * Check if file appears to be an image based on extension
   */
  const isImageByExtension = (filename: string): boolean => {
    const extension = getFileExtension(filename).toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'heic', 'heif'];
    return imageExtensions.includes(extension);
  };

  /**
   * Validates files before upload with improved checking
   */
  const validateFiles = (files: File[]): { valid: File[], invalid: { file: File, reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    for (const file of files) {
      // Check file size first
      if (file.size > MAX_FILE_SIZE) {
        invalid.push({ file, reason: ERROR_MESSAGES.FILE_TOO_LARGE });
        continue;
      }

      // Check if MIME type is allowed or if it's a wildcard match
      const isTypeAllowed = ALLOWED_FILE_TYPES.some(allowedType => {
        if (allowedType === 'image/*' && file.type.startsWith('image/')) {
          return true;
        }
        return allowedType === file.type;
      });

      // If MIME type isn't explicitly allowed, try checking the file extension
      if (!isTypeAllowed && !isImageByExtension(file.name)) {
        invalid.push({ file, reason: ERROR_MESSAGES.INVALID_FILE_TYPE });
        continue;
      }

      // File passed all checks
      valid.push(file);
    }

    return { valid, invalid };
  };

  /**
   * Handles file upload with progress tracking
   */
  const handleUpload = async (filesToUpload: File[]): Promise<OperationResult> => {
    if (filesToUpload.length === 0) {
      return { success: false, message: 'No files to upload' };
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);
    onUploadStart?.();

    try {
      // Validate files
      const { valid, invalid } = validateFiles(filesToUpload);

      if (valid.length === 0) {
        const errorMsg = 'No valid files to upload';
        setError(errorMsg);
        onUploadError?.(errorMsg);
        
        // Log more details about invalid files for debugging
        console.log('Invalid files:', invalid.map(item => ({
          name: item.file.name,
          type: item.file.type,
          size: item.file.size,
          reason: item.reason
        })));
        
        return { 
          success: false, 
          message: errorMsg,
          data: { invalid }
        };
      }

      // Create form data
      const formData = new FormData();
      formData.append('dirPath', getCurrentPath());
      
      // Track uploads
      const uploads: FileUpload[] = valid.map(file => ({
        file,
        progress: 0,
        completed: false,
      }));
      
      setFiles(uploads);

      // Add files to form data
      valid.forEach(file => {
        formData.append('files', file);
      });

      // Calculate total size for progress estimation
      const totalSize = valid.reduce((total, file) => total + file.size, 0);
      
      // For large uploads, set a longer timeout
      const timeoutMs = Math.max(30000, totalSize / 10000); // At least 30 seconds, or longer for larger files
      
      // Set up request timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Simulate progress updates based on size (better estimate for large files)
      const largeFile = valid.some(file => file.size > 5 * 1024 * 1024);
      const progressUpdateInterval = largeFile ? 500 : 100; // Slower updates for large files
      const progressIncrement = largeFile ? 1 : 5; // Smaller increments for large files
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + progressIncrement, 95);
          onUploadProgress?.(newProgress);
          return newProgress;
        });
      }, progressUpdateInterval);

      try {
        // Upload files with timeout
        const result = await uploadFiles(formData);
        
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setProgress(100);
        onUploadProgress?.(100);

        if (result.success) {
          setFiles(prev => prev.map(file => ({ ...file, completed: true, progress: 100 })));
          onUploadComplete?.(result);
        } else {
          setError(result.message);
          onUploadError?.(result.message);
        }

        return result;
      } catch (error: any) {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        if (error?.name === 'AbortError') {
          const errorMessage = 'Upload timed out. The file may be too large or the connection is slow.';
          setError(errorMessage);
          onUploadError?.(errorMessage);
          
          return {
            success: false,
            message: errorMessage,
          };
        } else {
          throw error; // Rethrow for the outer catch
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      // Mark as completed even if there was an error
      setProgress(100);
      setIsUploading(false);
    }
  };

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setFiles([]);
    setError(null);
  }, []);

  /**
   * Handle drag and drop uploads
   */
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      void handleUpload(acceptedFiles);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isUploading,
    progress,
    files,
    error,
    upload: handleUpload,
    resetUpload,
    handleDrop,
  };
} 