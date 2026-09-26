# TestFlow Workflows

**Document status:** LOCKED — Workflow Reference
**Version:** 1.0
**Last updated:** 2026-09-25

## 1. Purpose

This document defines the major operational workflows of TestFlow and their state transitions.

## 2. Master commercial workflow

```text
CREATE CAMPAIGN
      ↓
SELECT SERVICE
      ↓
DEFINE PRODUCT
      ↓
DEFINE AUDIENCE
      ↓
DEFINE PARTICIPANTS / TASKS
      ↓
DEFINE EVIDENCE
      ↓
DEFINE TURNAROUND / DEADLINE
      ↓
COMPLETENESS CHECK
      ↓
PRICING ENGINE
      ↓
QUOTED
      ↓
CLIENT REVIEWS PRICE
      ↓
PAYMENT PENDING
      ↓
PAYMENT CONFIRMED
      ↓
RECRUITING
      ↓
MATCHING
      ↓
ASSIGNING
      ↓
TESTING
      ↓
QUALITY REVIEW
      ↓
REPLACEMENTS IF REQUIRED
      ↓
COMPLETED
      ↓
AI ANALYSIS
      ↓
REPORT READY
      ↓
CLOSED
```

## 3. Campaign lifecycle

Primary states:

`DRAFT → QUOTED → PAYMENT_PENDING → PAID → RECRUITING → MATCHING → ASSIGNING → TESTING → QUALITY_REVIEW → COMPLETED → ANALYZING → REPORT_READY → CLOSED`

Controlled alternate states may include PAUSED and CANCELLED.

### Rules

- DRAFT is editable.
- QUOTED represents a valid price quote.
- PAYMENT_PENDING means fulfillment has not begun.
- PAID means payment is confirmed by authorized payment logic.
- RECRUITING begins after payment confirmation under the commercial model.
- Later states require their prerequisites.
- Clients cannot jump directly to later operational states.

## 4. Client campaign creation workflow

1. Client opens Create Campaign.
2. Selects one of the five services.
3. Defines product.
4. Defines target audience.
5. Defines participant count/tasks/research questions.
6. Defines evidence requirements.
7. Defines turnaround/deadline.
8. System validates general brief completeness.
9. System validates service-specific completeness.
10. Pricing inputs are calculated.
11. Pricing Engine generates quote.
12. Campaign enters QUOTED.
13. Client reviews quote.
14. Client selects payment method.
15. Payment is created.
16. Payment is confirmed.
17. Campaign enters PAID.
18. Fulfillment may begin.

## 5. Pricing workflow

```text
Campaign Requirements
        ↓
Normalize Pricing Inputs
        ↓
Service Pricing Rules
        ↓
Recruitment/Targeting Complexity
        ↓
Operational Cost Factors
        ↓
Client Price
        ↓
Quote
        ↓
Purchase
        ↓
Lock Pricing Snapshot
```

Pricing must be deterministic and auditable for a given rules/configuration snapshot.

## 6. Payment workflow

```text
Payment Created
   ↓
Awaiting Payment / Verification
   ↓
Processing
   ↓
PAID
```

Failure paths include FAILED, EXPIRED, CANCELLED and applicable dispute/refund states.

Provider callbacks must be idempotent.

## 7. Tester onboarding workflow

```text
Tester Registration / Invitation
        ↓
Account Verification
        ↓
Profile Completion
        ↓
Device Declaration
        ↓
Skill Declaration
        ↓
Verification Review
        ↓
Eligible Tester Network
```

External candidates recruited through channels such as Upwork must become TestFlow testers before assignment.

## 8. Recruitment workflow

```text
Campaign Paid
    ↓
Create Opportunity
    ↓
OPEN
    ↓
Tester sees/request opportunity if eligible
    ↓
JobRequest = REQUESTED
    ↓
Admin Review
    ↓
APPROVED / REJECTED
```

Approval does not assign the tester.

## 9. Matching workflow

Inputs may include:

- campaign requirements
- tester country
- age range
- experience
- skills
- device/platform
- verification
- availability
- quality/reliability indicators
- campaign-specific constraints

Output is a candidate/selection for assignment.

Admin can override matching where authorized, with auditability.

## 10. Assignment workflow

```text
Eligible Candidate
    ↓
Matching / Admin Selection
    ↓
Assignment Created
    ↓
ASSIGNED
    ↓
STARTED
    ↓
SUBMITTED
    ↓
COMPLETED
```

Failure paths include FAILED, CANCELLED and EXPIRED.

## 11. Testing workflow

Tester receives assignment instructions, performs required tasks, records required evidence, and submits work.

A submission must not be accepted as complete if required fields/evidence are missing.

## 12. Quality workflow

```text
Submission
   ↓
Automated checks / AI signals
   ↓
Quality Review
   ├── PASS
   ├── REJECT
   └── NEEDS_REVIEW
```

A rejected or invalid submission may lead to replacement according to campaign rules.

## 13. Replacement workflow

```text
Failed / Invalid / Missing Participant
        ↓
Replacement Need Identified
        ↓
Admin / Replacement Engine
        ↓
Recruitment / Matching
        ↓
New Assignment
```

The original assignment and reason remain auditable.

## 14. Reward workflow

```text
Completed Work
    ↓
Quality Control
    ↓
Reward Approval
    ↓
AVAILABLE
    ↓
Payout Request
    ↓
PAID
```

Reward status is independent of client payment status after campaign fulfillment has been authorized.

## 15. AI analysis workflow

```text
Completed / Accepted Submissions
        ↓
Evidence Processing
        ↓
AI Extraction
        ↓
Finding Clustering
        ↓
Classification
        ↓
Prioritization
        ↓
Human Review Where Required
        ↓
Report Data
```

AI must preserve evidence provenance and classification.

## 16. Reporting workflow

Report generation consumes validated campaign outputs, quality-reviewed findings and evidence.

Typical report structure:

1. Executive summary
2. Methodology
3. Participant overview
4. Key findings
5. Task results
6. Feedback
7. Bugs/issues where applicable
8. Recommendations
9. Supporting evidence

## 17. Client/Admin messaging workflow

```text
Client creates/opens support conversation
       ↓
Admin receives notification
       ↓
Admin responds
       ↓
Conversation remains linked to campaign/payment/support context
       ↓
Resolved / Closed
```

No tester is added as a client conversation participant.

## 18. Notification workflow

Business event → notification creation → channel delivery → read/delivery state.

Notification failure must not silently change business state.

Example:

Payment confirmation is a business event. Email failure must not make the payment unpaid.

## 19. External recruitment workflow

Initial MVP channel may be manual Upwork recruitment:

```text
Admin identifies campaign recruitment need
        ↓
Admin prepares recruitment brief
        ↓
Admin posts externally
        ↓
Applicant is reviewed
        ↓
TestFlow invitation
        ↓
Tester onboarding/verification
        ↓
Tester becomes eligible
        ↓
Matching / Assignment
```

No Upwork API integration is required for the initial workflow.

## 20. Cancellation/refund workflow

Cancellation must validate the campaign state and applicable commercial policy.

Refund is a financial event and must not erase the original payment record.

Any already-incurred operational/reward consequences must be handled through explicit business rules rather than an AI-created assumption.

## 21. Workflow implementation rule

Every state transition must have:

- permitted source state
- permitted target state
- authorized actor
- prerequisites
- validation
- audit behavior where required
- failure behavior

An AI agent must not add a shortcut transition merely because it simplifies UI implementation.
