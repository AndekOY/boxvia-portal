-- Preview-only atomic registration guard: no credential without consumed owner challenge.
CREATE TRIGGER IF NOT EXISTS hitl_passkey_registration_guard
BEFORE INSERT ON hitl_authenticators
WHEN NEW.enrollment_ref IN (SELECT id FROM hitl_passkey_enrollments)
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM hitl_passkey_enrollments e
  WHERE e.id=NEW.enrollment_ref AND e.owner_id=NEW.owner_id
    AND e.state='CONSUMED' AND e.rp_id=NEW.rp_id
    AND e.expires_at>CAST(strftime('%s','now') AS INTEGER)
    AND NEW.state='PENDING' AND NEW.public_key_spki IS NOT NULL
 ) THEN RAISE(ABORT,'hitl_enrollment_not_consumed') END;
END;
-- An existing credential ID UNIQUE constraint rejects duplicate registration.
