import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dslrbaflqotaolaszthw.supabase.co";

const supabaseAnonKey =
  "sb_publishable_lOPEIqnVYoC0vAQcyZ6rVg_boNW8oxf";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);