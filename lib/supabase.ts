import { createClient } from "@supabase/supabase-js";

function env(name: string) {
  return String(process.env[name] || "").trim();
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const service = env("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseBrowser =
  url && anon ? createClient(url, anon) : null;

export const supabaseAdmin =
  url && service
    ? createClient(url, service, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;
