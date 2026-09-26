# TestFlow Architecture

**Document status:** LOCKED — Architectural Constitution
**Version:** 1.0
**Last updated:** 2026-09-25
**Applies to:** All TestFlow implementations and development environments

## 1. Purpose

This document is the primary technical architecture reference for TestFlow. It is an implementation contract for humans and AI development agents. It describes what TestFlow is, how its major systems fit together, and the architectural constraints that must be preserved when the application is extended.

TestFlow is an existing product under active development. It must not be treated as a greenfield project. Any AI agent must inspect the existing repository and these documents before making material changes.

## 2. Product definition

TestFlow is a managed, DFY user-testing and research platform. Clients purchase outcomes and evidence rather than access to a marketplace of independent testers.

TestFlow coordinates:

- campaign design and requirements
- participant recruitment
- eligibility and verification
- matching and assignment
- testing/research execution
- quality control
- replacements
- analysis
- reporting
- tester rewards
- client support

### TestFlow is not

- a freelancer marketplace
- a platform where clients browse and hire individual testers
- a social network for clients and testers
- a direct client-to-tester communication platform
- a DIY productivity or research-template product

## 3. Core architectural principles

1. **Campaign is the central business object.**
2. **TestFlow owns fulfillment.** The client defines the desired outcome; TestFlow operates recruitment and delivery.
3. **Client chooses outcomes, not individual testers.**
4. **Job Request is not Assignment.**
5. **Admin approval of a Job Request is not Assignment.**
6. **Client payment and tester reward are separate financial flows.**
7. **Client ↔ Tester direct communication is prohibited.**
8. **The database/server is authoritative.** The UI is never a security boundary.
9. **Multi-tenant isolation is mandatory.** Client organizations must not access each other's data.
10. **Financial records are auditable and non-destructive.** Corrections create new records rather than rewriting history.
11. **AI assists analysis and operations but does not silently make high-impact decisions.**
12. **Business state and notification state are separate concerns.**
13. **Use a modular monolith unless there is a demonstrated need for service separation.**
14. **Avoid duplicate domain concepts and duplicate tables.**
15. **The architecture must remain portable across development environments.** An AI development agent or coding environment is an implementation environment, not the product architecture.
16. **Existing locked functionality must be extended, not casually replaced.**

## 4. System-of-systems view

```text
Client Interface ───────────────┐
                                │
Tester Interface ───────────────┼── Application / Domain Layer
                                │
Admin Interface ────────────────┘
                                      │
             ┌────────────────────────┼────────────────────────┐
             │                        │                        │
       Campaign Engine        Tester/Recruitment        Financial Systems
             │                        │                        │
       Service Engine          Matching/Assignment      Pricing/Payment
             │                        │                  Rewards/Ledger
             │                        │
       Testing Engine          Quality/Replacement
             │                        │
       AI/Report Engine        Notifications/Audit
             │                        │
             └────────────────────────┼────────────────────────┘
                                      │
                              Supabase/PostgreSQL
                                      │
                         Auth / RLS / Storage / DB
                                      │
                              Deployment on Vercel
```

## 5. Current infrastructure

The current project is independent of any particular AI development environment as an infrastructure dependency.

- **GitHub:** source-control source of truth.
- **Supabase:** PostgreSQL database, authentication, RLS and applicable storage/backend services.
- **Vercel:** deployed web application.
- **AI development environment:** interchangeable implementation environment; it must work against the existing repository and architecture rather than redefine it.

The project must remain deployable without depending on a particular AI coding product.

## Automatic Pricing Engine

The Pricing Engine is an automated platform capability. It does not depend on an Admin manually preparing a quote.

The client completes the relevant order configuration; the platform validates the inputs and calculates the client price. Pricing inputs may include service type, participant count, campaign duration, deadline, urgency, scope, complexity, task count/complexity, countries, device/platform requirements, audience specificity, screening, evidence burden, recruitment difficulty and operational/processing requirements.

Internal pricing concept:

`Tester Compensation + Fulfillment/Operational Costs + Payment/Processing Costs + AI/Processing Costs + Other Applicable Costs + Configured Margin = Client Price`

Rates, coefficients, margins and provider costs are configurable business parameters. AI agents must never invent them.

The client sees the resulting campaign price and an appropriate inclusion/breakdown view, not internal tester compensation or margin. The purchased price and relevant pricing configuration are snapshotted for the campaign.

## 6. Application architecture

TestFlow uses a modular-monolith approach. Domain modules are separated conceptually and in code, but they share the primary application/database boundary unless a future architectural decision explicitly changes this.

Core engines/modules:

- Campaign Engine
- Service Engine
- Tester Engine
- Verification Engine
- Recruitment Engine
- Matching Engine
- Assignment/Testing Engine
- Quality Engine
- Replacement Engine
- Pricing Engine
- Payment Engine
- Financial/Ledger Engine
- Reward/Payout Engine
- AI Analysis Engine
- Report Engine
- Notification Engine
- Messaging/Support Engine
- Audit Engine
- Fraud/Risk Engine

## 7. Service model

All five TestFlow services are configurations of the same Campaign Engine:

1. USER_FEEDBACK
2. BUG_TESTING
3. USABILITY_TESTING
4. BETA_TESTING
5. TARGETED_RESEARCH

The service configuration determines requirements, evidence expectations, workflow flags, pricing inputs, validation and report sections. It must not create five unrelated campaign architectures.

## 8. Three user domains

### Client

The client organization creates and pays for campaigns and consumes evidence and reports.

Client responsibilities include:

- campaign creation
- service selection
- product definition
- audience definition
- task/research definition
- evidence requirements
- turnaround requirements
- quote review
- payment
- report consumption
- communication with TestFlow Admin

### Tester

The tester supplies verified testing/research work and receives rewards through TestFlow.

Tester responsibilities include:

- profile completion
- device declaration
- skill declaration
- verification
- requesting eligible opportunities
- completing assigned work
- submitting evidence
- maintaining accurate profile/device information

### Admin

Admin is the operational control plane.

Admin responsibilities include:

- campaign operations
- recruitment
- eligibility review
- matching
- assignments
- quality control
- replacements
- payment verification where applicable
- pricing configuration
- rewards
- fraud/risk review
- AI oversight
- report operations
- support
- audit and recovery

## 9. Data architecture

Primary database is PostgreSQL through Supabase.

Client-owned records are organization-scoped. Every client-facing query must enforce organization ownership. Tester-owned private data is scoped to the tester/user. Admin access is explicitly authorized.

Use UUID identifiers and foreign keys. Use indexes for common operational filters. Use database constraints/triggers/functions where business integrity cannot safely depend on application code alone.

Large evidence files belong in private object storage; relational records store metadata and storage references.

## 10. Authorization architecture

Authorization follows this conceptual sequence:

```text
Authentication
  → Role
  → Organization / Tester ownership
  → Resource ownership
  → Permission
  → Valid state transition
  → Business rule
```

Authorization must be enforced server-side/database-side. Frontend hiding is not sufficient.

## 11. Financial architecture

Pricing, client payment, tester reward, payout and accounting are distinct concerns.

Client flow:

```text
Campaign
 → Pricing
 → Quote
 → Payment Pending
 → Confirmed Payment
 → Fulfillment
```

Tester flow:

```text
Assignment
 → Submission
 → Quality Review
 → Reward Approval
 → Available Reward
 → Payout
```

Client-visible pricing must not expose internal tester compensation or TestFlow margin unless a future explicit business decision permits it.

Pricing is calculated from structured campaign inputs. A purchased campaign receives a locked pricing snapshot.

## 12. AI architecture

AI may assist with:

- submission analysis
- finding extraction
- duplicate/cluster detection
- prioritization suggestions
- report drafting
- fraud/risk signals
- operational summaries

AI output must be evidence-grounded and distinguish:

- OBSERVED
- REPORTED
- INFERRED
- RECOMMENDATION

High-impact decisions require appropriate human review. AI output is not automatically authoritative merely because it was generated by a model.

## 13. Messaging architecture

The communication boundary is:

```text
Client ↔ TestFlow Admin
Tester ↔ TestFlow Admin
```

Client ↔ Tester communication is prohibited through TestFlow.

Client/Admin conversations can be campaign-specific or general support/payment/technical support. Messaging is business communication, not a social chat layer.

## 14. Development-environment independence

Any AI coding environment must treat GitHub plus the repository documentation as the implementation source of truth.

No development environment may:

- invent replacement architecture without approval
- remove a domain because it appears unused without investigation
- replace existing security controls with UI checks
- migrate away from Supabase/Vercel without an explicit decision
- create duplicate tables for existing concepts
- alter locked business rules silently

## 15. Change protocol

Before a material change:

1. Read the relevant documentation.
2. Inspect existing implementation.
3. Identify affected domain entities.
4. Identify state-machine effects.
5. Identify security/RLS implications.
6. Identify migration/data risks.
7. Implement the smallest coherent change.
8. Add/update tests.
9. Run regression tests.
10. Report deviations, migrations and unresolved risks.

## 16. Definition of Done

A feature is not complete merely because the UI renders.

Definition of Done includes, where applicable:

- UI
- API/server logic
- database schema
- business rules
- authorization
- validation
- state transitions
- error handling
- auditability
- security
- edge cases
- automated tests
- regression tests
- migration safety
- operational recovery
- documentation updates

## 17. Non-negotiable architecture rules

The following are LOCKED unless a new architecture decision explicitly supersedes them:

- Campaign remains central.
- Five services remain configurations of Campaign.
- Client cannot select/contact individual testers directly.
- Request and Assignment remain separate concepts.
- Payment precedes actual fulfillment/recruitment.
- Client payment and tester rewards remain separate.
- Multi-tenancy and RLS/server authorization remain mandatory.
- Financial history remains auditable.
- AI remains assistive with human control for high-impact decisions.
- AI development environments remain replaceable implementation environments.
