// Draft-only one-time server checkout session state machine. Not wired to production.
// D1 migration required. No public endpoint, payment action or email sending.
const validId = s => typeof s === "string" && /^[A-Za-z0-9_-]{6,100}$/.test(s);
const validDigest = s => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
const hex = bytes => [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
const sha = async s => hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
export async function createCheckoutSessionDraft({db,claimId,verifyClaimCapability,accessToken,contractCatalogSha256,ttlSeconds=900,nowMs=Date.now(),randomBytes}) {
  if (!db?.prepare || !Number.isSafeInteger(claimId) || claimId < 1 ||
      typeof verifyClaimCapability !== "function" || !validDigest(contractCatalogSha256) ||
      !Number.isSafeInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 1800 ||
      !Number.isSafeInteger(nowMs) || typeof randomBytes !== "function") throw new TypeError("Invalid checkout session context");
  if (await verifyClaimCapability(db,claimId,accessToken) !== true) throw new Error("Claim capability not verified");
  const claim = await db.prepare("SELECT id, customer_email, payment_status FROM claims WHERE id = ?").bind(claimId).first();
  if (!claim || claim.id !== claimId || claim.payment_status !== "pending") throw new Error("Claim not eligible");
  const bytes = randomBytes(32);
  if (!(bytes instanceof Uint8Array) || bytes.length !== 32) throw new TypeError("Secure random bytes required");
  const sessionId = "BXC_" + hex(bytes);
  const expiresAt = new Date(nowMs + ttlSeconds*1000).toISOString();
  const result = await db.prepare("INSERT INTO contract_checkout_sessions (session_id, claim_id, customer_email, catalog_sha256, expires_at, status) VALUES (?, ?, ?, ?, ?, 'open')")
    .bind(sessionId,claimId,claim.customer_email,contractCatalogSha256,expiresAt).run();
  if (result.success !== true) throw new Error("Checkout session creation failed");
  return {sessionId,claimId,expiresAt};
}
export async function claimCheckoutAcceptanceDraft({db,sessionId,claimId,customerEmail,contractCatalogSha256,nowIso}) {
  if (!db?.prepare || !validId(sessionId) || !Number.isSafeInteger(claimId) || claimId < 1 ||
      typeof customerEmail !== "string" || !validDigest(contractCatalogSha256) ||
      Number.isNaN(Date.parse(nowIso || ""))) throw new TypeError("Invalid checkout acceptance claim");
  // One atomic transition. Never trust a browser-supplied timestamp.
  const result = await db.prepare("UPDATE contract_checkout_sessions SET status = 'consuming', updated_at = CURRENT_TIMESTAMP WHERE session_id = ? AND claim_id = ? AND customer_email = ? AND catalog_sha256 = ? AND status = 'open' AND expires_at > ?")
    .bind(sessionId,claimId,customerEmail,contractCatalogSha256,nowIso).run();
  if (result.meta?.changes !== 1) throw new Error("Checkout session unavailable, expired or consumed");
  return {sessionId,status:"consuming"};
}
export async function finalizeCheckoutAcceptanceDraft({db,sessionId,claimId,snapshotSha256}) {
  if (!db?.prepare || !validId(sessionId) || !Number.isSafeInteger(claimId) || claimId < 1 ||
      !validDigest(snapshotSha256)) throw new TypeError("Invalid checkout finalization");
  const result = await db.prepare("UPDATE contract_checkout_sessions SET status = 'accepted', snapshot_sha256 = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ? AND claim_id = ? AND status = 'consuming' AND snapshot_sha256 IS NULL AND EXISTS (SELECT 1 FROM contract_acceptance_archive WHERE order_id = ? AND snapshot_sha256 = ?)")
    .bind(snapshotSha256,sessionId,claimId,sessionId,snapshotSha256).run();
  if (result.meta?.changes !== 1) throw new Error("Checkout acceptance finalization requires archived snapshot");
  return {sessionId,status:"accepted",snapshotSha256};
}
export async function hashTrustedCatalogDraft(catalog) {
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) throw new TypeError("Invalid catalog");
  return sha(JSON.stringify(catalog));
}
