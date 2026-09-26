# TestFlow Decision Log

**Document status:** LOCKED — Decision History
**Version:** 1.0
**Last updated:** 2026-09-25

## Purpose

This document preserves major architectural and product decisions so future AI agents understand not only what exists, but why it exists.

A decision should be superseded explicitly rather than silently reversed in code.

---

## D001 — TestFlow is a managed DFY platform

**Status:** LOCKED

**Decision:** TestFlow manages recruitment, matching, testing/research, quality control, replacements, analysis and reporting for clients.

**Reason:** The product sells outcomes/evidence rather than access to a marketplace of freelancers.

**Rejected direction:** Client-managed freelancer marketplace behavior.

---

## D002 — Campaign is the central business object

**Status:** LOCKED

**Decision:** Campaign is the primary commercial and operational object.

**Reason:** A client purchases a defined outcome. Tester jobs, recruitment openings, assignments and reports operate in the context of a campaign.

**Implementation consequence:** Do not create unrelated parallel campaign models for each service.

---

## D003 — Five services share one Campaign Engine

**Status:** LOCKED

**Decision:** User Feedback, Bug Testing, Usability Testing, Beta Testing and Targeted Research are configurations of the same campaign architecture.

**Reason:** Shared lifecycle, ownership, security, pricing and reporting infrastructure should not be duplicated.

---

## D004 — Client chooses outcome, not individual tester

**Status:** LOCKED

**Decision:** Client specifies participant requirements but does not select individual testers for assignment.

**Reason:** TestFlow owns fulfillment and must preserve quality, fairness, privacy and platform economics.

---

## D005 — Client↔Tester direct communication is prohibited

**Status:** LOCKED

**Decision:** Clients communicate with TestFlow Admin; testers communicate with TestFlow Admin. Client↔Tester communication is not a platform feature.

**Reason:** Prevent bypass, protect tester privacy and keep TestFlow responsible for delivery.

---

## D006 — Job Request and Assignment are separate concepts

**Status:** LOCKED

**Decision:** A tester can request an opportunity without being assigned to the campaign.

**Reason:** Request expresses interest; Assignment is the operational commitment made by TestFlow.

---

## D007 — Recruitment approval is not assignment

**Status:** LOCKED

**Decision:** `JobRequest = APPROVED` means recruitment review passed. It does not mean assignment.

**Reason:** Matching/assignment may still consider other candidates and campaign capacity.

---

## D008 — Client payment precedes fulfillment

**Status:** LOCKED

**Decision:** Client pays after quote review and before TestFlow begins actual recruitment/fulfillment under the normal commercial workflow.

**Reason:** TestFlow should not incur operational recruitment/fulfillment obligations for an unpaid campaign.

---

## D009 — Pricing is dynamic

**Status:** LOCKED as architecture; exact rates remain configurable/business-controlled

**Decision:** Campaign price is calculated from structured requirements rather than one universal price.

**Factors may include:** service, participants, duration, deadline, urgency, scope, complexity, tasks, countries, devices, screening, evidence burden and recruitment difficulty.

**Reason:** Different campaigns create materially different operational costs.

---

## D010 — Client price and tester reward are separate

**Status:** LOCKED

**Decision:** The client's campaign price does not directly expose or equal the tester's compensation.

**Reason:** TestFlow has fulfillment, recruitment, payment, AI and operational costs plus margin.

---

## D011 — Pricing snapshot is locked at purchase

**Status:** LOCKED

**Decision:** The price used for a purchased campaign is preserved as a snapshot.

**Reason:** Later pricing-rule changes must not silently change an already purchased campaign.

---

## D012 — Payment and rewards are separate financial flows

**Status:** LOCKED

**Decision:** Client payment lifecycle and tester reward/payout lifecycle are separate domains.

**Reason:** A client's payment is revenue/payment processing; tester reward is a fulfillment liability and compensation event.

---

## D013 — Financial history is auditable

**Status:** LOCKED

**Decision:** Payments, refunds, adjustments, rewards and ledger events must preserve historical traceability.

**Reason:** Financial records must be reconstructable and auditable.

---

## D014 — Shared multi-tenant database is acceptable for MVP architecture

**Status:** LOCKED unless future scale/security requirements change it

**Decision:** Supabase/PostgreSQL shared database with strong organization isolation is the current architecture.

**Reason:** It is operationally simpler while providing strong RLS and application-level isolation.

**Future option:** Dedicated infrastructure per institution/customer may be considered if enterprise requirements justify it; this is not the current TestFlow architecture.

---

## D015 — Security is enforced server/database-side

**Status:** LOCKED

**Decision:** RLS/server authorization is authoritative. UI controls are supplemental.

**Reason:** Frontend controls can be bypassed.

---

## D016 — Modular monolith before microservices

**Status:** LOCKED

**Decision:** Build domain modules within a coherent application before introducing distributed services.

**Reason:** Early microservices would add operational complexity without a demonstrated requirement.

---

## D017 — AI development environments are not the architecture

**Status:** LOCKED

**Decision:** No particular AI development environment is a TestFlow dependency.

**Reason:** TestFlow must remain portable across development environments.

---

## D018 — GitHub is source-control source of truth

**Status:** LOCKED

**Decision:** The repository is the durable source of application code and architectural documentation.

**Reason:** Future AI tools must be able to understand and continue the project without depending on one platform's conversation memory.

---

## D019 — Supabase is current backend/database infrastructure

**Status:** LOCKED for current architecture

**Decision:** PostgreSQL, Auth, RLS and applicable storage/backend services are provided through Supabase.

**Reason:** The project has already been migrated and security-tested around this architecture.

---

## D020 — Vercel is current deployment platform

**Status:** LOCKED for current deployment

**Decision:** Vercel hosts the deployed web application.

**Reason:** The current project is already deployed there and should remain independently deployable from AI development environments.

---

## D021 — AI is assistive, not the final authority for high-impact decisions

**Status:** LOCKED

**Decision:** AI can analyze, classify, cluster, recommend and flag, but high-impact decisions require appropriate human controls.

**Reason:** AI outputs can be uncertain and must remain evidence-grounded.

---

## D022 — AI findings require evidence classification

**Status:** LOCKED

**Decision:** Findings distinguish Observed, Reported, Inferred and Recommendation.

**Reason:** Prevent inference or recommendation from being presented as direct evidence.

---

## D023 — Initial external recruitment is manual

**Status:** LOCKED for MVP

**Decision:** Upwork recruitment may be performed manually rather than through API integration.

**Reason:** Validate operations before investing in integration complexity.

---

## D024 — Platform/device categories use OS/platform terminology

**Status:** LOCKED

**Decision:** Client-facing requirements use categories such as iPhone, Android, iPad, Mac, Windows and Linux. Exact manufacturer/model details remain internal matching data.

**Reason:** Clients usually need platform-level targeting; TestFlow needs exact device information operationally.

---

## D025 — Client sees limited tester profile transparency

**Status:** LOCKED

**Decision:** Client may see permitted summaries such as tester ID, verified country, age range, relevant experience, platform/device category and verification status.

**Reason:** Provide transparency without enabling direct tester recruitment/bypass.

---

## D026 — Architecture documents are part of the product repository

**Status:** LOCKED

**Decision:** `/docs` is an implementation contract for all AI and human developers.

**Reason:** Product decisions should survive changes in development tools and personnel.

---

## D027 — No AI agent may invent undocumented commercial rules

**Status:** LOCKED

**Decision:** If exact rates, refund rules, operational thresholds or another business rule is not defined, an AI agent must identify the ambiguity instead of silently choosing a value.

**Reason:** Product/business decisions belong to the authorized product owner, not accidental implementation defaults.

---

## D028 — Payment was intentionally deferred until after service/recruitment foundations

**Status:** HISTORICAL / SUPERSEDED BY ROADMAP RESEQUENCING

**Decision:** Early Campaign and Service Engine work established pricing inputs and lifecycle placeholders without implementing real pricing/payment.

**Current consequence:** Pricing Engine and Payment Engine must now be implemented before Matching/Assignment fulfillment.

---

## D029 — Prompt stages are implementation checkpoints, not the architecture itself

**Status:** LOCKED

**Decision:** Prompt numbers such as 001–005 are historical implementation stages. They must not override the underlying domain architecture.

**Reason:** Future AI tools may use different implementation sequencing while preserving the same business/domain contracts.
