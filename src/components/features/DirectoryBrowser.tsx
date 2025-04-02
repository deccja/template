'use client';

import React, { useState } from 'react';
import { DialogState } from '@/types';
import FileGrid from './FileGrid';
import BreadcrumbNav from './BreadcrumbNav';
import FileDialogs from './FileDialogs';

interface DirectoryBrowserProps {
  onShowImage: (imageData: { url: string; name: string }) => void;
}

export default function DirectoryBrowser({ onShowImage }: DirectoryBrowserProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null,
  });

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
          <BreadcrumbNav />
        </div>
        
        <div className="flex-1">
          <FileGrid onShowImage={onShowImage} />
        </div>
      </div>

      <FileDialogs
        dialogState={dialogState}
        onClose={handleCloseDialog}
      />
    </div>
  );
} 