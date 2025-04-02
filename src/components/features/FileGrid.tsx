'use client';

import React, { useState } from 'react';
import { FileItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { FolderIcon, FileIcon, MoreVertical } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { ImageOverlay } from './ImageOverlay';
import path from 'path';

interface FileGridProps {
  items: FileItem[];
  currentPath: string;
  onItemClick?: (item: FileItem) => void;
  onItemMenuClick?: (item: FileItem, event: React.MouseEvent) => void;
}

export default function FileGrid({ 
  items,
  currentPath,
  onItemClick,
  onItemMenuClick
}: FileGridProps) {
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Group items by type (directories first, then files)
  // For recursive view, prioritize current directory items first
  const sortedItems = [...items].sort((a, b) => {
    // Get relative paths
    const aRelPath = a.path.replace(currentPath, '').replace(/^\//, '');
    const bRelPath = b.path.replace(currentPath, '').replace(/^\//, '');
    
    const aIsInCurrentDir = !aRelPath.includes('/');
    const bIsInCurrentDir = !bRelPath.includes('/');
    
    // First sort by current directory vs subdirectory
    if (aIsInCurrentDir && !bIsInCurrentDir) return -1;
    if (!aIsInCurrentDir && bIsInCurrentDir) return 1;
    
    // Then sort by directories vs files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    // Then sort by path depth for items in subdirectories
    if (!aIsInCurrentDir && !bIsInCurrentDir) {
      const aDepth = aRelPath.split('/').length;
      const bDepth = bRelPath.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
    }
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });

  const isImageType = (type?: string): boolean => {
    if (!type) return false;
    return type.startsWith('image/');
  };

  // Check if the file is an image
  const isImage = (item: FileItem) => 
    isImageType(item.type) || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(item.path);

  const handleItemClick = (item: FileItem) => {
    if (item.isDirectory) {
      onItemClick?.(item);
    } else if (isImage(item) && item.url) {
      // Open image in overlay if it's an image
      setSelectedItem(item);
      setIsOverlayOpen(true);
    } else {
      // For non-image files, use the original onItemClick handler
      onItemClick?.(item);
    }
  };
  
  // Get relative path from current directory for display purposes
  const getDisplayPath = (itemPath: string): string => {
    if (itemPath === currentPath) return '';
    
    // Remove current path prefix to get relative path
    const relativePath = itemPath.replace(currentPath, '').replace(/^\//, '');
    
    // If there's no slash, it's in the current directory
    if (!relativePath.includes('/')) return '';
    
    // Get the directory path (excluding the filename)
    return path.dirname(relativePath);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedItems.map((item) => {
          const displayPath = getDisplayPath(item.path);
          const isInSubfolder = displayPath !== '';
          
          return (
            <Card 
              key={item.path}
              className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${isInSubfolder ? 'border-blue-100' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-0 flex flex-col">
                <div className="h-36 flex items-center justify-center bg-gray-50 relative">
                  {item.isDirectory ? (
                    <FolderIcon className="h-24 w-24 text-blue-400" />
                  ) : isImage(item) && item.url ? (
                    <img 
                      src={item.url} 
                      alt={item.name}
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <FileIcon className="h-24 w-24 text-gray-400" />
                  )}
                </div>
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm truncate" title={item.name}>
                      {item.name}
                    </div>
                    
                    <button 
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-100 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemMenuClick?.(item, e);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {isInSubfolder && (
                    <div className="text-xs text-blue-500 mt-1 truncate" title={displayPath}>
                      in: {displayPath}
                    </div>
                  )}
                  
                  {!item.isDirectory && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatFileSize(item.size)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Image overlay */}
      {isOverlayOpen && selectedItem && selectedItem.url && (
        <ImageOverlay 
          src={selectedItem.url}
          alt={selectedItem.name}
          onClose={() => setIsOverlayOpen(false)}
        />
      )}
    </>
  );
} 