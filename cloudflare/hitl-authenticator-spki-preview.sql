-- Preview only. Align stored credential with WebCrypto SPKI verification.
-- This is NOT a passkey enrollment or identity activation.
ALTER TABLE hitl_authenticators ADD COLUMN public_key_spki TEXT;
-- Existing synthetic records remain without SPKI and fail closed in signed preflight.
