import { defineMiddleware } from 'astro:middleware';
import { middleware } from 'astro:i18n';
import { auth } from '@/auth';

// ---- Rate limiter (in-memory, per-IP) ----
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // max attempts per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Periodic cleanup to avoid memory leaks (unref so it doesn't block shutdown)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(ip);
  }
}, 60 * 1000);
cleanupInterval.unref();

function isUnsafeMethod(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function isSameOriginRequest(request: Request, currentUrl: URL): boolean {
  const origin = request.headers.get('origin');
  if (origin) {
    return origin === currentUrl.origin;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === currentUrl.origin;
    } catch {
      return false;
    }
  }

  return false;
}

function hasSessionCookie(request: Request): boolean {
  return Boolean(request.headers.get('cookie'));
}

const i18nMiddleware = middleware({
  fallbackType: 'rewrite',
  prefixDefaultLocale: true,
  redirectToDefaultLocale: false,
});

function setSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self'; connect-src 'self' ws:; frame-src https://www.youtube-nocookie.com https://www.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  return response;
}

const authMiddleware = defineMiddleware(async (context, next): Promise<Response> => {
  const { request, locals, url, redirect } = context;

  const isAdminPage = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');
  const isAdminApi = url.pathname.startsWith('/api/admin');
  const isAuthApi = url.pathname.startsWith('/api/auth');
  const isAction = url.pathname.startsWith('/_actions');

  // Rate limit login endpoint
  if (url.pathname === '/api/auth/sign-in/email' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '900' },
      });
    }
  }

  // Only resolve session for routes that actually need it (SSR routes)
  if (isAdminPage || isAdminApi || isAuthApi || isAction) {
    const sessionResult = await auth.api.getSession({
      headers: request.headers,
    });

    locals.user = sessionResult?.user ?? null;
    locals.session = sessionResult?.session ?? null;
  } else {
    locals.user = null;
    locals.session = null;
  }

  // Protect admin pages — redirect to login
  if (isAdminPage) {
    if (!locals.user) {
      return redirect('/admin/login');
    }
    if (locals.user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Protect admin API routes — return 401/403
  if (isAdminApi) {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (locals.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (isUnsafeMethod(request.method) && (isAdminApi || isAuthApi || isAction)) {
    const requiresCsrfSignal = hasSessionCookie(request);
    if (requiresCsrfSignal && !isSameOriginRequest(request, url)) {
      return new Response(JSON.stringify({ error: 'Invalid request origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Skip i18n middleware for admin, API, and action routes
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api') || url.pathname.startsWith('/_actions')) {
    return setSecurityHeaders((await next()) as Response);
  }

  // Apply i18n middleware for public routes
  const response = await i18nMiddleware(context, next);
  return setSecurityHeaders(response as Response);
});

export const onRequest = authMiddleware;
