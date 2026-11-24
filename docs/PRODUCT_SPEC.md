# MVP scope and traceability
| ID | Staff outcome | Route | Trusted entity/control | Acceptance |
|---|---|---|---|---|
| FR-001 | Two distinct equal-access identities | /login, /settings | staff slots, auth.users, RLS | Both can work, revoked or third identity denied |
| FR-002 | Find, change and archive members | /members, /members/[id] | members, audit | Unique ID, searchable directory, attributable change |
| FR-003 | Configure descriptions | /categories | categories, group, label snapshot | Rename leaves old receipt unchanged |
| FR-004 | Review and post split collection | /contributions/new | collection and allocations RPC | Single posting on retry, complete rollback on failure |
| FR-005 | Retrieve itemized receipt | /receipts/[id] | unique sequence, issuer snapshot | Print/PDF, visible void and replacement link |
| FR-006 | Track commitments | /dues | obligations and allocation links | Explicit assignment, partial payments, void restores balance |
| FR-007 | Record expenses and evidence | /expenses | expenses, private storage | Scoping, currency, payee, correction history |
| FR-008 | Trace period movement | /dashboard, /reports | currency-grouped active records | Source totals match exports |
| FR-009 | Inspect changes | /audit | immutable events | Filter actor, date, entity and action |
| FR-010 | Manage church settings | /settings | profile, methods, staff slots | Changes attributed, prior receipts reproducible |
| FR-011 | Produce member statement | /members/[id]/statement | member allocations | Reconcile by date, category, method and currency |
| FR-012 | Recover operations | operator runbook | DB backup and storage manifest | Rehearsed restore and staff sign-off |

Seed descriptions verbatim: Budget Support, Special Projects (Todee), Father's Day Contribution, End of Year Program, IBMF T-Shirt, IBMF Program Contribution, Prayer Breakfast, Evangelism, Monthly Offering, Father's day Lappas Sale, Visitation, Meeting Dues, Other Contribution. No real names, records or church contact details taken from the mockup.
