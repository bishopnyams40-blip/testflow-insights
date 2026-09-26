# TestFlow Roadmap

**Document status:** LOCKED — Development Roadmap
**Version:** 1.0
**Last updated:** 2026-09-25

## 1. Purpose

This roadmap records what has been built, what is being verified, and what remains. It is the sequencing guide for AI development agents.

## 2. Current project state

Infrastructure has been separated from the AI development environment:

- source code connected to GitHub
- database moved to Supabase
- application deployed on Vercel

The repository and architecture documents are the durable source of truth.

## 3. Completed implementation stages

### 001 — Foundation, Authentication & Security

**Status: LOCKED**

Established:

- user/auth foundation
- client/tester/admin role model
- organizations and memberships
- tenant isolation
- RLS/security foundation
- tester/client/admin access boundaries
- private evidence storage foundation
- Client↔Admin messaging boundary
- Client↔Tester communication prevention
- audit foundation

### 002 — Tester Network & Onboarding

**Status: LOCKED**

Established:

- tester profiles
- devices/platforms
- skills
- verification records
- tester status/availability
- admin review controls
- server-controlled tester quality/counters
- tester network admin views

### 003 — Campaign Engine

**Status: LOCKED**

Established:

- central Campaign model
- campaign lifecycle
- product definition
- requirements
- tasks
- organization ownership
- client campaign workflow
- service type foundation

### 003A — Campaign Security Verification

**Status: LOCKED**

Verified:

- cross-tenant isolation
- organization ownership protection
- tester isolation
- state transition security
- admin security
- audit behavior

### 003B — Security Warning Review

**Status: LOCKED**

Completed security review and cleanup of identified warning classes and policy/helper concerns. Remaining intentional warnings were reviewed at the time and must not be casually removed without understanding their purpose.

### 004 — Service Engine

**Status: LOCKED**

Established one central service configuration architecture for:

- User Feedback
- Bug Testing
- Usability Testing
- Beta Testing
- Targeted Research

Added structured service configuration, service completeness rules, evidence expectations, pricing input structure and report section structure without prematurely implementing actual pricing/report generation.

### 005 — Opportunities & Recruitment

**Status: IN VERIFICATION / HARDENING**

Implemented:

- Opportunity
- JobRequest
- TesterInvitation
- recruitment lifecycle
- tester request flow
- admin recruitment controls
- client recruitment progress
- server-side security boundaries

Important distinction:

`JobRequest APPROVED ≠ Assignment`

### 005A — Recruitment Verification & Hardening

**Status: CURRENT VERIFICATION STAGE**

Required gates include:

- automated recruitment tests
- signed-in Client/Tester/Admin UI tests
- server-side eligibility enforcement
- admin campaign picker
- review of current database/security warnings
- full regression tests after latest changes
- database security/business-invariant audit
- build/typecheck/lint/UI smoke/data cleanup

Prompt 005 should only be marked PASSED/LOCKED after these gates are actually verified.

## 4. Revised next stages

The commercial dependency discovered during architecture clarification requires Pricing and Payment to precede Matching/Assignment fulfillment.

### 006 — Pricing Engine

Build:

- pricing rules/configuration
- pricing input normalization
- service-specific pricing model
- participant/campaign complexity factors
- urgency/deadline factors
- targeting/recruitment difficulty factors
- evidence burden factors
- operational cost factors
- quote generation
- pricing snapshot
- price auditability

Do not invent final commercial rates without explicit business approval.

### 007 — Payment Engine

Build:

- payment abstraction
- payment methods
- payment providers
- payment transactions
- payment state machine
- provider/webhook normalization
- manual verification
- crypto verification architecture where enabled
- refunds/disputes
- financial ledger integration
- idempotency

Payment must gate fulfillment.

### 008 — Matching & Assignment

Build:

- eligibility evaluation
- matching logic
- candidate selection
- assignment creation
- admin override
- assignment state management

Dependencies: Recruitment, Pricing, confirmed Payment.

### 009 — Testing Workspace

Build:

- tester assignment workspace
- task execution
- session management
- submission flow
- evidence capture/references

### 010 — Quality Control

Build:

- automated validation
- AI-assisted quality signals
- human review
- PASS/REJECT/NEEDS_REVIEW
- quality scoring integration

### 011 — Replacement Engine

Build:

- replacement triggers
- replacement eligibility
- recruitment restart
- replacement assignment
- financial/operational consequences
- audit trail

### 012 — Rewards & Payouts

Build:

- reward calculation
- QC dependency
- reward approval
- tester wallet/ledger
- payout requests
- payout processing
- reconciliation

### 013 — AI Analysis

Build:

- evidence processing
- finding extraction
- duplicate clustering
- classification
- prioritization
- confidence
- evidence traceability
- human review controls

### 014 — Reports

Build:

- report generation
- report versions
- publication state
- client report UI
- downloadable report output

### 015 — External Recruitment

Initial approach:

- manual external recruitment
- Upwork posting workflow
- applicant review
- TestFlow invitation
- onboarding/verification

Do not add Upwork API integration unless separately approved.

### 016 — Admin Operations

Expand Admin control plane across campaigns, recruitment, matching, QC, replacements, fraud/risk, payments, rewards, AI and reports.

### 017 — Notifications

Build robust in-app/email notification workflows and background delivery while keeping notification state separate from business state.

### 018 — Security Hardening

Perform comprehensive security review across all completed modules, including RLS, API authorization, storage, payment, rewards, messaging, audit and concurrency.

### 019 — Full E2E & Production Readiness

Run:

- unit tests
- integration tests
- API tests
- E2E tests
- security tests
- multi-tenant tests
- failure/recovery tests
- financial integrity tests
- regression tests
- production smoke tests

## 5. Roadmap sequencing rule

An AI agent must not skip a dependency simply because a later UI can be built first.

If a later module needs a preceding domain that does not yet exist, the agent must report the dependency rather than inventing a temporary duplicate implementation.

## 6. Completion gate

A roadmap stage is complete only when its documented implementation, business rules, security controls, tests and regression gates are satisfied.## Implementation Status Matrix

| Domain | Architecture | Implementation | Status |
|---|---|---|---|
| Foundation/Auth/Security | 🔒 | Built | 🔒 LOCKED |
| Tester Network | 🔒 | Built | 🔒 LOCKED |
| Campaign Engine | 🔒 | Built | 🔒 LOCKED |
| Campaign Security | 🔒 | Verified | 🔒 LOCKED |
| Service Engine | 🔒 | Built | 🔒 LOCKED |
| Recruitment | 🔒 | Built, final hardening/verification pending | 🧪 UNDER VERIFICATION |
| Pricing Engine | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Payment Engine | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Matching & Assignment | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Testing Workspace | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Quality Control | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Replacement Engine | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Rewards & Payouts | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| AI Analysis | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |
| Reports | 🔒 | Not built | 🚧 NOT YET IMPLEMENTED |


