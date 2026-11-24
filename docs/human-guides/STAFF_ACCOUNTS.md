# Replace a finance staff account

Use the church-controlled Supabase project operator account. Both finance roles have equal application access. Keep recovery codes and auth keys in the church's password manager.

1. Verify the incoming staff identity directly with the church. Use the project's Auth administration to invite that email. Creating an Auth identity alone gives no application access.
2. Find the new user's verified UUID. Read the current slot binding with the operator SQL editor. Keep those UUIDs private.
3. Run the following as a single operator transaction, substituting the intended role and verified UUIDs. Confirm the returned row before committing. Roll back if the result is empty or unexpected.

```sql
begin;
update public.staff_slots
set user_id = '<new verified UUID>'
where label = 'Finance Assistant' and user_id = '<expected previous UUID>'
returning label, user_id;
-- After checking the one returned row, commit or roll back.
```

4. Confirm the new account can sign in and the previous account can no longer open a protected page. The assignment trigger records the transition. Revoke the previous user's Auth sessions through project administration. Preserve the UUID on historical financial entries.
5. For password recovery, use the application's recovery page with a configured APP_ORIGIN and allowlisted callback URL /auth/recovery. Deliver email through the church's approved SMTP provider at staging. Local fictional accounts may be reset through local Auth administration. Never paste passwords into tickets, chat or source control.
