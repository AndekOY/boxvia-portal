# BXC D1 synthetic staging | INTERNAL DRAFT / RELEASE HOLD

Local-only schema and seed. No Cloudflare resource created. No DELETE.

Use Wrangler local D1 only after reviewing the commands and binding a separate local test database; never use --remote or production database_id.

Files: schema.sql, seed.sql, verify.sql. Local Python SQLite validation: expected preliminary_count=1, foreign_key_check empty. Cloudflare D1 compatibility NOT tested.
