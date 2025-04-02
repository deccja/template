'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileItem, DialogState } from '@/types';
import { sanitizeFilename } from '@/lib/utils';
import { useFileActions } from '@/hooks/useFileActions';
import { toast } from 'sonner';

interface FileDialogsProps {
  dialogState: DialogState;
  onClose: () => void;
}

export default function FileDialogs({ 
  dialogState, 
  onClose 
}: FileDialogsProps) {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { isLoading, createFolder, renameItem, deleteItem } = useFileActions({
    onSuccess: (action, result) => {
      toast.success(result.message);
      onClose();
    },
    onError: (action, error) => {
      setErrorMessage(error);
    }
  });
  
  // Reset form state when dialog changes
  React.useEffect(() => {
    if (dialogState.isOpen) {
      setErrorMessage(null);
      
      if (dialogState.type === 'rename' && dialogState.item) {
        setInputValue(dialogState.item.name);
      } else {
        setInputValue('');
      }
    }
  }, [dialogState]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!inputValue.trim()) {
      setErrorMessage('Name cannot be empty');
      return;
    }
    
    try {
      switch (dialogState.type) {
        case 'create':
          await createFolder(inputValue.trim());
          break;
          
        case 'rename':
          if (dialogState.item) {
            await renameItem(dialogState.item, inputValue.trim());
          }
          break;
          
        case 'delete':
          if (dialogState.item) {
            await deleteItem(dialogState.item);
          }
          break;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  
  // Render appropriate dialog content based on type
  const renderDialogContent = () => {
    switch (dialogState.type) {
      case 'create':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for the new folder.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(sanitizeFilename(e.target.value))}
                placeholder="Folder name"
                autoFocus
              />
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? 'Creating...' : 'Create Folder'}
                </Button>
              </DialogFooter>
            </form>
          </>
        );
        
      case 'rename':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Rename Item</DialogTitle>
              <DialogDescription>
                Enter a new name for "{dialogState.item?.name}".
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(sanitizeFilename(e.target.value))}
                placeholder="New name"
                autoFocus
              />
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? 'Renaming...' : 'Rename'}
                </Button>
              </DialogFooter>
            </form>
          </>
        );
        
      case 'delete':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{dialogState.item?.name}"?
                {dialogState.item?.isDirectory && ' This will delete the folder and all its contents.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isLoading}>
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </form>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
} 