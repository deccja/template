import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

interface ImageOverlayProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageOverlay({ src, alt, onClose }: ImageOverlayProps) {
  // Handle escape key to close overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
      >
        <button 
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/70 p-1 text-gray-800 shadow-md hover:bg-white"
          aria-label="Close image"
        >
          <X size={24} />
        </button>
        
        <div className="max-h-[85vh] max-w-[85vw] overflow-auto">
          {/* Use regular img tag instead of Next.js Image for external sources */}
          <img 
            src={src} 
            alt={alt} 
            className="h-auto max-h-[85vh] w-auto max-w-[85vw] object-contain" 
          />
        </div>
      </div>
    </div>
  );
} 