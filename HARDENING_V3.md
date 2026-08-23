# COLLECTABLE Tracker — Hardening & Performance V3

V3 contains all V1 and V2 changes, plus:

## Trade security
- Trade creation now goes through `createTrade`.
- Trade status changes now go through `updateTradeStatus`.
- Trade reviews now go through `submitTradeReview`.
- Direct client-side Trade create/update/delete is disabled by RLS.
- Direct client-side TradeReview creation is disabled by RLS.
- Backend recalculates trade item values from real collectible records instead of trusting client-supplied values.
- Backend verifies offered-item ownership.
- Backend verifies requested-item ownership, visibility, and trade availability.
- Backend enforces valid status transitions and which party may perform them.
- Backend blocks trades between blocked/suspended accounts.
- Trade creation is rate limited.
- Trade notifications and audit records are emitted server-side.

## Trade reputation correctness
- Review eligibility is verified against an actual completed trade.
- A user can review a completed trade only once.
- The reviewed user is derived from the trade rather than trusted from the client.
- Ratings are clamped to 1–5 server-side.
- Reputation averages are recalculated server-side.
- `total_completed_trades` is recalculated from completed trades instead of incrementing once per review.

## Query isolation
- Messages now loads incoming/outgoing trades explicitly instead of using broad `Trade.list()`.
- Trade offer modal only displays public items actually marked Trade or Sell.

## Achievement integrity
- Friend achievements count accepted relationships in either direction.
- Trade achievements count completed trades in either direction and deduplicate them.
- Value milestone achievements use verified completed-sale values only, preventing manual-value inflation.

## Regression coverage
- Added static security invariant checks.
- Added Collector AI action parity checks.
- Added deployed runtime security tests for direct trade creation, direct review creation, and self-trade rejection.
- Existing route parity check remains enabled.

## Validation completed
- Route parity: PASS — 33 application routes.
- Static security invariants: PASS.
- Collector AI write-action parity: PASS — 8 actions.
- Node syntax checks for modified non-JSX frontend modules: PASS.
- Direct trade-write scan: PASS — only backend service-role functions contain trade create/update/review writes.

## Build limitation
A complete `npm ci` / Vite production build could not be completed in this environment because dependency installation exceeded the execution window. Run `npm ci && npm run check` before deployment.

## Remaining recommended work
1. True collection pagination/infinite loading beyond the current bounded query limits.
2. Production bundle profiling and safe removal of unused dependencies.
3. Full browser/device smoke testing.
4. Runtime execution of `securityTests` after Base44 deployment.
5. End-to-end trade tests with two separate real test accounts.
