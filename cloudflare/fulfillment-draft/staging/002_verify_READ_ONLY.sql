-- READ ONLY; isolated staging only. Never print customer records.
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('claims','claim_access','notification_outbox','paypal_orders','bxc_fulfillment','bxc_fulfillment_events') ORDER BY name;
SELECT 'fulfillment', COUNT(*) FROM bxc_fulfillment;
SELECT 'events', COUNT(*) FROM bxc_fulfillment_events;
PRAGMA foreign_key_check;
