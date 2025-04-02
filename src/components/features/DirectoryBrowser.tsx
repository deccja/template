'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DirectoryContents, FileItem, DialogState } from '@/types';
import { FolderPlus, UploadCloud, ListFilter, FolderOpen, Loader2 } from 'lucide-react';
import FileGrid from './FileGrid';
import BreadcrumbNav from './BreadcrumbNav';
import FileDialogs from './FileDialogs';
import FileUpload from './FileUpload';
import { toast } from 'sonner';
import { ImageOverlay } from './ImageOverlay';

interface DirectoryBrowserProps {
  directoryContents: DirectoryContents;
}

export default function DirectoryBrowser({
  directoryContents
}: DirectoryBrowserProps) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null,
  });
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageItem, setSelectedImageItem] = useState<FileItem | null>(null);
  const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);

  // Check if the file is an image
  const isImage = (item: FileItem) => 
    (item.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(item.path)) &&
    !item.isDirectory;

  // Handle clicking on a file or folder
  const handleItemClick = (item: FileItem) => {
    if (item.isDirectory) {
      // Navigate to folder
      router.push(`/${item.path}`);
    } else if (isImage(item) && item.url) {
      // Open image in overlay
      setSelectedImageItem(item);
      setIsImageOverlayOpen(true);
    } else if (item.url) {
      // Open non-image files in new tab
      window.open(item.url, '_blank');
    }
  };

  // Handle item menu actions
  const handleItemMenuClick = (item: FileItem, event: React.MouseEvent) => {
    // Prevent the click from propagating to the card
    event.stopPropagation();
    
    // Show a simple menu for now
    const actions = [
      { 
        name: 'Rename', 
        action: () => setDialogState({ isOpen: true, type: 'rename', item }) 
      },
      { 
        name: 'Delete', 
        action: () => setDialogState({ isOpen: true, type: 'delete', item }) 
      },
      ...(item.url ? [{ 
        name: 'Download', 
        action: () => {
          const link = document.createElement('a');
          link.href = item.url as string;
          link.download = item.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`Downloading ${item.name}`);
        } 
      }] : []),
    ];
    
    // In a more complete implementation, we would show a proper context menu
    // For simplicity, we'll just prompt the user for now
    const actionIndex = actions.findIndex(a => a.name === prompt(`Select action for ${item.name}:${actions.map(a => `\n- ${a.name}`).join('')}`));
    
    if (actionIndex >= 0) {
      actions[actionIndex].action();
    }
  };

  // Close any open dialog
  const handleCloseDialog = () => {
    setDialogState({
      isOpen: false,
      type: null,
    });
  };

  // Toggle upload visibility
  const toggleUpload = () => {
    setShowUpload(prev => !prev);
  };

  const handleUploadComplete = () => {
    // Implementation for when a file upload is complete
  };

  const handleCreateFolder = () => {
    // Implementation for creating a new folder
  };

  const handleRename = () => {
    // Implementation for renaming a file or folder
  };

  const handleDelete = () => {
    // Implementation for deleting a file or folder
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-4">
          <BreadcrumbNav currentPath={directoryContents.path} />
          
          <div className="flex gap-2">
            <Button 
              onClick={toggleUpload}
              variant="outline"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {showUpload ? 'Hide Upload' : 'Upload Files'}
            </Button>
            <Button onClick={() => setDialogState({ isOpen: true, type: 'create' })}>
              <FolderPlus className="mr-2 h-4 w-4" /> New Folder
            </Button>
          </div>
        </div>
        
        {/* File Upload */}
        {showUpload && <FileUpload />}

        {directoryContents.items.length > 0 ? (
          <FileGrid 
            items={directoryContents.items}
            currentPath={directoryContents.path}
            onItemClick={handleItemClick}
            onItemMenuClick={handleItemMenuClick}
          />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-200 p-6">
            <FolderOpen className="mb-2 h-8 w-8 text-neutral-400" />
            <p className="text-center text-sm text-neutral-600">This folder is empty</p>
            <p className="text-center text-xs text-neutral-400">Upload files or create a new folder to get started</p>
          </div>
        )}
      </div>

      <FileDialogs
        dialogState={dialogState}
        onClose={handleCloseDialog}
      />

      {/* Image Overlay */}
      {isImageOverlayOpen && selectedImageItem && selectedImageItem.url && (
        <ImageOverlay
          src={selectedImageItem.url}
          alt={selectedImageItem.name}
          onClose={() => setIsImageOverlayOpen(false)}
        />
      )}
    </div>
  );
} 