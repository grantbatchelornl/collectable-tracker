import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { filterPublicProfile } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all profiles using service role (bypasses RLS)
    const allProfiles = await base44.asServiceRole.entities.CollectorProfile.filter({}, '-created_date', 500);

    // Return only public-safe fields
    const publicProfiles = allProfiles.map((p) => {
      const filtered = filterPublicProfile(p);
      // last_week_rank is needed for leaderboard rank-change display
      if (p.last_week_rank != null) filtered.last_week_rank = p.last_week_rank;
      // Convention fields are opt-in — only expose when user activated convention mode
      if (p.convention_mode_active) {
        filtered.convention_mode_active = true;
        filtered.convention_lat = p.convention_lat;
        filtered.convention_lng = p.convention_lng;
        filtered.convention_name = p.convention_name;
      }
      return filtered;
    });

    return Response.json({ profiles: publicProfiles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}