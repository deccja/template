'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getDirectoryContents } from '@/server/actions/file-actions';
import { FileItem } from '@/types';
import { FolderIcon, FileIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageOverlay } from './ImageOverlay';

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  children: TreeNode[];
  url?: string;
  type?: string;
}

export default function FolderTree() {
  const router = useRouter();
  const pathname = usePathname();
  const [rootNode, setRootNode] = useState<TreeNode>({
    name: 'Root',
    path: '',
    isDirectory: true,
    isExpanded: true,
    isLoading: false,
    children: [],
  });
  const [selectedImageNode, setSelectedImageNode] = useState<TreeNode | null>(null);
  const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);

  // Load the root directory when the component mounts
  useEffect(() => {
    loadRootDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expand folders based on current path when pathname changes
  useEffect(() => {
    if (pathname) {
      const currentPath = pathname === '/' ? '' : pathname.slice(1);
      if (currentPath) {
        expandPathFolders(currentPath);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Check if the file is an image
  const isImage = (node: TreeNode) => 
    (node.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(node.path)) &&
    !node.isDirectory;

  // Load the root directory
  const loadRootDirectory = async () => {
    try {
      const contents = await getDirectoryContents('');
      const rootChildren = contents.items.map((item) => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        isExpanded: false,
        isLoading: false,
        children: [],
        url: item.url,
        type: item.type,
      }));

      setRootNode((prev) => ({
        ...prev,
        children: rootChildren,
      }));
    } catch (error) {
      console.error('Failed to load root directory:', error);
    }
  };

  // Expand all folders in a path
  const expandPathFolders = async (path: string) => {
    const pathParts = path.split('/');
    let currentPath = '';

    // Create a copy of the root node to modify
    const newRoot = { ...rootNode };
    
    // Traverse the path parts and expand each folder
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // Update the tree structure to expand this folder
      await expandFolderInTree(newRoot, currentPath);
    }
    
    setRootNode(newRoot);
  };

  // Helper to expand a folder in the tree structure
  const expandFolderInTree = async (node: TreeNode, targetPath: string): Promise<boolean> => {
    // If this is the target node, expand it and load its contents
    if (node.path === targetPath) {
      if (!node.isExpanded) {
        await loadFolderContents(node);
      }
      node.isExpanded = true;
      return true;
    }
    
    // If this node is not a directory or has no children, we can't expand further
    if (!node.isDirectory || !node.children.length) {
      return false;
    }
    
    // Try to find the target in children
    for (const child of node.children) {
      if (targetPath.startsWith(child.path)) {
        const found = await expandFolderInTree(child, targetPath);
        if (found) {
          node.isExpanded = true;
          return true;
        }
      }
    }
    
    return false;
  };

  // Toggle folder expansion
  const toggleFolder = async (node: TreeNode) => {
    // Create a copy of the root node
    const newRoot = { ...rootNode };
    
    // Find and toggle the node
    toggleNodeInTree(newRoot, node.path);
    
    // Update state
    setRootNode(newRoot);
  };

  // Helper to toggle a node in the tree structure
  const toggleNodeInTree = async (node: TreeNode, targetPath: string): Promise<boolean> => {
    // If this is the target node, toggle it
    if (node.path === targetPath) {
      node.isExpanded = !node.isExpanded;
      
      // Load contents if expanding and no children yet
      if (node.isExpanded && node.children.length === 0) {
        await loadFolderContents(node);
      }
      
      return true;
    }
    
    // If this node is not a directory or has no children, we can't expand further
    if (!node.isDirectory || !node.children.length) {
      return false;
    }
    
    // Try to find the target in children
    for (const child of node.children) {
      if (await toggleNodeInTree(child, targetPath)) {
        return true;
      }
    }
    
    return false;
  };

  // Load folder contents
  const loadFolderContents = async (node: TreeNode) => {
    if (!node.isDirectory) return;
    
    node.isLoading = true;
    
    try {
      // Update root node to reflect loading state
      setRootNode({ ...rootNode });
      
      // Fetch contents
      const contents = await getDirectoryContents(node.path);
      
      // Create child nodes for all items (both files and folders)
      const children = contents.items.map((item) => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        isExpanded: false,
        isLoading: false,
        children: [],
        url: item.url,
        type: item.type,
      }));
      
      // Update the node
      node.children = children;
      node.isLoading = false;
      
      // Update state
      setRootNode({ ...rootNode });
    } catch (error) {
      console.error(`Failed to load contents for ${node.path}:`, error);
      node.isLoading = false;
      setRootNode({ ...rootNode });
    }
  };

  // Handle file click
  const handleFileClick = (node: TreeNode) => {
    console.log('FolderTree - clicked on:', node);
    
    if (node.isDirectory) {
      router.push(`/${node.path}`);
    } else if (isImage(node) && node.url) {
      console.log('FolderTree - opening image in overlay:', node.url);
      // Open image in overlay
      setSelectedImageNode(node);
      setIsImageOverlayOpen(true);
      console.log('Set overlay state to true, selectedImageNode:', node);
    } else if (node.url) {
      // Open non-image files in new tab
      window.open(node.url, '_blank');
    } else {
      // If no URL, just navigate to its directory
      const dirPath = node.path.split('/').slice(0, -1).join('/');
      router.push(`/${dirPath}`);
    }
  };

  // Render the tree nodes recursively
  const renderTreeNodes = (nodes: TreeNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} className="tree-node">
        <div 
          className={cn(
            "flex items-center cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-md",
            pathname === `/${node.path}` && "bg-gray-100"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.isDirectory ? (
            <button 
              className="mr-1" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent onClick
                toggleFolder(node);
              }}
            >
              {node.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-4 mr-1"></span> 
          )}
          
          {node.isDirectory ? (
            <FolderIcon className="h-4 w-4 text-blue-500 mr-2" />
          ) : (
            <FileIcon className="h-4 w-4 text-gray-500 mr-2" />
          )}
          
          <span className="text-sm truncate">{node.name}</span>
          
          {node.isLoading && (
            <span className="ml-2">
              <span className="animate-spin h-3 w-3 border-t-2 border-blue-500 rounded-full inline-block"></span>
            </span>
          )}
        </div>
        
        {node.isDirectory && node.isExpanded && node.children.length > 0 && (
          <div className="pl-4">
            {renderTreeNodes(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <div className="bg-white rounded-md border p-2 h-full overflow-auto">
        <div className="font-semibold text-sm mb-2">Files</div>
        {renderTreeNodes([rootNode])}
      </div>
      
      {/* Image Overlay */}
      {isImageOverlayOpen && selectedImageNode && selectedImageNode.url && (
        <ImageOverlay
          src={selectedImageNode.url}
          alt={selectedImageNode.name}
          onClose={() => {
            console.log('Closing image overlay');
            setIsImageOverlayOpen(false);
          }}
        />
      )}
    </>
  );
} 