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
  
  // Decode any URL-encoded components in the path
  const decodedPath = pathParams.path.map(segment => {
    try {
      return decodeURIComponent(segment);
    } catch (error) {
      console.error(`Error decoding path segment: ${segment}`, error);
      return segment;
    }
  });
  
  const pathString = decodedPath.join('/');
  console.log(`[PathPage] Path string after joining: "${pathString}"`);
  
  try {
    // Get directory contents for the requested path
    const directoryContents = await getDirectoryContents(pathString);
    
    // If the path doesn't exist or isn't a directory, show 404
    if (!directoryContents || directoryContents.items === undefined) {
      return notFound();
    }
    
    return (
      <Layout>
        <DirectoryBrowser directoryContents={directoryContents} />
      </Layout>
    );
  } catch (error) {
    console.error('Error fetching directory contents:', error);
    return notFound();
  }
} 