-- Set default values for existing users who don't have onboarding fields set
UPDATE perfis
SET 
    onboarding_completed = COALESCE(onboarding_completed, FALSE),
    onboarding_dismissed_count = COALESCE(onboarding_dismissed_count, 0)
WHERE onboarding_completed IS NULL OR onboarding_dismissed_count IS NULL;

-- Create a function to auto-trigger tour for new users on first login
-- This will be useful if we want to show the tour immediately on first dashboard visit
CREATE OR REPLACE FUNCTION check_first_login()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new profile being created, set onboarding fields
    IF NEW.onboarding_completed IS NULL THEN
        NEW.onboarding_completed := FALSE;
    END IF;
    
    IF NEW.onboarding_dismissed_count IS NULL THEN
        NEW.onboarding_dismissed_count := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run on profile insert
DROP TRIGGER IF EXISTS set_onboarding_defaults ON perfis;
CREATE TRIGGER set_onboarding_defaults
    BEFORE INSERT ON perfis
    FOR EACH ROW
    EXECUTE FUNCTION check_first_login();

COMMENT ON FUNCTION check_first_login() IS 'Automatically sets onboarding defaults for new users';
