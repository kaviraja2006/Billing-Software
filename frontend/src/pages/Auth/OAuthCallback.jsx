import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginSuccess } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            console.log("OAuth Success: Token received");
            // Instant Login
            loginSuccess(token);
            navigate('/', { replace: true });
        } else {
            console.error("OAuth Error: No token found");
            navigate('/login');
        }
    }, [searchParams, navigate, loginSuccess]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Completing Login...</h2>
            <p className="text-slate-500">Please wait while we redirect you.</p>
        </div>
    );
};

export default OAuthCallback;
