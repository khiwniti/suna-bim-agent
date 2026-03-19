"use client";

/**
 * Full-Screen Chat Page with Split-Panel Workspace
 *
 * ChatGPT/Claude-like conversational interface with:
 * - Full-screen centered layout for unauthenticated users
 * - Split-panel workspace mode for authenticated users
 * - Resizable analysis panels (Carbon Dashboard, BOQ Table, 3D Viewer)
 * - Auto-activation of relevant panels based on tool calls
 * - Tambo Generative UI integration for AI-driven panel updates
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TamboChatPanel } from "@/components/chat/tambo";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { createClient } from "@/lib/supabase/client";

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check authentication status
    const checkAuth = async () => {
      try {
        // Check if auth is disabled (development mode)
        // When auth is disabled, treat as authenticated to show full workspace
        const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";
        if (authDisabled) {
          setIsAuthenticated(true); // Show full workspace in dev mode
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch {
        // Auth check failed, default to unauthenticated
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Prevent hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Authenticated users get the split-panel workspace with Tambo chat
  if (isAuthenticated) {
    return <WorkspaceLayout />;
  }

  // Unauthenticated users get the simple full-screen Tambo chat
  return (
    <div className="flex flex-col h-screen bg-background">
      <TamboChatPanel />
    </div>
  );
}
