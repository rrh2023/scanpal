import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

type Tier = "free" | "pro";

type AuthState = {
  session: Session | null;
  user: User | null;
  tier: Tier;
  setSession: (session: Session | null) => void;
  setTier: (tier: Tier) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  tier: "free",
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setTier: (tier) => set({ tier }),
}));
