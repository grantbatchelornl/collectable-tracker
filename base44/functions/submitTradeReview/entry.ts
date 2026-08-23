import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function clampRating(value: any) {
  const n = Math.round(Number(value || 5));
  return Math.max(1, Math.min(5, n));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.is_suspended) return Response.json({ error: 'Your account is suspended.' }, { status: 403 });

    const body = await req.json();
    const tradeId = String(body.tradeId || '');
    if (!tradeId) return Response.json({ error: 'Missing tradeId' }, { status: 400 });

    const trade = await base44.asServiceRole.entities.Trade.get(tradeId).catch(() => null);
    if (!trade) return Response.json({ error: 'Trade not found' }, { status: 404 });
    if (trade.status !== 'completed') return Response.json({ error: 'Only completed trades can be reviewed' }, { status: 409 });
    if (![trade.proposer_id, trade.recipient_id].includes(user.id)) {
      return Response.json({ error: 'You are not a participant in this trade' }, { status: 403 });
    }

    const reviewedId = trade.proposer_id === user.id ? trade.recipient_id : trade.proposer_id;
    const existing = await base44.asServiceRole.entities.TradeReview.filter({ trade_id: tradeId, reviewer_id: user.id });
    if (existing.length) return Response.json({ error: 'You already reviewed this trade' }, { status: 409 });

    const reviewerProfiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: user.id });
    const review = await base44.asServiceRole.entities.TradeReview.create({
      trade_id: tradeId,
      reviewer_id: user.id,
      reviewer_name: reviewerProfiles[0]?.display_name || user.display_name || user.full_name || '',
      reviewed_id: reviewedId,
      rating_accuracy: clampRating(body.rating_accuracy),
      rating_communication: clampRating(body.rating_communication),
      rating_shipping: clampRating(body.rating_shipping),
      rating_packaging: clampRating(body.rating_packaging),
      would_trade_again: body.would_trade_again !== false,
      comment: String(body.comment || '').trim().slice(0, 1000) || undefined,
    });

    const reviews = await base44.asServiceRole.entities.TradeReview.filter({ reviewed_id: reviewedId });
    const avgScore = reviews.length
      ? reviews.reduce((sum, r) => sum + (
          Number(r.rating_accuracy || 0) + Number(r.rating_communication || 0) +
          Number(r.rating_shipping || 0) + Number(r.rating_packaging || 0)
        ) / 4, 0) / reviews.length
      : 0;

    const [asProposer, asRecipient] = await Promise.all([
      base44.asServiceRole.entities.Trade.filter({ proposer_id: reviewedId, status: 'completed' }, '-updated_date', 500),
      base44.asServiceRole.entities.Trade.filter({ recipient_id: reviewedId, status: 'completed' }, '-updated_date', 500),
    ]);
    const completedTradeCount = new Set([...asProposer, ...asRecipient].map((t) => t.id)).size;

    const profiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: reviewedId });
    if (profiles[0]) {
      await base44.asServiceRole.entities.CollectorProfile.update(profiles[0].id, {
        trade_reputation_score: Math.round(avgScore * 10) / 10,
        trade_review_count: reviews.length,
        total_completed_trades: completedTradeCount,
      });
    }

    return Response.json({ success: true, review });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to submit review' }, { status: 500 });
  }
}
