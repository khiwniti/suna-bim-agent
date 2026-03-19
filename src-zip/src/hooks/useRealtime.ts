/**
 * useRealtime Hook
 *
 * Provides real-time subscriptions using Supabase Realtime
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeOptions<T extends Record<string, unknown>> {
  table: string;
  schema?: string;
  event?: ChangeType | '*';
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: { old: T; new: T }) => void;
  onDelete?: (payload: T) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
  enabled?: boolean;
}

/**
 * Subscribe to real-time changes on a Supabase table
 */
export function useRealtime<T extends Record<string, unknown>>(
  options: RealtimeOptions<T>
) {
  const {
    table,
    schema = 'public',
    event = '*',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
    enabled = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClient();

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      onChange?.(payload);

      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload.new as T);
          break;
        case 'UPDATE':
          onUpdate?.({ old: payload.old as T, new: payload.new as T });
          break;
        case 'DELETE':
          onDelete?.(payload.old as T);
          break;
      }
    },
    [onChange, onInsert, onUpdate, onDelete]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Create channel
    const channelName = `${schema}:${table}${filter ? `:${filter}` : ''}`;
    const channel = supabase.channel(channelName);

    // Subscribe to changes
    channel.on(
      'postgres_changes' as 'system',
      {
        event,
        schema,
        table,
        filter,
      } as unknown as { event: string },
      handleChange as unknown as (payload: unknown) => void
    );

    // Subscribe
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime: subscribed to ${channelName}`);
        setIsSubscribed(true);
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [supabase, table, schema, event, filter, enabled, handleChange]);

  return {
    isSubscribed,
  };
}

/**
 * usePresence Hook
 *
 * Track presence of users in a channel (e.g., who's viewing a project)
 */
interface PresencePayload {
  id?: string;
  name?: string;
  email?: string;
  online_at?: string;
  [key: string]: unknown;
}

interface UsePresenceOptions {
  channelName: string;
  userId: string;
  userData?: Record<string, unknown>;
  onSync?: (state: Record<string, PresencePayload[]>) => void;
  onJoin?: (key: string, currentPresences: PresencePayload[], newPresences: PresencePayload[]) => void;
  onLeave?: (key: string, currentPresences: PresencePayload[], leftPresences: PresencePayload[]) => void;
  enabled?: boolean;
}

export function usePresence(options: UsePresenceOptions) {
  const {
    channelName,
    userId,
    userData = {},
    onSync,
    onJoin,
    onLeave,
    enabled = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const channel = supabase.channel(channelName);

    // Set up presence handlers
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresencePayload>();
        onSync?.(state);
      })
      .on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
        onJoin?.(key, currentPresences, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
        onLeave?.(key, currentPresences, leftPresences);
      });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsSubscribed(true);
        await channel.track({
          id: userId,
          online_at: new Date().toISOString(),
          ...userData,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [supabase, channelName, userId, userData, onSync, onJoin, onLeave, enabled]);

  return {
    isSubscribed,
  };
}

/**
 * useBroadcast Hook
 *
 * Send and receive broadcast messages (e.g., cursor positions, viewport state)
 */
interface UseBroadcastOptions<T> {
  channelName: string;
  event: string;
  onMessage?: (payload: T) => void;
  enabled?: boolean;
}

export function useBroadcast<T>(options: UseBroadcastOptions<T>) {
  const { channelName, event, onMessage, enabled = true } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase.channel(channelName);

    channel.on('broadcast', { event }, (payload) => {
      onMessage?.(payload.payload as T);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsSubscribed(true);
      }
    });
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [supabase, channelName, event, onMessage, enabled]);

  const send = useCallback(
    (payload: T) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload,
        });
      }
    },
    [event]
  );

  return {
    send,
    isSubscribed,
  };
}
