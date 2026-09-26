# TestFlow Business Rules

**Document status:** LOCKED — Business Constitution
**Version:** 1.0
**Last updated:** 2026-09-25

## 1. Purpose

This document defines the business rules that govern TestFlow. These rules must be treated as domain constraints, not suggestions for UI behavior.

## 2. Business model

TestFlow is a managed DFY service. The client purchases a defined research/testing outcome. TestFlow manages the operational work required to produce that outcome.

The client does not purchase access to a pool of testers.

## 3. Client rules

1. A client operates through an organization.
2. A campaign belongs to exactly one organization.
3. Client organization members can only access records permitted for their organization and role.
4. A client may create a campaign in DRAFT.
5. A campaign must satisfy general and service-specific completeness requirements before quotation.
6. A client reviews a generated quote before payment.
7. Fulfillment must not begin before confirmed payment, except explicitly authorized internal/non-production workflows.
8. Purchased pricing is represented by a pricing snapshot and must not silently change.
9. Client cannot choose or negotiate tester compensation.
10. Client cannot directly contact, hire, or bypass TestFlow to contact a tester through platform data.
11. Client sees only the tester profile information permitted for campaign transparency.
12. Client communicates with TestFlow through Client/Admin messaging.

## 4. Campaign rules

A Campaign contains the commercial and operational definition of a client request.

A campaign can define:

- service type
- product
- objective
- description
- audience
- participants
- tasks
- evidence
- deadline/turnaround
- targeting requirements
- service-specific configuration
- pricing inputs

A campaign cannot enter operational fulfillment states without satisfying the prerequisites for that state.

## 5. Service rules

Exactly five services exist unless explicitly changed through an architecture decision:

- USER_FEEDBACK
- BUG_TESTING
- USABILITY_TESTING
- BETA_TESTING
- TARGETED_RESEARCH

Service configuration must remain within the central Campaign Engine.

## 6. Pricing rules

Pricing is dynamic and based on structured campaign requirements.

Potential pricing variables include:

- service type
- participant count
- campaign duration
- deadline
- urgency
- scope
- complexity
- number/complexity of tasks
- target countries
- device/platform requirements
- screening requirements
- audience specificity
- evidence burden
- recruitment difficulty
- operational requirements

Pricing is not hard-coded as a single universal campaign price.

Internal economics may include:

```text
Tester Compensation
+ Recruitment/Fulfillment Cost
+ Payment/Processing Cost
+ AI/Processing Cost
+ Other Operational Cost
+ TestFlow Margin
= Client Price
```

The exact pricing formula/rates are configuration and business-policy concerns and must not be invented by an AI agent.

## 7. Payment rules

The intended commercial sequence is:

```text
Campaign Creation
→ Completeness
→ Quote
→ Client Review
→ Payment
→ Payment Confirmation
→ Fulfillment
```

Payment statuses may include:

- PENDING
- AWAITING_PAYMENT
- AWAITING_VERIFICATION
- PROCESSING
- PAID
- FAILED
- EXPIRED
- CANCELLED
- REFUNDED
- PARTIALLY_REFUNDED
- DISPUTED

Manual payment confirmation must be audited.

Crypto payments must be verified using appropriate transaction/network evidence; self-reporting is not sufficient.

Refunds are separate financial events/records and must not erase original payment history.

## 8. Recruitment rules

Recruitment is TestFlow-controlled.

An Opportunity represents an operational opening against a campaign. It is not a replacement for Campaign.

A JobRequest means a tester has requested consideration for an opportunity.

`APPROVED` means the tester passed the recruitment review stage. It does not mean the tester has been assigned.

A tester may not assign themselves.

Duplicate active requests for the same tester/opportunity must be prevented.

## 9. Assignment rules

Assignment is an explicit TestFlow decision.

A tester becomes operationally committed to campaign work only through Assignment.

Assignment may be produced through matching or explicit Admin action.

Assignments must record campaign, tester and relevant recruitment/request context.

## 10. Tester rules

Testers must maintain truthful information relevant to eligibility.

Testers cannot directly change:

- quality scores
- reliability scores
- completion counters
- verification outcomes
- admin-controlled status fields

A tester may request review of eligible information, but final admin-controlled outcomes remain controlled by TestFlow.

## 11. Eligibility rules

Eligibility must be enforced server-side.

UI filtering is for usability; it is not the security/business boundary.

Eligibility may use:

- country
- age range
- device/platform
- experience
- skills
- verification state
- availability
- campaign-specific screening
- other campaign requirements

## 12. Tester information shown to clients

Client-facing tester information is intentionally limited.

Permitted examples:

- tester identifier
- verified country
- age range
- relevant experience
- platform/device category
- verification status

Private contact information and other protected tester data must not be exposed for client bypass.

## 13. Testing and submission rules

An Assignment may progress to testing only when its prerequisites are satisfied.

Submissions belong to assignments/sessions and contain the required responses/evidence.

Evidence may include:

- text
- screenshot
- screen recording
- video
- audio
- transcript
- metric

Evidence storage must remain private and access-controlled.

## 14. Quality rules

Quality Review determines whether submitted work meets campaign requirements.

Possible decisions:

- PASS
- REJECT
- NEEDS_REVIEW

Quality failures may trigger replacement workflows.

AI quality signals do not automatically replace authorized human review where the decision has material financial, access, fraud or campaign consequences.

## 15. Replacement rules

Replacement is an operational mechanism for handling failed, invalid, incomplete or otherwise unsuitable participant fulfillment.

Replacement must preserve the original history. It must not silently rewrite an assignment or erase the reason for replacement.

## 16. Reward rules

Tester reward is distinct from client payment.

Reward lifecycle:

```text
PENDING_QC
→ APPROVED
→ AVAILABLE
→ PAYOUT_REQUESTED
→ PAID
```

A reward may be rejected where applicable, but the history of the decision must remain auditable.

## 17. Financial rules

Financial history should be ledger-oriented and auditable.

Do not mutate historical financial records merely to correct an error.

Use new transactions/entries for refunds, adjustments and corrections.

Payment provider events must be idempotently processed.

## 18. AI rules

AI-generated findings must distinguish:

- Observed: directly supported by evidence.
- Reported: stated by a participant/client/source.
- Inferred: reasoned interpretation not directly observed.
- Recommendation: proposed action.

AI must not manufacture evidence.

AI must not silently convert uncertain inference into observed fact.

## 19. Messaging rules

Allowed:

- Client ↔ Admin
- Tester ↔ Admin

Prohibited:

- Client ↔ Tester

The prohibition must be enforced by backend/database rules, not only by hiding a UI button.

## 20. Audit rules

Sensitive actions must be auditable, including where applicable:

- admin overrides
- tester verification decisions
- campaign state overrides
- recruitment decisions
- payment verification
- refunds
- rewards
- fraud/risk decisions
- permission/security changes

## 21. State integrity rules

No user or UI may directly force a campaign into an arbitrary later state.

For example, clients cannot directly set:

- PAID
- TESTING
- COMPLETED
- REPORT_READY

unless the authorized state-transition logic permits it.

## 22. No invented business rules

If a requirement is not documented and cannot safely be inferred from the existing implementation, an AI agent must ask for clarification or report the ambiguity rather than inventing a rule.
