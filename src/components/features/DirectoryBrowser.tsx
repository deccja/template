'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DirectoryContents, DialogState } from '@/types';
import { FolderOpen, Loader2 } from 'lucide-react';
import FileGrid from './FileGrid';
import BreadcrumbNav from './BreadcrumbNav';
import FileDialogs from './FileDialogs';
import { toast } from 'sonner';
import { getDirectoryContents } from '@/server/actions/file-actions';

interface DirectoryBrowserProps {
  directoryContents: DirectoryContents;
}

export default function DirectoryBrowser({
  directoryContents
}: DirectoryBrowserProps) {
  console.log('DirectoryBrowser rendered with:', {
    path: directoryContents.path,
    itemCount: directoryContents.items.length,
    folders: directoryContents.items.filter(item => item.isDirectory).length,
    files: directoryContents.items.filter(item => !item.isDirectory).length,
    items: directoryContents.items.map(item => `${item.name} (${item.isDirectory ? 'dir' : 'file'})`)
  });
  
  const pathname = usePathname();
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentDirContents, setCurrentDirContents] = useState<DirectoryContents>(directoryContents);

  // Handle showing an image in the overlay
  const handleShowImage = (imageData: { url: string; name: string }) => {
    // Create and dispatch a custom event to notify Layout
    const event = new CustomEvent('showImageOverlay', { 
      detail: { url: imageData.url, name: imageData.name }
    });
    window.dispatchEvent(event);
  };

  // Close any open dialog
  const handleCloseDialog = () => {
    setDialogState({
      isOpen: false,
      type: null,
    });
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <BreadcrumbNav currentPath={currentDirContents.path} />
        </div>
        
        <div className="flex-1">
          <FileGrid onShowImage={handleShowImage} />
        </div>
      </div>

      <FileDialogs
        dialogState={dialogState}
        onClose={handleCloseDialog}
      />
    </div>
  );
} 