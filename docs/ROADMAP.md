# Phased delivery
Every row depends on the preceding phase. Work on cumulative phase branches. At each verified boundary commit, push and compare remote SHA. Do not merge main or deploy production without owner authorization.

| Phase | Implementation blocks in order | Exit evidence |
|---|---|---|
| 0 Discovery | Inventory → trace scope → design invariants → challenge plan | Audit and remote planning checkpoint |
| 1 Foundation | Scaffold → local Supabase/config → two-slot auth + RLS → protected shell → CI | Local reset, two real logins, third/anonymous denied, build and browser smoke |
| 2 Directory | Member IDs and forms → profiles → category seed and administration → audit | Search/create/edit, all 13 names, inactive categories unavailable for new entries |
| 3 Collections | Atomic posting → payer and allocation forms → receipts → correction/void | Concurrent idempotency, rollback, PDF, financial/security audit |
| 4 Dues and expenses | Approved assignment rules → obligation posting integration → expenses and private evidence | Partial payment, concurrent cap, reversal, scoped file access |
| 5 Reporting | Currency/date views → dashboard and exports → settings, recovery and audit UI | Identical source and export totals, both users, full route inventory |
| 6 Pilot | End-to-end reconciliation → responsive/accessibility review → restore rehearsal → staff walkthrough | Critical/major findings fixed and retested, pilot evidence and owner acceptance |
| 7 Release | Approved cloud staging → migrations and smoke → backup verification → owner go-live → handover | Staging evidence, explicit go-live authorization, verified production smoke and recovery runbook |
