-- =====================================================================
-- CuratedStack — Auth, Profiles, Submissions, Bookmarks, Roles
-- =====================================================================
-- Run in Supabase SQL Editor (Project: jereytrwxnuwcvzvqhbg).
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------- Roles enum ----------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- TABLE: profiles
-- =====================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        CITEXT UNIQUE,
  display_name    TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  website_url     TEXT,
  twitter_url     TEXT,
  github_url      TEXT,
  role            user_role NOT NULL DEFAULT 'user',
  marketing_consent     BOOLEAN NOT NULL DEFAULT false,
  marketing_consent_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Auto-create profile on signup
-- =====================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, marketing_consent, marketing_consent_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, false),
    CASE WHEN (NEW.raw_user_meta_data->>'marketing_consent')::boolean = true
         THEN NOW() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: is_admin() — used in policies
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = uid AND role = 'admin'
  );
$$;

-- =====================================================================
-- TABLE: app_submissions
-- =====================================================================
CREATE TABLE IF NOT EXISTS app_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitter_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  description     TEXT,
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  logo_url        TEXT,
  screenshot_url  TEXT,
  status          submission_status NOT NULL DEFAULT 'pending',
  admin_note      TEXT,
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  approved_app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON app_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON app_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON app_submissions(created_at DESC);

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON app_submissions;
CREATE TRIGGER trg_submissions_updated_at
BEFORE UPDATE ON app_submissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- TABLE: bookmarks
-- =====================================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id      UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_app ON bookmarks(app_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks        ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
DROP POLICY IF EXISTS profiles_public_read     ON profiles;
DROP POLICY IF EXISTS profiles_self_update     ON profiles;
DROP POLICY IF EXISTS profiles_admin_all       ON profiles;

-- Anyone can read public profile fields (needed to show submitter on cards)
CREATE POLICY profiles_public_read ON profiles
  FOR SELECT USING (true);

-- A user can update only their own row (and cannot escalate role — see trigger)
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can do anything on profiles (e.g. promote/demote)
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Prevent self-promotion to admin: if a non-admin tries to change role, block it
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON profiles;
CREATE TRIGGER trg_prevent_role_self_change
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION prevent_role_self_change();

-- ---------- app_submissions ----------
DROP POLICY IF EXISTS submissions_owner_read   ON app_submissions;
DROP POLICY IF EXISTS submissions_owner_insert ON app_submissions;
DROP POLICY IF EXISTS submissions_owner_update ON app_submissions;
DROP POLICY IF EXISTS submissions_admin_all    ON app_submissions;

-- Submitter can read their own
CREATE POLICY submissions_owner_read ON app_submissions
  FOR SELECT USING (auth.uid() = submitter_id);

-- Authenticated user can submit (only as themselves)
CREATE POLICY submissions_owner_insert ON app_submissions
  FOR INSERT WITH CHECK (auth.uid() = submitter_id AND auth.uid() IS NOT NULL);

-- Submitter can edit ONLY while pending and only safe fields (status stays pending)
CREATE POLICY submissions_owner_update ON app_submissions
  FOR UPDATE USING (auth.uid() = submitter_id AND status = 'pending')
  WITH CHECK (auth.uid() = submitter_id AND status = 'pending');

-- Admin: full control
CREATE POLICY submissions_admin_all ON app_submissions
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---------- bookmarks ----------
DROP POLICY IF EXISTS bookmarks_owner_all ON bookmarks;

CREATE POLICY bookmarks_owner_all ON bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- Approve helper (admin RPC) — promotes a submission into apps table
-- =====================================================================
CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_admin_note    TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sub app_submissions;
  v_app_id UUID;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve submissions';
  END IF;

  SELECT * INTO v_sub FROM app_submissions WHERE id = p_submission_id;
  IF v_sub IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v_sub.status <> 'pending' THEN RAISE EXCEPTION 'Submission is not pending'; END IF;

  INSERT INTO apps (name, description, url, logo_url, screenshot_url, category, tags)
  VALUES (v_sub.name, v_sub.description, v_sub.url, v_sub.logo_url,
          v_sub.screenshot_url, v_sub.category, COALESCE(v_sub.tags, '{}'))
  RETURNING id INTO v_app_id;

  UPDATE app_submissions
     SET status = 'approved',
         admin_note = COALESCE(p_admin_note, admin_note),
         reviewed_by = auth.uid(),
         reviewed_at = NOW(),
         approved_app_id = v_app_id
   WHERE id = p_submission_id;

  RETURN v_app_id;
END;
$$;

CREATE OR REPLACE FUNCTION reject_submission(
  p_submission_id UUID,
  p_admin_note    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can reject submissions';
  END IF;
  UPDATE app_submissions
     SET status = 'rejected',
         admin_note = COALESCE(p_admin_note, admin_note),
         reviewed_by = auth.uid(),
         reviewed_at = NOW()
   WHERE id = p_submission_id AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION approve_submission(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION reject_submission(UUID, TEXT)  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_submission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_submission(UUID, TEXT)  TO authenticated;

-- =====================================================================
-- Storage bucket for avatars (run separately if first time)
-- =====================================================================
-- In Supabase Dashboard → Storage → New bucket → name "avatars", PUBLIC = true
-- Then run the policies below:
--
-- CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');
-- CREATE POLICY "avatars_user_insert" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE
--   USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================================
-- One-off: promote first admin (RUN MANUALLY, ONCE)
-- =====================================================================
-- After boecrim@gmail.com signs in for the first time:
--
-- UPDATE profiles SET role = 'admin'
--  WHERE id = (SELECT id FROM auth.users WHERE email = 'boecrim@gmail.com');
