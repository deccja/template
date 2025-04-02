'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getDirectoryContents } from '@/server/actions/file-actions';
import { FileItem } from '@/types';
import { FolderIcon, FileIcon } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface GridNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: GridNode[];
  url?: string;
  type?: string;
  size?: number;
}

interface FileGridProps {
  onShowImage: (imageData: { url: string; name: string }) => void;
}

export default function FileGrid({ onShowImage }: FileGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [rootNode, setRootNode] = useState<GridNode>({
    name: 'Root',
    path: '',
    isDirectory: true,
    children: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  // Load directory contents when the component mounts or pathname changes
  useEffect(() => {
    if (pathname) {
      const path = pathname === '/' ? '' : pathname.slice(1);
      setCurrentPath(path);
      loadDirectoryContents(path);
    }
  }, [pathname]);

  // Check if the file is an image
  const isImage = (node: GridNode) => 
    (node.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(node.path)) &&
    !node.isDirectory;

  // Load directory contents
  const loadDirectoryContents = async (path: string) => {
    setIsLoading(true);
    
    try {
      console.log(`[FileGrid] Loading contents for path: "${path}"`);
      const contents = await getDirectoryContents(path);
      
      const children = contents.items.map((item) => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        children: [],
        url: item.url,
        type: item.type,
        size: item.size
      }));

      setRootNode({
        name: path.split('/').pop() || 'Root',
        path: path,
        isDirectory: true,
        children: children,
      });
    } catch (error) {
      console.error(`Failed to load contents for ${path}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle item click
  const handleItemClick = (node: GridNode) => {
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
  const sortedItems = [...rootNode.children].sort((a, b) => {
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