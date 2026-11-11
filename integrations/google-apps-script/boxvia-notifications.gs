/**
 * BoxVia Notifications — Google Apps Script (owner-only).
 * Polls metadata-only D1 notifications; never sends customer personal data.
 * Script properties: BOXVIA_API_URL, OWNER_EMAIL, CLAIMS_AFTER,
 * SERVICES_AFTER, OWNER_NOTIFICATION_TOKEN.
 * Run setupBoxViaNotifications() once to authorize and create a 5-minute trigger.
 */
function boxViaPoll() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const p = PropertiesService.getScriptProperties();
    const base = (p.getProperty('BOXVIA_API_URL') || '').replace(/\/+$/, '');
    const owner = p.getProperty('OWNER_EMAIL') || '';
    const token = p.getProperty('OWNER_NOTIFICATION_TOKEN') || '';
    if (!/^https:\/\/boxvia\.andeks\.workers\.dev$/.test(base)) throw Error('Unexpected API origin');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) throw Error('OWNER_EMAIL is missing');
    if (token.length < 32) throw Error('OWNER_NOTIFICATION_TOKEN is missing or too short');
    const claimAfter = readCursor_(p, 'CLAIMS_AFTER');
    const serviceAfter = readCursor_(p, 'SERVICES_AFTER');
    const url = base + '/api/owner-notifications?claims_after=' + claimAfter +
      '&services_after=' + serviceAfter;
    const res = UrlFetchApp.fetch(url, {
      method: 'get', headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true, followRedirects: false
    });
    if (res.getResponseCode() !== 200) throw Error('API returned HTTP ' + res.getResponseCode());
    const payload = JSON.parse(res.getContentText());
    if (!Array.isArray(payload.claims) || !Array.isArray(payload.services)) throw Error('Unexpected API response');
    const claims = payload.claims.map(x => Number(x.id));
    const services = payload.services.map(x => ({ id: Number(x.id), code: String(x.code || '') }));
    if (claims.some(x => !Number.isSafeInteger(x) || x <= claimAfter) ||
        services.some(x => !Number.isSafeInteger(x.id) || x.id <= serviceAfter)) throw Error('Invalid IDs');
    if (!claims.length && !services.length) return;
    const lines = [
      'Новые заявки BoxVia (только идентификаторы).',
      '',
      'Check a Claim: ' + (claims.length ? claims.join(', ') : 'нет'),
      'Другие услуги: ' + (services.length ? services.map(x => '#' + x.id + ' [' + x.code + ']').join(', ') : 'нет'),
      '',
      'Полные сведения о заявках находятся в Cloudflare D1.',
      'Это уведомление не означает подтверждения оплаты.'
    ];
    // Advance cursors only after Gmail confirms acceptance.
    GmailApp.sendEmail(owner, 'BoxVia: новые заявки (' + (claims.length + services.length) + ')', lines.join('\n'));
    if (claims.length) p.setProperty('CLAIMS_AFTER', String(Math.max(...claims)));
    if (services.length) p.setProperty('SERVICES_AFTER', String(Math.max(...services.map(x => x.id))));
  } finally {
    lock.releaseLock();
  }
}
function readCursor_(p, name) {
  const s = p.getProperty(name) || '0';
  if (!/^(0|[1-9]\d{0,12})$/.test(s)) throw Error('Invalid ' + name);
  return Number(s);
}
function setupBoxViaNotifications() {
  // Avoid duplicate triggers when setup is run again.
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'boxViaPoll')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('boxViaPoll').timeBased().everyMinutes(5).create();
  // Do not call boxViaPoll here; authorization and API readiness are separate.
}
function stopBoxViaNotifications() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'boxViaPoll')
    .forEach(t => ScriptApp.deleteTrigger(t));
}
