/**
 * IFC to XKT Conversion API Route
 *
 * Server-side conversion of IFC files to xeokit's optimized XKT format
 * Uses @xeokit/xeokit-convert for high-performance conversion
 *
 * Security:
 * - Authentication required (getUser)
 * - Upload rate limiting (20 requests/hour)
 * - CSRF token validation
 * - File size limits (100MB)
 * - File type whitelist
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';
import { convert2xkt } from '@xeokit/xeokit-convert/src/convert2xkt.js';
import { uploadRateLimiter } from '@/lib/security/rate-limit';
import { validateCSRFToken } from '@/lib/security/csrf';
import { getUser } from '@/lib/supabase/server';

// Maximum file size for conversion: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed input formats
const ALLOWED_INPUT_FORMATS = ['.ifc', '.gltf', '.glb'];

/**
 * POST /api/models/convert - Convert BIM file to XKT format
 *
 * Request: multipart/form-data with 'file' field
 * Response: XKT file as binary download
 */
export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

  try {
    // 1. Rate limiting - prevent DoS attacks
    const rateLimitError = await uploadRateLimiter.check(request);
    if (rateLimitError) return rateLimitError;

    // 2. CSRF validation - prevent CSRF attacks
    const csrfError = await validateCSRFToken(request);
    if (csrfError) return csrfError;

    // 3. Authentication - only authenticated users can convert files
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const extension = '.' + (fileName.split('.').pop() || '');

    if (!ALLOWED_INPUT_FORMATS.includes(extension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_INPUT_FORMATS.join(', ')}` },
        { status: 400 }
      );
    }

    // Create temp directory for conversion
    const conversionId = nanoid();
    const tempDir = join(tmpdir(), 'xkt-convert', conversionId);

    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Write input file to temp directory
    const inputPath = join(tempDir, `input${extension}`);
    const outputPath = join(tempDir, 'output.xkt');

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, fileBuffer);
    tempFiles.push(inputPath);

    console.log(`[User: ${user.id}] Converting ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to XKT...`);

    // Convert to XKT
    const stats: Record<string, unknown> = {};

    await convert2xkt({
      source: inputPath,
      output: outputPath,
      stats,
      log: (msg: string) => console.log(`[convert2xkt] ${msg}`),
    });

    tempFiles.push(outputPath);

    console.log(`Conversion complete. Stats:`, stats);

    // Read the XKT file
    const xktBuffer = await readFile(outputPath);

    // Clean up temp files
    await Promise.all(
      tempFiles.map(async (f) => {
        try {
          await unlink(f);
        } catch {
          // Ignore cleanup errors
        }
      })
    );

    // Return XKT file as download
    const outputFileName = file.name.replace(/\.[^.]+$/, '.xkt');

    return new NextResponse(xktBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${outputFileName}"`,
        'Content-Length': xktBuffer.length.toString(),
        'X-Conversion-Stats': JSON.stringify(stats),
      },
    });
  } catch (error) {
    console.error('Conversion error:', error);

    // Clean up temp files on error
    await Promise.all(
      tempFiles.map(async (f) => {
        try {
          await unlink(f);
        } catch {
          // Ignore cleanup errors
        }
      })
    );

    const message = error instanceof Error ? error.message : 'Conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/models/convert - Get conversion info
 */
export async function GET() {
  return NextResponse.json({
    description: 'IFC/glTF to XKT conversion API',
    supportedFormats: ALLOWED_INPUT_FORMATS,
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    outputFormat: '.xkt',
    usage: {
      method: 'POST',
      contentType: 'multipart/form-data',
      body: {
        file: 'The BIM file to convert (IFC, glTF, or GLB)',
      },
      response: 'XKT file as binary download',
    },
  });
}
