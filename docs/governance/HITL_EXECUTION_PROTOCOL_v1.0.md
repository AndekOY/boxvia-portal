# BOXVIA HITL EXECUTION PROTOCOL v1.0
Status: BASELINE IMPLEMENTATION PROTOCOL - 2026-11-15
Authority: BOXVIA HITL POLICY v1.0

## Five control gates
H1 - HUMAN-DEFINED SCOPE: record requester, object/version, question, scope, evidence boundary and authorized processing.
H2 - AUTHORIZED AI ASSISTANCE: record AI tools used when material, their role, input permissions and any prohibited transfers.
H3 - HUMAN EVIDENCE VERIFICATION: check material sources, citations, source versions, contradictions, uncertainty and missing evidence.
H4 - HUMAN JUDGMENT: assign finding and limitations independently; do not copy an AI verdict without verification.
H5 - ACCOUNTABLE RELEASE: responsible assessor checks deliverable, approves release and records the date and version.

## Minimal release record
- Case / request ID
- Service and object/version
- Responsible assessor
- Scope and evidence boundary
- Evidence sources and verification record
- AI assistance: none / used (purpose and constraints)
- Finding and limitations
- Human review completion
- Release approval, date and deliverable version

## Release decision
PASS only when all required gates are evidenced.
HOLD if sources, authorizations or human review are missing.
STOP if restricted-data processing or disclosure is unauthorized.
Never silently replace a failed gate with an AI-generated explanation.

## Public-service applicability
Check a Claim: retain the public primary-source boundary and SUPPORTED / NOT SUPPORTED / UNESTABLISHED findings. Payment confirmation does not equal assessment approval. Human release is required before delivery.
Technical Pilot: verify scenario, version, behavior, evidence and boundaries. Do not infer system-wide conformance from a bounded pilot.
Other reviews: follow the same gates at the proportional depth specified in the engagement.

## BCAF relationship
Use the applicable approved confidentiality rules. Draft BCAF documents do not automatically authorize restricted data, external AI processing or publication.

## Implementation status
This document defines required controls. It is NOT evidence that every existing production workflow already implements or logs all five gates. Verify actual practice before adding a human-reviewed label to individual reports or automatic communications.
