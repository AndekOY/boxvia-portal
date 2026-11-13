/**
 * BoxVia Production service-request notifier.
 * Separate Apps Script project from Preview. No trigger is created automatically.
 * Script Properties required:
 *   BOXVIA_PROD_BASE_URL = https://boxvia.andeks.workers.dev
 *   BOXVIA_PROD_OWNER_TOKEN = dedicated Production OWNER_NOTIFICATION_TOKEN
 *   BOXVIA_PROD_NOTIFY_TO = owner email address
 *   BOXVIA_PROD_SERVICES_AFTER = 0 (initially)
 * Never store tokens in source code, GitHub or logs.
 */
function boxViaProductionPoll() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const base = props.getProperty('BOXVIA_PROD_BASE_URL');
    const token = props.getProperty('BOXVIA_PROD_OWNER_TOKEN');
    const to = props.getProperty('BOXVIA_PROD_NOTIFY_TO');
    const cursor = props.getProperty('BOXVIA_PROD_SERVICES_AFTER') || '0';
    if (base !== 'https://boxvia.andeks.workers.dev' ||
        !token || token.length < 32 || !to ||
        !/^(0|[1-9][0-9]{0,12})$/.test(cursor)) {
      throw new Error('Production notification configuration incomplete');
    }
    const endpoint = base + '/api/owner-notifications?claims_after=0&services_after=' + encodeURIComponent(cursor);
    const response = UrlFetchApp.fetch(endpoint, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true,
      followRedirects: false
    });
    if (response.getResponseCode() !== 200) {
      throw new Error('Production notification endpoint returned HTTP ' + response.getResponseCode());
    }
    const payload = JSON.parse(response.getContentText());
    if (!payload || !Array.isArray(payload.services)) throw new Error('Invalid service queue response');
    let after = Number(cursor);
    for (const item of payload.services) {
      if (!Number.isSafeInteger(item.id) || item.id <= after ||
          typeof item.code !== 'string' || !/^[a-z0-9-]{1,80}$/.test(item.code)) {
        throw new Error('Invalid or unordered service queue entry');
      }
      MailApp.sendEmail({
        to,
        subject: '[PRODUCTION] BoxVia service request #' + item.id,
        body: 'A new BoxVia service request is recorded.\n' +
          'Request ID: ' + item.id + '\nService: ' + item.code + '\n' +
          'Open the authorized D1 administration interface to review details.\n' +
          'This notification intentionally contains no customer personal data.'
      });
      after = item.id;
      props.setProperty('BOXVIA_PROD_SERVICES_AFTER', String(after));
    }
    // Do not advance the cursor on empty results or failed delivery.
  } finally {
    lock.releaseLock();
  }
}
