import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const trade = JSON.parse(read('base44/entities/Trade.jsonc'));
const review = JSON.parse(read('base44/entities/TradeReview.jsonc'));
const executor = read('base44/functions/collectorAIExecute/entry.ts');
const caps = read('base44/shared/appCapabilities.ts');
const frontendFiles = [
  'src/components/social/TradeOfferModal.jsx',
  'src/components/social/TradeCard.jsx',
  'src/lib/tradeCenter.js',
  'src/lib/tradeHistory.js',
].map(read).join('\n');

const failures = [];
const systemOnly = (rule) => rule?.user_condition?.role === 'system_only';

if (!systemOnly(trade.rls?.create)) failures.push('Trade.create must be backend-only');
if (!systemOnly(trade.rls?.update)) failures.push('Trade.update must be backend-only');
if (!systemOnly(trade.rls?.delete)) failures.push('Trade.delete must be backend-only');
if (!systemOnly(review.rls?.create)) failures.push('TradeReview.create must be backend-only');

for (const unsafe of ['entities.Trade.create(', 'entities.Trade.update(', 'entities.Trade.delete(', 'entities.TradeReview.create(']) {
  if (frontendFiles.includes(unsafe)) failures.push(`Unsafe frontend write found: ${unsafe}`);
}

for (const pricingField of ["'estimated_value'", "'low_value'", "'high_value'", "'value_locked'"]) {
  const whitelistStart = caps.indexOf('export const COLLECTIBLE_UPDATABLE_FIELDS');
  const whitelistEnd = caps.indexOf('];', whitelistStart);
  if (caps.slice(whitelistStart, whitelistEnd).includes(pricingField)) {
    failures.push(`Collector AI must not directly edit pricing-engine field ${pricingField}`);
  }
}

if (!executor.includes("if (actionType !== 'navigate' && !confirmed)")) {
  failures.push('Collector AI executor explicit confirmation guard is missing');
}

const supportedLine = 'Pokémon, Magic: The Gathering, Disney Lorcana, Sports Cards, Funko Pop!, Coins, and Sports Memorabilia.';
if (!caps.includes(supportedLine)) failures.push('Seven-category capability lock is missing');

if (failures.length) {
  console.error('Security invariant check failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('Security invariants OK.');
