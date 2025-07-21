import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthForm() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{ user_metadata?: { full_name?: string }; email?: string } | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signupCode, setSignupCode] = useState('');
    const [authMode, setAuthMode] = useState('login');
    const [message, setMessage] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Fade-in effect on mount
        setVisible(true);

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                const currentUser = session?.user;
                setUser(currentUser ?? null);
                setIsLoggedIn(!!currentUser);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleAuthAction = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        if (authMode === 'signup') {
            if (signupCode !== import.meta.env.PUBLIC_ADMIN_SIGNUP_CODE) {
                setMessage({ type: 'error', content: 'Invalid Admin Signup Code.' });
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                setMessage({ type: 'error', content: error.message });
            } else {
                setMessage({ type: 'success', content: 'Signup successful! Check your email for a verification link.' });
            }
        } else {
            // --- LOGIN LOGIC ---
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage({ type: 'error', content: error.message });
            } else {
                setMessage({ type: 'success', content: 'Logged in successfully! Redirecting...' });
                // Redirects to the homepage after a successful login
                window.location.href = '/';
            }
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        // **UPDATED**: Redirects to the homepage after logging out
        window.location.href = '/';
    };

    // This part of the component is shown on the /login page IF the user is already logged in
    if (isLoggedIn) {
        return (
            <div className={`w-full max-w-md mx-auto text-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-gray-800/80 backdrop-blur-md shadow-2xl rounded-lg px-8 py-10">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome, Admin!</h2>
                    <p className="text-lg text-blue-300 mb-6">{user?.user_metadata?.full_name || user?.email}</p>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500"
                    >
                        {loading ? 'Logging out...' : 'Logout'}
                    </button>
                </div>
            </div>
        );
    }

    // This is the main login/signup form
    return (
        <div className={`w-full max-w-md mx-auto transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex justify-center mb-4">
                <button
                    onClick={() => setAuthMode('login')}
                    className={`px-6 py-2 font-semibold rounded-l-lg transition-all duration-300 ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300'}`}
                >
                    Login
                </button>
                <button
                    onClick={() => setAuthMode('signup')}
                    className={`px-6 py-2 font-semibold rounded-r-lg transition-all duration-300 ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300'}`}
                >
                    Create Account
                </button>
            </div>

            <form onSubmit={handleAuthAction} className="bg-gray-800/80 backdrop-blur-md shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl text-white font-bold text-center mb-6">{authMode === 'login' ? 'Admin Login' : 'Admin Registration'}</h2>
                
                {authMode === 'signup' && (
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                            Full Name
                        </label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="shadow-sm appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" />
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="shadow-sm appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="shadow-sm appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" />
                </div>

                {authMode === 'signup' && (
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="signup-code">
                            Admin Signup Code
                        </label>
                        <input id="signup-code" type="password" value={signupCode} onChange={(e) => setSignupCode(e.target.value)} required className="shadow-sm appearance-none border border-gray-600 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" />
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100">
                        {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Create Account')}
                    </button>
                </div>
                
                {message.content && (
                    <p className={`mt-4 text-center text-sm font-semibold ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                        {message.content}
                    </p>
                )}
            </form>
        </div>
    );
}
