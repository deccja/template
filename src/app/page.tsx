import DirectoryBrowser from '@/components/features/DirectoryBrowser';
import Layout from '@/components/layout/Layout';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <Layout>
      <DirectoryBrowser onShowImage={(imageData) => {}} />
    </Layout>
  );
}
