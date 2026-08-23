# COLLECTABLE Tracker — Hardening V1

Changes applied to this working copy:

- Enforced explicit user confirmation at the Collector AI backend executor before write actions.
- Removed pricing-engine market fields (`estimated_value`, `low_value`, `high_value`, `value_locked`) from Collector AI's editable collectible whitelist.
- Locked Collector AI capability text to the seven approved collectible categories.
- Removed the misleading backend `refresh_pricing` capability claim; pricing refresh remains a validated navigation action.
- Added Discover and League Detail to the validated Collector AI route registries.
- Added a route-parity check to prevent frontend/backend AI route registries from drifting away from application routes.
- Added route-level React lazy loading/Suspense so feature-heavy pages are downloaded on demand rather than all at initial startup.
- Added `npm run check:routes` and aggregate `npm run check` scripts.

Validation performed:

- Route registry parity: PASS (33 application routes).
- Full npm install/build/typecheck could not be completed in the execution environment because dependency installation exceeded the available execution window. Run `npm ci && npm run check` locally or in CI before deployment.

No database schema, user data, sold-pricing methodology, or supported product categories were added or removed.
