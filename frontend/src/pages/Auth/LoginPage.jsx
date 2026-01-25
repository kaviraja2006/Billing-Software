import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Lock, AlertCircle } from "lucide-react";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal";

const LoginPage = () => {
  const { authStatus, loginWithGoogle, setTokenAndAuthenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);

  const from = location.state?.from?.pathname || "/";

  // ✅ Redirect AFTER auth succeeds
  useEffect(() => {
    if (authStatus === "authenticated") {
      navigate(from, { replace: true });
    }
  }, [authStatus, from, navigate]);

  // ✅ Listen for Electron Google Auth Token
  useEffect(() => {
    if (window.electron) {
      window.electron.onGoogleAuthSuccess((token) => {
        console.log("✅ Received token from Electron, authenticating...");
        setTokenAndAuthenticate(token); // ✅ Use context method instead of reload
      });
    }
  }, [setTokenAndAuthenticate]);

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

        <div className="bg-blue-50 p-4 rounded-lg text-left space-y-2 border border-blue-100">
          <h3 className="font-semibold text-blue-900 text-sm">New: Automatic Backup</h3>
          <p className="text-xs text-blue-800">
            To keep your data safe, we now automatically backup your encrypted data to your Google Drive.
          </p>
          <p className="text-xs text-blue-600">
            You will be asked to grant permission to create files in your Drive. We only access files created by this app.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 justify-center">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={() => {
            try {
              loginWithGoogle();
            } catch {
              setError("Unable to start Google login.");
            }
          }}
          className="w-full h-10 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm"
        >
          Sign in with Google
        </button>

        <div className="pt-2">
          <button
            onClick={() => setShowPrivacy(true)}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Privacy & Data Security Policy
          </button>
        </div>
      </Card>

      <PrivacyPolicyModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </div>
  );
};

export default LoginPage;
