/**
 * BoxVia owner notifications, Google Apps Script (standalone).
 * Script Properties required: BOXVIA_API_URL, BOXVIA_API_TOKEN, OWNER_EMAIL.
 * Install a time-driven trigger for pollBoxViaRequests after synthetic test.
 * No customer personal data leaves D1 through this endpoint.
 */
function pollBoxViaRequests() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const base = props.getProperty('BOXVIA_API_URL');
    const token = props.getProperty('BOXVIA_API_TOKEN');
    const owner = props.getProperty('OWNER_EMAIL');
    if (!base || !/^https:\/\//.test(base) || !token || !owner) throw new Error('Missing configuration');
    let claimsAfter = Number(props.getProperty('CLAIMS_AFTER') || '0');
    let servicesAfter = Number(props.getProperty('SERVICES_AFTER') || '0');
    if (![claimsAfter, servicesAfter].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Invalid cursor');
    // Fetch a bounded batch; each subsequent scheduled run handles the next batch.
    const u = base.replace(/\/$/, '') + '/api/owner-notifications?claims_after=' +
      encodeURIComponent(claimsAfter) + '&services_after=' + encodeURIComponent(servicesAfter);
    const res = UrlFetchApp.fetch(u, {
      method: 'get', headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true, followRedirects: false
    });
    if (res.getResponseCode() !== 200) throw new Error('Notification endpoint HTTP ' + res.getResponseCode());
    const data = JSON.parse(res.getContentText());
    if (!Array.isArray(data.claims) || !Array.isArray(data.services)) throw new Error('Invalid response');
    const lines = [];
    for (const item of data.claims) {
      if (!Number.isSafeInteger(item.id) || item.id <= claimsAfter) throw new Error('Bad claim ID');
      lines.push('Check a Claim request #' + item.id);
      claimsAfter = item.id;
    }
    for (const item of data.services) {
      if (!Number.isSafeInteger(item.id) || item.id <= servicesAfter) throw new Error('Bad service ID');
      lines.push('Service request #' + item.id + ' (' + String(item.code || 'unknown').slice(0, 60) + ')');
      servicesAfter = item.id;
    }
    if (!lines.length) return;
    // Email only non-sensitive metadata. Save cursors AFTER successful send.
    MailApp.sendEmail(owner, 'BoxVia: ' + lines.length + ' new request(s)',
      lines.join('\n') + '\n\nReview the requests in Cloudflare D1. Do not reply to this automated alert.');
    props.setProperties({
      CLAIMS_AFTER: String(claimsAfter), SERVICES_AFTER: String(servicesAfter)
    });
  } finally {
    lock.releaseLock();
  }
}
