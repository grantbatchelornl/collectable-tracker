export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const CATEGORIES_NEEDING_BOTH_PHOTOS = [
  'Pokémon',
  'Magic: The Gathering',
  'Disney Lorcana',
  'Sports Cards',
  'Funko Pop!',
  'Coins',
];

export function computeQualityScore(collectibles, pricingHistory, photos) {
  if (!collectibles || collectibles.length === 0) {
    return { score: 0, issues: {}, factors: [], total: 0 };
  }

  const now = Date.now();

  const latestPricing = {};
  (pricingHistory || []).forEach((h) => {
    const existing = latestPricing[h.collectible_id];
    if (!existing || new Date(h.created_date) > new Date(existing.created_date)) {
      latestPricing[h.collectible_id] = h;
    }
  });

  const photosByCollectible = {};
  (photos || []).forEach((p) => {
    if (!photosByCollectible[p.collectible_id]) {
      photosByCollectible[p.collectible_id] = [];
    }
    photosByCollectible[p.collectible_id].push(p);
  });

  const issues = {
    needPhotos: [],
    outdatedPricing: [],
    lowConfidence: [],
    missingDetails: [],
    needGrading: [],
    missingRequiredPhotos: [],
    notRepriced30Days: [],
    possibleDuplicates: [],
  };

  collectibles.forEach((c) => {
    if (!c.primary_photo_url) {
      issues.needPhotos.push(c);
    }

    const latest = latestPricing[c.id];
    if (!latest || c.value_source === 'Manual') {
      issues.outdatedPricing.push(c);
    }

    if (!c.value_confidence || c.value_confidence === 'low') {
      issues.lowConfidence.push(c);
    }

    if (!c.character_athlete_name && !c.brand && !c.team) {
      issues.missingDetails.push(c);
    }

    if ((c.grading_company && !c.grade) || (!c.grading_company && c.grade)) {
      issues.needGrading.push(c);
    }

    if (CATEGORIES_NEEDING_BOTH_PHOTOS.includes(c.category_name)) {
      const cPhotos = photosByCollectible[c.id] || [];
      const hasFront = cPhotos.some((p) => p.photo_type === 'front');
      const hasBack = cPhotos.some((p) => p.photo_type === 'back');
      if (!hasFront || !hasBack) {
        issues.missingRequiredPhotos.push(c);
      }
    }

    const lastDate = latest
      ? new Date(latest.created_date).getTime()
      : new Date(c.created_date).getTime();
    if (now - lastDate > THIRTY_DAYS_MS) {
      issues.notRepriced30Days.push(c);
    }
  });

  const nameMap = {};
  collectibles.forEach((c) => {
    if (c.item_name) {
      if (!nameMap[c.item_name]) nameMap[c.item_name] = [];
      nameMap[c.item_name].push(c);
    }
  });
  Object.values(nameMap).forEach((group) => {
    if (group.length > 1) {
      group.forEach((c) => issues.possibleDuplicates.push(c));
    }
  });

  const total = collectibles.length;
  const factorScore = (arr) => Math.round(((total - arr.length) / total) * 100);

  const factors = [
    { key: 'photos', label: 'Photos Present', score: factorScore(issues.needPhotos), weight: 0.2 },
    { key: 'freshness', label: 'Pricing Freshness', score: factorScore(issues.notRepriced30Days), weight: 0.15 },
    { key: 'confidence', label: 'AI Confidence', score: factorScore(issues.lowConfidence), weight: 0.15 },
    { key: 'details', label: 'Complete Details', score: factorScore(issues.missingDetails), weight: 0.15 },
    { key: 'requiredPhotos', label: 'Required Photos', score: factorScore(issues.missingRequiredPhotos), weight: 0.15 },
    { key: 'grading', label: 'Grading Info', score: factorScore(issues.needGrading), weight: 0.1 },
    { key: 'duplicates', label: 'No Duplicates', score: factorScore(issues.possibleDuplicates), weight: 0.1 },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

  return { score, issues, factors, total };
}

export function getScoreColor(score) {
  if (score >= 90) return 'text-gain';
  if (score >= 75) return 'text-gold';
  if (score >= 50) return 'text-orange-500';
  return 'text-loss';
}

export function getScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Poor';
}

export function getScoreBg(score) {
  if (score >= 90) return 'bg-gain';
  if (score >= 75) return 'bg-gold';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-loss';
}