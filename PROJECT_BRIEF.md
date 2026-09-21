# Hiring test: data exploration dashboard

Source: user-provided hiring-test screenshot. Its examples illustrate the requirements; they do not mandate a particular dataset. Dataset selection is pending.

Deadline shown: Wednesday, 23 September (year omitted in the source).

## Acceptance checklist

- [ ] Dashboard using a documented dataset of our choice — 10 points.
- [ ] Data imported into cloud-hosted PostgreSQL and queried by the application backend — 20 points. Local CSV/JSON must not be the runtime data source.
- [ ] Multi-select filters with cascading options — 25 points. Options in later filters must reflect earlier selections; invalid downstream selections must be removed.
- [ ] Paginated data view with previous/next controls and page indicator — 15 points. Use stable ordering and reset the page when filters or search change.
- [ ] Search across relevant text fields, combined with filters — 10 points.
- [ ] Email/password sign-up and login, with the dashboard protected — 25 bonus points.
- [ ] GitHub repository with incremental, meaningful commit history and a shareable link — 10 points.
- [ ] Working Vercel deployment and shareable URL — 10 points.

Base total: 100 points. Including authentication: 125 points.

## Proposed implementation

Next.js and TypeScript for the interface and backend; Supabase for hosted PostgreSQL and authentication; Vercel for deployment. Final dataset and available accounts are being clarified with the user.

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

Planning only. Application, database, repository publication, and deployment are not yet completed.
