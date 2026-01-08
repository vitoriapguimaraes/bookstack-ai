import { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../services/supabase";
import { SUPER_ADMIN_EMAIL } from "../utils/constants";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // Manually update state to ensure fast UI response (listener will also fire but this is immediate)
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return data;
  };

  const signUp = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  const isAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const [userAvatar, setUserAvatarState] = useState(
    localStorage.getItem("user_avatar") || "User"
  );
  const [userAvatarColor, setUserAvatarColorState] = useState(
    localStorage.getItem("user_avatar_color") || "slate"
  );
  const [userAvatarBg, setUserAvatarBgState] = useState(
    localStorage.getItem("user_avatar_bg") || "slate"
  );

  const setUserAvatar = (avatarName) => {
    setUserAvatarState(avatarName);
    localStorage.setItem("user_avatar", avatarName);
  };

  const setUserAvatarColor = (colorId) => {
    setUserAvatarColorState(colorId);
    localStorage.setItem("user_avatar_color", colorId);
  };

  const setUserAvatarBg = (bgId) => {
    setUserAvatarBgState(bgId);
    localStorage.setItem("user_avatar_bg", bgId);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
