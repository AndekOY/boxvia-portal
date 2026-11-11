# BXC / BoxVia — minimal email notification decision (2026-11-11)

Status: DRAFT / NO PRODUCTION CHANGE.

## Verified source facts
- Production Worker `cloudflare/worker.js` writes Check a Claim requests to D1 `claims` and returns request ID/access token; no email notification is invoked.
- `cloudflare/service-request.js` writes other service requests to D1 `service_requests`; source explicitly says never email or log content.
- Owner's Cloudflare screenshot shows Email Sending requires Workers Paid and is unavailable on current plan.
- Email Routing is for inbound mail forwarding to a verified destination; it is not a D1-to-Gmail outbound notification mechanism.
- Resend is not used and its environment variables were removed by owner. Do not reintroduce it.

## MINIMAX decision
1. Keep D1 as the source of truth and Gmail as the owner's manual response channel.
2. Do not buy Workers Paid, activate Email Sending, create an additional Worker, or enable a third-party provider solely for notification.
3. Do not claim that email notifications are operational. D1 insertion alone cannot deliver Gmail notifications.
4. Until a verified notification mechanism exists, owner must manually inspect the D1 `claims` and `service_requests` tables. This does not meet the owner's preferred automatic-email requirement and is an interim fallback only.
5. Gmail Apps Script plus a protected read-only D1 API is technically possible but would require an authenticated API endpoint, scheduled polling, Google authorization, duplicate suppression and privacy/security review; do not deploy it without a separate decision. Gmail SMTP cannot be called directly from the Worker as a drop-in free substitute.
6. If immediate Gmail notification is mandatory before accepting requests, keep intake on HOLD until an approved, tested notification path exists. Do not promise a 24-hour service clock based solely on an unread D1 row.

## Remaining minimal decision
Owner to choose either (A) temporary manual D1 monitoring, or (B) authorize a small Gmail Apps Script notification integration with access controls and synthetic-only testing. Neither choice authorizes live payments or publication of unapproved consumer terms.
