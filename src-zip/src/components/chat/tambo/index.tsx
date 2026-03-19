export { TamboChatPanel } from './DynamicTamboChatPanel';
export { MessageList } from './MessageList';

import dynamic from 'next/dynamic';

export const ChatInput = dynamic(
  () => import('./ChatInput').then(mod => ({ default: mod.ChatInput })),
  { ssr: false, loading: () => <div className="p-4 border-t">Loading chat...</div> }
);
