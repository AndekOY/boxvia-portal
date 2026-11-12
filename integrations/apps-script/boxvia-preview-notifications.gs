/**
 * BoxVia isolated Preview notifications.
 * Independent of the existing Production boxViaPoll and its script properties.
 * Deploy as a SEPARATE Apps Script project; never paste over the Production script.
 *
 * Script properties (configure in Apps Script settings; NEVER commit values):
 *   BOXVIA_PREVIEW_OWNER_TOKEN - existing Preview Worker OWNER_NOTIFICATION_TOKEN
 *   BOXVIA_PREVIEW_RECIPIENT - destination email address
 *   BOXVIA_PREVIEW_SERVICES_AFTER - managed automatically; initially 0
 *
 * Requires authorization for UrlFetchApp, GmailApp, PropertiesService,
 * ScriptApp and LockService.
 */
const BOXVIA_PREVIEW_URL =
  'https://boxvia-service-preview.andeks.workers.dev/api/owner-notifications';
const BOXVIA_PREVIEW_PREFIX = 'BOXVIA_PREVIEW_';
const BOXVIA_PREVIEW_CODES = Object.freeze([
  'technical-pilot', 'one-question-review', 'focused-ai-governance-review',
  'independent-pre-decision-review', 'ai-governance-compliance-gap-assessment',
  'faar-stage-1'
]);

function boxViaPreviewPoll() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Preview poll already running');
  try {
    const properties = PropertiesService.getScriptProperties();
    const token = properties.getProperty(BOXVIA_PREVIEW_PREFIX + 'OWNER_TOKEN');
    const recipient = properties.getProperty(BOXVIA_PREVIEW_PREFIX + 'RECIPIENT');
    if (!token || token.length < 32 || !recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new Error('Preview notification configuration missing or invalid');
    }
    let cursor = Number(properties.getProperty(BOXVIA_PREVIEW_PREFIX + 'SERVICES_AFTER') || '0');
    if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error('Invalid Preview cursor');
    let sent = 0;
    for (let page = 0; page < 20; page++) {
      const url = BOXVIA_PREVIEW_URL + '?claims_after=0&services_after=' + cursor;
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true,
        followRedirects: false
      });
      if (response.getResponseCode() !== 200) {
        throw new Error('Preview notification API HTTP ' + response.getResponseCode());
      }
      const payload = JSON.parse(response.getContentText());
      if (!payload || !Array.isArray(payload.services)) throw new Error('Malformed Preview queue response');
      if (payload.services.length === 0) return { sent: sent, cursor: cursor };
      for (const item of payload.services) {
        if (!item || !Number.isSafeInteger(item.id) || item.id <= cursor ||
            typeof item.code !== 'string' || !/^[a-z0-9-]{1,70}$/.test(item.code)) {
          throw new Error('Unexpected Preview queue item');
        }
        const code = BOXVIA_PREVIEW_CODES.includes(item.code) ? item.code : 'other-service';
        // No customer email, form content or links in the notification.
        GmailApp.sendEmail(recipient, '[PREVIEW] BoxVia service request #' + item.id,
          'New BoxVia Preview service request.\n' +
          'ID: ' + item.id + '\n' +
          'Service: ' + code + '\n' +
          'Environment: isolated Preview D1 (boxvia-bxc-sandbox).\n' +
          'This message does not confirm payment.\n' +
          'Review full details only in authorized Cloudflare D1.');
        cursor = item.id;
        // Advance only after GmailApp reports success, preventing silent loss.
        properties.setProperty(BOXVIA_PREVIEW_PREFIX + 'SERVICES_AFTER', String(cursor));
        sent++;
      }
      if (payload.services.length < 100) return { sent: sent, cursor: cursor };
    }
    return { sent: sent, cursor: cursor, moreMayRemain: true };
  } finally {
    lock.releaseLock();
  }
}

function setupBoxViaPreviewNotifications() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty(BOXVIA_PREVIEW_PREFIX + 'OWNER_TOKEN');
  const recipient = properties.getProperty(BOXVIA_PREVIEW_PREFIX + 'RECIPIENT');
  if (!token || token.length < 32 || !recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Set Preview token and recipient in Script Properties first');
  }
  if (properties.getProperty(BOXVIA_PREVIEW_PREFIX + 'SERVICES_AFTER') === null) {
    properties.setProperty(BOXVIA_PREVIEW_PREFIX + 'SERVICES_AFTER', '0');
  }
  const exists = ScriptApp.getProjectTriggers().some(
    trigger => trigger.getHandlerFunction() === 'boxViaPreviewPoll'
  );
  if (!exists) ScriptApp.newTrigger('boxViaPreviewPoll').timeBased().everyMinutes(5).create();
  return 'Preview-only trigger configured. Run boxViaPreviewPoll once for the E2E test.';
}
