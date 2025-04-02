'use client';

import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
} 