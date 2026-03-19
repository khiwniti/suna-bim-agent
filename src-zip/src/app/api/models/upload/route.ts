/**
 * File Upload API Route
 *
 * Handles BIM file uploads to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { uploadRateLimiter, validateCSRFToken } from '@/lib/security';
import { nanoid } from 'nanoid';

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file extensions with magic bytes validation
const ALLOWED_EXTENSIONS = [
  '.ifc',
  '.gltf',
  '.glb',
  '.fbx',
  '.obj',
  '.step',
  '.stp',
  '.png',
  '.jpg',
  '.jpeg',
];

/**
 * Magic bytes signatures for file content validation
 * Prevents malicious files disguised with valid extensions
 */
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  '.png': [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  '.jpg': [{ bytes: [0xff, 0xd8, 0xff] }],
  '.jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  '.glb': [{ bytes: [0x67, 0x6c, 0x54, 0x46] }], // glTF binary
  '.gltf': [{ bytes: [0x7b] }], // JSON opening brace
  // IFC files start with "ISO-10303-21" or contain "IFC" header
  '.ifc': [
    { bytes: [0x49, 0x53, 0x4f, 0x2d, 0x31, 0x30, 0x33, 0x30, 0x33] }, // "ISO-10303"
  ],
  // STEP files also use ISO-10303
  '.step': [
    { bytes: [0x49, 0x53, 0x4f, 0x2d, 0x31, 0x30, 0x33, 0x30, 0x33] }, // "ISO-10303"
  ],
  '.stp': [
    { bytes: [0x49, 0x53, 0x4f, 0x2d, 0x31, 0x30, 0x33, 0x30, 0x33] }, // "ISO-10303"
  ],
  // FBX can be binary or ASCII
  '.fbx': [
    { bytes: [0x4b, 0x61, 0x79, 0x64, 0x61, 0x72, 0x61] }, // "Kaydara" (binary)
    { bytes: [0x3b, 0x20, 0x46, 0x42, 0x58] }, // "; FBX" (ASCII)
  ],
  // OBJ files are text-based, start with comment or vertex
  '.obj': [
    { bytes: [0x23] }, // "#" comment
    { bytes: [0x76, 0x20] }, // "v " vertex
    { bytes: [0x6f, 0x20] }, // "o " object
  ],
};

/**
 * Validate file content against magic bytes signature
 */
async function validateFileContent(
  file: File,
  extension: string
): Promise<{ valid: boolean; reason?: string }> {
  const signatures = MAGIC_BYTES[extension.toLowerCase()];

  // If no signature defined, allow but log warning
  if (!signatures) {
    console.warn(`No magic bytes defined for extension: ${extension}`);
    return { valid: true };
  }

  try {
    // Read first 32 bytes for signature check
    const headerSlice = file.slice(0, 32);
    const headerBuffer = await headerSlice.arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);

    // Check if any signature matches
    const matches = signatures.some((sig) => {
      const offset = sig.offset || 0;
      return sig.bytes.every(
        (byte, index) => headerBytes[offset + index] === byte
      );
    });

    if (!matches) {
      return {
        valid: false,
        reason: `File content does not match expected ${extension} format`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Failed to read file content for validation' };
  }
}

/**
 * POST /api/models/upload - Upload BIM file
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (20 uploads per hour)
    const rateLimitError = await uploadRateLimiter.check(request);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Validate CSRF token
    const csrfError = await validateCSRFToken(request);
    if (csrfError) {
      return csrfError;
    }

    // Check if auth is disabled (development mode)
    const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

    const user = await getUser();
    if (!user && !authDisabled) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;

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
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file content (magic bytes) to prevent malicious uploads
    const extension = '.' + fileName.split('.').pop();
    const contentValidation = await validateFileContent(file, extension);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.reason || 'Invalid file content' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get user ID (use 'anonymous' for dev mode when auth is disabled)
    const userId = user?.id || 'anonymous';

    // Verify project ownership if projectId provided (skip for anonymous)
    if (projectId && user) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // Generate unique file path
    const fileId = nanoid();
    const fileExtension = fileName.split('.').pop();
    const storagePath = `${userId}/${projectId || 'general'}/${fileId}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bim-models')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bim-models')
      .getPublicUrl(uploadData.path);

    // Create file upload record (only if user is authenticated)
    if (user) {
      const { error: recordError } = await supabase
        .from('file_uploads')
        .insert({
          filename: fileId + '.' + fileExtension,
          original_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
          storage_key: uploadData.path,
          public_url: urlData.publicUrl,
          user_id: userId,
          status: 'COMPLETED',
          processed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (recordError) {
        console.error('Record creation error:', recordError);
        // File was uploaded but record failed - still return success with URL
      }
    }

    return NextResponse.json({
      success: true,
      fileId,
      url: urlData.publicUrl,
      path: uploadData.path,
      originalName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/models/upload - Get upload status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if auth is disabled (development mode)
    const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

    const user = await getUser();
    if (!user && !authDisabled) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    const supabase = await createServerSupabaseClient();
    const userId = user?.id || 'anonymous';

    // Return empty for anonymous users (no records stored)
    if (!user) {
      return NextResponse.json({ files: [] });
    }

    if (fileId) {
      // Get specific file
      const { data: file, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('filename', fileId)
        .eq('user_id', userId)
        .single();

      if (error || !file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      return NextResponse.json({ file });
    }

    // List recent uploads
    const { data: files, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Get uploads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
