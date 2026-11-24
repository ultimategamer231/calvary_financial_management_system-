# Database design
| Relation | Invariants |
|---|---|
| staff_slots | Fixed slot label, unique active user UUID, trusted writes only |
| members, groups, memberships | Stable IDs, member number unique, archive flag, group membership for explicit assignments |
| categories, payment_methods, church_profile | Stable identifiers, active state and grouping. Archive referenced definitions |
| collections | One payer kind (member, named guest, anonymous), one currency, business date, total minor units, method, actor, unique receipt number, idempotency key and original input fingerprint |
| allocations | Collection FK, category ID + historical label, currency matching parent, positive bigint minor units, optional matching member obligation |
| obligations | Member, category, original currency, assigned amount, due date. Group assignment snapshots selected members |
| expenses, expense_evidence | Payee, date, currency, amount, method, description, expense category, optional project link and private object |
| voids, replacements | Unique original reference, reason, actor and time, immutable linked replacement |
| audit_events | Entity ID, operation, actor UUID/label, server time, sanitized old/new and reason |

Validate decimal strings to two places, use bigint for arithmetic, serialize money as strings across JSON boundaries. Atomically validate active definitions, lock obligations in deterministic order, insert collection and allocations, issue sequence number and audit. Identical retries return original receipt, mismatched payload fails. Void and replace in a single transaction. Exclude voided originals once. Calculate outstanding from active linked payments. Apply RLS to every exposed table. Deny direct mutations where transactional checks are required.
