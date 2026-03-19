/**
 * Analytics Hooks
 *
 * Convenient React hooks for tracking analytics events
 * throughout the application.
 */

'use client';

import { useCallback } from 'react';
import { trackEvent, AnalyticsEvent, usePostHog } from './posthog';

/**
 * Hook for tracking calculator events
 */
export function useCalculatorAnalytics() {
  const posthog = usePostHog();

  const trackCalculatorStarted = useCallback((buildingType?: string) => {
    trackEvent('calculator_started', {
      building_type: buildingType,
      source: 'calculator_page',
    });
  }, []);

  const trackCalculatorCompleted = useCallback((data: {
    totalCarbon: number;
    carbonIntensity: number;
    materialCount: number;
    buildingType: string;
    floorArea: number;
  }) => {
    trackEvent('calculator_completed', {
      total_carbon_kg: data.totalCarbon,
      carbon_intensity: data.carbonIntensity,
      material_count: data.materialCount,
      building_type: data.buildingType,
      floor_area_sqm: data.floorArea,
    });
  }, []);

  const trackMaterialAdded = useCallback((materialName: string, category: string) => {
    trackEvent('material_added', {
      material_name: materialName,
      category,
    });
  }, []);

  const trackMaterialRemoved = useCallback((materialName: string) => {
    trackEvent('material_removed', {
      material_name: materialName,
    });
  }, []);

  const trackBuildingTypeSelected = useCallback((buildingType: string) => {
    trackEvent('building_type_selected', {
      building_type: buildingType,
    });
  }, []);

  return {
    trackCalculatorStarted,
    trackCalculatorCompleted,
    trackMaterialAdded,
    trackMaterialRemoved,
    trackBuildingTypeSelected,
  };
}

/**
 * Hook for tracking report events
 */
export function useReportAnalytics() {
  const trackReportGenerated = useCallback((data: {
    reportType: 'CFO' | 'CFP' | 'TREES';
    totalCarbon: number;
    projectName?: string;
  }) => {
    trackEvent('report_generated', {
      report_type: data.reportType,
      total_carbon_kg: data.totalCarbon,
      project_name: data.projectName,
    });
  }, []);

  const trackReportExportedPDF = useCallback((reportType: string) => {
    trackEvent('report_exported_pdf', {
      report_type: reportType,
    });
  }, []);

  const trackReportExportedExcel = useCallback((reportType: string) => {
    trackEvent('report_exported_excel', {
      report_type: reportType,
    });
  }, []);

  return {
    trackReportGenerated,
    trackReportExportedPDF,
    trackReportExportedExcel,
  };
}

/**
 * Hook for tracking BIM viewer events
 */
export function useBIMViewerAnalytics() {
  const trackModelUploaded = useCallback((data: {
    fileSize: number;
    fileType: string;
    elementCount?: number;
  }) => {
    trackEvent('model_uploaded', {
      file_size_mb: Math.round(data.fileSize / 1024 / 1024 * 100) / 100,
      file_type: data.fileType,
      element_count: data.elementCount,
    });
  }, []);

  const trackModelViewed = useCallback((modelId: string) => {
    trackEvent('model_viewed', {
      model_id: modelId,
    });
  }, []);

  const trackMeasurementTaken = useCallback((measurementType: 'distance' | 'area' | 'angle') => {
    trackEvent('measurement_taken', {
      measurement_type: measurementType,
    });
  }, []);

  const trackSectionCreated = useCallback(() => {
    trackEvent('section_created', {});
  }, []);

  return {
    trackModelUploaded,
    trackModelViewed,
    trackMeasurementTaken,
    trackSectionCreated,
  };
}

/**
 * Hook for tracking auth events
 */
export function useAuthAnalytics() {
  const trackSignUp = useCallback((method: 'email' | 'google' | 'anonymous') => {
    trackEvent('user_signed_up', {
      method,
    });
  }, []);

  const trackSignIn = useCallback((method: 'email' | 'google') => {
    trackEvent('user_signed_in', {
      method,
    });
  }, []);

  const trackSignOut = useCallback(() => {
    trackEvent('user_signed_out', {});
  }, []);

  return {
    trackSignUp,
    trackSignIn,
    trackSignOut,
  };
}

/**
 * Hook for tracking chat events
 */
export function useChatAnalytics() {
  const trackChatMessageSent = useCallback((messageLength: number, hasAttachment: boolean) => {
    trackEvent('chat_message_sent', {
      message_length: messageLength,
      has_attachment: hasAttachment,
    });
  }, []);

  const trackChatSessionStarted = useCallback((source: 'fab' | 'panel' | 'workspace') => {
    trackEvent('chat_session_started', {
      source,
    });
  }, []);

  return {
    trackChatMessageSent,
    trackChatSessionStarted,
  };
}

/**
 * Hook for tracking navigation/CTA events
 */
export function useNavigationAnalytics() {
  const trackCTAClicked = useCallback((ctaName: string, location: string) => {
    trackEvent('cta_clicked', {
      cta_name: ctaName,
      location,
    });
  }, []);

  const trackPricingViewed = useCallback((source: string) => {
    trackEvent('pricing_viewed', {
      source,
    });
  }, []);

  const trackCaseStudyViewed = useCallback((caseStudySlug: string) => {
    trackEvent('case_study_viewed', {
      case_study: caseStudySlug,
    });
  }, []);

  const trackSolutionPageViewed = useCallback((solution: 'contractors' | 'architects' | 'developers' | 'consultants') => {
    trackEvent('solution_page_viewed', {
      solution,
    });
  }, []);

  return {
    trackCTAClicked,
    trackPricingViewed,
    trackCaseStudyViewed,
    trackSolutionPageViewed,
  };
}

/**
 * Combined analytics hook for components that need multiple tracking types
 */
export function useAnalytics() {
  const calculator = useCalculatorAnalytics();
  const report = useReportAnalytics();
  const bimViewer = useBIMViewerAnalytics();
  const auth = useAuthAnalytics();
  const chat = useChatAnalytics();
  const navigation = useNavigationAnalytics();

  return {
    calculator,
    report,
    bimViewer,
    auth,
    chat,
    navigation,
    // Direct access to trackEvent for custom events
    trackEvent,
  };
}
