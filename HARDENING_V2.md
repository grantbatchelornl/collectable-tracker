# COLLECTABLE Tracker — Hardening & Performance V2

This V2 includes all V1 changes plus the following improvements.

## Security / Data Isolation
- Explicitly scope Home, Collection, Data Quality, Time Machine, and Collector AI pricing-history queries to the authenticated user.
- Explicitly scope Data Quality photo queries to the authenticated user.
- Fix the trade-offer modal so “Your Items” always queries the authenticated user's collectibles instead of relying on broad RLS behavior. This prevents Admin/Super Admin normal-user mode from accidentally receiving other users' collectibles.

## Collector AI
- Increase collection context from 200 to 500 collectibles.
- Scope pricing-history context to the current user.
- Include both incoming and outgoing trades in Collector AI context.
- Deduplicate trades and correctly identify whether a pending trade was sent or received.
- Increase binder/watchlist/health context modestly while keeping response context bounded.
- Retain V1 explicit-confirmation enforcement and pricing-field protections.

## Performance / Correctness
- Increase collection data used for Home/Collection/Profile/Collectible Detail from 200 to 500 items to reduce incorrect totals for larger collections.
- Increase user-scoped pricing-history limits where historical calculations need additional records.
- Bulk Scanner now identifies up to 3 images concurrently instead of processing every image serially.
- Concurrency is deliberately bounded to avoid flooding the AI integration.
- Bulk Scanner thumbnails now use lazy loading and asynchronous decoding.
- Route-level React lazy loading from V1 remains enabled.

## Validation
- Route registry parity: PASS (33 app routes).
- Basic Node syntax check for non-JSX helper scripts: PASS.
- Full `npm ci` / production build could not complete in this execution environment because dependency installation exceeded the execution window. Run `npm ci && npm run check` locally or in CI before deployment.

## Remaining items recommended for a later pass
- Backend-authorized trade creation / trade state transitions rather than client-side trade writes.
- True pagination/infinite loading for collections larger than 500 records.
- More targeted pricing-history retrieval by collectible when Base44 query capabilities allow it.
- Bundle/dependency audit after a production build can be profiled.
- Full automated test suite for security-critical backend functions.
