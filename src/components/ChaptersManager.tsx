import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Define the types for our structured JSONB data
interface Leader {
    name: string;
    role: string;
}

interface SocialMedia {
    [key: string]: string; // e.g., { "instagram": "url", "linkedin": "url" }
}

// Update the Chapter interface with all the new fields
interface Chapter {
    id: number;
    name: string;
    description: string;
    logo_url: string;
    hero_image_url: string;
    mission: string;
    vision: string;
    history: string;
    projects: string;
    leaders: Leader[];
    social_media: SocialMedia;
}

export default function ChaptersManager() {
    const [user, setUser] = useState<User | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Chapter | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchChapters = async () => {
            const { data, error } = await supabase.from('chapters').select('*').order('name');
            if (!error) {
                setChapters(data);
            } else {
                console.error("Error fetching chapters:", error);
            }
            setLoading(false);
        };

        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };

        fetchChapters();
        checkUser();
    }, []);

    const handleCreate = () => {
        setIsCreating(true);
        setIsEditing(null);
    };

    const handleEdit = (chapter: Chapter) => {
        setIsEditing(chapter);
        setIsCreating(false);
    };

    const handleDelete = async (chapterId: number) => {
        if (window.confirm('Are you sure you want to delete this chapter?')) {
            const { error } = await supabase.from('chapters').delete().match({ id: chapterId });
            if (error) {
                alert(`Error: ${error.message}`);
            } else {
                setChapters(chapters.filter(c => c.id !== chapterId));
                alert('Chapter deleted successfully.');
            }
        }
    };

    if (loading) {
        return <div className="text-center text-white py-10">Loading Chapters...</div>;
    }

    if (isCreating || isEditing) {
        return (
            <ChapterForm
                chapter={isEditing}
                onClose={() => {
                    setIsCreating(false);
                    setIsEditing(null);
                }}
                onSave={(newChapter) => {
                    if (isCreating) {
                        setChapters([...chapters, newChapter]);
                    } else {
                        setChapters(chapters.map(c => c.id === newChapter.id ? newChapter : c));
                    }
                    setIsCreating(false);
                    setIsEditing(null);
                }}
            />
        );
    }

    // Main display view
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-between items-center mb-8 pt">
                <h1 className="text-4xl font-bold text-white font-display">Nuestros Capítulos</h1>
                {user && (
                    <button onClick={handleCreate} className="btn-primary-nav">
                        Add New Chapter
                    </button>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                {chapters.map(chapter => (
                    <div key={chapter.id} className="bg-ieee-dark-card/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden group relative">
                        <img src={chapter.hero_image_url || 'https://placehold.co/600x400/0f172a/FFF?text=IEEE'} alt={chapter.name} className="w-full h-56 object-cover" />
                        <div className="p-6">
                            <img src={chapter.logo_url || 'https://placehold.co/100x100/1e293b/FFF?text=Logo'} alt={`${chapter.name} Logo`} className="w-24 h-24 rounded-full -mt-16 border-4 border-ieee-dark-card shadow-md" />
                            <h2 className="text-3xl font-bold text-white mt-4">{chapter.name}</h2>
                            <p className="text-ieee-dark-muted mt-2 text-lg">{chapter.description}</p>
                            
                            <div className="mt-6 space-y-4">
                                {chapter.mission && <div><h3 className="font-bold text-neon-blue">Misión</h3><p className="text-ieee-dark-text">{chapter.mission}</p></div>}
                                {chapter.vision && <div><h3 className="font-bold text-neon-blue">Visión</h3><p className="text-ieee-dark-text">{chapter.vision}</p></div>}
                                {chapter.leaders && chapter.leaders.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-neon-blue mb-2">Junta Directiva</h3>
                                        <ul className="list-disc list-inside text-ieee-dark-text">
                                            {chapter.leaders.map(leader => <li key={leader.name}><strong>{leader.role}:</strong> {leader.name}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        {user && (
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => handleEdit(chapter)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg">Edit</button>
                                <button onClick={() => handleDelete(chapter.id)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg">Delete</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- Form Component for Create/Update ---
function ChapterForm({ chapter, onClose, onSave }: { chapter: Chapter | null, onClose: () => void, onSave: (c: Chapter) => void }) {
    const [name, setName] = useState(chapter?.name || '');
    const [description, setDescription] = useState(chapter?.description || '');
    const [mission, setMission] = useState(chapter?.mission || '');
    const [vision, setVision] = useState(chapter?.vision || '');
    const [history, setHistory] = useState(chapter?.history || '');
    const [projects, setProjects] = useState(chapter?.projects || '');
    const [leadersStr, setLeadersStr] = useState(JSON.stringify(chapter?.leaders || [], null, 2));
    const [socialMediaStr, setSocialMediaStr] = useState(JSON.stringify(chapter?.social_media || {}, null, 2));
    
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uploadFile = async (file: File, path: string) => {
        const { data, error } = await supabase.storage.from('chapter-images').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('chapter-images').getPublicUrl(data.path);
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            let logo_url = chapter?.logo_url || '';
            if (logoFile) {
                logo_url = await uploadFile(logoFile, `logos/${Date.now()}_${logoFile.name}`);
            }

            let hero_image_url = chapter?.hero_image_url || '';
            if (heroFile) {
                hero_image_url = await uploadFile(heroFile, `heroes/${Date.now()}_${heroFile.name}`);
            }

            const leaders = JSON.parse(leadersStr);
            const social_media = JSON.parse(socialMediaStr);

            const chapterData = { name, description, mission, vision, history, projects, leaders, social_media, logo_url, hero_image_url };

            if (chapter) { // Update
                const { data, error } = await supabase.from('chapters').update(chapterData).match({ id: chapter.id }).select();
                if (error) throw error;
                onSave(data[0]);
            } else { // Create
                const { data, error } = await supabase.from('chapters').insert(chapterData).select();
                if (error) throw error;
                onSave(data[0]);
            }
        } catch (error: any) {
            if (error instanceof SyntaxError) {
                alert("Error: Invalid JSON format in Leaders or Social Media fields. Please check the syntax.");
            } else {
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const jsonTextareaClass = "w-full bg-ieee-dark-surface p-2 rounded text-white font-mono text-sm";

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <form onSubmit={handleSubmit} className="bg-ieee-dark-card p-8 rounded-lg shadow-lg space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">{chapter ? 'Edit Chapter' : 'Create New Chapter'}</h2>
                
                <div><label htmlFor="name" className="block text-ieee-dark-muted mb-2">Chapter Name</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-ieee-dark-surface p-2 rounded text-white" /></div>
                <div><label htmlFor="description" className="block text-ieee-dark-muted mb-2">Description</label><textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-ieee-dark-surface p-2 rounded text-white h-24"></textarea></div>
                <div><label htmlFor="mission" className="block text-ieee-dark-muted mb-2">Mission</label><textarea id="mission" value={mission} onChange={e => setMission(e.target.value)} className="w-full bg-ieee-dark-surface p-2 rounded text-white h-24"></textarea></div>
                <div><label htmlFor="vision" className="block text-ieee-dark-muted mb-2">Vision</label><textarea id="vision" value={vision} onChange={e => setVision(e.target.value)} className="w-full bg-ieee-dark-surface p-2 rounded text-white h-24"></textarea></div>
                <div><label htmlFor="history" className="block text-ieee-dark-muted mb-2">History</label><textarea id="history" value={history} onChange={e => setHistory(e.target.value)} className="w-full bg-ieee-dark-surface p-2 rounded text-white h-24"></textarea></div>
                <div><label htmlFor="projects" className="block text-ieee-dark-muted mb-2">Projects & Initiatives</label><textarea id="projects" value={projects} onChange={e => setProjects(e.target.value)} className="w-full bg-ieee-dark-surface p-2 rounded text-white h-24"></textarea></div>

                <div>
                    <label htmlFor="leaders" className="block text-ieee-dark-muted mb-2">Leaders (JSON format)</label>
                    <textarea id="leaders" value={leadersStr} onChange={e => setLeadersStr(e.target.value)} className={jsonTextareaClass} rows={6} placeholder={`[\n  {\n    "name": "Full Name",\n    "role": "President"\n  }\n]`}></textarea>
                </div>
                
                <div>
                    <label htmlFor="social_media" className="block text-ieee-dark-muted mb-2">Social Media (JSON format)</label>
                    <textarea id="social_media" value={socialMediaStr} onChange={e => setSocialMediaStr(e.target.value)} className={jsonTextareaClass} rows={4} placeholder={`{\n  "instagram": "https://...",\n  "linkedin": "https://..."\n}`}></textarea>
                </div>

                <div><label htmlFor="logo" className="block text-ieee-dark-muted mb-2">Logo Image</label><input type="file" id="logo" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} className="w-full text-white" /></div>
                <div><label htmlFor="hero" className="block text-ieee-dark-muted mb-2">Hero Image</label><input type="file"id="hero" onChange={e => setHeroFile(e.target.files ? e.target.files[0] : null)} className="w-full text-white" /></div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={isSubmitting} className="btn-primary-nav flex-1">{isSubmitting ? 'Saving...' : 'Save Chapter'}</button>
                    <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                </div>
            </form>
        </div>
    );
}
