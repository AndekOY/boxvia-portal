// INTERNAL DRAFT / RELEASE HOLD. NOT IMPORTED BY WORKER.
// No DELETE, UPDATE, INSERT, scheduler, or live D1 connection.
export const RELEASE_HOLD = true;
export const UNPAID_DAYS_PROPOSED = 30;
const iso = x => {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(x)) return false;
  const ms = Date.parse(x);
  if (!Number.isFinite(ms)) return false;
  const canonical = new Date(ms).toISOString();
  return canonical.slice(0,19) === x.slice(0,19);
};
export function classifyUnpaid(row, {now, days = UNPAID_DAYS_PROPOSED} = {}) {
  if (!iso(now) || !Number.isInteger(days) || days < 1) throw new TypeError('Invalid clock or days');
  if (!Number.isSafeInteger(row?.id) || row.id <= 0) return 'invalid_id';
  if (row.payment_status !== 'pending') return 'not_unpaid';
  if (row.legal_hold !== 0 || row.dispute_open !== 0) return 'hold_or_dispute_unknown';
  if (row.payment_reconciled !== 1) return 'payment_unreconciled';
  if (row.paypal_order_count !== 0) return 'paypal_order_or_unknown';
  if (row.outbox_count !== 0) return 'outbox_or_unknown';
  if (!iso(row.created_at) || Date.parse(row.created_at) > Date.parse(now)) return 'invalid_date';
  if (Date.parse(row.created_at) > Date.parse(now) - days*86400000) return 'not_due';
  // No approval state exists in draft schema: never return a deletion authorization.
  return 'review_required';
}
export async function dryRun(db, {now, days = UNPAID_DAYS_PROPOSED} = {}) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('D1-like read-only adapter required');
  if (!iso(now) || !Number.isInteger(days) || days < 1) throw new TypeError('Invalid clock or days');
  // Read-only, aggregate counts only. No customer fields or record IDs returned.
  const query = `SELECT COUNT(*) AS total FROM claims AS c
    JOIN bxc_retention_control AS r ON r.claim_id = c.id
    WHERE c.payment_status = 'pending' AND c.created_at <= ?
      AND strftime('%Y-%m-%dT%H:%M:%SZ', c.created_at) = c.created_at
      AND r.legal_hold = 0 AND r.dispute_open = 0 AND r.payment_reconciled = 1
      AND NOT EXISTS (SELECT 1 FROM paypal_orders AS p WHERE p.claim_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM notification_outbox AS o WHERE o.claim_id = c.id)`;
  const cutoff = new Date(Date.parse(now) - days*86400000).toISOString().replace('.000Z','Z');
  const result = await db.prepare(query).bind(cutoff).first();
  const count = Number(result?.total);
  if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('Invalid D1 count');
  return Object.freeze({mode:'READ_ONLY_DRAFT', releaseHold:RELEASE_HOLD, policy:'PROPOSED_NOT_APPROVED', cutoff, preliminaryCount:count, deletionAuthorized:false});
}
export function executeErasure() {
  throw new Error('RELEASE_HOLD: no D1 erasure executor is implemented or authorized');
}
