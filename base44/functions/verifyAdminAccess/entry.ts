import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const password = body?.password;
    const adminPassword = secrets.get('ADMIN_ACCESS_PASSWORD');

    if (!adminPassword) {
      return Response.json({ error: 'Admin access password not configured' }, { status: 500 });
    }

    if (!password || password !== adminPassword) {
      return Response.json({ authorized: false }, { status: 403 });
    }

    return Response.json({ authorized: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}