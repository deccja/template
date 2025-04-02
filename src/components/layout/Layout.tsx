'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/layout/Header';
import FolderTree from '../features/FolderTree';
import { Menu, X } from 'lucide-react';
import { ImageOverlay } from '../features/ImageOverlay';

interface LayoutProps {
  children: React.ReactNode;
}

// Define a type for image data
interface ImageData {
  url: string;
  name: string;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayImage, setOverlayImage] = useState<ImageData | null>(null);
  
  // Listen for custom events from DirectoryBrowser
  useEffect(() => {
    const handleShowOverlay = (event: CustomEvent<ImageData>) => {
      console.log('Layout received showImageOverlay event:', event.detail);
      setOverlayImage(event.detail);
    };
    
    // Add event listener
    window.addEventListener('showImageOverlay', handleShowOverlay as EventListener);
    
    // Cleanup function
    return () => {
      window.removeEventListener('showImageOverlay', handleShowOverlay as EventListener);
    };
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Function to show the image overlay
  const showImageOverlay = (imageData: ImageData) => {
    console.log('Layout - showing image overlay:', imageData);
    setOverlayImage(imageData);
  };
  
  // Function to hide the image overlay
  const hideImageOverlay = () => {
    setOverlayImage(null);
  };
  
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar toggle */}
        <button 
          className="md:hidden absolute top-4 left-4 z-30 bg-white rounded-full p-2 shadow-md"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar with folder tree */}
        <div className={`
          w-64 border-r border-gray-200 bg-white z-20
          fixed top-0 bottom-0 pt-16 md:static md:pt-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <FolderTree onShowImage={showImageOverlay} />
        </div>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 md:ml-0 pt-16 md:pt-0">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global image overlay */}
      {overlayImage && (
        <ImageOverlay
          src={overlayImage.url}
          alt={overlayImage.name}
          onClose={hideImageOverlay}
        />
      )}
      
      <Toaster position="top-right" />
    </div>
  );
} 