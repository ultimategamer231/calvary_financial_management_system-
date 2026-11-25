# Dashboard handover

The dashboard opens on recorded movement for the current month in Monrovia. Read each currency separately. Net recorded movement is the selected period’s income minus its expenses. Recent entries appear immediately below and show up to eight allocation lines. A split receipt can appear more than once. The category section includes the full period.

## Open the local application

1. Start Docker Desktop and wait for its engine to be ready.
2. Open PowerShell in the repository folder. For the configured pilot, run `pnpm run db:start` if the local database is stopped. If the web server is already running, open [the dashboard](http://127.0.0.1:3107/dashboard).
3. To start the web server yourself, run `pnpm build`, then `pnpm start --hostname 127.0.0.1 --port 3107`. Leave this PowerShell window open. Stop that server with Ctrl+C when finished.
4. Sign in with one of the **fictional local** staff accounts. The operator can find the account details in the ignored local `.env.demo` file. Keep it private.
5. On the existing pilot, open [February 2030](http://127.0.0.1:3107/dashboard?from=2030-02-01&to=2030-02-28) to see the populated period used in the screenshots.

On a new computer, follow the [repository setup guide](../../README.md) first, including installing dependencies and generating local configuration. A new database starts empty. Use the repository’s clean-stack test sequence for fictional data. The existing pilot already has both staff slots assigned.

## Manual acceptance check

- Choose a date range and select **Update period**. Compare the date under the title with the requested range. Clear either date for an open-ended report. An invalid range offers a reset.
- For each currency compare recorded income, recorded expenses and net movement with **View full report** for the same filters. The register links open the original receipt or expense. A URL with extra filters identifies them above the overview and offers **Clear filters**.
- At phone width, compare the amount against its entry. Scroll the table sideways for the remaining columns. Swipe the navigation strip or tab through its links. At desktop width the same destinations are in the left rail.
- Try a period with no entries. Both currency summaries show zero, and the register explains how to select a different period. A service failure shows an error and a **Try again** button that requests the same URL.
- Sign out, reopen the dashboard, and verify that login is required. Staff account settings, reports, exports, receipts and evidence continue to use their established routes.

## Files and ownership

| Files | Responsibility |
| --- | --- |
| `app/(staff)/dashboard/page.tsx`, `dashboard.module.css` | Applied period, currency overview, record and category presentation, responsive styling |
| `app/(staff)/dashboard/loading.tsx`, `error.tsx` | Scoped progress, safe failure message and retry |
| `app/(staff)/layout.tsx`, `workspace-nav.tsx`, `workspace.css` | Church identity, ten workspace destinations, active location, keyboard skip link and sign-out |
| `app/(staff)/reports/report-ui.tsx` | Common monetary summary arithmetic and register renderer. Reports retain their existing columns. |
| `scripts/check-dashboard.mjs`, `.github/workflows/foundation.yml` | Read-only dashboard reconciliation, responsive and access regression check in the existing test workflow |
| `docs/dashboard-redesign/` | Audit, plan, test results and fictional screenshots |

The redesign uses the installed Next.js, React, Playwright and axe versions. It adds no dependencies, migrations, hosted assets or environment variables. Review the [audit](DASHBOARD_AUDIT.md), [plan](DASHBOARD_REDESIGN_PLAN.md) and [test report](DASHBOARD_TEST_REPORT.md) for coverage and limits.

| View | Original | Redesigned |
| --- | --- | --- |
| Desktop | [1440px before](screenshots/before/1440.png) | [1440px after](screenshots/after/1440.png) |
| Tablet | [768px before](screenshots/before/768.png) | [768px after](screenshots/after/768.png) |
| Phone | [390px before](screenshots/before/390.png) | [390px after](screenshots/after/390.png) |

## Release considerations

This branch is local. The normal application build is sufficient to package it. Before a separately authorized rollout, review a representative reporting period on the church’s staging environment with its finance staff. Follow the existing [operations guide](../OPERATIONS.md) for environment and release sign-off. A previous application build can be restored independently of the ledger because this change has no database migration.
