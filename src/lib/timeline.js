export function buildTimeline(collectibles, achievements, trades) {
  const events = [];

  collectibles.forEach((c) => {
    if (c.is_deleted) return;
    events.push({
      id: `item-${c.id}`,
      type: 'new_collectible',
      title: `Added ${c.item_name}`,
      description: c.category_name,
      value: c.estimated_value || 0,
      photo: c.primary_photo_url,
      date: c.created_date,
      route: `/collectible/${c.id}`,
    });
  });

  achievements.forEach((a) => {
    events.push({
      id: `achievement-${a.id}`,
      type: 'achievement',
      title: `Earned ${a.badge_name}`,
      description: a.badge_description,
      icon: a.badge_icon,
      date: a.created_date,
    });
  });

  trades.forEach((t) => {
    if (t.status === 'completed') {
      events.push({
        id: `trade-${t.id}`,
        type: 'trade',
        title: 'Completed Trade',
        description: t.message || 'Trade completed successfully',
        value: (t.offered_value || 0) + (t.requested_value || 0),
        date: t.updated_date || t.created_date,
      });
    }
  });

  const active = collectibles.filter((c) => !c.is_deleted);
  const totalValue = active.reduce((s, c) => s + (c.estimated_value || 0), 0);
  if (totalValue > 0) {
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000];
    const milestone = milestones.filter((m) => totalValue >= m).pop();
    if (milestone) {
      const latestItem = active.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      events.push({
        id: 'value-milestone',
        type: 'value_milestone',
        title: `Collection hit $${milestone.toLocaleString()}`,
        description: `Total collection value: $${totalValue.toLocaleString()}`,
        date: latestItem?.created_date || new Date().toISOString(),
      });
    }
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

export function groupByDate(events) {
  const groups = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const order = ['Today', 'Yesterday', 'This Week', 'This Month'];

  events.forEach((e) => {
    const d = new Date(e.date);
    let key;
    if (d >= today) key = 'Today';
    else if (d >= yesterday) key = 'Yesterday';
    else if (d >= weekAgo) key = 'This Week';
    else if (d >= monthAgo) key = 'This Month';
    else key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  return Object.entries(groups).sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return new Date(b[0]) - new Date(a[0]);
  });
}

export const EVENT_ICONS = {
  new_collectible: '📦',
  achievement: '🏆',
  trade: '🔄',
  value_milestone: '💎',
};