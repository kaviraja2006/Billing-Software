import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Lock, AlertCircle } from "lucide-react";

const LoginPage = () => {
  const { authStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  // ✅ Redirect ONLY after backend OAuth completes
  useEffect(() => {
    if (authStatus === "authenticated") {
      navigate(from, { replace: true });
    }
  }, [authStatus, from, navigate]);

  // ✅ Start Google login via backend + system browser
  const handleGoogleLogin = () => {
    try {
      window.open("http://localhost:5000/auth/google");
    } catch (err) {
      console.error(err);
      setError("Unable to open browser for Google login.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl text-center">
        <div className="space-y-2">
          <div className="mx-auto bg-primary-main text-white p-3 rounded-full w-fit">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-slate-500">
            Continue with your Google account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 justify-center">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full h-10 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </Card>
    </div>
  );
};

export default LoginPage;
