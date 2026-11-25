# Dashboard test report

**Result.** The redesigned production build passed the financial, access, responsive and browser checks below. In the same populated pilot period, all six summary amounts, four category groups, five ordered rows and their record links matched the original dashboard.

## Conditions and financial reconciliation

The original and final builds ran against the same existing localhost Supabase pilot. Edge captured February 1–28, 2030 using an authenticated fictional account. Test setup verified the known fixture parties before writing screenshots. The captured RPC response had the same digest on both runs. We also compared the original and redesigned **rendered** data cell by cell, including dates, method, reference, party, category, currency and amount, and followed both expense and receipt links.

| February 2030 pilot | Income | Expenses | Net recorded movement |
| --- | ---: | ---: | ---: |
| USD | 125.00 | 40.00 | 85.00 |
| LRD | 500.00 | 80.00 | 420.00 |

Separately, baseline and redesigned builds each ran against a freshly initialized, isolated local Supabase project using Google Chrome. These runs used the same fixture expectations with independent generated record IDs. All writes by the integration suites were confined to fictional test stacks. Screenshots and the same-record pilot comparison were read-only.

## Regression results

| Check | Result and evidence |
| --- | --- |
| Static gates | Passed `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `node --experimental-strip-types scripts/check-money.mjs`. Run typecheck and build sequentially as both generate files under .next. |
| Foundation | Passed on both clean builds. Both staff accessed protected content. Anonymous, unassigned and revoked access, signup policy, sign-out, staff history and RLS checks passed. |
| Directory, collections, dues/expenses | All three suites passed on both clean builds, including existing posting, linked corrections, split receipt/PDF, evidence and balance checks. |
| Reports and pilot | Both suites passed on both clean builds. Verified reporting totals, statement, escaped CSV, audit, receipt header snapshots, PDF seal, form access and password validation. |
| Dashboard | The new read-only check compared the UI to finance_report for both staff. It checked all-date and finite periods, separate ledgers, category groups, record links and order, full-report drill-through, export, invalid period, reset, empty period and signed-out redirect. It passed on an isolated fixture with 21 eligible lines. On the final pilot build, date-form submissions also exercised open start and end dates, visible inherited filters, clearing filters and browser Back. |
| Precision and limit | Independent ten-line fixture displayed the correct latest eight allocation lines. Negative USD movement and maximum accepted figures were exercised across the seven viewport widths. |
| Navigation and keyboard | All ten shared destinations loaded and correctly identified the active route. Receipt and expense links reached their records. The keyboard skip link moved focus into main content. The next Tab reached From. Active links on direct mobile visits to Account, Settings and Reports scrolled into view. Print checks passed for reports and dashboard. |
| Loading and service failure | A local proxy delayed the report RPC by 5.5 seconds and then separately returned HTTP 503. Loading and the safe error message appeared. After service recovery, one click on Try again reissued the original period query and restored exact values. |
| Accessibility | Desktop and mobile axe scans returned zero violations in the dashboard regression. Independent Chrome scans also passed at three widths. Checks included focus, current location, labeled date controls, semantic rows/columns, signed-in identity, and text labels for income and expenses. |
| Console | No uncaught browser errors in the successful populated, filter and navigation checks. The intentionally failed request was tested separately. |

## Responsive and visual review

Coordinates are CSS pixels from the top of the document to the **Recent entries** heading on the identical five-row fixture. The table remains intentionally scrollable where needed.

| Viewport width | Before | Final | Horizontal page overflow |
| ---: | ---: | ---: | --- |
| 1920 | 985 | 448 | None |
| 1440 | 978 | 448 | None |
| 1280 | 966 | 443 | None |
| 1024 | 944 | 436 | None |
| 768 | 1335 | 536 | None |
| 390 | 1566 | 732 | None |
| 360 | 1566 | 732 | None |

Reviewed full-page captures at desktop, tablet and phone sizes, then repeated the checks after refinement. The first redesigned tablet capture broke the word “Method”. Single-line column headings fixed it. On phones, aligning ledger labels and amounts in rows brought Recent entries up another 63px. The final desktop church name occupies two lines and the current destination is visible on direct mobile loads. The independent reviewer accepted the final layouts. [Before screenshots](screenshots/before/) · [After screenshots](screenshots/after/)

## Performance

On the same authenticated navigation under equivalent production-build browser conditions, Resource Timing reported 3,381 → 6,057 encoded CSS bytes and 143,982 → 145,475 encoded JavaScript bytes. These are observed route resources, not the total deployment size. The added CSS covers the workspace, dashboard and responsive states. The small client components handle route highlighting and error recovery. The page still obtains totals, categories and records in a single finance_report call. The full-report link fetches on use. The redesign adds no package, chart engine, remote font, image asset, animation or polling interval. Long-term load performance and field layout-shift statistics were outside this local comparison.

## Existing defects and limits

The original 768px register fragmented amounts and dates. The original error boundary also repeated a failed render after a transient report outage. The dashboard-specific retry now requests the report again. The money test still emits Node’s existing module-type notice and passes.

Windows desktop Chrome and Edge supplied the browser evidence, including emulated small viewports. Physical iOS/Android devices, Safari, Firefox and manual screen-reader sessions were not exercised. Automated accessibility findings do not certify WCAG conformance. The unrelated recovery rehearsal was skipped because its cleanup drops a scratch database. Production deployment and church acceptance were outside this run.

The temporary QA stacks, servers and test proxy were stopped. Automatic approval review blocked recursive deletion of the two temporary QA source checkouts as a policy decision. Generated credential files and startup logs were removed from those checkouts.

## Reproduce the focused check

With the configured local application on port 3107 and a populated fictional test ledger, run:

```powershell
$env:BROWSER_CHANNEL = "msedge"
node --experimental-strip-types scripts/check-dashboard.mjs
```

The original integration suites require a fresh stack. Follow the order in [the CI workflow](../../.github/workflows/foundation.yml) on an isolated project. The foundation fixture requires unassigned staff slots. The [handover](DASHBOARD_REDESIGN_HANDOVER.md) includes a shorter manual walkthrough.
