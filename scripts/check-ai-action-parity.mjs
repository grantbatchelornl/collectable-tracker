import fs from 'node:fs';
const chat = fs.readFileSync('base44/functions/collectorAIChat/entry.ts', 'utf8');
const execute = fs.readFileSync('base44/functions/collectorAIExecute/entry.ts', 'utf8');

const advertisedWriteActions = [
  'update_profile', 'update_collectible', 'update_binder', 'add_to_wishlist',
  'mark_for_trade', 'toggle_favorite', 'toggle_showcase', 'delete_binder',
];
const missing = advertisedWriteActions.filter((a) => !execute.includes(`case '${a}'`));
const unadvertised = advertisedWriteActions.filter((a) => !chat.includes(`"${a}"`));

if (missing.length || unadvertised.length) {
  console.error(JSON.stringify({ missingExecutorCases: missing, missingChatActions: unadvertised }, null, 2));
  process.exit(1);
}
console.log(`Collector AI action parity OK: ${advertisedWriteActions.length} write actions.`);
