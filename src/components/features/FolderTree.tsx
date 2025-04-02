'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { FileItem } from '@/types';
import { getDirectoryContents } from '@/server/actions/file-actions';

interface TreeNode {
  name: string;
  path: string;
  isExpanded: boolean;
  children: TreeNode[];
  isLoading: boolean;
}

export default function FolderTree() {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname.replace(/^\//, ''); // Remove leading slash
  
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const expandedRef = useRef<string>(''); // Track the last expanded path

  // Load root directory on initial load
  useEffect(() => {
    loadRootDirectory();
  }, []);

  // Expand folders in the path based on current location
  useEffect(() => {
    if (currentPath && tree.length > 0 && currentPath !== expandedRef.current) {
      const pathSegments = currentPath.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        expandPathToCurrentFolder(pathSegments);
        expandedRef.current = currentPath; // Mark this path as expanded
      }
    }
  }, [currentPath, tree.length]); // Only depend on tree.length, not the full tree

  // Load the root directory contents
  const loadRootDirectory = async () => {
    setIsLoading(true);
    try {
      const contents = await getDirectoryContents('');
      const rootFolders = contents.items
        .filter(item => item.isDirectory)
        .map(folder => ({
          name: folder.name,
          path: folder.path,
          isExpanded: false,
          children: [],
          isLoading: false
        }));
      
      setTree(rootFolders);
    } catch (error) {
      console.error('Failed to load root directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Recursively expand folders to reach the current path
  const expandPathToCurrentFolder = async (pathSegments: string[]) => {
    let currentLevel = tree;
    let currentPathSoFar = '';
    
    // Create a copy of the tree to modify
    const newTree = [...tree];
    
    for (const segment of pathSegments) {
      currentPathSoFar = currentPathSoFar ? `${currentPathSoFar}/${segment}` : segment;
      
      // Find the node at this level that matches the segment
      const nodeIndex = currentLevel.findIndex(node => node.name === segment);
      
      if (nodeIndex >= 0) {
        // Mark this node as expanded
        currentLevel[nodeIndex].isExpanded = true;
        
        // If children haven't been loaded yet, load them
        if (currentLevel[nodeIndex].children.length === 0 && !currentLevel[nodeIndex].isLoading) {
          await loadFolderContents(currentLevel[nodeIndex], newTree);
        }
        
        // Continue to next level
        currentLevel = currentLevel[nodeIndex].children;
      } else {
        break; // Path segment not found in the tree
      }
    }
    
    setTree(newTree);
  };

  // Toggle folder expansion
  const toggleFolder = async (node: TreeNode, nodePath: TreeNode[]) => {
    const newTree = [...tree];
    
    // Find the node by path and toggle its expanded state
    let currentLevel = newTree;
    for (const pathNode of nodePath) {
      const nodeIndex = currentLevel.findIndex(n => n.path === pathNode.path);
      if (nodeIndex >= 0) {
        currentLevel = currentLevel[nodeIndex].children;
      } else {
        return; // Node not found
      }
    }
    
    const nodeIndex = currentLevel.findIndex(n => n.path === node.path);
    if (nodeIndex >= 0) {
      const isExpanded = !currentLevel[nodeIndex].isExpanded;
      currentLevel[nodeIndex].isExpanded = isExpanded;
      
      // If expanding and no children loaded yet, load them
      if (isExpanded && currentLevel[nodeIndex].children.length === 0 && !currentLevel[nodeIndex].isLoading) {
        await loadFolderContents(currentLevel[nodeIndex], newTree);
      }
      
      setTree(newTree);
    }
  };

  // Load folder contents and update tree
  const loadFolderContents = async (node: TreeNode, treeState: TreeNode[]) => {
    // Mark as loading
    node.isLoading = true;
    
    try {
      const contents = await getDirectoryContents(node.path);
      const folders = contents.items
        .filter(item => item.isDirectory)
        .map(folder => ({
          name: folder.name,
          path: folder.path,
          isExpanded: false,
          children: [],
          isLoading: false
        }));
      
      node.children = folders;
    } catch (error) {
      console.error(`Failed to load contents for ${node.path}:`, error);
    } finally {
      node.isLoading = false;
    }
    
    return treeState;
  };

  // Handle folder click
  const handleFolderClick = (node: TreeNode) => {
    router.push(`/${node.path}`);
  };

  // Recursive function to render tree nodes
  const renderTreeNodes = (nodes: TreeNode[], path: TreeNode[] = []) => {
    return nodes.map(node => {
      const isActive = currentPath === node.path;
      const nodePath = [...path];
      
      return (
        <div key={node.path} className="folder-tree-node">
          <div 
            className={`flex items-center py-1.5 px-2 rounded hover:bg-gray-100 ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
          >
            <button 
              onClick={() => toggleFolder(node, nodePath)}
              className="mr-1 focus:outline-none"
            >
              {node.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            <div 
              className="flex items-center cursor-pointer flex-1"
              onClick={() => handleFolderClick(node)}
            >
              {isActive ? (
                <FolderOpen className="h-4 w-4 mr-2 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 mr-2 text-gray-600" />
              )}
              <span className="truncate text-sm" title={node.name}>
                {node.name}
              </span>
            </div>
          </div>
          
          {node.isExpanded && (
            <div className="pl-4 border-l border-gray-200 ml-3">
              {renderTreeNodes(node.children, [...nodePath, node])}
            </div>
          )}
        </div>
      );
    });
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
      <h3 className="font-medium mb-4 text-gray-700">Folders</h3>
      {tree.length > 0 ? (
        renderTreeNodes(tree)
      ) : (
        <div className="text-sm text-gray-500">No folders found</div>
      )}
    </div>
  );
} 