'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList, 
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';
import { PathSegment } from '@/types';
import { useFolderContext } from './FolderTree';

export default function BreadcrumbNav() {
  const { currentPath } = useFolderContext();
  const pathname = usePathname();
  
  // Create breadcrumb segments
  const getPathSegments = (path: string): PathSegment[] => {
    if (!path || path === '') {
      return [];
    }
    
    const segments = path.split('/');
    return segments.map((segment, index) => {
      const segmentPath = segments.slice(0, index + 1).join('/');
      return {
        name: segment,
        path: segmentPath,
      };
    });
  };
  
  const pathSegments = getPathSegments(currentPath);
  
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center">
              <Home size={16} className="mr-1" />
              <span>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => (
          <React.Fragment key={segment.path}>
            <BreadcrumbSeparator>
              <ChevronRight size={14} />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {index === pathSegments.length - 1 ? (
                <BreadcrumbPage>{segment.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={`/${segment.path}`}>
                    {segment.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 