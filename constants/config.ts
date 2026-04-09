export const CONFIG = {
  FREE_SCAN_LIMIT: 10,
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "",
  REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "",
} as const;

export type Tier = "free" | "pro";
