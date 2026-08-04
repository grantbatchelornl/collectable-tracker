import { base44 } from '@/api/base44Client';

export async function askCollectorAI(question, history = [], contextHint = '') {
  const response = await base44.functions.invoke('collectorAIChat', {
    question,
    history,
    contextHint,
  });
  return response.data;
}

export async function executeAction(action, user, navigate) {
  let details = {};
  try {
    details = typeof action.details === 'string' ? JSON.parse(action.details) : (action.details || {});
  } catch { details = {}; }

  switch (action.action_type) {
    case 'create_binder': {
      const binder = await base44.entities.CollectionBinder.create({
        user_id: user.id,
        name: details.name || action.title,
        description: details.description || '',
        target_count: details.target_count || 0,
        binder_type: 'custom',
        privacy_status: 'private',
      });
      return { success: true, message: `Created binder "${binder.name}"`, route: `/binder/${binder.id}` };
    }

    case 'add_to_wishlist': {
      const items = details.items || [];
      if (!items.length) return { success: false, message: 'No items specified' };
      await base44.entities.Watchlist.bulkCreate(
        items.map(item => ({
          user_id: user.id,
          item_name: item.name || item,
          category_name: item.category || '',
          target_price: item.target_price || 0,
          priority: item.priority || 'medium',
          status: 'active',
          alert_type: 'buy_target',
        }))
      );
      return { success: true, message: `Added ${items.length} item${items.length > 1 ? 's' : ''} to your wishlist`, route: '/watchlist' };
    }

    case 'mark_for_trade': {
      const ids = details.collectible_ids || [];
      if (!ids.length) return { success: false, message: 'No items specified' };
      for (const id of ids) {
        await base44.entities.Collectible.update(id, { trade_status: 'trade' });
      }
      return { success: true, message: `Marked ${ids.length} item${ids.length > 1 ? 's' : ''} as available for trade` };
    }

    case 'refresh_pricing': {
      const id = details.collectible_id;
      if (id) {
        navigate(`/collectible/${id}`);
        return { success: true, message: 'Opening collectible for pricing refresh' };
      }
      return { success: false, message: 'No collectible specified' };
    }

    case 'start_grading': {
      const id = details.collectible_id;
      if (id) {
        navigate(`/collectible/${id}`);
        return { success: true, message: 'Opening collectible for grading evaluation' };
      }
      return { success: false, message: 'No collectible specified' };
    }

    case 'create_goal': {
      const goal = await base44.entities.CollectionGoal.create({
        user_id: user.id,
        title: details.title || action.title,
        goal_type: details.goal_type || 'custom',
        target_count: details.target_count || 0,
        status: 'active',
      });
      return { success: true, message: `Created goal "${goal.title}"`, route: '/goals' };
    }

    case 'update_preference': {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      if (!profiles[0]) return { success: false, message: 'Profile not found' };
      const field = details.field;
      const value = details.value;
      if (!field) return { success: false, message: 'No preference field specified' };
      await base44.entities.CollectorProfile.update(profiles[0].id, { [field]: value });
      return { success: true, message: `Updated ${field.replace(/_/g, ' ')} to ${value}` };
    }

    case 'navigate': {
      if (details.route) {
        navigate(details.route);
        return { success: true, message: 'Navigating' };
      }
      return { success: false, message: 'No route specified' };
    }

    default:
      return { success: false, message: `Unknown action: ${action.action_type}` };
  }
}

export const SUGGESTED_PROMPTS = [
  { label: 'Review my collection', question: 'Give me a comprehensive review of my collection, including total value, strengths, and areas for improvement.' },
  { label: 'What changed this week?', question: 'What changed in my collection this week? Show me gains, losses, and new additions.' },
  { label: 'What should I grade?', question: 'Which of my collectibles are the best candidates for professional grading? Explain why.' },
  { label: 'What should I trade?', question: 'Which duplicates or items should I consider trading? What are my best trade candidates?' },
  { label: 'Help me finish a binder', question: 'Which binder am I closest to completing? What items am I missing and which are the least expensive?' },
  { label: 'Find my duplicates', question: 'Do I have any duplicate items? Which ones could I trade?' },
  { label: 'Show stale prices', question: 'Which items have stale pricing and need a refresh?' },
  { label: 'Show my biggest gains', question: 'Which items in my collection gained the most value recently?' },
  { label: 'Find a fair trade', question: 'Do I have any fair trade matches with friends or collectors?' },
  { label: 'Explain my Collection Health', question: 'What are my Collection Health issues and how do I fix them?' },
];

export function getAdaptivePrompts(collectibles, binders, healthIssues) {
  const prompts = [];

  if (!collectibles || collectibles.length === 0) {
    prompts.push({ label: 'Getting started', question: 'I am new to collecting. What should I know about building and tracking my collection?' });
    return prompts;
  }

  const staleCount = collectibles.filter(c => c.is_stale).length;
  if (staleCount > 0) {
    prompts.push({ label: 'Show stale prices', question: `I have ${staleCount} items with stale pricing. Which ones need refreshing?` });
  }

  const duplicates = findDuplicates(collectibles);
  if (duplicates.length > 0) {
    prompts.push({ label: 'Find my duplicates', question: 'Do I have any duplicate items that I could trade?' });
  }

  const ungradedValuable = collectibles.filter(c => !c.grading_company && (c.estimated_value || 0) > 100);
  if (ungradedValuable.length > 0) {
    prompts.push({ label: 'What should I grade?', question: `I have ${ungradedValuable.length} ungraded items worth over $100. Which are the best grading candidates?` });
  }

  if (binders && binders.length > 0) {
    const closest = [...binders].sort((a, b) => (b.completion_percent || 0) - (a.completion_percent || 0))[0];
    if (closest && (closest.completion_percent || 0) > 0) {
      prompts.push({ label: 'Help me finish a binder', question: `I'm ${closest.completion_percent}% done with my "${closest.name}" binder. What am I missing and which missing items are cheapest?` });
    }
  }

  if (healthIssues && healthIssues.filter(h => !h.status || h.status === 'open').length > 0) {
    prompts.push({ label: 'Explain my Collection Health', question: 'What are my Collection Health issues and how do I fix them?' });
  }

  prompts.push({ label: 'Review my collection', question: 'Give me a comprehensive review of my collection.' });
  prompts.push({ label: 'What changed this week?', question: 'What changed in my collection this week? Show me gains, losses, and new additions.' });

  return prompts.slice(0, 6);
}

function findDuplicates(collectibles) {
  const seen = {};
  collectibles.forEach(c => {
    const key = `${c.item_name}_${c.set_name || ''}_${c.year || ''}`;
    if (!seen[key]) seen[key] = [];
    seen[key].push(c);
  });
  return Object.values(seen).filter(arr => arr.length > 1);
}