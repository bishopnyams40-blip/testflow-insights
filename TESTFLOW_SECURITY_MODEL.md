# TestFlow Security Model

**Document status:** LOCKED — Security Constitution
**Version:** 1.0
**Last updated:** 2026-09-25

## 1. Security objective

TestFlow handles multi-tenant client data, private tester information, evidence files, financial records and operational decisions. Security must be enforced at the data/server boundary.

## 2. Security hierarchy

```text
Authentication
→ Role
→ Organization / ownership
→ Resource permission
→ Valid state transition
→ Business invariant
→ Transaction integrity
→ Audit
```

Passing one layer does not replace the others.

## 3. Threat model

Important threat categories include:

- cross-tenant data access
- privilege escalation
- client impersonation of admin
- tester impersonation or self-approval
- direct state manipulation
- payment tampering
- reward manipulation
- evidence exposure
- client-to-tester bypass
- invitation abuse
- duplicate requests
- webhook replay
- AI-generated false findings
- fraud/risk false positives
- insecure file access
- accidental data deletion
- race conditions/concurrent updates

## 4. Authentication

Authentication must support secure signup, login, session persistence, logout and password reset as implemented by the selected auth system.

Email verification requirements must be respected where configured.

Unconfirmed or inactive users must not bypass application access rules.

## 5. Roles

Core application roles:

- CLIENT
- TESTER
- ADMIN

A user must not be able to elevate their own role through client-controlled input.

Self-selected ADMIN registration is not permitted.

## 6. Multi-tenancy

Client organizations are security boundaries.

Every client-owned record must be traceable to an organization directly or through a secure relationship.

Cross-organization reads, writes, ownership changes and relationship manipulation must be denied unless an explicitly authorized Admin operation permits them.

## 7. Row Level Security

Where Supabase/PostgreSQL RLS is used, policies must enforce actual data boundaries.

RLS policies must not rely solely on frontend route restrictions.

Helper functions used by RLS must avoid exposing arbitrary-user role probing or equivalent information leakage.

Anonymous access should be denied by default except for deliberately public functionality.

## 8. Tester isolation

A tester must only access their own private tester records unless a specific authorized Admin operation permits broader access.

Tester A must not access Tester B's:

- private profile data
- verification details
- device details beyond permitted public/operational summaries
- reward/payout information
- job requests
- private evidence

## 9. Client isolation

Client organization A must not access organization B's:

- campaigns
- requirements
- tasks
- recruitment progress
- payments
- reports
- messages
- private organization data

Attempts to manipulate organization IDs in requests must fail server-side.

## 10. Admin access

Admin access is powerful and must be explicitly authorized.

Administrative actions must be audited where material.

Admin APIs/functions must re-check authorization rather than trusting the UI or caller-supplied role fields.

## 11. State-transition security

State transitions must be allowlisted.

Invalid transitions must fail even if a malicious client submits the target state directly.

Examples of prohibited client manipulation include direct attempts to move a campaign from DRAFT to PAID, TESTING, COMPLETED or REPORT_READY.

## 12. Messaging security

Conversation participants must be restricted to authorized client/admin or tester/admin communication.

Database/server rules must prevent creation of Client↔Tester conversations even if a user manipulates IDs.

## 13. Evidence/storage security

Evidence storage must be private.

Access must be authorized to the related submission/campaign/assignment context.

Do not expose predictable public object URLs for private evidence.

Large files should remain in object storage; database records should hold controlled metadata/references.

## 14. Payment security

Payment state must be server-controlled.

Provider callbacks/webhooks must be authenticated and idempotent.

A client cannot mark their own payment as PAID.

Manual verification must identify the authorized reviewer and time.

Secrets, API keys and provider credentials must never be stored as ordinary exposed database fields or returned to clients.

## 15. Financial integrity

Financial history must be auditable.

Do not rewrite historical payment/ledger records merely to correct an error.

Refunds, adjustments and corrections should be represented as new financial events.

## 16. Reward security

Tester reward amounts and statuses must be server-controlled.

Testers cannot approve their own rewards or mark their own payout as paid.

Wallet history must be ledger-oriented rather than trusting a mutable client-supplied balance.

## 17. Recruitment security

Opportunity lifecycle is Admin-controlled.

Tester requests must be owned by the requesting tester.

Duplicate active requests must be prevented.

Tester self-approval must be impossible.

Approved requests must not automatically become assignments unless explicit matching/assignment logic performs that transition.

## 18. Verification security

Tester verification outcomes are Admin-controlled.

Testers may submit information or request review but cannot directly set verification outcomes.

Admin review operations should write audit information.

## 19. AI security

AI output must be treated as untrusted derived data.

AI must not:

- invent evidence
- bypass authorization
- directly grant privileged roles
- directly confirm payment
- directly pay rewards
- make irreversible fraud decisions without the required human control

AI findings must preserve provenance where practical.

## 20. Idempotency and concurrency

Operations susceptible to retries must be idempotent where appropriate, especially:

- payment webhooks
- payment confirmation
- invitations
- assignment creation
- reward creation
- payout processing
- notification delivery

Use unique constraints and transactional logic to prevent duplicate business records.

## 21. Audit logging

Audit logs should capture material administrative and security-sensitive events, including:

- actor
- action
- entity
- entity ID
- relevant previous/new state
- timestamp
- applicable request/IP metadata where appropriate

Audit logs themselves must not become an uncontrolled data-exfiltration channel.

## 22. Error handling

Errors must not leak sensitive information.

Do not expose stack traces, secrets, database internals or private user information to ordinary clients.

Use generic authentication errors where appropriate while retaining detailed internal logs.

## 23. Deletion and retention

Deleting an application record must not silently destroy records required for financial, security or audit obligations.

Use controlled archival/soft-deletion patterns where appropriate.

## 24. Security verification gates

Before a major module is marked complete:

- test authenticated access
- test unauthenticated access
- test wrong-role access
- test cross-tenant access
- test ID manipulation
- test invalid state transitions
- test self-approval/self-modification
- test duplicate submissions/requests
- test sensitive file access
- test audit logging
- run regression tests

## 25. Security rule for AI development agents

An AI agent must never weaken a security control merely to make a feature work or a test pass. If an existing control blocks an intended feature, the agent must identify the conflict and propose an authorized change.
