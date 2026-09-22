# ConsentKey — Cloudflare Workers + D1 + Resend backend

This replaces the old Express (`server.ts` + `server/realDataStore.ts`) backend,
which cannot run on Cloudflare Workers (no persistent filesystem, no long-running
Node process). The new backend runs as a Cloudflare Worker and stores data in
a real D1 (SQLite-compatible) database, and sends real verification emails
through Resend.

## 1. Files in this package

- `wrangler.jsonc` — replaces your existing one (adds `main`, D1 binding, `run_worker_first`)
- `package.json` — replaces your existing one (adds `hono`, `wrangler`, removes Express)
- `src/worker/index.ts` — the new Worker (all `/api/*` routes)
- `src/worker/db.ts` — D1 data access (replaces `server/realDataStore.ts`)
- `src/worker/email.ts` — Resend magic-link email sender
- `migrations/0001_init.sql` — D1 database schema

## 2. Local setup steps

1. Copy all the files above into your `ConsentKey` project, overwriting the
   existing `wrangler.jsonc` and `package.json`.
2. Delete the old backend files (no longer used):
   ```bash
   git rm server.ts
   git rm -r server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## 3. Create the D1 database

```bash
npx wrangler login          # opens a browser to authorize
npx wrangler d1 create consentkey-db
```

This prints a `database_id`. Copy it into `wrangler.jsonc`, replacing
`REPLACE_WITH_YOUR_DATABASE_ID`.

Then apply the schema:

```bash
npm run db:migrate:remote
```

## 4. Get a Resend API key (free tier is enough)

1. Sign up at https://resend.com (free).
2. Create an API key (Dashboard → API Keys).
3. For quick testing you can send from `onboarding@resend.dev` (Resend's
   shared sandbox sender — works immediately, no domain setup needed).
   For production, verify your own domain in Resend and change
   `MAGIC_LINK_FROM_EMAIL` in `wrangler.jsonc` to an address on that domain.

## 5. Add the secret to Cloudflare

In the Cloudflare dashboard: **Workers & Pages → consentkey → Settings →
Variables and Secrets → Add** →
- Name: `RESEND_API_KEY`
- Value: (paste your Resend API key)
- Type: **Secret** (encrypted)

Optionally also add `GEMINI_API_KEY` there the same way if you want the AI
Maps feature.

## 6. Commit and push

```bash
git add wrangler.jsonc package.json src/worker migrations README-DEPLOY.md
git commit -m "Rebuild backend for Cloudflare Workers + D1 + Resend magic link"
git push
```

Cloudflare will auto-build and deploy. Watch the **Deployments** tab.

## 7. Test it

Register a real account on the live site. You should now get:
- A real row in D1 (verifiable with
  `npx wrangler d1 execute consentkey-db --remote --command="SELECT * FROM users"`)
- A real verification email in your inbox from Resend, with a working
  "Verify my email" magic link
