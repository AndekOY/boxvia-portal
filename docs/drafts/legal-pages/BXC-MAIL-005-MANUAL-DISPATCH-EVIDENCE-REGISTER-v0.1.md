# BXC-MAIL-005 — Manual Gmail dispatch evidence register | v0.1
Status: INTERNAL TEMPLATE / NOT A LIVE CUSTOMER DATABASE
Decision: BXC-MAIL-003, owner-approved manual Gmail interim channel
Security: restrict access; do not store client data in a public GitHub repository.

## Order-level evidence record (store in restricted order archive, NOT GitHub)
- Order ID:
- Customer email (verified against accepted order):
- Accepted contract timestamp (UTC):
- Service and exact scope reference:
- Final amount and transaction-specific tax disclosure:
- Payment status and provider transaction reference:
- Applicable consumer/protected sole-trader classification and legal review:
- Early performance requested? (yes/no):
- Separate consequences acknowledgment? (yes/no):
- Early-performance consent wording/version and server timestamp (if yes):
- Lawful start timestamp and reason (if applicable):
- Terms version / SHA-256:
- Schedule version / SHA-256:
- Withdrawal notice/model form version / SHA-256:
- Privacy notice version / SHA-256:
- Complete English attachments reviewed? (yes/no):
- Sent from: andrzej.ekhmenin@gmail.com
- Sent to:
- Sent timestamp (UTC):
- Gmail sent message ID or stable Sent-folder reference:
- Evidence of delivery, if available (do not equate Sent with delivered):
- Stored sent-message copy and attachment location (restricted):
- Operator verification and date:
- Exception / correction log:
- Retention category and deletion review date (set only after policy approval):

## Fail-closed manual send checklist
1. Stop if final contract bytes are not frozen and approved, or order acceptance is not verified.
2. Confirm exact recipient, subject, order ID and price; remove all placeholders.
3. Check document content SHA-256 against the accepted snapshot; do not use a later changed website version.
4. Attach complete English terms, applicable schedule, withdrawal notice/model form, privacy notice. Confirm actual file attachments before sending.
5. Check early-performance evidence and applicable mandatory consumer timing; do not start work merely because payment was captured.
6. Send once from owner Gmail; save sent-message reference and timestamp; check for bounce/failure.
7. Do not include personal data in public repository, logs or unapproved AI prompts.
8. Never mark delivered without appropriate evidence.

## Boundary
This is a recordkeeping template, not proof that an email was sent or that legal requirements were met. GDPR retention, access controls and transfer disclosures remain subject to release verification. BXC stays HOLD.
