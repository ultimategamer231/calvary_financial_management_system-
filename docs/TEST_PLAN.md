# Acceptance fixtures
Use fictional staff and member identities. Post USD 100 split 70 Budget Support + 30 Meeting Dues against USD 50 assigned. Add USD 20 guest and LRD 500 anonymous. Void the guest receipt, replace with USD 25. Record USD 40 and LRD 80 expenses. Expected active income USD 125 and LRD 500, expenses USD 40 and LRD 80, movement USD 85 and LRD 420. Dues outstanding USD 20. Void the split receipt to restore USD 50 outstanding; verify USD movement becomes -15. Renaming a category preserves both versions of receipts.

Unit: parse and format money with two decimals, reject negatives/overprecision, large values and zero; distinguish dates and filter boundaries. DB: repeat requests concurrently, conflicting replay, allocation mismatch, double void, competing payments and rollback. RLS matrix: anonymous, non-slot authenticated, each active slot, revoked slot. Test direct ledger, audit, configuration and storage access. E2E: login → create member → split → print → report → correct → audit → sign out. Compare displayed/CSV/printed amounts and category totals to independent fixture values. Verify no real member records in fixtures. Lint, typecheck, build, DB tests, Playwright and accessibility checks precede release.

## Approved policy checks

- Post a split collection, retry it, then correct it. Verify the split and retry share one itemized CBC receipt. The correction has a distinct CBC number linked to the original.
- Assign a group due, then change group membership. Confirm the original individual obligations still match the snapshot and newly added members receive no retroactive debt.
- Against USD 20 outstanding, submit USD 25 entirely as dues. Verify atomic rejection with no receipt or balance change. Then explicitly split USD 20 dues and USD 5 voluntary. Verify one USD 25 receipt, zero outstanding and USD 5 in the voluntary category.
