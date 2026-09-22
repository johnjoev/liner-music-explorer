# Liner — Music explorer

A searchable music catalogue built for the dashboard hiring assignment. Browse 3,503 Chinook tracks using cascading multi-select filters, server-side search, and pagination.

**Live app:** https://liner-music-explorer.vercel.app

**Public repository:** https://github.com/johnjoev/liner-music-explorer

**Status (23 September 2026):** deployed successfully to Vercel with Supabase configuration. Cloud PostgreSQL contains 3,503 tracks. Production authentication redirects are configured; the login page returns HTTP 200 and anonymous catalogue requests return HTTP 401. A confirmed-email account is required to access the dashboard. The final live sign-up/sign-in and authenticated dashboard check awaits the project owner.

## Run the working local preview

Requires Node.js 20.9+ and npm. Developed and checked with Node.js on Windows.

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:3000. This explicitly enables a development-only PostgreSQL preview powered by PGlite. It imports the same SQL schema and Chinook seed used for Supabase and runs the same query function. It has no live login and displays a preview banner. The preview database is temporary and recreated when the development process restarts.

`npm run dev` starts the normal Supabase-backed application. Without environment settings it displays an honest setup screen. Production never permits local preview, even if `LOCAL_PREVIEW=true` is accidentally configured.

## Features

- Multi-select **Genre → Artist → Album** filters. Changing an upstream filter clears downstream selections and resets the page. Options are calculated by PostgreSQL from the upstream selection.
- Case-insensitive, literal substring search across track, artist, album, and composer. Search combines with selected filters and is debounced by 300 ms.
- Server-side pagination: 10, 20, or 50 rows, previous/next, current page, total count, and jump-to-page (press Enter).
- Matching track/artist/album counts, total listening duration, and a top-five genre breakdown.
- Email/password sign-up and login, email-confirmation callback, sign-out, server-verified access, and database row-level security. Deployed with Supabase; final confirmed-email login verification is pending.
- Responsive interface, keyboard-accessible checkboxes, loading/error/empty states, and cancelled stale requests.

## Architecture

```text
Browser dashboard
  → GET /api/catalogue (validates inputs and Supabase identity)
    → Supabase RPC: explore_catalogue(...)
      → PostgreSQL tracks table with RLS
      ← matching page, counts, valid filter options, genre distribution
```

Next.js 16 App Router and TypeScript provide the UI and backend. Supabase provides hosted PostgreSQL and password authentication. Vercel hosts the production app. The browser never downloads the entire track dataset to implement filtering or pagination. Dropdown options are returned separately from the requested track page.

`explore_catalogue` is a `SECURITY INVOKER` function, so RLS remains active. Only the authenticated role has read/execute privileges; neither anonymous users nor authenticated users may modify tracks. The backend verifies the user with `getUser()`, and the Next.js proxy refreshes session cookies. No service-role key is required.

Values within one filter use OR; separate filters and search use AND. Facet options reflect upstream filters independently of the search term, so typing a search does not destroy selections or hide the choices needed to recover. Track ordering is `lower(title), id`, which makes pagination deterministic. Limits and page numbers are validated and clamped. Search symbols such as `%` and `_` are literal characters, not SQL wildcards. RPC parameters are passed separately from SQL.

For this 3,503-row dataset, a straightforward substring search is adequate. At substantially larger scale, add an appropriate text-search index and move large dropdown lists to paginated option endpoints.

## Files to review

| Location                      | Responsibility                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `components/dashboard.tsx`    | Search, cascading selection state, request cancellation, table, and pagination |
| `app/api/catalogue/route.ts`  | Authentication, validated request parameters, and database RPC                 |
| `database/001_schema.sql`     | Table, access policies, and query function                                     |
| `database/002_seed.sql`       | Repeatable music-catalogue import                                              |
| `components/auth-form.tsx`    | Sign-up and sign-in forms                                                      |
| `lib/supabase.ts`, `proxy.ts` | Server cookies and session refresh                                             |
| `lib/local-preview.ts`        | Explicit development-only PostgreSQL preview                                   |
| `tests/`                      | Database and browser integration tests                                         |

## Supabase setup (for reproducing this project)

1. Create a Supabase project. In its SQL Editor, run `database/001_schema.sql`, then `database/002_seed.sql`. These scripts create the application table; they do not drop or create the hosting database.
2. Copy `.env.example` to `.env.local`. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the project's Connect dialog. Use the publishable key, never a service-role or secret key. `.env.local` is ignored by Git.
3. In Auth settings, enable Email/password. Set the site URL to `http://127.0.0.1:3000` for local testing, and allow `http://127.0.0.1:3000/auth/callback` as a redirect URL. Keep email confirmation enabled. For custom confirmation templates, preserve Supabase's confirmation URL.
4. Stop local preview and run `npm run dev`. Create an account, confirm the email in the same browser, sign in, explore the catalogue, and sign out. Confirm that signed-out access to `/api/catalogue` returns HTTP 401.
5. Confirm the imported total is 3,503 tracks. No local CSV/JSON or PGlite is used in this mode.

The seed includes all Chinook media tracks, including some TV and video entries. Prices are USD. Duration statistics include those entries.

## Vercel deployment (for reproducing this project)

1. Import the GitHub repository into Vercel as a Next.js project.
2. Set the two Supabase environment variables above for the required deployment environments. Do not set `LOCAL_PREVIEW`.
3. Deploy using the default Next.js build settings (`npm run build`).
4. Update Supabase's site URL to the production URL and allow the production `/auth/callback` URL. Add only preview callback URLs you actually need.
5. Repeat the authentication and filter checks on the live URL. Test in a fresh browser session. Share the live URL and a repository reviewers can access.

## Checks

```sh
npm test
npm run test:ui
npm run typecheck
npm run build
npm run test:production
```

Database tests run the actual schema, seed, and RPC in PGlite, including role permissions, multiselect behavior, search, stable pagination, boundary conditions, and repeat imports. Browser tests use installed Google Chrome through Playwright and run the local preview automatically if it is not already running. If Chrome is unavailable, install it or change the Playwright channel configuration to a browser you have installed.

The production smoke test runs on port 3001 after a build, deliberately sets the preview flag, and confirms that production still refuses local preview and rejects a cross-origin sign-out request.

Passing local tests does not establish that Supabase email delivery, cloud credentials, hosted RLS integration, or the Vercel deployment work. The cloud import, production deployment, redirect configuration, and anonymous API protection are verified. Live email delivery and the authenticated dashboard flow still need a confirmed account check.

## Data source and attribution

[Chinook Database](https://github.com/lerocha/chinook-database), version 1.4.5, by Luis Rocha, MIT licensed. The original music catalogue comes from an iTunes library. This project imports only artist, album, genre, and track fields; no customer or employee records are included. The upstream license is preserved in `database/CHINOOK_LICENSE.md`.

To regenerate the seed, download `ChinookDatabase/DataSources/Chinook_PostgreSql.sql` from the upstream repository to `chinook-source.sql`, then run `node scripts/prepare-seed.mjs`. The generator extracts only the four catalogue tables and skips upstream database-management commands. Run the database tests afterward.

## Short demo for the hiring review

1. Sign up/sign in on the final connected app.
2. Select Rock, then AC/DC. Album choices narrow to the two matching albums.
3. Select an album, then change the genre selection. Downstream selections clear.
4. Combine multiple genres with a track or artist search.
5. Change rows per page, use Next/Previous, and jump to a page.
6. Show the SQL function and explain why filtering and pagination happen in PostgreSQL.
7. Sign out and show that the protected data endpoint rejects anonymous access.

See `PROJECT_BRIEF.md` for the original scoring checklist.
