'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFolderContext } from './FolderTree';
import { FolderIcon, FileIcon } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface FileGridProps {
  onShowImage: (imageData: { url: string; name: string }) => void;
}

export default function FileGrid({ onShowImage }: FileGridProps) {
  const router = useRouter();
  const { currentContents, isLoading, currentPath } = useFolderContext();

  // Check if the file is an image
  const isImage = (node: any) => 
    (node.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(node.path)) &&
    !node.isDirectory;

  // Handle item click
  const handleItemClick = (node: any) => {
    console.log('FileGrid - clicked on:', node);
    
    if (node.isDirectory) {
      router.push(`/${node.path}`);
    } else if (isImage(node) && node.url) {
      console.log('FileGrid - opening image in overlay:', node.url);
      onShowImage({
        url: node.url,
        name: node.name
      });
    } else if (node.url) {
      // Open non-image files in new tab
      window.open(node.url, '_blank');
    } else {
      // If no URL, just navigate to its directory
      const dirPath = node.path.split('/').slice(0, -1).join('/');
      router.push(`/${dirPath}`);
    }
  };

  // Sort items - directories first, then alphabetically
  const sortedItems = [...currentContents].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-md h-full overflow-auto">
      {isLoading ? (
        <div className="flex h-40 flex-col items-center justify-center">
          <span className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full"></span>
          <p className="mt-2 text-sm text-gray-500">Loading contents...</p>
        </div>
      ) : sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {sortedItems.map((item) => (
            <Card 
              key={item.path}
              className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-0 flex flex-col">
                <div className="h-36 flex items-center justify-center bg-gray-50 relative">
                  {item.isDirectory ? (
                    <FolderIcon className="h-24 w-24 text-blue-500" />
                  ) : isImage(item) && item.url ? (
                    <img 
                      src={item.url} 
                      alt={item.name}
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <FileIcon className="h-24 w-24 text-gray-500" />
                  )}
                </div>
                
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm truncate" title={item.name}>
                      {item.name}
                    </div>
                  </div>
                  
                  {!item.isDirectory && item.size !== undefined && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatFileSize(item.size)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center p-6">
          <p className="text-center text-sm text-neutral-600">This folder is empty</p>
        </div>
      )}
    </div>
  );
} 