# Hiring test: data exploration dashboard

Source: user-provided hiring-test screenshot. Its examples illustrate the requirements; they do not mandate a particular dataset. Selected dataset: Chinook music catalogue.

Deadline shown: Wednesday, 23 September (year omitted in the source).

## Acceptance checklist

- [x] Dashboard using a documented dataset of our choice — 10 points.
- [ ] Data imported into cloud-hosted PostgreSQL and queried by the application backend — 20 points. Local CSV/JSON must not be the runtime data source.
- [x] Multi-select filters with cascading options — 25 points. Options in later filters reflect earlier selections; downstream selections are cleared when upstream selections change.
- [x] Paginated data view with previous/next controls and page indicator — 15 points. Stable ordering and page reset when filters or search change.
- [x] Search across relevant text fields, combined with filters — 10 points.
- [ ] Email/password sign-up and login, with the dashboard protected — 25 bonus points.
- [ ] GitHub repository with incremental, meaningful commit history and a shareable link — 10 points.
- [ ] Working Vercel deployment and shareable URL — 10 points.

Base total: 100 points. Including authentication: 125 points.

## Proposed implementation

Next.js and TypeScript for the interface and backend; Supabase for hosted PostgreSQL and authentication; Vercel for deployment. User has GitHub and requested that all local work be completed before Supabase and Vercel setup.

Database queries should perform search, filtering, total counts, and pagination. Do not fetch the entire dataset and paginate only in the browser. Use parameterized queries or typed database RPC arguments. Keep privileged credentials on the server, out of Git.

Build in reviewable stages: project setup; schema and import; data queries; dashboard and filters; authentication; verification and deployment. Record actual commits as work progresses.

## Verification scenarios

1. Select multiple values in the first filter; confirm the next filter contains only valid options.
2. Change an upstream selection; confirm invalid downstream selections are cleared.
3. Combine search and filters; confirm both the table and total count agree.
4. Navigate multiple pages; confirm stable order, no overlap, and correct first/last-page controls.
5. Search for no matches; show a useful empty state and a way to clear constraints.
6. Sign up, sign in, sign out; verify unauthenticated users cannot query protected dashboard data.
7. Confirm the deployed app reads the cloud database and does not depend on local files.
8. Verify desktop/mobile layout, keyboard controls, loading states, and failed-query handling.

## Delivery status

Local application, actual PostgreSQL query tests, browser interaction tests, database import scripts, authentication implementation, and setup documentation are complete. Authentication is not checked off because live email/password flows still require Supabase. Cloud PostgreSQL and Vercel deployment are intentionally deferred. The local preview uses the same SQL through development-only PGlite, not a cloud connection.
