# Phase 1 foundation verification

The Phase 0 remote checkpoint was verified at a0908ec. Development used an isolated Calvary Docker project, ports 55321/55322, fictional Auth users and a loopback web server. No cloud project or production records were used.

| Check | Evidence |
|---|---|
| Authentication and membership | The browser suite signs in both named roles, reads each account page, blocks an unassigned Auth user and redirects anonymous visits. Removing a slot assignment denies an existing session both in PostgREST and on a fresh page request. |
| Privileged operations | Staff cannot update slots or delete assignment history. Slot labels and unique user IDs constrain capacity. Account provisioning and test administration run from the operator terminal. The web app reads the local public key. |
| Sign-out | Finance Assistant signs out, then a fresh visit to the account route redirects to sign-in. |
| Screen inspection | Login captured at 360, 390 and 1280 px. Login and workspace screenshots reviewed at 390 and 1280 px. Automated axe checks cover login and dashboard with zero serious or critical violations in these states. Local screenshots are under test-results. CI archives screenshots. |
| Build | pnpm typecheck, pnpm lint and pnpm build. The production build exposes /login, /dashboard and /account. |

An initial configuration disabled the email provider while closing signup. A real staff login failed. Enabling the email provider with global signup disabled allowed both existing staff accounts to sign in and kept registration blocked. The browser harness also needed an explicit browser context for axe and a wait for completion of the login redirect.

The dashboard is a staff landing page at this stage. Financial totals depend on later ledger and reporting phases. Password recovery and operator replacement procedures are scheduled with account administration. Deployment, backups and pilot acceptance remain release gates.
