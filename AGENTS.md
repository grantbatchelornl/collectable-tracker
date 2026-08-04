# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## COLLECTABLE Tracker — Global Build Rules

1. Maintain architectural consistency with the existing application.
2. Integrate features into existing workflows instead of creating duplicate pages or duplicate data.
3. Design mobile-first with large touch targets and simple navigation.
4. Preserve existing users and records — never delete user data during refactors.
5. Only seven collectible categories are approved: Pokémon, Magic: The Gathering, Disney Lorcana, Sports Cards, Funko Pop!, Coins, Sports Memorabilia. Do not add any other category.
6. Never expose private user data. Use RLS on every entity that stores user content.
7. Never place secret API keys in frontend code — use backend integrations.
8. AI-generated data must be labeled as AI-generated (value_source, confidence, comparables_count).
9. AI must not silently overwrite confirmed user-entered information — use the Value Lock mechanism.
10. Use soft deletion for important user records.
11. Record important administrative actions in the AuditLog entity.
12. Use backend permission checks (RLS) rather than only hiding buttons.
13. Do not introduce payments or subscriptions.
14. Do not add family accounts or family plans.
15. Pricing must use completed sold transactions only — never use unsold asking prices as market value.