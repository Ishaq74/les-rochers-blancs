import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { join, posix, resolve } from 'node:path';

const configuredUploadsDir = process.env.UPLOADS_DIR ?? import.meta.env.UPLOADS_DIR ?? 'storage/uploads';
const explicitUploadsDir = process.env.UPLOADS_DIR ?? import.meta.env.UPLOADS_DIR;
const allowLegacyUploadFallback = (process.env.ALLOW_LEGACY_UPLOAD_FALLBACK ?? import.meta.env.ALLOW_LEGACY_UPLOAD_FALLBACK ?? '').toLowerCase() === 'true';
const legacyUploadsDir = resolve(process.cwd(), 'public', 'uploads');

export function getUploadsRoot(): string {
  return resolve(process.cwd(), configuredUploadsDir);
}

export function normalizeUploadRelativePath(value: string): string {
  const cleaned = value.replace(/^\/+/, '').replace(/^uploads\//, '');
  const normalized = posix.normalize(cleaned);

  if (!normalized || normalized === '.' || normalized === '..' || normalized.startsWith('../') || normalized.includes('\0')) {
    throw new Error('Invalid upload path');
  }

  return normalized;
}

export function getUploadPublicUrl(value: string): string {
  return `/uploads/${normalizeUploadRelativePath(value)}`;
}

export function resolveUploadAbsolutePath(value: string): string {
  const relativePath = normalizeUploadRelativePath(value);
  return join(getUploadsRoot(), ...relativePath.split('/'));
}

export function resolveLegacyUploadAbsolutePath(value: string): string {
  const relativePath = normalizeUploadRelativePath(value);
  return join(legacyUploadsDir, ...relativePath.split('/'));
}

export async function findStoredUploadAbsolutePath(value: string): Promise<string | null> {
  const candidates = [resolveUploadAbsolutePath(value)];

  if (!explicitUploadsDir || allowLegacyUploadFallback) {
    candidates.push(resolveLegacyUploadAbsolutePath(value));
  }

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.F_OK);
      return candidate;
    } catch {
      // Try next location.
    }
  }

  return null;
}
