/*
  # Create raffle_entries table

  1. New Tables
    - `raffle_entries`
      - `id` (uuid, primary key)
      - `first_name` (text, required)
      - `last_name` (text, required)
      - `company` (text, required)
      - `email` (text, required)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS
    - Allow anonymous inserts (public raffle — no auth required)
    - No select policy (entries are private)
*/

CREATE TABLE IF NOT EXISTS raffle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a raffle entry"
  ON raffle_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);
