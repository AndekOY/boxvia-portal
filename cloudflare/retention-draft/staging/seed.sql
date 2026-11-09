INSERT INTO claims(id,created_at,customer_email,claim_text,status,payment_status) VALUES
(1001,'2026-09-01T12:00:00Z','test1@example.invalid','SYNTHETIC','new','pending'),
(1002,'2026-09-01T12:00:00Z','test2@example.invalid','SYNTHETIC','new','paid'),
(1003,'2026-11-08T12:00:00Z','test3@example.invalid','SYNTHETIC','new','pending'),
(1004,'2026-09-01T12:00:00Z','test4@example.invalid','SYNTHETIC','new','pending'),
(1005,'2026-09-01T12:00:00Z','test5@example.invalid','SYNTHETIC','new','pending');
INSERT INTO bxc_retention_control(claim_id,legal_hold,dispute_open,payment_reconciled) VALUES (1001,0,0,1),(1002,0,0,1),(1003,0,0,1),(1004,1,0,1),(1005,0,0,1);
INSERT INTO paypal_orders(id,claim_id,paypal_order_id,amount,currency,status,created_at,updated_at) VALUES (2005,1005,'SYNTHETIC-ORDER-2005','20','USD','CREATED','2026-09-01T12:00:00Z','2026-09-01T12:00:00Z');
