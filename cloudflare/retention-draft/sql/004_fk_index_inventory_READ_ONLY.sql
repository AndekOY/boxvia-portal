-- BXC-D1 structural inventory v0.1. READ ONLY. No customer rows.
-- Cloudflare D1 Studio may show multiple result sets; run each SELECT separately if needed.
SELECT 'claims' AS table_name, id, seq, "table" AS parent_table, "from" AS child_column,
       "to" AS parent_column, on_update, on_delete
FROM pragma_foreign_key_list('claims')
UNION ALL
SELECT 'claim_access', id, seq, "table", "from", "to", on_update, on_delete
FROM pragma_foreign_key_list('claim_access')
UNION ALL
SELECT 'paypal_orders', id, seq, "table", "from", "to", on_update, on_delete
FROM pragma_foreign_key_list('paypal_orders')
UNION ALL
SELECT 'notification_outbox', id, seq, "table", "from", "to", on_update, on_delete
FROM pragma_foreign_key_list('notification_outbox')
ORDER BY table_name, id, seq;

SELECT m.name AS table_name, il.name AS index_name, il."unique" AS is_unique,
       il.origin AS index_origin, il.partial AS is_partial,
       ii.seqno AS position, ii.name AS column_name
FROM sqlite_master AS m
JOIN pragma_index_list(m.name) AS il
JOIN pragma_index_info(il.name) AS ii
WHERE m.type = 'table'
  AND m.name IN ('claims','claim_access','paypal_orders','notification_outbox')
ORDER BY m.name, il.name, ii.seqno;

SELECT name AS object_name, type AS object_type, sql AS definition
FROM sqlite_master
WHERE type IN ('trigger','view')
  AND (tbl_name IN ('claims','claim_access','paypal_orders','notification_outbox')
       OR sql LIKE '%claims%' OR sql LIKE '%paypal_orders%')
ORDER BY type, name;
-- Metadata can include application logic, but should not include customer records.
