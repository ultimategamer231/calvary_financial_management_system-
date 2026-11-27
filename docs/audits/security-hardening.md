# Security review of the finance pilot

## Scope and plan

Review the local network boundary, session creation and refresh, staff and database authorization, password recovery, ledger mutations, CSV and PDF exports, private evidence, Git exposure and dependency advisories. Fix confirmed weaknesses at their owning layer, test both staff identities against the existing financial rules, and verify deployed settings separately before a church rollout.

## Findings and changes

| Area | Finding | Remediation and verification |
| --- | --- | --- |
| Local services | The pilot database and API had wildcard Docker port mappings. This can expose development services to reachable networks. | The repository's start command creates a project-specific loopback bridge. A data-free preflight checks Docker's effective port publishing, followed by checks of the actual services. Development and the documented local web start use 127.0.0.1. Use Docker Engine 28 or newer. |
| Session protection | The SSR cookie defaults permitted browser JavaScript to read staff session cookies. All Supabase session use in this app is server-side. | Set HttpOnly and SameSite=Lax in both session writers. Production builds set Secure. The Chromium foundation test inspects cookie attributes after each staff sign-in. Existing sessions receive new attributes when rewritten. Sign out and sign back in during rollout. Serve production over HTTPS. |
| Password policy | The local Auth provider used its default minimum while the app required 12 characters for changes. | Set a 12-character minimum in local Supabase configuration. Apply the equivalent hosted Auth setting separately. Existing passwords are unaffected. |
| Private files | An uploaded or historical filename could suggest a different file type when downloaded. | Determine the allowed extension from the file signature on upload and download. Normalize the suggested filename and serve as a private, non-cacheable attachment. Signature checks identify file types and do not scan document contents for malware. |

The dependency audit reported zero known advisories among 474 resolved dependencies. A filename/history check found only the example environment file tracked. A targeted private-key and token-pattern scan found no matches in the checked project files. These checks cannot exclude prior disclosure through other channels.

Staff actions use server-side identity checks, PostgreSQL policies constrain underlying reads and writes, and financial RPCs check the officer before privileged mutations. The reviewed reporting views use invoker permissions. The password recovery callback exchanges a code and redirects to a fixed local path. Receipt, evidence and CSV routes require staff access and set private, no-store on successful downloads.

## Verification and rollout

Run lint, typecheck and the production build. Run `node --experimental-strip-types scripts/check-evidence.mjs` for evidence naming and format checks. The clean-stack CI workflow exercises both staff slots, revoked and unassigned identities, ledger reconciliation, private downloads and authenticated browser flows. Use its result for the exact release commit.

On the pilot host, check the actual Docker bindings after startup and compare both identities' period report plus the stored attachment digest to the pre-change snapshot. Review the local networking note in the README if Docker Desktop overrides the bridge setting. No database migration is required. Hosted deployment, provider-side settings, access logs and incident investigation are outside the local source review.

On November 27, 2026, the approved Docker Desktop preference was applied to the Windows pilot. Windows reported only 127.0.0.1 listeners for the app (3107), API (55321) and PostgreSQL (55322). Docker Desktop 4.71 also reported an IPv6 wildcard in container metadata. For this specific discrepancy the startup check verifies the actual TCP listeners on the local Windows host and their Docker process ownership. Both staff reports, ledger record counts and the attachment digest matched the pre-change baseline.
