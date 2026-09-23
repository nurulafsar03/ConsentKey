-- Adds the user_id link on members (needed for delete/update + duplicate-account
-- prevention in the Super Admin panel) and speeds up email lookups.

ALTER TABLE members ADD COLUMN user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
