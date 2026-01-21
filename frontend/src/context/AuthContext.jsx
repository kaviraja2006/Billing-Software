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

  // 1️⃣ Initial auth check
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthStatus("unauthenticated");
        return;
      }

      try {
        const res = await services.auth.getCurrentUser();
        setUser(res.data);
        setAuthStatus("authenticated");
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setAuthStatus("unauthenticated");
      }
    };

    init();
  }, []);

  // 2️⃣ Receive token from Electron
  useEffect(() => {
    if (!window.electronAuth) return;

    window.electronAuth.onToken(async (token) => {
      try {
        localStorage.setItem("token", token);
        const res = await services.auth.getCurrentUser();
        setUser(res.data);
        setAuthStatus("authenticated");
      } catch (err) {
        console.error("Auth failed:", err);
        setUser(null);
        setAuthStatus("unauthenticated");
      }
    });
  }, []);

  // 3️⃣ Logout (Electron-safe)
  const logout = async () => {
    try {
      await services.auth.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
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
        loginSuccess, // ✅ EXPOSED
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
