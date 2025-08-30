import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qhkaltdodktjsgynlmzr.supabase.co"; // replace with your actual Supabase URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoa2FsdGRvZGt0anNneW5sbXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDA0NTgsImV4cCI6MjA3MTc3NjQ1OH0.kJLXurJwVGom_vUeIcGujnaQ2Q9w30mEhozMjc9QoUg";

export const supabase = createClient(supabaseUrl, supabaseKey);
