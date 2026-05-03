import type { APIRoute } from 'astro';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { findStoredUploadAbsolutePath, normalizeUploadRelativePath } from '@/lib/uploads';

export const prerender = false;

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

function getMimeType(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function isInlineSafeMimeType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType);
}

async function serveUpload(rawPath: string | undefined): Promise<Response> {
  if (!rawPath) {
    return new Response('Not found', { status: 404 });
  }

  let relativePath: string;
  try {
    relativePath = normalizeUploadRelativePath(rawPath);
  } catch {
    return new Response('Invalid path', { status: 400 });
  }

  const absolutePath = await findStoredUploadAbsolutePath(relativePath);
  if (!absolutePath) {
    return new Response('Not found', { status: 404 });
  }

  const [buffer, fileStat] = await Promise.all([
    readFile(absolutePath),
    stat(absolutePath),
  ]);
  const mimeType = getMimeType(absolutePath);
  const inlineSafe = isInlineSafeMimeType(mimeType);

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(fileStat.size),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Content-Disposition': `${inlineSafe ? 'inline' : 'attachment'}; filename="${basename(absolutePath)}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const GET: APIRoute = async ({ params }) => serveUpload(params.path);
export const HEAD: APIRoute = async ({ params }) => serveUpload(params.path);
