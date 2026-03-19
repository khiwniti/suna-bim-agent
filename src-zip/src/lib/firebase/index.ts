/**
 * Firebase Module
 *
 * Complete Firebase integration for CarbonBIM.
 * Includes Auth, Firestore, Storage, and Analytics.
 */

// Core configuration
export {
  app,
  analytics,
  auth,
  db,
  storage,
  firebaseConfig,
  googleProvider,
  emailProvider,
} from './config';

// Authentication
export {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  resendVerificationEmail,
  getUserProfile,
  onAuthStateChange,
  getCurrentUser,
} from './auth';
export type { AuthResult, UserProfile } from './auth';

// Firestore Database
export {
  createProject,
  getProject,
  getUserProjects,
  updateProject,
  deleteProject,
  createAnalysis,
  getAnalysis,
  getProjectAnalyses,
  updateAnalysis,
  deleteAnalysis,
  getUserStats,
  decrementAnalysisCount,
} from './firestore';
export type { Project, CarbonAnalysis, AnalysisMaterial, PaginatedResult } from './firestore';

// Storage
export {
  uploadFile,
  uploadModel,
  uploadReport,
  uploadThumbnail,
  uploadAvatar,
  getFileUrl,
  deleteFile,
  deleteFolder,
  listFiles,
  listProjectModels,
  listProjectReports,
} from './storage';
export type { UploadProgress, UploadResult, FileMetadata } from './storage';

// React Hooks
export {
  useFirebaseAuth,
  useProjects,
  useProject,
  useUserStats,
  useFeatureAccess,
} from './hooks';
export type {
  AuthState,
  AuthActions,
  ProjectsState,
  ProjectState,
  StatsState,
} from './hooks';
