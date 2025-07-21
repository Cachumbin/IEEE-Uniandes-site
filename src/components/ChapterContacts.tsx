import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Cpu, HeartHandshake, Lightbulb, Rocket, Users2, Users, Mail } from 'lucide-react';

// A map to associate chapter names with icons and colors
const chapterVisuals: { [key: string]: { icon: React.ElementType, color: string } } = {
    "RAS": { icon: Rocket, color: "bg-neon-green/10 text-neon-green" },
    "WIE": { icon: HeartHandshake, color: "bg-neon-purple/10 text-neon-purple" },
    "IAS": { icon: Lightbulb, color: "bg-ieee-gold/10 text-ieee-gold" },
    "Computer Society": { icon: Cpu, color: "bg-neon-blue/10 text-neon-blue" },
    "SpaceTech": { icon: Users2, color: "bg-neon-pink/10 text-neon-pink" }
};

interface ChapterContactInfo {
    id: number;
    name: string;
    description: string;
    contact_email: string;
    member_count: number;
    destacados: string[];
}

export default function ChapterContacts() {
    const [chapters, setChapters] = useState<ChapterContactInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChapterContacts = async () => {
            const { data, error } = await supabase
                .from('chapters')
                .select('id, name, description, contact_email, member_count, destacados');
            
            if (error) {
                console.error("Error fetching chapter contacts:", error);
            } else {
                setChapters(data);
            }
            setLoading(false);
        };
        fetchChapterContacts();
    }, []);

    if (loading) {
        return <div className="text-center text-white py-10">Loading Chapters...</div>;
    }

    return (
        <section className="relative py-20 bg-ieee-dark-bg">
            <div className="max-w-6xl mx-auto px-6">
                <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-12 tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-ieee-gold">Contact our chapters</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {chapters.map((chapter) => {
                        const visuals = chapterVisuals[chapter.name] || { icon: Lightbulb, color: "bg-gray-500/10 text-gray-400" };
                        const Icon = visuals.icon;

                        return (
                            <div key={chapter.id} className={`glass-card p-7 rounded-2xl border border-white/10 shadow-lg hover:scale-[1.03] transition-all duration-300 ${visuals.color}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <Icon size={32} className={visuals.color.split(' ')[1]} />
                                    <h3 className="text-xl font-bold text-white">{chapter.name}</h3>
                                </div>
                                <p className="text-ieee-dark-muted mb-3 h-24 overflow-hidden">{chapter.description}</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <a href={`mailto:${chapter.contact_email}`} className="flex items-center gap-1 px-3 py-1 rounded bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition">
                                        <Mail size={12} /> {chapter.contact_email}
                                    </a>
                                    <span className="flex items-center gap-1 px-3 py-1 rounded bg-neon-green/10 text-neon-green text-xs font-semibold">
                                        <Users size={12} /> {chapter.member_count || 0}
                                    </span>
                                </div>
                                {chapter.destacados && chapter.destacados.length > 0 && (
                                    <div className="mt-4">
                                        <span className="text-xs text-ieee-gold font-bold">Destacados:</span>
                                        <ul className="list-disc list-inside ml-3 mt-1 text-sm text-white/90">
                                            {chapter.destacados.map((h, index) => (
                                                <li key={index}>{h}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
