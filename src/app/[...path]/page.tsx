import DirectoryBrowser from '@/components/features/DirectoryBrowser';
import Layout from '@/components/layout/Layout';

export const dynamic = 'force-dynamic';

interface PathPageProps {
  params: {
    path: string[];
  };
}

export default async function PathPage({ params }: PathPageProps) {
  return (
    <Layout>
      <DirectoryBrowser onShowImage={(imageData) => {}} />
    </Layout>
  );
} 