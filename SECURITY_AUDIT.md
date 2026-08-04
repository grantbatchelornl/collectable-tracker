# COLLECTABLE Tracker — Security Audit Report

**Audit Date:** 2026-08-04  
**Auditor:** Base44 AI  
**Scope:** Application-level security (RLS, frontend authorization, data exposure, input handling)

---

## ⚠️ Important Disclaimer

This review reduces known risk but does **not** replace an independent professional penetration test. Do not claim the application is "fully secure," "unhackable," or has "no vulnerabilities." An independent pen test is required before handling substantial user volume, sensitive data, or payments.

---

## 1. Security Surface Inventory

### Entities (27 total)
| Entity | Ownership | Public Read? | RLS Status |
|--------|-----------|-------------|------------|
| Collectible | Per-user | Public records only | ✅ Enforced |
| CollectorProfile | Per-user | Owner+admin only | ✅ Fixed (Finding #6) |
| CollectionBinder | Per-user | Public records only | ✅ Enforced |
| Watchlist | Per-user | Public records only | ✅ Enforced |
| CollectiblePhoto | Per-user | Owner+admin only | ✅ Enforced |
| PricingHistory | Per-user | Owner+admin only | ✅ Enforced |
| SoldComparable | Per-user | Owner+admin only | ✅ Enforced |
| AIAnalysis | Per-user | Owner+admin only | ✅ Enforced |
| AIReviewQueue | Per-user | Owner only | ✅ Enforced |
| HallOfFame | Per-user | Owner+admin only | ✅ Enforced |
| Trade | Participant | Participant+admin | ✅ Enforced |
| TradeReview | Per-user | Yes (all) | ✅ Intentional |
| Message | Participant | Participant+admin | ✅ Enforced |
| Follow | Participant | Participant+admin | ✅ Enforced |
| Notification | Per-user | Recipient+admin | ✅ Enforced |
| Achievement | Per-user | Yes (all) | ✅ Fixed (Finding #5) |
| AchievementTemplate | Admin | Yes (all) | ✅ Admin-only writes |
| CollectionGoal | Per-user | Owner+admin only | ✅ Enforced |
| CollectionFolder | Per-user | Owner only | ✅ Enforced |
| CollectionHealth | Per-user | Owner only | ✅ Enforced |
| CollectionValueSnapshot | Per-user | Owner only | ✅ Enforced |
| League/Member/Activity/Challenge | Social | Yes (all) | ✅ Intentional |
| Report | Per-user | Reporter+admin | ✅ Enforced |
| UserBlock | Per-user | Blocker+admin | ✅ Enforced |
| FoundingCollector | Per-user | Yes (all) | ✅ Intentional |
| AppFeatureFlag | Admin | Yes (all) | ✅ Admin-only writes |
| AppSetting | Admin | Yes (all) | ⚠️ See Finding #8 |
| AuditLog | Admin | Admin only | ✅ Immutable |
| CollectibleCategory | Admin | Yes (all) | ✅ Admin-only writes |
| User (built-in) | Platform | Platform-managed | Platform-managed |

### Routes (34 total)
All authenticated routes are gated behind `ProtectedRoute`. Auth pages (login, register, reset) are public. RLS enforces data access on all protected routes.

### External Integrations
- **Core/InvokeLLM** — AI identification, pricing, recommendations
- **Core/UploadFile** — Image uploads (stored on Wix Media Platform)
- **Core/SendEmail** — Registered users only
- **Core/GenerateImage/Video/Speech** — AI content generation

No external API connectors authorized yet. No backend functions with secrets.

---

## 2. Vulnerabilities Found & Fixes Applied

### Finding #1 — CRITICAL: Self-promotion to Super Admin
**Severity:** Critical  
**Root Cause:** The `claimSuperAdmin()` function in AdminDashboard allowed ANY authenticated user to call `User.update(myId, { role: 'super_admin' })`, self-promoting to the highest privilege level. The bootstrap UI was shown to non-admin users.  
**Fix Applied:** Removed the `claimSuperAdmin()` function, the `claiming` state, the `superAdminClaimed` state, and the bootstrap UI entirely. Non-admins now see "Access Denied." Super Admin must be assigned through the Base44 platform dashboard.  
**Test:** Verified the bootstrap UI and function are removed; the access-denied path handles non-admins.

### Finding #2 — HIGH: CollectibleDetail exposed edit controls to non-owners
**Severity:** High  
**Root Cause:** CollectibleDetail.jsx rendered Edit, Delete, Privacy, For Sale, Value Lock, Showcase, Trade Status, and Refresh Pricing controls to ALL viewers, including non-owners viewing public collectibles. While RLS blocked the actual operations, exposing controls to unauthorized users is a security anti-pattern. Additionally, `allCollectibles` was fetched using the collectible owner's ID (`c.created_by_id`) rather than the viewer's ID, potentially feeding another user's collection data into AI recommendations.  
**Fix Applied:** Added `useAuth` and `isOwner` check. All edit controls are now wrapped in `{isOwner && (...)}`. The `allCollectibles` fetch now uses `user.id` (the viewer's own collection). The Share button remains visible to all.  
**Test:** Verified that edit controls are hidden when viewing another user's public collectible.

### Finding #3 — MEDIUM: Chat did not enforce blocks before sending
**Severity:** Medium  
**Root Cause:** Chat.jsx's `sendMessage()` did not check if either party had blocked the other. A blocked user could still send messages. The `UserBlock` entity RLS has no cross-entity enforcement on `Message.create`.  
**Fix Applied:** Created the `sendMessage` backend function that enforces blocks bidirectionally, rate limits (30 msgs/hour), checks suspended status, and creates the message via service role. Changed Message entity RLS `create` to `system_only` — direct client-side `Message.create()` is now blocked by RLS. Chat.jsx now routes all sends through the backend function. Block status is loaded via the `getPublicProfile` backend function (service role, reliable).  
**Status:** **FIXED** — server-side enforcement via backend function + RLS lock-down.  
**Test:** Verified the backend function rejects messages to/from blocked users and that direct SDK Message.create is blocked by RLS.

### Finding #4 — LOW: Chat loaded all messages instead of filtering
**Severity:** Low (performance/data minimization)  
**Root Cause:** `Chat.jsx` called `Message.list('-created_date', 500)` which returned ALL messages involving the current user, then filtered client-side to the specific conversation. While RLS ensured only the user's own messages were returned, this unnecessarily loaded data for all conversations.  
**Fix Applied:** Replaced with two targeted `Message.filter()` calls: one for sent messages to the recipient, one for received messages from the sender. Results are merged and sorted.  
**Test:** Verified messages load correctly with the filtered approach.

### Finding #5 — MEDIUM: Achievement self-awarding
**Severity:** Medium  
**Root Cause:** The `Achievement` entity's RLS allowed any user to `create` achievement records for themselves. The `user_id` field was client-supplied, enabling fake achievements.  
**Fix Applied:** Created the `awardAchievements` backend function that fetches the user's data (collectibles, follows, trades) via service role, evaluates all badge conditions server-side, and creates Achievement records via service role. Changed Achievement entity RLS `create` to `system_only` — direct client-side `Achievement.create()` is now blocked. Created `manualAchievement` backend function for super_admin overrides. The frontend `checkAndAwardBadges()` now calls the backend function instead of creating records directly.  
**Status:** **FIXED** — server-side validation via backend function + RLS lock-down.  
**Test:** Verified direct SDK Achievement.create is blocked by RLS and the backend function correctly awards badges.

### Finding #6 — MEDIUM: CollectorProfile exposes all fields publicly
**Severity:** Medium  
**Root Cause:** `CollectorProfile` had `read: true`, exposing ALL fields to any authenticated user — including `budget`, `goals`, `risk_tolerance`, AI settings, convention location, and other private preferences.  
**Fix Applied:** Changed CollectorProfile RLS `read` from `true` to owner+admin only (`created_by_id: {{user.id}}` + admin/super_admin). Created the `getPublicProfile` backend function (single user) and `getPublicProfiles` backend function (bulk) — both use service role to read profiles and strip private fields via `filterPublicProfile()`. Only public-safe fields (display_name, username, bio, profile_photo, reputation, XP, leaderboard opt-in, privacy toggles) are returned. Convention-mode location data is only included when the user has explicitly opted in (`convention_mode_active: true`). Updated all 6 frontend files that read other users' profiles (Chat, TradeBinder, Discover, leaderboard, convention mode, trade center) to route through these backend functions.  
**Status:** **FIXED** — RLS lock-down + server-side field filtering via backend functions.  
**Test:** Verified `getPublicProfiles` returns only public fields; private fields (budget, goals, risk_tolerance, AI settings) are stripped.

### Finding #7 — LOW: Admins can promote to super_admin via SDK
**Severity:** Low (requires admin access first)  
**Root Cause:** The `setRole()` function in AdminDashboard called `User.update(u.id, { role })` directly via the client SDK. A regular admin could call the SDK from the browser console to set any role including 'super_admin'. This is a platform-level limitation — the Base44 built-in User security allows admins to update user records without field-level restrictions.  
**Fix Applied:** Created the `updateUserRole` backend function that verifies the caller is an admin, enforces role hierarchy (admins can only set 'admin' or 'user', cannot target super_admins, cannot modify self), and performs the update via service role. AdminDashboard now routes all role changes through this function.  
**Remaining Risk:** Platform-level — the built-in User entity allows admins to call `User.update()` directly from the SDK. This cannot be blocked from the app side; it requires platform-level field restrictions on the User entity.  
**Status:** **FIXED (app-level)** — backend function enforces authorization server-side. Platform-level SDK bypass remains a known limitation.  
**Test:** Verified the backend function rejects unauthorized role changes and self-promotion attempts.

### Finding #8 — LOW: AppSetting public read could expose secrets if misused
**Severity:** Low  
**Root Cause:** `AppSetting` has `read: true`. If an admin stores API keys or secrets in this entity, they would be publicly readable. Currently only non-sensitive settings (alert thresholds) are stored here.  
**Status:** Not fixed — no secrets are currently stored.  
**Recommendation:** Document that `AppSetting` must never contain secrets. Use platform secrets (`set_secrets`) for API keys. Never store secrets in any entity.

---

## 3. What Was Tested

### RLS Enforcement (Verified via code audit)
- ✅ Private collectibles are not returned to other users via `Collectible.filter`
- ✅ Public collectibles are returned to all users
- ✅ PricingHistory is owner-only (not visible on public collectible views)
- ✅ CollectiblePhoto is owner-only (not visible on public collectible views)
- ✅ Messages are only returned to sender/recipient
- ✅ Trades are only returned to participants
- ✅ Notifications are only returned to the recipient
- ✅ AIReviewQueue is owner-only
- ✅ CollectionFolder/Health/ValueSnapshot are owner-only
- ✅ AuditLog is admin-only and immutable (update: false)
- ✅ HallOfFame is owner+admin only
- ✅ Reports are reporter+admin only
- ✅ UserBlock is blocker+admin only
- ✅ Admin entities (AppSetting, AppFeatureFlag, CollectibleCategory, AchievementTemplate) are admin-only for writes

### Frontend Authorization (Verified via code audit)
- ✅ Home.jsx uses `user.id` from auth context for all queries
- ✅ Collection.jsx uses `user.id` for filtering
- ✅ PublicProfile.jsx filters collectibles by `privacy_status: 'public'`
- ✅ TradeBinder.jsx only shows items with `trade_status: 'trade'` or `'sell'`
- ✅ Discover.jsx filters out current user's own records
- ✅ AdminDashboard role-setting UI is super_admin-only, prevents self-modification

### Input Handling (Verified via code audit)
- ✅ React's default JSX escaping prevents stored XSS in all rendered text
- ✅ No use of `dangerouslySetInnerHTML` found in any reviewed file
- ✅ No user content rendered in `href` attributes (prevents javascript: URLs)
- ✅ No SQL injection risk (Base44 SDK uses parameterized queries)

### Authentication (Platform-managed, verified via documentation)
- ✅ Passwords handled by Base44 platform (never stored in plaintext)
- ✅ Password reset uses generic success (doesn't reveal email existence)
- ✅ OTP flow for registration (multi-step, can't shortcut)
- ✅ Session management handled by platform
- ✅ Google OAuth supported
- ✅ Hard redirects after auth (not navigate()) used correctly

---

## 4. What Could NOT Be Tested

### Platform-Level Controls (Managed by Base44)
- ❌ Rate limiting (login, registration, API calls)
- ❌ CSRF protection
- ❌ Content Security Policy headers
- ❌ Cookie security flags (HttpOnly, Secure, SameSite)
- ❌ HTTPS enforcement
- ❌ Session expiration duration
- ❌ Brute-force protection
- ❌ Account lockout after failed logins
- ❌ New-device login notifications
- ❌ MFA enforcement for admin accounts
- ❌ File upload content validation (file type, size, dimensions)
- ❌ Malware scanning of uploads
- ❌ Webhook signature verification
- ❌ Cross-origin resource sharing (CORS) configuration
- ❌ Backup encryption and access controls

### Backend Functions (Implemented)
- ✅ `sendMessage` — server-side block enforcement + rate limiting (Finding #3)
- ✅ `awardAchievements` — server-side achievement validation (Finding #5)
- ✅ `manualAchievement` — super_admin achievement overrides (Finding #5)
- ✅ `updateUserRole` — server-side role change authorization (Finding #7)
- ✅ `getPublicProfile` — single-user public profile with field filtering (Finding #6)
- ✅ `getPublicProfiles` — bulk public profiles with field filtering (Finding #6)
- ❌ Server-side trade value calculation (deferred)
- ❌ Server-side leaderboard calculation verification (deferred)
- ❌ Server-side rate limiting for AI/scanner operations (deferred)

### Requires External Configuration
- ❌ Domain HTTPS certificate
- ❌ DNS security (DNSSEC)
- ❌ Email authentication (SPF, DKIM, DMARC)
- ❌ OAuth app configuration (Google, Apple)
- ❌ Push notification certificates
- ❌ App Store / Google Play credentials
- ❌ External API key rotation
- ❌ Independent penetration testing

---

## 5. Remediation Priority

| Priority | Finding | Status |
|----------|---------|--------|
| ✅ Critical | #1: Self-promotion to super_admin | **FIXED** |
| ✅ High | #2: Edit controls exposed to non-owners | **FIXED** |
| ✅ Medium | #3: Block enforcement | **FIXED** — backend function + RLS lock-down |
| ✅ Low | #4: Chat message over-fetching | **FIXED** |
| ✅ Medium | #5: Achievement self-awarding | **FIXED** — backend function + RLS lock-down |
| ✅ Medium | #6: CollectorProfile field exposure | **FIXED** — RLS lock-down + server-side filtering |
| ✅ Low | #7: Admin role escalation via SDK | **FIXED (app-level)** — backend function (platform SDK bypass remains) |
| ⚠️ Low | #8: AppSetting secret exposure risk | **DOCUMENTED** — policy: never store secrets |

---

## 6. Manual Checklist (Requires External Verification)

- [ ] Configure HTTPS with valid SSL certificate
- [ ] Enable DNSSEC on domain
- [ ] Set up SPF, DKIM, DMARC for email
- [ ] Verify Google OAuth app configuration and scopes
- [ ] Configure Apple Sign-In (if supported)
- [ ] Rotate all API keys before production
- [ ] Verify backup encryption and access controls
- [ ] Secure App Store / Google Play credentials
- [ ] Configure push notification certificates
- [ ] Review external API permissions and scopes
- [ ] Conduct independent penetration testing
- [ ] Legal privacy review of data retention policies
- [ ] Set Super Admin role via Base44 dashboard (not via app)
- [ ] Configure rate limits at platform level if available
- [ ] Set up monitoring/alerting for suspicious activity
- [ ] Verify no secrets in environment variables are exposed to frontend
- [ ] Review and remove any test credentials

---

## 7. Architecture Notes

### What Works Well
- **RLS is consistently applied** across all 27 entities with appropriate ownership rules
- **Privacy status** on Collectible and CollectionBinder is enforced at the RLS level, not just UI
- **Admin access** is role-based with `user_condition` checks
- **AuditLog** is immutable (`update: false`) and admin-only
- **Soft deletion** is used for collectibles (is_deleted flag) with restore capability
- **React's built-in XSS protection** prevents script injection in all rendered content
- **No `dangerouslySetInnerHTML`** usage found anywhere in the codebase
- **No client-supplied user IDs** trusted for ownership (all use `user.id` from auth context)
- **PublicProfile** correctly filters to `privacy_status: 'public'` collectibles only

### Platform Limitations
- Base44 RLS is per-record, not per-field — cannot restrict individual fields within an entity
- No cross-entity RLS validation — cannot prevent Message.create based on UserBlock status
- Rate limiting, CSRF, CSP, and cookie security are platform-level, not configurable from the app
- The platform's built-in User security allows admins to update user records without field-level restrictions

---

**Recommended Next Security Review:** Before enabling any payment integration or opening to public registration. Findings #1–#7 are now fixed at the app level; remaining items are platform-level limitations (#7 SDK bypass), policy recommendations (#8), deferred server-side validation (trade values, leaderboard), and external configuration (HTTPS, DNSSEC, pen test).

**Review completed by:** Base44 AI  
**Date:** 2026-08-04