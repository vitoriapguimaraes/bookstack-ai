import { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../services/supabase";
import { api } from "../services/api"; // Build relies on this
import { SUPER_ADMIN_EMAIL } from "../utils/constants";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Preference States
  const [userAvatar, setUserAvatarState] = useState("User");
  const [userAvatarColor, setUserAvatarColorState] = useState("slate");
  const [userAvatarBg, setUserAvatarBgState] = useState("slate");
  const [yearlyGoal, setYearlyGoalState] = useState(20);

  useEffect(() => {
    // Check active session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Erro ao recuperar sessão:", error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            syncUserProfile();
            fetchUserPreferences();
          }
        }
      })
      .catch((err) => {
        console.error("Erro inesperado na sessão:", err);
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        syncUserProfile();
        fetchUserPreferences();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const res = await api.get("/preferences/");
      if (res.data) {
        if (res.data.avatar_icon) setUserAvatarState(res.data.avatar_icon);
        if (res.data.avatar_color)
          setUserAvatarColorState(res.data.avatar_color);
        if (res.data.avatar_bg) setUserAvatarBgState(res.data.avatar_bg);
        if (res.data.yearly_goal) setYearlyGoalState(res.data.yearly_goal);
      }
    } catch (error) {
      console.error("Erro ao carregar preferências do usuário:", error);
    }
  };

  const syncUserProfile = async () => {
    try {
      await api.post("/users/sync");
    } catch (error) {
      console.error("Erro ao sincronizar perfil:", error);
    }
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return data;
  };

  const signUp = async ({ email, password }) => {
    // New flow: Call Backend to register + sync immediately
    try {
      const { data } = await api.post("/auth/register", {
        email,
        password,
      });
      return { data, error: null };
    } catch (err) {
      console.error("SignUp Error:", err);
      // Format error to match what Login component expects (object with message)
      const errorMsg = err.response?.data?.detail || "Falha no cadastro";
      return { data: null, error: { message: errorMsg } };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    // Reset defaults
    setUserAvatarState("User");
    setUserAvatarColorState("slate");
    setUserAvatarBgState("slate");
    setYearlyGoalState(20);
  };

  const isAdmin = user?.email === SUPER_ADMIN_EMAIL;

  // Setters that sync with Backend
  const setUserAvatar = async (avatarName) => {
    setUserAvatarState(avatarName);
    try {
      await api.put("/preferences/", { avatar_icon: avatarName });
    } catch (err) {
      console.error("Failed to sync avatar icon:", err);
    }
  };

  const setUserAvatarColor = async (colorId) => {
    setUserAvatarColorState(colorId);
    try {
      await api.put("/preferences/", { avatar_color: colorId });
    } catch (err) {
      console.error("Failed to sync avatar color:", err);
    }
  };

  const setUserAvatarBg = async (bgId) => {
    setUserAvatarBgState(bgId);
    try {
      await api.put("/preferences/", { avatar_bg: bgId });
    } catch (err) {
      console.error("Failed to sync avatar bg:", err);
    }
  };

  const setYearlyGoal = async (goal) => {
    setYearlyGoalState(goal);
    try {
      await api.put("/preferences/", { yearly_goal: goal });
    } catch (err) {
      console.error("Failed to sync yearly goal:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        userAvatar,
        setUserAvatar,
        userAvatarColor,
        setUserAvatarColor,
        userAvatarBg,
        setUserAvatarBg,
        yearlyGoal,
        setYearlyGoal,
        fetchUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
