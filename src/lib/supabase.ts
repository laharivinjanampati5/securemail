import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://yctcryjauquiacmtlcqm.supabase.co';
const fallbackKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdGNyeWphdXF1aWFjbXRsY3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTI2ODksImV4cCI6MjEwNTY2ODY4OX0.uR9xuk3_nA0ZRXsMxnxN9t45GK4Lt0Z86YfwxY0IdqU';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
