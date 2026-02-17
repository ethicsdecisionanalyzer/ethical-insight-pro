import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  profession: string | null;
  tenure: string | null;
  usage_count: number;
  max_analyses: number;
  book_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (userId: string, userMeta?: Record<string, unknown>) => {
    // Fetch profile and admin role in parallel
    const [profileResult, roleResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" as const }),
    ]);

    // Handle profile
    const { data } = profileResult;
    if (data) {
      if (userMeta && (!data.profession || !data.tenure)) {
        const updates: Record<string, unknown> = {};
        if (!data.profession && userMeta.profession) updates.profession = userMeta.profession;
        if (!data.tenure && userMeta.tenure) updates.tenure = userMeta.tenure;
        if (Object.keys(updates).length > 0) {
          await supabase.from("profiles").update(updates).eq("user_id", userId);
          Object.assign(data, updates);
        }
      }
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }

    // Handle admin role
    setIsAdmin(roleResult.data === true);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndRole(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const meta = session.user.user_metadata;
          setTimeout(() => fetchProfileAndRole(session.user.id, meta as Record<string, unknown>), 0);
        } else {
          setProfile(null);
          setIsAdmin(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      } else {
        setIsAdmin(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
