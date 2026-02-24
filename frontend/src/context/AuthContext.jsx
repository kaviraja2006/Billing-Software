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

  // ✅ Check auth state on app load with Retry Logic
  useEffect(() => {
    let retries = 0;
    const maxRetries = 50; // 15 seconds (300ms * 50) - Give backend ample time to start

    const checkAuth = async () => {
      try {
        const res = await services.auth.getCurrentUser();
        setUser(res.data);
        setAuthStatus("authenticated");

        // Send token to Electron for auto-backup timer on initial load
        const token = localStorage.getItem('token');
        if (token && window.electron?.setToken) {
          window.electron.setToken(token);
        }
      } catch (err) {
        if (err.code === "ERR_NETWORK" && retries < maxRetries) {
          retries++;
          // Silently retry after delay (faster retries = more responsive)
          setTimeout(checkAuth, 300);
          return;
        }

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

      // Notify Electron to stop auto-backup timer
      if (window.electron?.setToken) {
        window.electron.setToken(null);
      }
    }
  };

  // ✅ Set token and authenticate (for Electron OAuth callback)
  const setTokenAndAuthenticate = async (token) => {
    localStorage.setItem("token", token);
    try {
      const res = await services.auth.getCurrentUser();
      const userData = res.data;
      setUser(userData);
      setAuthStatus("authenticated");

      // Send token to Electron for auto-backup timer
      if (window.electron?.setToken) {
        window.electron.setToken(token);
      }
    } catch (err) {
      console.error("Failed to authenticate with token:", err);
      localStorage.removeItem("token");
      setAuthStatus("unauthenticated");
    }
  };

  // 4️⃣ Direct Login Helper (for OAuth / Instant Access)
  const loginSuccess = (token, userData) => {
    localStorage.setItem("token", token);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
    setAuthStatus("authenticated");
    // If we don't have userData yet, we can trigger a fetch
    if (!userData) {
      services.auth.getCurrentUser()
        .then(res => setUser(res.data))
        .catch(console.error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authStatus,
        logout,
        loginSuccess,
        loginWithGoogle, // ✅ FIXED: Added missing method
        setTokenAndAuthenticate, // ✅ FIXED: Added missing method
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
