-- Session table for the Super Admin panel's fixed-email magic-link login.
-- Separate from the regular user magic_links table so a super-admin login
-- never touches (or depends on) a real users row.

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
