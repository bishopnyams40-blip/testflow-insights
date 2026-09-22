# TestFlow Insights

TESTFLOW — LOVABLE PROMPT 001

Foundation, Database, Authentication & Security Architecture

You are building TestFlow, a managed software testing and user research platform.

Before writing significant application code, understand the product model and architectural rules below.

1. WHAT TESTFLOW IS

TestFlow allows businesses, startups, indie developers, AI/no-code app builders, and other clients to order testing and user research for:

Mobile apps

Websites

Web applications

Desktop software

SaaS products

AI products

Other digital products

The client creates a campaign describing what they want tested.

TestFlow then handles the operational work:

Client
↓
Creates Campaign
↓
TestFlow calculates price
↓
Client pays
↓
TestFlow/Admin recruits and selects testers
↓
Testers are assigned
↓
Testing happens
↓
Quality control
↓
AI analysis
↓
Report
↓
Client receives findings


The client is purchasing a managed outcome.

TestFlow is therefore NOT a freelancer marketplace.

2. CORE BUSINESS MODEL

There are five core services:

USER_FEEDBACK
BUG_TESTING
USABILITY_TESTING
BETA_TESTING
TARGETED_RESEARCH


These services will eventually have different pricing because their difficulty, operational requirements and value differ.

Client pricing will NOT be based on one static price.

Future pricing will be dynamically calculated based on factors such as:

Service type

Number of testers

Tester location

Platform/device

Testing duration

Campaign complexity

Recruitment difficulty

Urgency

Evidence requirements

AI/reporting requirements

Other operational factors

TestFlow margin

A client must NOT be able to simply enter:

"$5 budget"

and expect TestFlow to accept the campaign.

Future minimum pricing rules will prevent clients from underpaying.

Do NOT implement the complete pricing engine yet.

Only prepare the architecture for it.

3. CRITICAL PRODUCT PRINCIPLE

TestFlow is:

Done-For-You, not Do-It-Yourself.

The client should NOT have to:

Search through testers

Browse a marketplace

Interview testers

Select individual testers

Negotiate with testers

Hire testers

Manage tester payments

Manage tester communication

Instead:

Client defines outcome
↓
TestFlow handles operations


4. TESTERS

Testers are independent participants who complete TestFlow assignments.

A tester will eventually have:

Tester profile

Country

Timezone

Platform/device information

Skills

Verification status

Quality score

Reliability score

Completion rate

Completed jobs

Pending jobs

Requested jobs

Assigned jobs

Rewards

The tester dashboard will eventually show the number of available opportunities.

A tester may eventually click:

Request Job

when they qualify for an available opportunity.

IMPORTANT:

Request Job ≠ Assignment


A request does NOT automatically assign the job.

TestFlow/Admin controls final assignment.

Do NOT build the complete tester opportunity/matching system yet.

Only establish the architectural foundation.

5. INITIAL TESTER RECRUITMENT

At launch, TestFlow may not have enough testers.

Admin may manually recruit testers through external platforms such as Upwork.

The intended flow is:

Client campaign
↓
Admin identifies required tester profile
↓
Admin finds a suitable external candidate
↓
Candidate receives TestFlow tester registration link
↓
Candidate creates tester account
↓
Candidate completes verification
↓
Admin assigns campaign


Do NOT build an Upwork integration.

Upwork is simply an external acquisition channel.

6. CLIENT VISIBILITY OF TESTERS

Clients should have transparency.

After paying for a campaign and once testers are assigned, the client will eventually be able to see limited information about the individual testers working on the campaign.

For example:

Tester #1042
Kenya
Android
Verified
97% completion rate
4.8 quality score


The client must NOT see private contact information.

Do NOT expose:

Email address

Phone number

Social media

Private contact information

The client may verify relevant characteristics such as:

Country

Platform

Verification status

Relevant quality information

But the client cannot directly communicate with the tester.

7. COMMUNICATION RULE

This is a critical architectural boundary.

Allowed:

CLIENT ↔ TESTFLOW ADMIN


Not allowed:

CLIENT ↔ TESTER
TESTER ↔ CLIENT


Clients should eventually have a Messages section where they can communicate with TestFlow Admin regarding:

Campaign questions

Campaign problems

Tester/recruitment questions

Payment questions

Technical problems

General support

This should be controlled business communication, NOT a social chat system.

Prepare the database architecture for this now.

8. USER TYPES

TestFlow has three primary roles:

CLIENT
TESTER
ADMIN


A user must have a clear role.

Do not mix permissions into frontend visibility alone.

Authorization must be enforced on the backend/database layer.

9. CLIENT ORGANIZATIONS

A client account should belong to an organization/company.

Create:

Organization

Fields:

id
name
industry
country
timezone
status
createdAt
updatedAt


Create:

OrganizationMember

Fields:

id
organizationId
userId
role
status
createdAt
updatedAt


Organization roles:

OWNER
ADMIN
MEMBER
BILLING


A user and an organization are separate entities.

Do not assume one user equals one company.

Prepare the system for multiple users belonging to one client organization.

10. MULTI-TENANCY

TestFlow must be designed as a multi-tenant SaaS platform.

For the initial architecture, use a shared database with strict tenant isolation.

If using Supabase/PostgreSQL, implement appropriate Row Level Security (RLS) policies.

Tenant isolation is mandatory.

For example:

Organization A
    ↓
Campaign A

Organization B
    ↓
Campaign B


A user from Organization A must NEVER be able to retrieve or modify Organization B's campaign.

Do not rely only on frontend checks.

Security must be enforced at the data-access/backend/database layer.

11. AUTHENTICATION

Implement the foundation for secure authentication.

Users should eventually be able to:

Register

Login

Logout

Maintain an authenticated session

Verify email

Reset password

Use the authentication system provided by the selected Lovable backend stack/Supabase if appropriate.

Do NOT create insecure custom authentication.

Never store plaintext passwords.

12. USER MODEL

Create a user/profile architecture containing:

id
email
firstName
lastName
role
status
emailVerified
createdAt
updatedAt


User roles:

CLIENT
TESTER
ADMIN


User statuses:

PENDING
ACTIVE
SUSPENDED
DEACTIVATED


If the chosen authentication provider maintains its own authentication user table, do not duplicate authentication unnecessarily.

Create a proper profile/application user table linked to the authentication identity.

13. TESTER PROFILE

Create the foundation for:

TesterProfile

Fields should include approximately:

id
userId
country
timezone
ageRange
occupation
bio
experienceLevel
qualityScore
reliabilityScore
completionRate
fraudRiskScore
verificationStatus
availabilityStatus
createdAt
updatedAt


Do not collect unnecessary sensitive personal information.

Use age ranges rather than requiring exact date of birth for general tester profile data.

14. TESTER DEVICE

Create:

TesterDevice

Fields:

id
testerId
deviceType
manufacturer
model
operatingSystem
osVersion
browser
browserVersion
verified
createdAt
updatedAt


IMPORTANT:

Clients should eventually select broad platforms such as:

iPhone
Android
iPad
Mac
Windows
Linux
Any Device


Clients should NOT normally select individual brands.

For example, the client should not need to choose:

Samsung
Tecno
Infinix
Google Pixel
Dell
HP
Lenovo


However, TestFlow should internally retain detailed device information for verification and matching.

Therefore:

Client requirement
≠
Internal tester device record


Preserve this distinction.

15. TESTER VERIFICATION

Create:

TesterVerification

Fields:

id
testerId
verificationType
status
verifiedAt
expiresAt
metadata
createdAt
updatedAt


Verification types:

EMAIL
PHONE
IDENTITY
COUNTRY
DEVICE
SKILL


Statuses:

PENDING
VERIFIED
FAILED
EXPIRED


Do not integrate an external identity verification provider yet.

Prepare the architecture so one can be added later.

16. TESTER SKILLS

Create the foundation for tester skills.

TesterSkill

Fields:

id
testerId
skill
experienceLevel
verified
createdAt
updatedAt


Potential future skills include:

Website Testing
Web App Testing
Mobile App Testing
Desktop App Testing
SaaS Testing
AI Product Testing
Game Testing
Bug Testing
Usability Testing
User Research


Do not build the complete skill-management interface yet.

17. CAMPAIGN

The Campaign is the central business object of TestFlow.

Create:

Campaign

Fields should include:

id
organizationId
createdBy
serviceType
name
objective
description
productUrl
status
participantTarget
deadline
pricingSnapshot
createdAt
updatedAt


Service types:

USER_FEEDBACK
BUG_TESTING
USABILITY_TESTING
BETA_TESTING
TARGETED_RESEARCH


Campaign statuses should support the future lifecycle:

DRAFT
QUOTED
PAYMENT_PENDING
PAID
RECRUITING
MATCHING
ASSIGNING
TESTING
QUALITY_REVIEW
REPLACEMENTS
COMPLETED
ANALYZING
REPORT_READY
CLOSED
PAUSED
CANCELLED


Do not implement the entire campaign workflow yet.

Create the data model and architectural foundation.

18. CAMPAIGN REQUIREMENTS

Create:

CampaignRequirement

Fields:

id
campaignId
requirementType
operator
value
required
createdAt
updatedAt


The architecture should eventually support requirements such as:

country = Kenya
country = Nigeria
age >= 18
device = Android
device = iPhone
experience = fintech
priorExposure = false


Do not hard-code these requirements into the Campaign table.

19. CAMPAIGN TASKS

Create:

CampaignTask

Fields:

id
campaignId
title
description
instructions
successCriteria
maxDuration
sequence
required
createdAt
updatedAt


A campaign may eventually contain multiple tasks.

Do not implement the five complete service workflows yet.

20. COMMUNICATION ARCHITECTURE

Create:

Conversation

Fields:

id
organizationId
createdBy
type
subject
status
campaignId
paymentId
assignedAdminId
createdAt
updatedAt


Conversation types:

CAMPAIGN
GENERAL_SUPPORT
PAYMENT
TECHNICAL_SUPPORT


Statuses:

OPEN
PENDING
RESOLVED
CLOSED


campaignId must be nullable.

paymentId must be nullable.

21. CONVERSATION PARTICIPANTS

Create:

ConversationParticipant

Fields:

id
conversationId
userId
participantRole
createdAt


Allowed participant roles:

CLIENT
ADMIN


Do NOT create CLIENT-TESTER conversation participants.

This is an intentional privacy boundary.

22. MESSAGE

Create:

Message

Fields:

id
conversationId
senderId
messageType
body
metadata
createdAt
updatedAt


Message types:

TEXT
SYSTEM


Design the system so attachments can be supported later.

Do not build complete file attachments now.

23. COMMUNICATION SECURITY

The system must enforce:

CLIENT → ADMIN     ALLOWED
ADMIN → CLIENT     ALLOWED

CLIENT → TESTER    PROHIBITED
TESTER → CLIENT    PROHIBITED


Do not rely on the UI to enforce this.

The database/backend authorization must enforce it.

24. FUTURE CLIENT DASHBOARD

Do NOT build the full dashboard in this prompt.

However, establish the routing/navigation architecture for a future client dashboard containing:

Dashboard
Campaigns
Reports
Testers
Messages
Payments
Products
Team
Settings


The client dashboard will eventually focus on:

Active campaigns

Campaign progress

Assigned testers

Results

Reports

Messages with Admin

Payments

Products

Do not implement all of these screens now.

25. FUTURE TESTER DASHBOARD

Do NOT build the complete tester dashboard.

Reserve the architecture for:

Dashboard
Available Jobs
Requested
Assignments
Completed
Rewards
Support
Profile
Settings


The future dashboard should show counts such as:

Available
Requested
Pending
Assigned
Completed


Again:

Requesting a job does not mean automatic assignment.

Admin controls assignment.

26. FUTURE ADMIN SYSTEM

Do NOT build the complete Admin dashboard.

The architecture must eventually support Admin control over:

Clients

Testers

Campaigns

Recruitment

Matching

Assignments

Quality control

Replacements

Payments

Rewards

Pricing

Reports

AI analysis

Messages

Audit logs

Admin is the operational control layer of TestFlow.

27. PAYMENT ARCHITECTURE

TestFlow will eventually accept multiple payment methods.

Potential methods:

CARD
CRYPTO
BANK_TRANSFER
MOBILE_MONEY
OTHER


Payment options will be controlled by Admin.

Do NOT assume Stripe is the only payment provider.

Create a provider-agnostic architecture.

Prepare the database for:

Payment

PaymentMethod

PaymentProvider

PaymentTransaction

But do NOT implement real payment processing yet.

28. FINANCIAL ARCHITECTURE

The eventual financial system must distinguish:

Client payment
Tester reward
TestFlow revenue
Payment processing fee
Operational cost
Refund


Do not create a simplistic system based only on a mutable balance.

Future financial records should be auditable and preferably ledger-based.

Do not implement the complete financial system now.

29. STORAGE ARCHITECTURE

TestFlow will eventually handle:

Screenshots

Bug evidence

Screen recordings

Videos

Audio

Documents

Reports

Do NOT store large binary files directly in PostgreSQL.

Prepare a storage abstraction using the available Supabase Storage/object-storage infrastructure.

The architecture should support future operations such as:

upload
download
delete
signed URL


Do not implement the complete evidence system now.

30. AI ARCHITECTURE

AI will eventually analyze testing results.

For example:

20 testers complete campaign
↓
Submissions collected
↓
AI analyzes submissions
↓
Common problems identified
↓
Patterns detected
↓
Severity/priorities generated
↓
Client report generated


Do NOT implement AI analysis in Prompt 001.

Only ensure that future campaign submissions/findings can be connected to an AI processing layer.

AI must not be tightly coupled to the Campaign database model.

31. AUDIT LOG

Create:

AuditLog

Fields:

id
actorId
action
entityType
entityId
previousValue
newValue
metadata
createdAt


The future system should record important administrative actions such as:

Admin assigns tester
Admin rejects submission
Admin approves reward
Admin issues refund
Admin changes pricing
Admin suspends tester
Admin resolves client conversation
Admin changes campaign status


Do not build the audit dashboard now.

32. NOTIFICATION ARCHITECTURE

Prepare the architecture for future notifications.

Potential channels:

IN_APP
EMAIL
PUSH


Future events include:

Campaign paid
Campaign started
Tester assigned
Tester completed
Tester replacement required
Report ready
New admin message
Payment issue


Do not implement a complete notification system yet.

33. SECURITY REQUIREMENTS

Security is a first-class architectural requirement.

Implement appropriate protection for:

Authentication

Authorization

Tenant isolation

Input validation

Database access

API access

Session management

Secrets

Sensitive information

Rate limiting architecture

Never expose private tester contact information.

Never expose another organization's data.

Never trust client-side authorization.

34. VALIDATION

Use strong schema validation for important inputs.

Zod is preferred if compatible with the selected stack.

Validate on the server/backend.

Frontend validation is only for user experience.

Backend/database validation is authoritative.

35. ERROR HANDLING

Create a consistent error-handling approach.

Support errors such as:

VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_VIOLATION
INTERNAL_ERROR


Do not expose:

stack traces

database credentials

secrets

internal infrastructure information

to normal users.

36. LOGGING

Prepare structured application logging.

Important fields:

timestamp
level
message
requestId
userId
organizationId
module
action
metadata


Never log passwords or authentication secrets.

37. DATABASE INDEXES

Create sensible indexes for common operations.

At minimum consider indexes for:

User.email
OrganizationMember.userId
OrganizationMember.organizationId
Campaign.organizationId
Campaign.status
TesterProfile.country
TesterProfile.verificationStatus
Conversation.organizationId
Conversation.status
Message.conversationId


Do not create unnecessary indexes everywhere.

38. DATABASE RELATIONSHIPS

Ensure the fundamental relationships are correct:

User
 ├── OrganizationMemberships
 ├── TesterProfile
 │    ├── TesterDevices
 │    ├── TesterSkills
 │    └── TesterVerifications
 │
 └── Messages

Organization
 ├── Members
 └── Campaigns

Campaign
 ├── Requirements
 ├── Tasks
 └── Conversations

Conversation
 ├── Participants
 └── Messages


Future relationships must be able to extend this without restructuring the core identity model.

39. DO NOT BUILD THESE YET

Do NOT implement:

Full client dashboard

Full tester dashboard

Full admin dashboard

Complete campaign wizard

Dynamic pricing engine

Real card payments

Crypto payments

Tester payouts

Matching engine

Recruitment engine

Upwork API integration

AI analysis

AI reports

Complete report generation

Complete bug testing workflow

Complete usability testing workflow

Complete beta testing workflow

Complete targeted research workflow

Complete user feedback workflow

Full notification system

Advanced fraud detection

Mobile apps

Microservices

Client-to-tester messaging

The goal of this prompt is the foundation, not the finished platform.

40. UI REQUIREMENT FOR THIS PROMPT

Create only a minimal, professional SaaS shell.

The application should have:

Login

Registration

Basic authenticated layout

Role-aware routing foundation

Basic navigation

Loading states

Error states

Empty states

User/account indicator

Do not spend time on elaborate branding.

Do not build a marketing website yet.

Do not spend this prompt creating complex animations.

We will design the actual dashboards later.

41. DESIGN DIRECTION

The future TestFlow interface should feel:

Professional

Trustworthy

Modern

Clean

Simple

B2B SaaS

Easy to understand

Remember:

TestFlow is selling managed testing and actionable insight, not access to a freelancer marketplace.

42. IMPORTANT LOVABLE INSTRUCTION

Do NOT make architectural assumptions that conflict with this specification.

If a technology decision is required, choose the simplest production-appropriate option that preserves:

Security

Scalability

Maintainability

PostgreSQL compatibility

Multi-tenancy

Modular architecture

Future AI integration

Future payment integration

Future tester matching

Future reporting

Do not introduce unnecessary complexity.

Do not use microservices.

Use a modular monolithic architecture.

43. BEFORE MAKING CHANGES

First inspect the current project.

If this is a new project, establish the foundation cleanly.

If there is already existing code, do not destroy working functionality unnecessarily.

Before changing existing architecture, explain what you found.

Do not silently replace existing authentication/database architecture.

44. REQUIRED OUTPUT

After implementing this prompt, provide a concise implementation summary containing:

1. Architecture

Explain the architecture you established.

2. Database

List every database table/model created.

3. Authentication

Explain how authentication works.

4. Authorization

Explain how roles and permissions work.

5. Multi-tenancy

Explain how Organization A is prevented from accessing Organization B's data.

6. Tester foundation

Explain TesterProfile, TesterDevice, TesterSkill and TesterVerification.

7. Campaign foundation

Explain Campaign, CampaignRequirement and CampaignTask.

8. Messaging

Explain:

Conversation

ConversationParticipant

Message

and specifically how you prevent client-to-tester communication.

9. Storage

Explain the storage architecture.

10. Payment

Explain the payment abstraction prepared for future implementation.

11. Security

Explain the security measures implemented.

12. Tests

List the tests performed.

13. Known issues

Clearly identify anything that requires manual configuration.

14. Files/components created

List the important files and directories.

45. ACCEPTANCE CRITERIA

Do not declare this prompt complete merely because the UI loads.

The following must work:

Authentication

User can register

User can log in

User can log out

Authenticated session is maintained

/auth/me or equivalent authenticated user retrieval works

Passwords are securely handled

Roles

The system correctly distinguishes:

CLIENT
TESTER
ADMIN


Organizations

Organization can exist

Users can belong to organizations

Organization roles work

Tenant isolation

Create test organizations:

Organization A
Organization B


Prove that:

Organization A user


cannot access:

Organization B campaign
Organization B conversation
Organization B data


Tester

Tester profile can be associated with a user.

Tester device and skill relationships work.

Campaign

Campaign can be associated with an organization.

Campaign requirements and tasks can be associated with a campaign.

Communication

The data model supports:

Client ↔ Admin


and prevents:

Client ↔ Tester


Security

Unauthorized access attempts are rejected.

46. VERY IMPORTANT: STOP AFTER PROMPT 001

Once the foundation is implemented and tested:

STOP.

Do NOT automatically start building the next feature.

Do NOT build the complete TestFlow platform.

Do NOT invent additional major features.

Wait for the next instruction.

We will review the implementation before moving to Prompt 002.

FINAL PRODUCT PRINCIPLE

Always remember:

TestFlow is not a marketplace where clients hire testers.

It is:

A managed testing platform where clients describe what they need, pay TestFlow, and TestFlow handles the people, operations, quality control, analysis and reporting.

The client buys the result.

The tester participates in the work.

TestFlow/Admin controls the operation.

Client ↔ Tester communication is prohibited.

Client ↔ Admin communication is supported.

Build the foundation around this principle.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4082defd-258f-4b53-934f-2f4129221d21).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
