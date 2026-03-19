'use client';

/**
 * DynamicTamboChatPanel
 * 
 * Dynamic import wrapper for TamboChatPanel to prevent SSR issues.
 * The @tambo-ai/react package uses browser-only APIs (Worker) that
 * cause errors during server-side rendering.
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import with SSR disabled
const TamboChatPanel = dynamic(
  () => import('./ChatPanel').then(mod => ({ default: mod.TamboChatPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export { TamboChatPanel };
