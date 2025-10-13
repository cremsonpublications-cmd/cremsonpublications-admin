import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vayisutwehvbjpkhzhcc.supabase.co"; // replace with your actual Supabase URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheWlzdXR3ZWh2Ympwa2h6aGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDg2NzQsImV4cCI6MjA3NTU4NDY3NH0.368e_Tz9pWhTevzXmwXJI3bZ3G9OktrlZzy6lBA8oL4";

export const supabase = createClient(supabaseUrl, supabaseKey);
