# Dashboard audit

Baseline: clean local main, production Next.js build, authenticated fictional pilot, February 2030. Captures at [1440](screenshots/before/1440.png), [768](screenshots/before/768.png), and [390](screenshots/before/390.png) show identical PostgreSQL records. No hosted service was used.

## Technical and functional baseline

Next.js 16 App Router, React 19, TypeScript, Tailwind 4 preflight and handwritten global CSS. System Segoe UI and Georgia, locally served church seal. No dashboard component, chart, or icon library. URL search parameters are the filter state. Server components render the current response without a client store or polling.

| Function | Owner and source | Expected behavior |
| --- | --- | --- |
| Access, session, sign out | Proxy, staff layout, dashboard, requireStaff, server action | Authenticated Supabase user with an assigned staff slot. Both staff have equal access. Display the slot label. Refresh session cookies in the proxy. Sign out returns to login. |
| Navigation | Staff layout | Ten links to Dashboard, Contributions, Dues & commitments, Expenses, Members, Payment categories, Reports, Audit log, Settings, My account. Horizontal navigation on mobile. |
| Reporting period | Dashboard GET form, lib/reports period and invalid, lib/money today | Default to calendar month in Monrovia. Support open endpoints, validate ordered real dates and member ID. Invalid input shows an alert instead of querying the report. Reload and browser history reproduce URL state. The report also accepts currency, member, category, method and view in deep links. |
| Income, expenses, net movement | Totals, finance_report RPC and money formatter | Always show separate USD and LRD. Missing currency totals display zero. Net equals income less expenses in integer minor units. This measures recorded movement during the period, not a bank balance. |
| Category breakdown | Groups and finance_report.groups | All currency/kind/category groups with exact amounts. Snapshotted labels. No FX conversion. |
| Recent entries | Lines, first eight finance_report.rows | Allocation-level rows sorted by business date, creation time and line ID. Display business date, reference, party, category, method, currency amount. Follow the reference to a receipt or an expense. |
| Empty, error, loading | Shared renderers, staff loading, app error | Empty rows and groups have text, totals remain zero. Invalid range has an alert. Unavailable RPC goes to the app retry boundary. Loading is a single text line. |
| Related workflows | Sidebar destinations | Filters beyond dates, export, print, statements and full history live in reports. No dashboard currency selector, chart, pagination, search, sort, posting dialog, notification, or automatic data refresh. |

The database RPC runs with invoker permissions over active ledger lines. It returns totals, groups and ordered rows together. The page formats exact amounts through the same functions as reports. The application relies on Supabase Auth, cookie-based SSR, staff-slot RLS, PostgreSQL and PostgREST. Existing CI covers money, auth, directory, collections, dues/expenses, reports, pilot and scratch restore. Playwright and axe are installed.

## Observed usability issues and priorities

| Priority | Evidence | Design response |
| --- | --- | --- |
| High | At 768px the 256px rail leaves too little room. Digits, column headings and dates break into fragments, even though the document fits the viewport. | Give tablets the compact navigation and financial tables a deliberate scroll region. Keep amounts and dates intact. |
| High | Recent entries start at y=978 at 1440px, y=1335 at 768px and y=1566 at 390px. Category count can push them farther down. | Put movement and recent records first. Place the complete category breakdown after the ledger. |
| High | Each ledger occupies a tall card. Income, expenses and net all have the same weight. Amounts in the register are left aligned. | Emphasize net movement within each currency and align comparable amounts. Expose record type in the register. |
| Medium | An 81px header repeats the staff label below the 56px title. All ten sidebar links look like equally weighted buttons. The current page has no active marker. | Keep identity in one place, apply the brand deliberately, provide current-page and keyboard cues. |
| Medium | On mobile the two date controls have unequal widths. Mobile navigation, identity and filters fill most of the first screen. | Align the date fields. Give the applied period its own visible label independent of draft fields. |
| Medium | Category values are prose lines on a narrow panel with unused space beside it. | Group by ledger, align columns and keep the transaction type explicit. |
| Low | The empty result has no suggested recovery. The single-line loading text reserves little space. | Offer a date-range action and a dashboard-shaped progress state. |

There was no document overflow at the seven requested widths, browser error on the sampled dashboard, or axe finding in the 360px baseline scan. Lint, the money check, sequential typecheck and the production build passed. Node emitted its existing module-type warning in the money check. An initial overlapping build/typecheck invalidated generated Next types. The sequential rerun passed. See the test report for clean-stack suite results.
