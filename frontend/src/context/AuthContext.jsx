import React, { createContext, useContext, useEffect, useState } from "react";
import services from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading");

  // ✅ Check auth state on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await services.auth.getCurrentUser();
        setUser(res.data); // ✅ Fixed: /auth/me returns user data directly, not res.data.user
        setAuthStatus("authenticated");
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error("Auth check failed", err);
        }
        setUser(null);
        setAuthStatus("unauthenticated");
      }
    };
    checkAuth();
  }, []);


  // ✅ Start Google OAuth (backend handles everything)
  const loginWithGoogle = () => {
    window.open("http://localhost:5000/auth/google", "_blank");
  };


  // ✅ Logout (backend-side)
  const logout = async () => {
    try {
      await services.auth.logout();
    } finally {
      localStorage.removeItem("token"); // ✅ Clear token from localStorage
      setUser(null);
      setAuthStatus("unauthenticated");
    }
  };

  // ✅ Set token and authenticate (for Electron OAuth callback)
  const setTokenAndAuthenticate = async (token) => {
    localStorage.setItem("token", token);
    try {
      const res = await services.auth.getCurrentUser();
      setUser(res.data);
      setAuthStatus("authenticated");
    } catch (err) {
      console.error("Failed to authenticate with token:", err);
      localStorage.removeItem("token");
      setAuthStatus("unauthenticated");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authStatus,
        isAuthenticated: authStatus === "authenticated",
        loginWithGoogle,
        logout,
        setTokenAndAuthenticate, // ✅ Expose new method
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
