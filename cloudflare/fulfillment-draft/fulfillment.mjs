// INTERNAL DRAFT / RELEASE HOLD. Pure state transition validation only.
// Not imported by Worker; no database, network, or mutation side effects.
export const RELEASE_HOLD = true;
export const STATES = Object.freeze(['new','in_review','ready','delivered','closed']);
const transitions = Object.freeze({new:['in_review'],in_review:['ready'],ready:['delivered'],delivered:['closed'],closed:[]});
const utc = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value.replace('Z','.000Z');
export function proposeTransition(record, event) {
  if (!record || !event || !Number.isSafeInteger(record.id) || record.id < 1) throw new TypeError('Invalid record');
  if (!STATES.includes(record.fulfillment_status)) return {decision:'BLOCK',reason:'unknown_state'};
  if (record.payment_status !== 'paid' || record.verified_capture !== true) return {decision:'BLOCK',reason:'payment_not_verified'};
  if (record.legal_hold !== false || record.dispute_open !== false) return {decision:'BLOCK',reason:'hold_dispute_or_unknown'};
  if (typeof event.to !== 'string' || !STATES.includes(event.to)) return {decision:'BLOCK',reason:'invalid_target'};
  if (record.fulfillment_status === event.to) return {decision:'REVIEW',reason:'idempotency_requires_authoritative_event_log'};
  if (!transitions[record.fulfillment_status].includes(event.to)) return {decision:'BLOCK',reason:'invalid_transition'};
  if (!utc(event.at)) return {decision:'BLOCK',reason:'invalid_timestamp'};
  if (typeof event.actor !== 'string' || !/^[a-zA-Z0-9._@-]{3,120}$/.test(event.actor)) return {decision:'BLOCK',reason:'actor_missing'};
  if (event.to === 'delivered' && (typeof event.delivery_reference !== 'string' || !/^[a-zA-Z0-9._:-]{8,128}$/.test(event.delivery_reference))) return {decision:'BLOCK',reason:'delivery_evidence_missing'};
  return Object.freeze({decision:'REVIEW',reason:'requires_authorized_transaction_and_audit',from:record.fulfillment_status,to:event.to,proposed_at:event.at,delivery_clock_may_start:event.to==='delivered'});
}
export function executeTransition() { throw new Error('RELEASE_HOLD: fulfillment executor not implemented'); }
