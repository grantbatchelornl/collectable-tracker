export function computeCollectorScore(collectibles, pricingHistory, achievements, trades) {
  const validCollectibles = (collectibles || []).filter((c) => !c.is_deleted);
  const total = validCollectibles.length;

  if (total === 0) {
    return {
      score: 0,
      factors: [
        { key: 'size', label: 'Collection Size', score: 0, weight: 0.15 },
        { key: 'verification', label: 'Verified Values', score: 0, weight: 0.25 },
        { key: 'freshness', label: 'Pricing Freshness', score: 0, weight: 0.15 },
        { key: 'diversity', label: 'Category Diversity', score: 0, weight: 0.1 },
        { key: 'social', label: 'Trading & Badges', score: 0, weight: 0.2 },
        { key: 'photos', label: 'Photo Coverage', score: 0, weight: 0.15 },
      ],
      label: 'New Collector',
      verifiedCount: 0,
      total: 0,
    };
  }

  const sizeScore = Math.min(100, Math.round((total / 50) * 100));

  const verifiedCount = validCollectibles.filter(
    (c) => c.value_type === 'verified_sold'
  ).length;
  const verificationScore = Math.round((verifiedCount / total) * 100);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const freshCount = validCollectibles.filter((c) => {
    const updated = new Date(c.updated_date).getTime();
    return updated > thirtyDaysAgo;
  }).length;
  const freshnessScore = Math.round((freshCount / total) * 100);

  const categories = new Set(
    validCollectibles.map((c) => c.category_name).filter(Boolean)
  );
  const diversityScore = Math.min(100, Math.round((categories.size / 7) * 100));

  const completedTrades = (trades || []).filter((t) => t.status === 'completed').length;
  const achievementCount = (achievements || []).length;
  const socialScore = Math.min(100, completedTrades * 10 + achievementCount * 5);

  const withPhotos = validCollectibles.filter((c) => c.primary_photo_url).length;
  const photoScore = Math.round((withPhotos / total) * 100);

  const factors = [
    { key: 'size', label: 'Collection Size', score: sizeScore, weight: 0.15 },
    { key: 'verification', label: 'Verified Values', score: verificationScore, weight: 0.25 },
    { key: 'freshness', label: 'Pricing Freshness', score: freshnessScore, weight: 0.15 },
    { key: 'diversity', label: 'Category Diversity', score: diversityScore, weight: 0.1 },
    { key: 'social', label: 'Trading & Badges', score: socialScore, weight: 0.2 },
    { key: 'photos', label: 'Photo Coverage', score: photoScore, weight: 0.15 },
  ];

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  let label = 'New Collector';
  if (score >= 90) label = 'Elite Collector';
  else if (score >= 75) label = 'Expert Collector';
  else if (score >= 50) label = 'Serious Collector';
  else if (score >= 25) label = 'Active Collector';

  return { score, factors, label, verifiedCount, total };
}