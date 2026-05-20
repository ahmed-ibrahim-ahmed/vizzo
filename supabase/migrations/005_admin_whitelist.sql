-- Vizzo Platform — Admin Whitelist Migration
-- Establishes a strict administrative whitelist table to lock down administrative layouts.

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to query their own whitelist status.
-- They can ONLY SELECT their own email row.
CREATE POLICY "Admins can view own admin row" ON admins
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Seed Initial Administrator
INSERT INTO admins (email) 
VALUES ('ahmedibrahimahmed009988@gmail.com')
ON CONFLICT (email) DO NOTHING;
