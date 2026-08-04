import { base44 } from '@/api/base44Client';

export async function getTradeHistory(userId) {
  const trades = await base44.entities.Trade.filter(
    { status: 'completed' },
    '-updated_date', 100
  );

  const myTrades = trades.filter(
    (t) => t.proposer_id === userId || t.recipient_id === userId
  );

  const reviews = await base44.entities.TradeReview.filter({ reviewed_id: userId });

  return {
    trades: myTrades,
    reviews,
    stats: calculateTradeStats(myTrades, userId),
    favoritePartners: getFavoritePartners(myTrades, userId),
  };
}

function calculateTradeStats(trades, userId) {
  let valueGained = 0;
  let valueLost = 0;

  trades.forEach((t) => {
    if (t.proposer_id === userId) {
      valueGained += t.requested_value || 0;
      valueLost += t.offered_value || 0;
    } else {
      valueGained += t.offered_value || 0;
      valueLost += t.requested_value || 0;
    }
  });

  return {
    totalTrades: trades.length,
    valueGained,
    valueLost,
    netValue: valueGained - valueLost,
  };
}

function getFavoritePartners(trades, userId) {
  const partnerCounts = {};
  trades.forEach((t) => {
    const partnerId = t.proposer_id === userId ? t.recipient_id : t.proposer_id;
    const partnerName = t.proposer_id === userId ? t.recipient_name : t.proposer_name;
    if (!partnerCounts[partnerId]) {
      partnerCounts[partnerId] = { id: partnerId, name: partnerName, count: 0 };
    }
    partnerCounts[partnerId].count++;
  });
  return Object.values(partnerCounts).sort((a, b) => b.count - a.count).slice(0, 5);
}

export async function submitTradeReview(reviewData) {
  await base44.entities.TradeReview.create(reviewData);

  const reviews = await base44.entities.TradeReview.filter({ reviewed_id: reviewData.reviewed_id });
  const avgScore =
    reviews.reduce((s, r) => {
      const score =
        ((r.rating_accuracy || 0) + (r.rating_communication || 0) + (r.rating_shipping || 0) + (r.rating_packaging || 0)) /
        4;
      return s + score;
    }, 0) / reviews.length;

  const profiles = await base44.entities.CollectorProfile.filter({ user_id: reviewData.reviewed_id });
  if (profiles.length > 0) {
    await base44.entities.CollectorProfile.update(profiles[0].id, {
      trade_reputation_score: Math.round(avgScore * 10) / 10,
      trade_review_count: reviews.length,
      total_completed_trades: (profiles[0].total_completed_trades || 0) + 1,
    });
  }
}

export async function checkExistingReview(tradeId, reviewerId) {
  const existing = await base44.entities.TradeReview.filter({
    trade_id: tradeId,
    reviewer_id: reviewerId,
  });
  return existing.length > 0;
}