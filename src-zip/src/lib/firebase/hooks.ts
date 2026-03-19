/**
 * Firebase React Hooks
 *
 * Custom hooks for authentication state and Firestore data.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  getUserProfile,
  UserProfile,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  AuthResult,
} from './auth';
import {
  getUserProjects,
  getProject,
  getProjectAnalyses,
  getUserStats,
  Project,
  CarbonAnalysis,
} from './firestore';

// ============================================
// Auth Hook
// ============================================

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

/**
 * Hook for authentication state and actions
 */
export function useFirebaseAuth(): [AuthState, AuthActions] {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setState({
          user,
          profile,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Define callbacks at the top level of the hook (not inside object literal)
  const handleSignInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await signInWithGoogle();
    if (!result.success) {
      setState((prev) => ({ ...prev, loading: false, error: result.error || null }));
    }
    return result;
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await signInWithEmail(email, password);
    if (!result.success) {
      setState((prev) => ({ ...prev, loading: false, error: result.error || null }));
    }
    return result;
  }, []);

  const handleSignUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await signUpWithEmail(email, password, displayName);
    if (!result.success) {
      setState((prev) => ({ ...prev, loading: false, error: result.error || null }));
    }
    return result;
  }, []);

  const handleSignOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const result = await signOut();
    return result;
  }, []);

  const actions: AuthActions = {
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
  };

  return [state, actions];
}

// ============================================
// Projects Hook
// ============================================

export interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

/**
 * Hook for user's projects
 */
export function useProjects(userId: string | null): [ProjectsState, () => Promise<void>] {
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    loading: false,
    error: null,
    hasMore: false,
  });

  const loadProjects = useCallback(async () => {
    if (!userId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getUserProjects(userId);
      setState({
        projects: result.data,
        loading: false,
        error: null,
        hasMore: result.hasMore,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load projects',
      }));
    }
  }, [userId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return [state, loadProjects];
}

// ============================================
// Single Project Hook
// ============================================

export interface ProjectState {
  project: Project | null;
  analyses: CarbonAnalysis[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for a single project with analyses
 */
export function useProject(projectId: string | null): [ProjectState, () => Promise<void>] {
  const [state, setState] = useState<ProjectState>({
    project: null,
    analyses: [],
    loading: false,
    error: null,
  });

  const loadProject = useCallback(async () => {
    if (!projectId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [project, analyses] = await Promise.all([
        getProject(projectId),
        getProjectAnalyses(projectId),
      ]);

      setState({
        project,
        analyses,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load project',
      }));
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return [state, loadProject];
}

// ============================================
// User Stats Hook
// ============================================

export interface StatsState {
  totalProjects: number;
  totalAnalyses: number;
  totalCarbon: number;
  loading: boolean;
}

/**
 * Hook for user statistics
 */
export function useUserStats(userId: string | null): StatsState {
  const [state, setState] = useState<StatsState>({
    totalProjects: 0,
    totalAnalyses: 0,
    totalCarbon: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState({
        totalProjects: 0,
        totalAnalyses: 0,
        totalCarbon: 0,
        loading: false,
      });
      return;
    }

    const loadStats = async () => {
      try {
        const stats = await getUserStats(userId);
        setState({
          ...stats,
          loading: false,
        });
      } catch (error) {
        console.error('[Hook] Error loading stats:', error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, [userId]);

  return state;
}

// ============================================
// Feature Flag Hook (using user profile)
// ============================================

/**
 * Check if user has access to a feature based on plan
 */
export function useFeatureAccess(feature: string): boolean {
  const [{ profile }] = useFirebaseAuth();

  if (!profile) return false;

  const featureMatrix: Record<string, string[]> = {
    free: ['calculator', 'basic_reports', 'material_browser'],
    pro: ['calculator', 'basic_reports', 'material_browser', 'pdf_export', 'excel_export', 'ai_recommendations'],
    enterprise: ['calculator', 'basic_reports', 'material_browser', 'pdf_export', 'excel_export', 'ai_recommendations', 'api_access', 'white_label', 'priority_support'],
  };

  const allowedFeatures = featureMatrix[profile.plan] || featureMatrix.free;
  return allowedFeatures.includes(feature);
}
