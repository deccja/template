'use client';

import DirectoryBrowser from '@/components/features/DirectoryBrowser';
import Layout from '@/components/layout/Layout';

export const dynamic = 'force-dynamic';

interface PathPageProps {
  params: {
    path: string[];
  };
}

export default function PathPage({ params }: PathPageProps) {
  const handleShowImage = (imageData: { url: string; name: string }) => {
    // Event handling can be done here if needed
    // Currently handled by the Layout component via context
  };

  return (
    <Layout>
      <DirectoryBrowser onShowImage={handleShowImage} />
    </Layout>
  );
} 