// Analytics Integration Guide for AuthContext.jsx
// Add this code to your authentication context after successful Google login

// LOCATION: frontend/src/context/AuthContext.jsx

// Add this function to your setTokenAndAuthenticate function:

const setTokenAndAuthenticate = async (token) => {
    localStorage.setItem("token", token);
    try {
        const response = await axios.get("http://localhost:5005/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const userData = response.data;
        setUser(userData);
        setAuthStatus("authenticated");

        // ✅ ADD THIS: Send user info to analytics (Electron only)
        if (window.electron && window.electron.sendUserInfo) {
            console.log('Sending user info to analytics');
            window.electron.sendUserInfo({
                name: userData.name || userData.displayName,
                email: userData.email
            });
        }
    } catch (error) {
        console.error("Authentication failed:", error);
        setAuthStatus("unauthenticated");
    }
};

// Alternative: If you handle login in a different way, add after successful auth:

// Example: After user object is available
useEffect(() => {
    if (user && user.email && window.electron && window.electron.sendUserInfo) {
        console.log('User authenticated, sending to analytics');
        window.electron.sendUserInfo({
            name: user.name || user.displayName,
            email: user.email
        });
    }
}, [user]);

// NOTE: This only works in Electron builds, not in browser.
// The check for window.electron ensures it doesn't break in web builds.
