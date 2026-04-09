/**
 * Quick smoke test for the Supabase client.
 *
 * Usage — import and call from any screen or the root layout during development:
 *
 *   import { testSupabaseConnection } from "@/lib/__tests__/supabaseConnectionTest";
 *   useEffect(() => { testSupabaseConnection(); }, []);
 *
 * Remove before shipping to production.
 */
import { supabase } from "@/lib/supabase";
import { CONFIG } from "@/constants/config";

export async function testSupabaseConnection(): Promise<void> {
  console.log("──── Supabase connection test ────");
  console.log("URL :", CONFIG.SUPABASE_URL || "(empty!)");
  console.log("KEY :", CONFIG.SUPABASE_ANON_KEY ? `${CONFIG.SUPABASE_ANON_KEY.slice(0, 12)}…` : "(empty!)");

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("getSession error:", error.message);
    } else {
      console.log("Session:", data.session ? `active (user ${data.session.user.id})` : "none (anonymous)");
    }
  } catch (e) {
    console.error("Network / config error:", e);
  }
  console.log("──── end test ────");
}
