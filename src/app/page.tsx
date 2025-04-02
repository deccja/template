import { getDirectoryContents } from '@/server/actions/file-actions';
import DirectoryBrowser from '@/components/features/DirectoryBrowser';
import Layout from '@/components/layout/Layout';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Get the contents of the root directory
  const directoryContents = await getDirectoryContents('');

  return (
    <Layout>
      <DirectoryBrowser directoryContents={directoryContents} />
    </Layout>
  );
}
