import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthStatus() {
    const [user, setUser] = useState<{ user_metadata?: { full_name?: string } } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const { data } = await supabase.auth.getSession();
            setUser(data.session?.user ?? null);
            setLoading(false);
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (loading) {
        return <div className="w-32 h-10 bg-gray-700 rounded-lg animate-pulse"></div>;
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-white text-sm hidden sm:block whitespace-nowrap">
                    Hi, {user.user_metadata?.full_name?.split(' ')[0] || 'Admin'}
                </span>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-300 whitespace-nowrap"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <a
            href="/login"
            className="bg-gradient-to-r from-neon-blue to-ieee-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-glow-blue transition-all duration-300 transform hover:scale-105 border border-neon-blue/30 text-sm text-center whitespace-nowrap"
        >
            Admin Login
        </a>
    );
}
