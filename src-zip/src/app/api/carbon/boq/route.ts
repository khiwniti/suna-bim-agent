/**
 * BOQ Carbon Integration API Endpoint
 *
 * POST /api/carbon/boq - Import and calculate carbon from KKP BOQ format
 *
 * Integrates with วศท. (EIT) BOQ standards and KKP database
 *
 * Security: Authentication, CSRF validation, and rate limiting required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { expensiveRateLimiter, validateCSRFToken } from '@/lib/security';
import { z } from 'zod';
import {
  parseKKPBOQ,
  summarizeBOQBySection,
  analyzeBOQReadiness,
  calculateBOQCarbon,
  type KKPBOQItem,
  type BOQInput,
  type BOQWorkSection,
} from '@/lib/carbon';

// Validation schema for KKP BOQ item (matches KKPBOQItem interface)
// Work sections follow วศท. (EIT) BOQ standards
const kkpBOQItemSchema = z.object({
  itemNo: z.string(),
  description: z.string(),
  descriptionEn: z.string().optional(),
  unit: z.string(),
  quantity: z.number(),
  unitPrice: z.number().optional(),
  amount: z.number().optional(),
  kkpCode: z.string().optional(),
  materialSpec: z.string().optional(),
  workSection: z.enum([
    '01', // งานเตรียมการและงานชั่วคราว
    '02', // งานดินและงานถมดิน
    '03', // งานเสาเข็ม
    '04', // งานฐานราก
    '05', // งานโครงสร้างคอนกรีต
    '06', // งานโครงสร้างเหล็ก
    '07', // งานหลังคา
    '08', // งานผนังภายนอก
    '09', // งานผนังภายใน
    '10', // งานประตู-หน้าต่าง
    '11', // งานพื้น
    '12', // งานฝ้าเพดาน
    '13', // งานสี
    '14', // งานระบบไฟฟ้า
    '15', // งานระบบสุขาภิบาล
    '16', // งานระบบปรับอากาศ
    '17', // งานระบบป้องกันอัคคีภัย
    '18', // งานภูมิทัศน์
    '99', // งานอื่นๆ
  ]),
});

// Request body schema
const boqImportRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  projectName: z.string().min(1, 'Project name is required'),
  grossFloorArea: z.number().positive('Gross floor area must be positive'),
  items: z.array(kkpBOQItemSchema).min(1, 'At least one BOQ item is required'),
  // Export options
  includeTransport: z.boolean().default(false),
  defaultTransportDistance: z.number().positive().default(50),
});

export const maxDuration = 60; // Allow up to 60 seconds for processing

/**
 * POST /api/carbon/boq - Process BOQ and calculate carbon
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Rate limiting - this is computationally expensive
    const rateLimitError = await expensiveRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. CSRF token validation
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = boqImportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      projectId,
      projectName,
      grossFloorArea,
      items,
      includeTransport,
      defaultTransportDistance,
    } = validation.data;

    // 5. Convert items to KKP BOQ format (validation.data already matches KKPBOQItem)
    const boqItems: KKPBOQItem[] = items.map((item) => ({
      itemNo: item.itemNo,
      description: item.description,
      descriptionEn: item.descriptionEn,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      kkpCode: item.kkpCode,
      materialSpec: item.materialSpec,
      workSection: item.workSection,
    }));

    // 6. Parse KKP BOQ to BOQ Input format with carbon mapping
    const boqInputs: BOQInput[] = parseKKPBOQ(boqItems);

    // 7. Add transport data if requested
    if (includeTransport) {
      boqInputs.forEach((input) => {
        input.transportDistance = defaultTransportDistance;
        input.transportVehicle = 'truck_10wheel';
        input.transportLoadPercent = 75;
      });
    }

    // 8. Calculate BOQ carbon
    const carbonAnalysis = calculateBOQCarbon(
      projectId,
      projectName,
      boqInputs,
      grossFloorArea
    );

    // 9. Get section summary (requires both BOQ items and calculated carbon items)
    const sectionSummary = summarizeBOQBySection(boqItems, carbonAnalysis.items);

    // 10. Analyze readiness for certifications
    const readiness = analyzeBOQReadiness(boqItems);

    // 11. Return comprehensive result
    return NextResponse.json({
      success: true,
      data: {
        projectId,
        projectName,
        grossFloorArea,
        analysis: carbonAnalysis,
        sectionSummary,
        certificationReadiness: readiness,
        itemCount: boqItems.length,
        processedAt: new Date().toISOString(),
        processedBy: user.id,
      },
    });
  } catch (error) {
    console.error('[BOQ Carbon API] Error:', error);
    return NextResponse.json(
      {
        error: 'BOQ carbon calculation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
