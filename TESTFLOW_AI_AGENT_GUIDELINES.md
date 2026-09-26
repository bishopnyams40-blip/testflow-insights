# TestFlow AI Agent Guidelines

**Document status:** LOCKED — AI Development Contract
**Version:** 1.0
**Last updated:** 2026-09-25

## 1. Mission

You are modifying an existing TestFlow system. You are not designing a new application from scratch.

Your responsibility is to implement authorized product changes while preserving the architecture, business rules, security model, domain model, workflows and locked decisions in `/docs`.

## 2. Mandatory reading order

Before making a material change, read:

1. `TESTFLOW_ARCHITECTURE.md`
2. `TESTFLOW_BUSINESS_RULES.md`
3. `TESTFLOW_SECURITY_MODEL.md`
4. `TESTFLOW_DOMAIN_MODEL.md`
5. `TESTFLOW_WORKFLOWS.md`
6. `TESTFLOW_ROADMAP.md`
7. `TESTFLOW_DECISION_LOG.md`

Then inspect the relevant existing code, schema, migrations, tests and configuration.

## 3. Source-of-truth hierarchy

When information conflicts, use this order:

1. Explicit current product-owner instruction.
2. Current locked architecture/security/business rules.
3. Current approved decision log.
4. Existing implementation and tests.
5. Older implementation prompts.
6. AI assumptions.

Never treat an AI assumption as a business requirement.

## 4. Before coding

Report:

- what you found
- affected domain(s)
- affected entities/tables
- existing implementation to extend
- security implications
- state-machine implications
- migration implications
- dependencies
- tests that must change

Do not begin by creating duplicate tables or replacing existing modules.

## 5. Implementation rules

- Prefer extending existing domain concepts.
- Preserve tenant isolation.
- Preserve RLS/server authorization.
- Preserve existing valid state transitions.
- Keep business rules server-side.
- Use database constraints/triggers when necessary for integrity.
- Use transactions for multi-record operations requiring atomicity.
- Make retry-sensitive operations idempotent.
- Add tests for new behavior and security boundaries.
- Keep migrations additive/safe where practical.
- Do not silently delete data or history.
- Do not expose private tester/client/financial information.

## 6. Forbidden shortcuts

Do not:

- bypass RLS
- move authorization to the frontend only
- trust caller-supplied role/organization IDs
- allow clients to self-assign testers
- turn APPROVED JobRequest into Assignment automatically without the defined matching/assignment workflow
- allow client↔tester messaging
- let clients mark payments paid
- let testers approve their own rewards
- expose payment provider secrets
- rewrite financial history
- use AI inference as direct evidence
- remove security controls to pass tests
- invent pricing rates
- invent refund rules
- invent operational thresholds
- introduce a new table when an existing domain entity already represents the concept
- rewrite a working module merely because another implementation is easier
- mark a feature complete when only the UI exists

## 7. State-machine discipline

Any new state must document:

- meaning
- permitted entry states
- permitted actors
- prerequisites
- permitted exit states
- failure behavior
- audit requirements

Never create arbitrary direct state setters for convenience.

## 8. Database discipline

Before schema changes:

1. Determine whether an existing table already represents the concept.
2. Determine ownership and tenant scope.
3. Define foreign keys.
4. Define uniqueness constraints.
5. Define indexes needed for operational queries.
6. Define RLS policies.
7. Define triggers/functions if application-only enforcement is insufficient.
8. Define migration and rollback considerations.
9. Update domain documentation.

## 9. Security testing

Every material feature should include negative tests, not just happy paths.

Test:

- signed-out access
- wrong role
- wrong organization
- manipulated IDs
- self-approval
- unauthorized state transition
- duplicate request/submission
- private file access
- direct API access bypassing UI

## 10. AI-specific rules

AI output is derived data, not an authority by default.

AI must preserve provenance and distinguish:

- OBSERVED
- REPORTED
- INFERRED
- RECOMMENDATION

If AI confidence is low or evidence is insufficient, surface uncertainty rather than manufacture certainty.

## 11. Testing requirements

A feature is not complete until applicable tests pass across:

- unit
- integration
- API
- database/security
- E2E
- regression
- failure/recovery

If a test cannot be run, report that fact explicitly.

Do not claim a test passed unless it actually ran and passed.

## 12. Documentation requirements

When implementation changes architecture, business rules, workflows, entities or roadmap state, update the appropriate `/docs` document.

A code change that makes a documented rule obsolete must not silently leave contradictory documentation behind.

## 13. Reporting format

After implementation, report:

### Implemented
- concrete changes

### Database
- migrations/schema changes

### Security
- authorization/RLS changes

### Tests
- exact tests run and results

### Regression
- existing tests run and results

### Documentation
- docs updated

### Risks / limitations
- known unresolved issues

### Architecture deviations
- explicitly state `None` if none occurred

## 14. Escalation rule

Stop and ask for clarification when:

- two locked documents conflict
- a requested feature conflicts with a security rule
- a new business rule is required but undocumented
- pricing rates are needed but not provided
- refund/financial treatment is ambiguous
- a new state is required but its semantics are unclear
- a destructive migration appears necessary
- existing implementation contradicts the documented architecture in a material way

Do not resolve these by guessing.

## 15. Final principle

**TestFlow's architecture is more important than the convenience of the current AI coding tool.**

The development environment is replaceable. The product's business rules, security boundaries, domain model and locked decisions must survive that replacement.

## 15. Commercial Workflow Constraint

Do not implement a workflow in which the client submits a quote request to an Admin as the normal pricing process. The standard flow is automatic calculation from the completed order configuration, followed by client review and payment.

## Development-environment neutrality
The project may be continued in any authorized development environment. Do not assume that the next implementation will use the same AI development agent, editor, hosting workflow, or builder used previously. The repository, database state, tests and locked `/docs` decisions are the durable sources of truth.
