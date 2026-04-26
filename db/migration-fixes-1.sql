-- =====================================================================
-- CuratedStack — fixes after first deploy
-- Run this in Supabase SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Add second FK app_submissions.submitter_id -> profiles.id
--    so PostgREST can embed `profiles:submitter_id(...)` in admin queries.
--    The original FK to auth.users(id) stays — Postgres allows multiple
--    FKs on the same column.
-- ---------------------------------------------------------------------
ALTER TABLE app_submissions
  DROP CONSTRAINT IF EXISTS app_submissions_submitter_id_profiles_fkey;

ALTER TABLE app_submissions
  ADD CONSTRAINT app_submissions_submitter_id_profiles_fkey
  FOREIGN KEY (submitter_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ask PostgREST to reload its schema cache so the new FK is picked up
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 2. Allow service_role / postgres superuser to bypass the
--    role-self-change trigger. Lets the admin run admin promotion
--    SQL directly from the Dashboard SQL Editor without DISABLE TRIGGER.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Bypass for service_role and superusers (Supabase Dashboard SQL Editor)
  IF current_user IN ('postgres', 'supabase_admin', 'service_role')
     OR current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
