'use client';

import DirectoryBrowser from '@/components/features/DirectoryBrowser';
import Layout from '@/components/layout/Layout';

export const dynamic = 'force-dynamic';

export default function Home() {
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
