import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys | Carbon BIM',
  description: 'Manage your API keys for programmatic access to Carbon BIM',
  openGraph: {
    title: 'API Keys | Carbon BIM',
    description: 'Manage your API keys for programmatic access to Carbon BIM',
    type: 'website',
  },
};

export default async function APIKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
