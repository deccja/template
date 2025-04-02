import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getFileContent } from '@/server/actions/file-actions';
import { normalizePath } from '@/server/services/filesystem';

interface RouteParams {
  path: string[];
}

/**
 * API route handler for serving image files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
): Promise<Response> {
  try {
    // In Next.js 15, params should be awaited before accessing its properties
    const pathParams = await params;
    
    // Get the file path from the URL parameters
    const filePath = pathParams.path.join('/');
    
    // Normalize the path to prevent path traversal attacks
    try {
      const normalizedPath = normalizePath(filePath);
      
      // Get the file content as Buffer
      const fileBuffer = await getFileContent(normalizedPath);
      
      // Get file extension
      const fileExt = path.extname(normalizedPath).toLowerCase();
      
      // Set content type based on file extension
      let contentType = 'application/octet-stream';
      switch (fileExt) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.bmp':
          contentType = 'image/bmp';
          break;
        case '.tiff':
        case '.tif':
          contentType = 'image/tiff';
          break;
        // Handle other image types as needed
      }
      
      // Set appropriate cache controls
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', `inline; filename="${path.basename(normalizedPath)}"`);
      headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error('Path normalization or file read error:', error);
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('File API error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
} 