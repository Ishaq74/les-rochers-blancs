import { defineMiddleware } from 'astro:middleware';
import { auth } from '@/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, url, redirect } = context;

  const isAdminPage = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');
  const isAdminApi = url.pathname.startsWith('/api/admin');
  const isAuthApi = url.pathname.startsWith('/api/auth');

  // Only resolve session for routes that actually need it (SSR routes)
  if (isAdminPage || isAdminApi || isAuthApi) {
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

  return next();
});
