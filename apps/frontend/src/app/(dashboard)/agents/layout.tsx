import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Worker Conversation | Carbon BIM',
  description: 'Interactive Worker conversation powered by Carbon BIM',
  openGraph: {
    title: 'Worker Conversation | Carbon BIM',
    description: 'Interactive Worker conversation powered by Carbon BIM',
    type: 'website',
  },
};

export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
