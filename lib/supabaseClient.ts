import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufhctvcpkwpzgcfgmirx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaGN0dmNwa3dwemdjZmdtaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU3MDgsImV4cCI6MjA3OTA1MTcwOH0.qPkkj8Vr1ntmciIqGVbAH7ukeM9qi2mnGlWIDPGMGEQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
