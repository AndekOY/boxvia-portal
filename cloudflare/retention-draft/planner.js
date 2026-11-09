// BXC retention planner v0.1 — PURE FUNCTION / NOT WIRED TO WORKER.
// No D1 queries, network, deletion, scheduler or production side effects.
// Input must be a synthetic/minimized snapshot. Never pass raw customer content.
export const PROPOSED_UNPAID_DAYS = 30;
const DAY_MS = 86400000;
const allowedStatuses = new Set(["pending"]);
export function planUnpaidRetention(records, { now, days = PROPOSED_UNPAID_DAYS } = {}) {
  if (!Array.isArray(records) || !Number.isInteger(days) || days < 1) throw new TypeError("Invalid input");
  const timestamp = Date.parse(now);
  if (!Number.isFinite(timestamp)) throw new TypeError("Invalid now");
  const cutoff = timestamp - days * DAY_MS;
  const candidates = [], held = [], excluded = [];
  for (const r of records) {
    if (!Number.isSafeInteger(r?.id) || r.id <= 0) throw new TypeError("Invalid claim id");
    // Fail closed: unknown flags, ambiguous payment/order state, legal holds,
    // disputes, and any payment attempts are excluded from automatic deletion.
    const reason = r.payment_status !== "pending" ? "not_unpaid" :
      r.legal_hold !== false ? "hold_unknown_or_active" :
      r.dispute_open !== false ? "dispute_unknown_or_active" :
      r.payment_reconciled !== true ? "payment_unreconciled" :
      r.paypal_order_count !== 0 ? "payment_order_exists_or_unknown" :
      r.outbox_pending !== false ? "outbox_pending_or_unknown" :
      !allowedStatuses.has(r.payment_status) ? "unknown_status" : null;
    if (reason) { (reason.includes("hold") || reason.includes("dispute") ? held : excluded).push({ id:r.id, reason }); continue; }
    const created = Date.parse(r.created_at);
    if (!Number.isFinite(created) || created > timestamp) { excluded.push({id:r.id,reason:"invalid_date"}); continue; }
    if (created > cutoff) { excluded.push({id:r.id,reason:"not_due"}); continue; }
    candidates.push({id:r.id,reason:"unpaid_age_threshold"});
  }
  return { mode:"DRY_RUN_ONLY", policy:"PROPOSED_NOT_APPROVED", cutoff:new Date(cutoff).toISOString(), candidates, held, excluded, counts:{candidates:candidates.length,held:held.length,excluded:excluded.length} };
}
