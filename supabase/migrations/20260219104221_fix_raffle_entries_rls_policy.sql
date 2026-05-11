/*
  # Fix RLS Policy for raffle_entries table

  1. Security Changes
    - Drop the existing overly permissive INSERT policy that uses `WITH CHECK (true)`
    - Create a new INSERT policy that validates required fields are not empty
    - This prevents empty/spam submissions while still allowing public raffle entries

  2. Policy Details
    - The new policy requires all fields (first_name, last_name, company, email) to be non-empty
    - This is a reasonable restriction for a public form that doesn't require authentication
*/

DROP POLICY IF EXISTS "Anyone can insert a raffle entry" ON raffle_entries;

CREATE POLICY "Anonymous users can insert valid raffle entries"
  ON raffle_entries
  FOR INSERT
  TO anon
  WITH CHECK (
    first_name IS NOT NULL AND first_name <> '' AND
    last_name IS NOT NULL AND last_name <> '' AND
    company IS NOT NULL AND company <> '' AND
    email IS NOT NULL AND email <> '' AND
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );