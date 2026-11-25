# Dashboard redesign plan

## Reading order

1. Compact staff navigation, active route and signed-in identity. Preserve every destination and the sign-out form.
2. Dashboard heading, applied business-date range, From/To fields and Update period.
3. Period movement. One ruled surface for two currency ledgers. Lead each ledger with its net movement and keep income and expense on the same baseline. Preserve the shared monetary calculation and formatter.
4. Recent entries. Preserve eight allocation lines and record destinations, identify income/expense explicitly, keep amount near the reference on phones, link to the complete filtered report.
5. Category breakdown. Two compact currency-specific lists with comparable right-aligned amounts and explicit transaction type. Keep every group.

## Design decisions and scope

Use the church seal and navy for identity, active navigation, and the primary action. Use white surfaces, a cool near-white canvas, subtle rules, dark ink and a secondary slate. Reserve error coloring for an actual problem. System sans for controls, tables and figures, the established serif for the church name and dashboard title. Use tabular figures, mostly 4/8px spacing, small radii, and no shadows or animation. Use the existing focus outline with a higher-contrast alternative on the dark rail. Native dates, labeled scroll regions and text labels remain keyboard accessible.

| Scope / importance | Risk | Implementation and verification |
| --- | --- | --- |
| Dashboard composition and states / high | Low | Edit the dashboard page, add scoped CSS and route loading UI. Keep requireStaff, period, invalid and report calls. Test default, finite, open, empty and invalid periods. |
| Register and summaries / high | Medium | Reuse report UI primitives and exact formatting. Isolate dashboard presentation differences. Compare both staff views to the same RPC and baseline, including row order, links, full report and categories. |
| Shared staff chrome / high | Medium | Extract current-route-aware navigation from staff layout. Scope rail and toolbar styles to the workspace. Check all destinations, mobile overflow, active child pages and print. Preserve authentication, action and existing labels. |
| QA evidence / high | Low | Add a targeted read-only dashboard check, screenshots, results and operator handover. Existing Playwright, Edge/Chromium and axe suffice. No dependency, schema, policy or network-service changes planned. |

Implement the shared shell and tokens, then the header and overview, register, categories and states. Build and run in a production browser, critique the first pass, refine the layout and request an independent review. Keep dashboard-specific styles out of other modules.

## Release criteria

Validate 1920, 1440, 1280, 1024, 768, 390 and 360px. No page overflow or clipped money. Horizontal table scroll is acceptable. Match totals, groups, eight-row limit and destinations against localhost PostgreSQL for both staff. Verify signed-out behavior and active/error/retry/loading/empty states where reproducible. Run static gates, production build and applicable integration checks separately from the populated pilot. Compare browser assets and layout under the same conditions. Save representative before/after evidence with fictional records. Record any limits explicitly. Keep the branch local for this task.
