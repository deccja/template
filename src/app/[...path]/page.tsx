import { getDirectoryContents } from '@/server/actions/file-actions';
import DirectoryBrowser from '@/components/features/DirectoryBrowser';
import Layout from '@/components/layout/Layout';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PathPageProps {
  params: {
    path: string[];
  };
}

export default async function PathPage({ params }: PathPageProps) {
  // Ensure params is awaited before accessing properties
  const pathParams = await Promise.resolve(params);
  
  // Join path segments directly. Decoding and normalization will happen server-side.
  const pathString = pathParams.path.join('/');
  console.log(`[PathPage] Raw path string from params: "${pathString}"`);
  
  try {
    // Get directory contents for the requested path
    const directoryContents = await getDirectoryContents(pathString);
    
    // If the path doesn't exist or isn't a directory, show 404
    if (!directoryContents || directoryContents.items === undefined) {
      console.warn(`[PathPage] Directory contents not found or invalid for path: "${pathString}"`);
      return notFound();
    }
    
    console.log(`[PathPage] Successfully fetched contents for path: "${directoryContents.path}"`);
    return (
      <Layout>
        <DirectoryBrowser directoryContents={directoryContents} />
      </Layout>
    );
  } catch (error) {
    console.error(`[PathPage] Error fetching directory contents for path: "${pathString}"`, error);
    return notFound();
  }
} 