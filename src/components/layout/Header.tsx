'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-semibold text-neutral-900">
            Image Manager
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-sm font-medium"
          >
            {pathname === '/' ? 'Home' : 'File Browser'}
          </Button>
        </div>
      </div>
    </header>
  );
} 