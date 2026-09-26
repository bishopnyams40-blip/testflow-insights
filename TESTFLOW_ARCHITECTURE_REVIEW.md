# TestFlow Founder Architecture Review

**Version:** 1.1
**Purpose:** Record the deliberate review of the TestFlow architecture documentation against the established product and implementation history.

## Review Result

The previous documentation package was reviewed against the TestFlow decisions established through Prompt 005/005A and the current GitHub + Supabase + Vercel setup. The following corrections are incorporated into v1.1.

1. The standard client journey does **not** contain a manual Admin quote-request step.
2. The client completes order forms and the platform automatically calculates the price.
3. The Pricing Engine remains the previously agreed dynamic model, considering service, participant count, duration, deadline/urgency, scope/complexity, tasks, targeting, countries, devices/platforms, screening, evidence burden, recruitment difficulty and operational/processing requirements.
4. Internal tester compensation is separate from the client price.
5. Pricing configuration is configurable; the architecture is locked.
6. The purchased price is snapshotted.
7. Payment occurs before actual recruitment/fulfillment.
8. Payment and tester rewards are separate financial flows.
9. Recruitment approval does not equal assignment.
10. Pricing and Payment are roadmap dependencies before Matching/Assignment.
11. Current infrastructure independence is explicit: GitHub is source control; Supabase is current database/backend infrastructure; Vercel is deployment; the AI development environment is not the product owner or an architectural dependency.
12. Documentation distinguishes LOCKED, CONFIGURABLE, NOT YET IMPLEMENTED, UNDER VERIFICATION and HISTORICAL states.

## Correct Commercial Workflow

```text
Client completes order forms
        ↓
Automatic Pricing Engine
        ↓
Calculated price displayed
        ↓
Client reviews order + price
        ↓
Payment
        ↓
Payment confirmed
        ↓
TestFlow fulfillment/recruitment
```

## Review Status

**v1.1 is the corrected architecture documentation baseline for repository use.**

Future changes should be recorded in the Decision Log and versioned rather than silently changing architectural intent.
