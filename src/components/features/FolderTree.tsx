'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getDirectoryContents } from '@/server/actions/file-actions';
import { FileItem } from '@/types';
import { FolderIcon, FileIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define TreeNode interface
interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  children: TreeNode[];
  url?: string;
  type?: string;
  size?: number;
}

// Create a context for folder navigation
interface FolderContextType {
  currentPath: string;
  currentContents: TreeNode[];
  isLoading: boolean;
  navigateToFolder: (path: string) => void;
}

export const FolderContext = createContext<FolderContextType>({
  currentPath: '',
  currentContents: [],
  isLoading: false,
  navigateToFolder: () => {},
});

// Hook to use folder context
export const useFolderContext = () => useContext(FolderContext);

interface FolderTreeProps {
  onShowImage: (imageData: { url: string; name: string }) => void;
}

export default function FolderTree({ onShowImage }: FolderTreeProps) {
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
  const [currentContents, setCurrentContents] = useState<TreeNode[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load the root directory when the component mounts
  useEffect(() => {
    loadRootDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expand folders based on current path when pathname changes
  useEffect(() => {
    if (pathname) {
      const path = pathname === '/' ? '' : pathname.slice(1);
      setCurrentPath(path);
      
      if (path) {
        expandPathFolders(path);
      } else {
        // If at root, set current contents to root children
        setCurrentContents(rootNode.children);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Update current contents whenever rootNode changes
  useEffect(() => {
    updateCurrentContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootNode, currentPath]);

  // Function to update current contents based on the current path
  const updateCurrentContents = () => {
    const pathParts = currentPath.split('/').filter(part => part);
    
    if (pathParts.length === 0) {
      // At root level
      setCurrentContents(rootNode.children);
      return;
    }
    
    // Find the current node based on the path
    let currentNode = rootNode;
    let found = true;
    
    for (const part of pathParts) {
      const nextNode = currentNode.children.find(child => 
        child.name === part && child.isDirectory
      );
      
      if (nextNode) {
        currentNode = nextNode;
      } else {
        found = false;
        break;
      }
    }
    
    if (found) {
      setCurrentContents(currentNode.children);
    }
  };

  // Check if the file is an image
  const isImage = (node: TreeNode) => 
    (node.type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|heic|heif)$/i.test(node.path)) &&
    !node.isDirectory;

  // Load the root directory
  const loadRootDirectory = async () => {
    setIsLoading(true);
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
        size: item.size,
      }));

      setRootNode((prev) => ({
        ...prev,
        children: rootChildren,
      }));
      
      // If we're at the root path, update current contents
      if (currentPath === '') {
        setCurrentContents(rootChildren);
      }
    } catch (error) {
      console.error('Failed to load root directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Expand all folders in a path
  const expandPathFolders = async (path: string) => {
    setIsLoading(true);
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
    setIsLoading(false);
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
    setIsLoading(true);
    // Create a copy of the root node
    const newRoot = { ...rootNode };
    
    // Find and toggle the node
    toggleNodeInTree(newRoot, node.path);
    
    // Update state
    setRootNode(newRoot);
    setIsLoading(false);

    // If we're toggling to expand and this folder has the same path as currentPath
    // then update the router to navigate to this folder
    if (node.isExpanded === false && node.path === currentPath) {
      router.push(`/${node.path}`);
    }
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
        size: item.size,
      }));
      
      // Update the node
      node.children = children;
      node.isLoading = false;
      
      // Update state
      setRootNode({ ...rootNode });
      
      // If this is the current path, update current contents
      if (node.path === currentPath) {
        setCurrentContents(children);
      }
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
      // Use the layout's image overlay
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

  // Function for navigating to a folder (to be shared via context)
  const navigateToFolder = (path: string) => {
    router.push(`/${path}`);
  };

  // Folder context value
  const folderContextValue: FolderContextType = {
    currentPath,
    currentContents,
    isLoading,
    navigateToFolder,
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
    <FolderContext.Provider value={folderContextValue}>
      <div className="bg-white rounded-md border p-2 h-full overflow-auto">
        <div className="font-semibold text-sm mb-2">Files</div>
        {renderTreeNodes([rootNode])}
      </div>
    </FolderContext.Provider>
  );
} 