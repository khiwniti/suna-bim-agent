/**
 * Firestore Database Service
 *
 * Scalable NoSQL database structure for CarbonBIM.
 * Includes collections for users, projects, analyses, and materials.
 *
 * ★ Insight ─────────────────────────────────────
 * Collection Structure:
 * - users/{uid} - User profiles and settings
 * - projects/{projectId} - Building projects
 * - projects/{projectId}/analyses/{analysisId} - Carbon analyses
 * - materials/{materialId} - Custom user materials
 * ─────────────────────────────────────────────────
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// Types
// ============================================

export interface Project {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  buildingType: string;
  floorArea: number;
  location?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
  modelUrl?: string;
  tags?: string[];
}

export interface CarbonAnalysis {
  id?: string;
  projectId: string;
  userId: string;
  name: string;
  totalCarbon: number;
  carbonIntensity: number;
  reportType: 'CFO' | 'CFP' | 'TREES';
  materials: AnalysisMaterial[];
  createdAt: Date;
  updatedAt: Date;
  reportUrl?: string;
  status: 'draft' | 'completed';
  notes?: string;
}

export interface AnalysisMaterial {
  materialId: string;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  emissionFactor: number;
  totalEmissions: number;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// ============================================
// Helper Functions
// ============================================

function convertTimestamps<T extends Record<string, unknown>>(data: T): T {
  const converted = { ...data };
  for (const key in converted) {
    const value = converted[key];
    if (value instanceof Timestamp) {
      (converted as Record<string, unknown>)[key] = value.toDate();
    }
  }
  return converted;
}

// ============================================
// Projects Collection
// ============================================

const projectsCollection = collection(db, 'projects');

/**
 * Create a new project
 */
export async function createProject(
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(projectsCollection, {
    ...project,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('[Firestore] Project created:', docRef.id);
  return docRef.id;
}

/**
 * Get a project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const docRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data() as Omit<Project, 'id'>),
    };
  }
  return null;
}

/**
 * Get all projects for a user (paginated)
 */
export async function getUserProjects(
  userId: string,
  pageSize: number = 20,
  lastDocSnapshot?: DocumentSnapshot
): Promise<PaginatedResult<Project>> {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(pageSize + 1), // Fetch one extra to check if there's more
  ];

  if (lastDocSnapshot) {
    constraints.push(startAfter(lastDocSnapshot));
  }

  const q = query(projectsCollection, ...constraints);
  const querySnapshot = await getDocs(q);

  const projects: Project[] = [];
  let lastDoc: DocumentSnapshot | null = null;

  querySnapshot.docs.slice(0, pageSize).forEach((doc) => {
    projects.push({
      id: doc.id,
      ...convertTimestamps(doc.data() as Omit<Project, 'id'>),
    });
    lastDoc = doc;
  });

  return {
    data: projects,
    lastDoc,
    hasMore: querySnapshot.docs.length > pageSize,
  };
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  console.log('[Firestore] Project updated:', projectId);
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await deleteDoc(docRef);

  console.log('[Firestore] Project deleted:', projectId);
}

// ============================================
// Analyses Subcollection
// ============================================

/**
 * Create a new analysis for a project
 */
export async function createAnalysis(
  projectId: string,
  analysis: Omit<CarbonAnalysis, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const analysesCollection = collection(db, 'projects', projectId, 'analyses');
  const docRef = await addDoc(analysesCollection, {
    ...analysis,
    projectId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('[Firestore] Analysis created:', docRef.id);
  return docRef.id;
}

/**
 * Get an analysis by ID
 */
export async function getAnalysis(
  projectId: string,
  analysisId: string
): Promise<CarbonAnalysis | null> {
  const docRef = doc(db, 'projects', projectId, 'analyses', analysisId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data() as Omit<CarbonAnalysis, 'id'>),
    };
  }
  return null;
}

/**
 * Get all analyses for a project
 */
export async function getProjectAnalyses(
  projectId: string
): Promise<CarbonAnalysis[]> {
  const analysesCollection = collection(db, 'projects', projectId, 'analyses');
  const q = query(analysesCollection, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<CarbonAnalysis, 'id'>),
  }));
}

/**
 * Update an analysis
 */
export async function updateAnalysis(
  projectId: string,
  analysisId: string,
  updates: Partial<Omit<CarbonAnalysis, 'id' | 'projectId' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'analyses', analysisId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  console.log('[Firestore] Analysis updated:', analysisId);
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(
  projectId: string,
  analysisId: string
): Promise<void> {
  const docRef = doc(db, 'projects', projectId, 'analyses', analysisId);
  await deleteDoc(docRef);

  console.log('[Firestore] Analysis deleted:', analysisId);
}

// ============================================
// User Stats
// ============================================

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalProjects: number;
  totalAnalyses: number;
  totalCarbon: number;
}> {
  const projectsQuery = query(
    projectsCollection,
    where('userId', '==', userId)
  );
  const projectsSnapshot = await getDocs(projectsQuery);

  let totalAnalyses = 0;
  let totalCarbon = 0;

  // Get analyses count and total carbon for each project
  for (const projectDoc of projectsSnapshot.docs) {
    const analysesCollection = collection(db, 'projects', projectDoc.id, 'analyses');
    const analysesSnapshot = await getDocs(analysesCollection);

    totalAnalyses += analysesSnapshot.size;

    analysesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalCarbon += data.totalCarbon || 0;
    });
  }

  return {
    totalProjects: projectsSnapshot.size,
    totalAnalyses,
    totalCarbon,
  };
}

// ============================================
// Decrement User Analysis Count
// ============================================

/**
 * Decrement user's remaining analyses count
 */
export async function decrementAnalysisCount(userId: string): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return false;
  }

  const data = userSnap.data();
  const remaining = data.analysesRemaining || 0;

  if (remaining <= 0) {
    return false;
  }

  await updateDoc(userRef, {
    analysesRemaining: remaining - 1,
  });

  return true;
}

// ============================================
// Export
// ============================================

export { db };

export default {
  // Projects
  createProject,
  getProject,
  getUserProjects,
  updateProject,
  deleteProject,
  // Analyses
  createAnalysis,
  getAnalysis,
  getProjectAnalyses,
  updateAnalysis,
  deleteAnalysis,
  // Stats
  getUserStats,
  decrementAnalysisCount,
};
