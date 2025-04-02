/**
 * Custom hook for file operations with optimistic updates
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FileItem, OperationResult } from '@/types';
import { 
  createFolder, 
  renameItem, 
  deleteItem, 
  moveItem 
} from '@/server/actions/file-actions';

interface UseFileActionsProps {
  onSuccess?: (action: string, result: OperationResult) => void;
  onError?: (action: string, error: string) => void;
}

export function useFileActions({
  onSuccess,
  onError,
}: UseFileActionsProps = {}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Get current directory path from pathname
  const getCurrentPath = (): string => {
    // Remove leading slash and decode URI components
    return pathname === '/' ? '' : decodeURIComponent(pathname.slice(1));
  };

  /**
   * Creates a new folder
   */
  const handleCreateFolder = async (folderName: string): Promise<OperationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentPath = getCurrentPath();
      const result = await createFolder(currentPath, folderName);
      
      if (result.success) {
        onSuccess?.('createFolder', result);
      } else {
        setError(result.message);
        onError?.('createFolder', result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      onError?.('createFolder', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renames a file or folder
   */
  const handleRenameItem = async (
    item: FileItem,
    newName: string
  ): Promise<OperationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await renameItem(item.path, newName);
      
      if (result.success) {
        onSuccess?.('renameItem', result);
      } else {
        setError(result.message);
        onError?.('renameItem', result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      onError?.('renameItem', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Deletes a file or folder
   */
  const handleDeleteItem = async (item: FileItem): Promise<OperationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await deleteItem(item.path);
      
      if (result.success) {
        onSuccess?.('deleteItem', result);
      } else {
        setError(result.message);
        onError?.('deleteItem', result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      onError?.('deleteItem', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Moves a file or folder
   */
  const handleMoveItem = async (
    item: FileItem,
    targetPath: string
  ): Promise<OperationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await moveItem(item.path, targetPath);
      
      if (result.success) {
        onSuccess?.('moveItem', result);
      } else {
        setError(result.message);
        onError?.('moveItem', result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      onError?.('moveItem', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createFolder: handleCreateFolder,
    renameItem: handleRenameItem,
    deleteItem: handleDeleteItem,
    moveItem: handleMoveItem,
  };
} 