# Church finance operations

The local pilot uses only fictional records. Both finance users have equal rights to post and correct records. The church assigns an operator to manage identities, access to infrastructure, and backups. Use [the account procedure](human-guides/STAFF_ACCOUNTS.md) to replace an assigned identity.

## Daily work
Select the business date and original currency. Review each contribution allocation and the total before posting. To pay dues, select the named obligation. Enter voluntary excess on a separate allocation. Print or download the issued receipt. Enter expenses and attach a supporting PDF, JPEG or PNG. For errors, open the original receipt or expense, record the reason and post its correction. Reports exclude voided originals. Search the audit log to review changes. Export and compare each currency separately.

## Backup and recovery
The local rehearsal uses a custom-format pg_dump, database restore into a separate disposable database, and an independent byte-for-byte comparison of the copied storage tree. Run `node scripts/check-restore.mjs --require-evidence` on an idle, fictional pilot that has an attachment. The rehearsal creates and removes its own temporary copies. It does not provide off-device retention.

Before live use, the church operator must select retention, recovery objectives, encrypted off-device storage, access holders and a recovery schedule. Verify the actual cloud backup entitlement. Back up both database metadata and private bucket files. Freeze writes or capture a consistent point across both stores. Include project configuration, migration versions and a manifest of storage keys and checksums. Keep the key inventory and recovery credentials in the church's password manager. Restore into a separate staging project and verify both login identities, financial totals, receipt lookup, audit history and evidence downloads. Record restore duration and operator sign-off.

## Incidents
On suspected unauthorized activity, suspend affected slot bindings and lock the affected Auth identity. Preserve logs, receipts and database history. Restrict application traffic while the operator establishes the affected interval. Restore a copy separately, compare totals and file manifests, and document discrepancies. Resume posting after church authorization. A frontend rollback must remain compatible with the database schema. Do not overwrite the live ledger with an old snapshot to undo a single posting.
