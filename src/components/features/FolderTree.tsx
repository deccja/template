'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileIcon } from 'lucide-react';
import { DirectoryContents, FileItem } from '@/types';
import { getDirectoryContents } from '@/server/actions/file-actions';

type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  children: TreeNode[];
  url?: string;
};

export default function FolderTree() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname.replace(/^\//, ''); // Remove leading slash
  
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const expandedPathRef = useRef<string>('');
  
  // Initial load of root directory
  useEffect(() => {
    loadRootDirectory();
  }, []);
  
  // Expand to current path when navigating
  useEffect(() => {
    if (currentPath && currentPath !== expandedPathRef.current && tree.length > 0) {
      expandToPath(currentPath.split('/').filter(Boolean));
      expandedPathRef.current = currentPath;
    }
  }, [currentPath, tree.length]);
  
  // Load root directory contents
  const loadRootDirectory = async () => {
    setIsLoading(true);
    
    try {
      const contents = await getDirectoryContents('');
      
      // Convert directory contents to tree nodes
      const rootNodes = contents.items.map(item => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        isExpanded: false,
        isLoading: false,
        children: [],
        url: item.url
      }));
      
      setTree(rootNodes);
    } catch (error) {
      console.error('Failed to load root directory:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Expand tree to reach a specific path
  const expandToPath = async (pathSegments: string[]) => {
    if (pathSegments.length === 0) return;
    
    const newTree = [...tree];
    let currentLevel = newTree;
    let currentPath = '';
    
    for (const segment of pathSegments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      
      // Find matching node at current level
      const nodeIndex = currentLevel.findIndex(node => node.name === segment);
      
      // If we found the node and it's a directory
      if (nodeIndex >= 0 && currentLevel[nodeIndex].isDirectory) {
        // Mark it as expanded
        currentLevel[nodeIndex].isExpanded = true;
        
        // Load its children if not loaded yet
        if (currentLevel[nodeIndex].children.length === 0 && !currentLevel[nodeIndex].isLoading) {
          await loadChildren(currentLevel[nodeIndex]);
        }
        
        // Move to next level
        currentLevel = currentLevel[nodeIndex].children;
      } else {
        // Can't find node or it's not a directory, stop expanding
        break;
      }
    }
    
    setTree(newTree);
  };
  
  // Load children of a node
  const loadChildren = async (node: TreeNode) => {
    if (!node.isDirectory) return;
    
    node.isLoading = true;
    
    try {
      const contents = await getDirectoryContents(node.path);
      
      // Convert items to tree nodes
      node.children = contents.items.map(item => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        isExpanded: false,
        isLoading: false,
        children: [],
        url: item.url
      }));
    } catch (error) {
      console.error(`Failed to load contents for ${node.path}:`, error);
      node.children = [];
    } finally {
      node.isLoading = false;
    }
  };
  
  // Toggle expansion of a directory node
  const toggleNode = async (node: TreeNode) => {
    if (!node.isDirectory) return;
    
    const newTree = [...tree];
    
    // Find the node in the tree (this is a simplification - in production code,
    // you would need a more robust way to find nodes in a nested structure)
    const findAndToggleNode = (nodes: TreeNode[]): boolean => {
      for (const n of nodes) {
        if (n.path === node.path) {
          n.isExpanded = !n.isExpanded;
          
          // If expanding and children not loaded yet, load them
          if (n.isExpanded && n.children.length === 0 && !n.isLoading) {
            loadChildren(n).then(() => setTree([...newTree]));
          }
          
          return true;
        }
        
        if (n.isDirectory && n.children.length > 0) {
          if (findAndToggleNode(n.children)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    findAndToggleNode(newTree);
    setTree(newTree);
  };
  
  // Handle clicking on an item
  const handleItemClick = (node: TreeNode) => {
    if (node.isDirectory) {
      router.push(`/${node.path}`);
    } else if (node.url) {
      window.open(node.url, '_blank');
    }
  };
  
  // Render a tree node and its children
  const renderNode = (node: TreeNode) => {
    const isActive = currentPath === node.path;
    
    return (
      <div key={node.path} className="tree-node">
        <div 
          className={`flex items-center py-1.5 px-2 rounded hover:bg-gray-100 ${isActive ? 'bg-blue-50' : ''}`}
        >
          {node.isDirectory ? (
            <button
              className="mr-1 focus:outline-none"
              onClick={() => toggleNode(node)}
            >
              {node.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-5" /> {/* Spacer for files */}
          )}
          
          <div
            className="flex items-center cursor-pointer flex-1"
            onClick={() => handleItemClick(node)}
          >
            {node.isDirectory ? (
              isActive ? (
                <FolderOpen className="h-4 w-4 mr-2 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 mr-2 text-gray-600" />
              )
            ) : (
              <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
            )}
            
            <span className="truncate text-sm" title={node.name}>
              {node.name}
            </span>
          </div>
        </div>
        
        {node.isDirectory && node.isExpanded && (
          <div className="pl-4 ml-3 border-l border-gray-200">
            {node.children.map(childNode => renderNode(childNode))}
          </div>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="animate-pulse h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
      </div>
    );
  }
  
  return (
    <div className="folder-tree p-2 overflow-auto h-full">
      <h3 className="font-medium mb-4 text-gray-700">Files & Folders</h3>
      
      {tree.length > 0 ? (
        <div className="space-y-0.5">
          {tree.map(node => renderNode(node))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No items found</div>
      )}
    </div>
  );
} 