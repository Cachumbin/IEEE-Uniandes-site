import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, Inbox, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';


export default function AuthStatus() {
    
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        
        // Click outside to close dropdown
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            authListener.subscription.unsubscribe();
            document.removeEventListener("mousedown", handleClickOutside);
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
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-300 bg-ieee-dark-surface/50 hover:bg-ieee-dark-card"
                >
                    <span>Hi, {user.user_metadata?.full_name?.split(' ')[0] || 'Admin'}</span>
                    <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-ieee-dark-card/95 backdrop-blur-md rounded-lg shadow-glow-blue border border-ieee-dark-border">
                        <a href="/admin/submissions" className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-neon-blue/10 text-ieee-dark-text hover:text-neon-blue transition-colors">
                            <Inbox size={16} /> Submissions
                        </a>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <a
            href="/login"
            className="btn-primary-nav text-sm text-center whitespace-nowrap"
        >
            Admin Login
        </a>
    );
}
