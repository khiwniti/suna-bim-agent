/**
 * useProjects Hook
 *
 * Manages projects data with caching
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

// API response format (snake_case from database)
interface ApiProject {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  location: string | null;
  building_type: string | null;
  total_area: number | null;
  floors: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Client format (camelCase for JavaScript convention)
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  location: string | null;
  buildingType: string | null;
  totalArea: number | null;
  floors: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Transform API response to client format
function transformProject(api: ApiProject): Project {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    status: api.status,
    location: api.location,
    buildingType: api.building_type,
    totalArea: api.total_area,
    floors: api.floors,
    userId: api.user_id,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

// Transform client format to API request
function transformToApi(data: Partial<Project>): Partial<ApiProject> {
  const result: Partial<ApiProject> = {};

  if (data.id !== undefined) result.id = data.id;
  if (data.name !== undefined) result.name = data.name;
  if (data.description !== undefined) result.description = data.description;
  if (data.status !== undefined) result.status = data.status;
  if (data.location !== undefined) result.location = data.location;
  if (data.buildingType !== undefined) result.building_type = data.buildingType;
  if (data.totalArea !== undefined) result.total_area = data.totalArea;
  if (data.floors !== undefined) result.floors = data.floors;

  return result;
}

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Promise<Project | null>;
  refreshProjects: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      const transformed = (data.projects || []).map(transformProject);
      setProjects(transformed);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (data: Partial<Project>): Promise<Project> => {
      const apiData = transformToApi(data);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { project } = await response.json();
      const transformed = transformProject(project);
      setProjects((prev) => [transformed, ...prev]);
      return transformed;
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Project>): Promise<Project> => {
      const apiData = transformToApi(data);

      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      const { project } = await response.json();
      const transformed = transformProject(project);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? transformed : p))
      );
      return transformed;
    },
    []
  );

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete project');
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProject = useCallback(
    async (id: string): Promise<Project | null> => {
      // First check if already in cached projects
      const cached = projects.find((p) => p.id === id);
      if (cached) return cached;

      // Fetch from API
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch project');
        }

        const { project } = await response.json();
        return transformProject(project);
      } catch (err) {
        console.error('Failed to fetch project:', err);
        return null;
      }
    },
    [projects]
  );

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    refreshProjects: fetchProjects,
  };
}
