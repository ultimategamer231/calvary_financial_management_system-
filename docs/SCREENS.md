# Screen inventory
1. /login — email, password, recovery, generic auth errors and return navigation.
2. /dashboard — period selector, USD and LRD income, expenses and net movement, recent entries.
3. /members — search, status, member creation and editing.
4. /members/[id] — profile, history, printable filtered statement.
5. /contributions — period, currency, method, member and category filters, details and correction actions.
6. /contributions/new — payer selector, add/remove allocation rows, review totals, confirm once.
7. /categories — grouping, name, activation and history-safe editing.
8. /expenses — filtered list, add/edit-by-replacement form, evidence upload and private download.
9. /receipts/[id] — receipt number, itemization, received-by, void status, print and PDF.
10. /reports — income, expense, member, dues and movement, CSV and print.
11. /audit — filter, inspect before/after and reason.
12. /settings — profile, methods, currency policy, account status and replacement procedure.
13. /dues — assign obligations, choose outstanding obligation during collection, inspect outstanding and overdue by currency.

Deep green navigation, light canvas, dense tables, explicit currency labels and tabular amounts. Mobile navigation drawer and scrollable data tables. Each workflow needs loading, empty, validation, success, error and denied states. Dialogs return keyboard focus. Inspect 360, 390 and 1280 px and printed pages.
