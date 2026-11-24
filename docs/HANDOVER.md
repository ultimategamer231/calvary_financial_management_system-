# Local pilot handover
The cumulative pilot branch contains the application and migrations. Earlier phase branches are immutable review checkpoints. See README.md for setup, docs/DECISIONS.md for policy, docs/OPERATIONS.md for operations, and the staging guide before deploying.

| Area | Implementation |
|---|---|
| Identities and access | Supabase Auth, two database slots, session checks and RLS |
| Member and category management | Staff directories, revision checks and audited updates |
| Financial posting | Database RPCs, integer minor units, immutable receipts, explicit void and replacement records |
| Reports | Snapshot-based totals and historical allocation labels, currency-specific movement, filtered CSV and printable statements |
| Private evidence | Staff-protected storage, size and type checks, authenticated downloads |
| Recovery | Database and private storage rehearsal on fictional data, separate cloud verification required |

Use npm-compatible Node 22 and the pinned pnpm version. Never commit local .env files, backup archives or real member records. CI uses isolated fictional accounts and checks migrations, production build, browser flows, accessibility, financial race conditions and recovery.

The church must provide staging access, approved email delivery, the final receipt contact information if desired, and two verified staff addresses privately before launch. The local pilot does not certify the source books, staff training, hosting entitlements, or SMTP delivery. The operator must sign off on those items and the staging rehearsal before handling real records.
