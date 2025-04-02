'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DirectoryContents, FileItem, DialogState } from '@/types';
import { FolderPlus, UploadCloud, ListFilter, FolderOpen, Loader2 } from 'lucide-react';
import FileGrid from './FileGrid';
import BreadcrumbNav from './BreadcrumbNav';
import FileDialogs from './FileDialogs';
import FileUpload from './FileUpload';
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
  
  const router = useRouter();
  const pathname = usePathname();
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
  const [items, setItems] = useState<FileItem[]>([]);
  const [currentDirContents, setCurrentDirContents] = useState<DirectoryContents>(directoryContents);
  
  // Fetch directory contents when pathname changes during client-side navigation
  useEffect(() => {
    const fetchDirectoryContents = async () => {
      setIsLoading(true);
      try {
        // Convert pathname to directory path (remove leading slash)
        const dirPath = pathname === '/' ? '' : pathname.slice(1);
        
        console.log(`Fetching contents for directory from pathname: "${pathname}" -> path: "${dirPath}"`);
        
        // Get the contents for this directory
        const contents = await getDirectoryContents(dirPath);
        console.log(`Fetched ${contents.items.length} items for "${dirPath}"`);
        setCurrentDirContents(contents);
      } catch (error) {
        console.error('Error fetching directory contents:', error);
        toast.error('Failed to load directory contents');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch contents when pathname changes (client-side navigation)
    fetchDirectoryContents();
  }, [pathname]); // Only depend on pathname changes
  
  // Update items when directoryContents or currentDirContents changes
  useEffect(() => {
    const contentsToUse = currentDirContents || directoryContents;
    console.log(`Setting items from ${contentsToUse === directoryContents ? 'server props' : 'client fetch'}:`, 
      contentsToUse.path, contentsToUse.items.length);
    setItems(contentsToUse.items);
  }, [directoryContents, currentDirContents]);

  // Check if the file is an image
  const isImage = (item: FileItem) => 
    (item.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(item.path)) &&
    !item.isDirectory;

  // Handle clicking on a file or folder
  const handleItemClick = (item: FileItem) => {
    console.log('Item clicked:', item);
    if (item.isDirectory) {
      // Navigate to folder
      console.log('Navigating to folder:', item.path);
      router.push(`/${item.path}`);
    } else if (isImage(item) && item.url) {
      // Open image in overlay via global state (handled in Layout via _app.tsx)
      console.log('Opening image in overlay:', item.url);
      
      // Create and dispatch a custom event to notify Layout
      const event = new CustomEvent('showImageOverlay', { 
        detail: { url: item.url, name: item.name }
      });
      window.dispatchEvent(event);
    } else if (item.url) {
      // Open non-image files in new tab
      console.log('Opening file in new tab:', item.url);
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
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold mb-1">
              {currentDirContents.path ? currentDirContents.path.split('/').pop() : 'Root Directory'}
            </h1>
            <BreadcrumbNav currentPath={currentDirContents.path} />
            <div className="text-xs text-gray-500 mt-1">
              Folders: {items.filter(item => item.isDirectory).length} | 
              Files: {items.filter(item => !item.isDirectory).length}
              {items.length === 0 && (<span className="ml-2 text-red-500">No items found in this folder!</span>)}
            </div>
          </div>
          
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

        {isLoading ? (
          <div className="flex h-40 flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm text-gray-500">Loading contents...</p>
          </div>
        ) : items.length > 0 ? (
          <FileGrid 
            items={items}
            currentPath={currentDirContents.path}
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
    </div>
  );
} 