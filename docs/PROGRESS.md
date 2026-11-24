# Progress
Phase 0 was pushed and verified at a0908ec. The receipt series and dues policies were approved on November 24, 2026.

Phase 1 implements the Next.js shell, local Supabase migration, two active staff slots, Auth checks and RLS, local fixtures, generated database types, browser accessibility checks and CI. Read docs/audits/phase-1.md for test scope and limitations. Start the development environment using README.md. Local credentials and test output are ignored.

Phase 2 adds members, profiles, category management, active category lookup and immutable directory events. See docs/audits/phase-2.md. Phase 3 builds transactional contributions and itemized CBC receipts on these stable IDs.

Phase 3 introduces transactional contributions, CBC receipts, printable PDF output, corrections and voids. See docs/audits/phase-3.md. Phase 4 extends posting with obligation links and adds expenses.

Phase 4 adds individual obligations from a selected group snapshot, exact outstanding balances and partial payments, expense posting and private evidence. The clean-runner fixture exercises races, excess rejection, correction rollback, private downloads and void restoration. Next: reporting and administration.

Phase 5 adds dashboard, reconciled filtered reports, CSV and printable statements, audit search, settings, account management and the supplied church seal.
