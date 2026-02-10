-- ============================================================
-- 009: Admin enabled column, Scheme poster_url, Document uploads
-- ============================================================

-- 1. Add 'enabled' column to admin_users (allows disabling admins without deleting)
ALTER TABLE public.admin_users
ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

COMMENT ON COLUMN public.admin_users.enabled IS 'Whether this admin account is currently active. Disabled admins cannot access admin panel.';

-- 2. Add 'poster_url' to schemes (poster/banner image for scheme display)
ALTER TABLE public.schemes
ADD COLUMN IF NOT EXISTS poster_url text;

COMMENT ON COLUMN public.schemes.poster_url IS 'URL to a poster/banner image for the scheme. Displayed on cards and detail pages.';

-- 3. Create documents storage bucket for user document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Update is_admin function to also check 'enabled'
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = user_id AND enabled = true
  );
$$;

-- 6. Add user_documents column to user_profiles for tracking uploaded docs
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS uploaded_documents jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_profiles.uploaded_documents IS 'Array of uploaded identity/supporting documents: [{name, url, type, uploaded_at}]';
