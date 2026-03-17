'use client';

import { Suspense, lazy } from 'react';
import { BackgroundAALChecker } from '@/components/auth/background-aal-checker';
import { LandingPage } from '@/components/landing';
import { useRouter } from 'next/navigation';

// Lazy load components
const MobileAppInterstitial = lazy(() =>
  import('@/components/announcements/mobile-app-interstitial').then(mod => ({ default: mod.MobileAppInterstitial }))
);

const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

export default function Home() {
  const router = useRouter();

  const handleStartChat = (initialMessage: string) => {
    const trimmedMessage = initialMessage.trim();
    if (!trimmedMessage) return;

    localStorage.setItem(PENDING_PROMPT_KEY, trimmedMessage);
    router.push('/dashboard');
  };

  const handleUploadFloorPlan = () => {
    router.push('/dashboard');
  };

  return (
    <BackgroundAALChecker>
      <div className="min-h-dvh">
        <LandingPage
          onStartChat={handleStartChat}
          onUploadFloorPlan={handleUploadFloorPlan}
        />
        {/* Mobile app banner - shown on mobile devices for logged-in users */}
        <Suspense fallback={null}>
          <MobileAppInterstitial />
        </Suspense>
      </div>
    </BackgroundAALChecker>
  );
}
