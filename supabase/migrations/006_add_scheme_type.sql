-- Add scheme_type to differentiate government vs private schemes
-- Government schemes: redirect to government portal
-- Private schemes: use our application form

ALTER TABLE public.schemes 
ADD COLUMN IF NOT EXISTS scheme_type text NOT NULL DEFAULT 'government' CHECK (scheme_type IN ('government', 'private'));

-- Add comment
COMMENT ON COLUMN public.schemes.scheme_type IS 'Type of scheme: government (redirect to portal) or private (use our form)';

-- Update existing schemes to government type by default
UPDATE public.schemes SET scheme_type = 'government' WHERE scheme_type IS NULL;
