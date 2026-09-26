# TestFlow Domain Model

**Document status:** LOCKED — Domain Reference
**Version:** 1.0
**Last updated:** 2026-09-25

## 1. Purpose

This document defines TestFlow's core business entities, ownership, relationships, important fields, lifecycle concepts and invariants. Existing database names may vary slightly by implementation; the concepts must remain consistent.

## 2. Identity and organization domain

### User

Represents an authenticated person.

Typical fields:

- id
- email
- first_name
- last_name
- role
- status
- email_verified
- created_at
- updated_at

Roles: CLIENT, TESTER, ADMIN.

### Organization

Represents a client business/customer boundary.

Typical fields:

- id
- name
- industry
- country
- timezone
- status
- timestamps

### OrganizationMember

Links users to client organizations.

Roles may include OWNER, ADMIN, MEMBER, BILLING.

## 3. Tester domain

### TesterProfile

Represents the operational tester identity and attributes used for eligibility/matching.

Important concepts:

- country
- timezone
- age range
- occupation
- experience level
- availability
- quality score
- reliability score
- completion rate
- fraud-risk signal
- verification status
- job counters

Sensitive information should be minimized.

### TesterVerification

Represents verification evidence/outcome.

Types may include:

- EMAIL
- PHONE
- IDENTITY
- COUNTRY
- DEVICE
- SKILL

Verification outcome is controlled by TestFlow, not the tester.

### TesterDevice

Stores device/platform information used for matching and verification.

Fields include:

- device type/platform category
- manufacturer
- model
- operating system
- OS version
- browser
- browser version
- verified

Client-facing matching generally uses platform/category, while internal matching may use exact device information.

### TesterSkill

Represents tester capability relevant to eligibility.

Examples:

- websites
- web apps
- mobile apps
- desktop apps
- SaaS
- AI products
- games
- bug testing
- usability
- research

## 4. Campaign domain

### Campaign

Central business object representing the client engagement.

Important fields include:

- id
- organization_id
- created_by
- service_type
- name
- objective
- description
- product_url
- status
- participant_target
- deadline
- service_config
- pricing_snapshot
- timestamps

### CampaignRequirement

Generic structured audience/eligibility requirement.

Examples:

- country = Kenya
- age >= 18
- device = Android
- experience = fintech
- prior exposure = false

### CampaignTask

Represents a task or research activity.

Fields include title, description, instructions, success criteria, maximum duration, sequence and required flag.

### Service configuration

Service-specific configuration belongs to Campaign rather than separate campaign architectures.

Five supported services:

- USER_FEEDBACK
- BUG_TESTING
- USABILITY_TESTING
- BETA_TESTING
- TARGETED_RESEARCH

## 5. Recruitment domain

### Opportunity

Represents an operational recruitment opening against a campaign.

Statuses:

- DRAFT
- OPEN
- PAUSED
- FULL
- CLOSED
- EXPIRED
- CANCELLED

Important: Opportunity is not Campaign and does not replace Campaign lifecycle.

### JobRequest

Represents a tester's request to be considered for an Opportunity.

Statuses:

- REQUESTED
- UNDER_REVIEW
- APPROVED
- REJECTED
- WITHDRAWN
- EXPIRED

`APPROVED` means recruitment approval only. It does not mean assignment.

### TesterInvitation

Represents an invitation sent to a tester/candidate.

Sources may include:

- TESTFLOW_NETWORK
- UPWORK
- REFERRAL
- DIRECT_INVITATION
- OTHER

Invitations should be single-use where the workflow requires it and must have expiry/security controls.

## 6. Assignment/testing domain

### Assignment

Represents the official TestFlow commitment of a tester to campaign work.

Statuses:

- ASSIGNED
- STARTED
- SUBMITTED
- COMPLETED
- FAILED
- CANCELLED
- EXPIRED

Assignment may reference the originating JobRequest.

### TestSession

Represents a testing/research session within an assignment.

### Submission

Represents tester work submitted against an assignment/session.

May include structured response data and metrics.

### Evidence

Represents supporting material attached to a submission.

Types:

- TEXT
- SCREENSHOT
- SCREEN_RECORDING
- VIDEO
- AUDIO
- TRANSCRIPT
- METRIC

## 7. Quality and findings domain

### QualityReview

Represents quality assessment of a submission.

Decisions:

- PASS
- REJECT
- NEEDS_REVIEW

May include automated/AI scores, flags and human reviewer information.

### Replacement

Represents operational replacement of a tester or fulfillment slot without erasing the original history.

### Bug

Represents a structured bug discovered during testing.

Severity may use:

- P0 Critical
- P1 High
- P2 Medium
- P3 Low
- P4 Cosmetic

### Finding

Represents a broader reportable insight.

Classification:

- OBSERVED
- REPORTED
- INFERRED
- RECOMMENDATION

### FindingEvidence

Links a finding to supporting evidence.

## 8. Financial domain

### Payment

Represents the client's payment obligation/financial transaction against a campaign.

### PaymentMethod

Represents an enabled method such as card, crypto, bank transfer, mobile money or another configured method.

### PaymentProvider

Represents an external or internal payment processing provider.

### PaymentTransaction

Represents an individual provider/payment event.

### FinancialLedgerEntry

Represents an auditable financial event such as revenue, tester reward liability, refund, payment fee or operational cost.

## 9. Reward domain

### Reward

Represents compensation earned by a tester for completed work.

Statuses:

- PENDING_QC
- APPROVED
- AVAILABLE
- PAYOUT_REQUESTED
- PAID
- REJECTED

### WalletTransaction

Represents tester wallet history.

Types may include:

- REWARD
- BONUS
- PAYOUT
- ADJUSTMENT
- REFUND

Wallet history should be ledger-oriented.

## 10. Reporting domain

### Report

Represents the final client-facing research/testing output.

Expected sections may include:

- executive summary
- methodology
- participants
- key findings
- task results
- feedback
- recommendations
- evidence

Reports may have versions and publication state.

## 11. Communication domain

### Conversation

Represents business support communication.

Types:

- CAMPAIGN
- GENERAL_SUPPORT
- PAYMENT
- TECHNICAL_SUPPORT

Statuses:

- OPEN
- PENDING
- RESOLVED
- CLOSED

### ConversationParticipant

Controls authorized participants.

Allowed business boundaries:

- CLIENT ↔ ADMIN
- TESTER ↔ ADMIN

### Message

Represents a message within a permitted conversation.

## 12. Cross-cutting domain

### Notification

Represents user notifications. Notification state must not be used as the authoritative business state.

### AuditLog

Represents material historical administrative/security actions.

## 13. Core relationships

```text
Organization
  └── OrganizationMember
       └── User
            └── Client
                 └── Campaign
                      ├── CampaignRequirement
                      ├── CampaignTask
                      ├── ServiceConfig
                      ├── Opportunity
                      │    ├── JobRequest ── Tester
                      │    └── TesterInvitation
                      ├── Assignment ── Tester
                      │    └── TestSession
                      │         └── Submission
                      │              └── Evidence
                      ├── QualityReview
                      ├── Replacement
                      ├── Bug
                      ├── Finding
                      │    └── FindingEvidence
                      ├── Payment
                      │    └── PaymentTransaction
                      └── Report

Tester
  ├── TesterProfile
  ├── TesterVerification
  ├── TesterDevice
  ├── TesterSkill
  ├── Reward
  └── WalletTransaction
```

## 14. Entity ownership rules

- Client campaign data is organization-owned.
- Tester private data is tester-owned.
- Admin operational data is controlled by authorized Admin functions.
- Financial records are system/audit-controlled.
- Evidence belongs to authorized campaign/submission context.

## 15. No duplicate-domain rule

Before adding a new table/entity, determine whether an existing entity already represents the concept. An AI agent must not create a second entity merely because a new screen needs different fields.

Prefer extending an existing domain model when the business concept is the same.
