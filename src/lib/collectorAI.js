import { base44 } from '@/api/base44Client';
import { isValidRoute } from '@/lib/appCapabilityRegistry';

export async function askCollectorAI(question, history = [], contextHint = '') {
  const response = await base44.functions.invoke('collectorAIChat', {
    question,
    history,
    contextHint,
  });
  return response.data;
}

/**
 * Execute a Collector AI action. Write actions go through the backend function
 * collectorAIExecute for server-side ownership validation + audit logging.
 * Navigation actions are validated against the route registry before navigating.
 */
export async function executeAction(action, user, navigate, options = {}) {
  let details = {};
  try {
    details = typeof action.details === 'string' ? JSON.parse(action.details) : (action.details || {});
  } catch { details = {}; }

  const actionType = action.action_type;

  // Write actions — route through backend function
  const WRITE_ACTIONS = [
    'update_profile', 'update_collectible', 'update_binder',
    'add_to_wishlist', 'mark_for_trade', 'toggle_favorite',
    'toggle_showcase', 'delete_binder',
  ];

  if (WRITE_ACTIONS.includes(actionType)) {
    try {
      const response = await base44.functions.invoke('collectorAIExecute', {
        action_type: actionType,
        details,
        conversation_id: options.conversationId || null,
        auto_confirmed: options.autoConfirmed || false,
      });
      const result = response.data || response;
      if (result.success && result.route && isValidRoute(result.route)) {
        return { ...result, navigate: () => navigate(result.route) };
      }
      return result;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err.message || 'Action failed';
      return { success: false, message: errorMsg };
    }
  }

  // Navigation actions — validate route before navigating
  if (actionType === 'navigate' || actionType === 'refresh_pricing' || actionType === 'start_grading') {
    let route = details.route;
    if (actionType === 'refresh_pricing' || actionType === 'start_grading') {
      route = details.collectible_id ? `/collectible/${details.collectible_id}` : null;
    }
    if (!route || !isValidRoute(route)) {
      return { success: false, message: `Invalid or unknown route: ${route || 'none'}. This destination may not exist.` };
    }
    navigate(route);
    return { success: true, message: 'Navigating', route };
  }

  // Legacy client-side actions
  switch (actionType) {
    case 'create_binder': {
      const binder = await base44.entities.CollectionBinder.create({
        user_id: user.id,
        name: details.name || action.title,
        description: details.description || '',
        target_count: details.target_count || 0,
        binder_type: 'custom',
        privacy_status: 'private',
      });
      return { success: true, message: `Created binder "${binder.name}"`, route: `/binder/${binder.id}`, navigate: () => navigate(`/binder/${binder.id}`) };
    }

    case 'create_goal': {
      const goal = await base44.entities.CollectionGoal.create({
        user_id: user.id,
        title: details.title || action.title,
        goal_type: details.goal_type || 'custom',
        target_count: details.target_count || 0,
        status: 'active',
      });
      return { success: true, message: `Created goal "${goal.title}"`, route: '/goals', navigate: () => navigate('/goals') };
    }

    default:
      return { success: false, message: `Unknown action: ${actionType}` };
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
  { label: 'What can you do?', question: 'What features and actions can you perform for me? List your capabilities.' },
  { label: 'Where are Master Binders?', question: 'Where are Master Binders located in the app? How do I find them?' },
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
  prompts.push({ label: 'What can you do?', question: 'What features and actions can you perform for me?' });

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