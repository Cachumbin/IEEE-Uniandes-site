import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, PlusCircle, XCircle } from 'lucide-react';

interface Leader {
    id: number;
    name: string;
    role: string;
}

interface SocialMedia {
    [key: string]: string;
}

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
                        setChapters([...chapters, newChapter].sort((a, b) => a.name.localeCompare(b.name)));
                    } else {
                        setChapters(chapters.map(c => c.id === newChapter.id ? newChapter : c).sort((a, b) => a.name.localeCompare(b.name)));
                    }
                    setIsCreating(false);
                    setIsEditing(null);
                }}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white font-display">Nuestros Capítulos</h1>
                {user && (
                    <button onClick={handleCreate} className="btn-primary-nav flex items-center gap-2">
                        <Plus size={18} />
                        New Chapter
                    </button>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                {chapters.map(chapter => (
                    <div key={chapter.id} className="bg-ieee-dark-card/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden group relative">
                        <div className="relative w-full h-56 overflow-hidden bg-ieee-dark-surface">
                           <img 
                                src={chapter.hero_image_url || 'https://placehold.co/600x400/0f172a/FFF?text=IEEE'} 
                                alt={chapter.name} 
                                className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
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
                                            {chapter.leaders.map((leader, index) => <li key={index}><strong>{leader.role}:</strong> {leader.name}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        {user && (
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => handleEdit(chapter)} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-lg flex items-center justify-center"><Edit size={16}/></button>
                                <button onClick={() => handleDelete(chapter.id)} className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition shadow-lg flex items-center justify-center"><Trash2 size={16}/></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChapterForm({ chapter, onClose, onSave }: { chapter: Chapter | null, onClose: () => void, onSave: (c: Chapter) => void }) {
    const [name, setName] = useState(chapter?.name || '');
    const [description, setDescription] = useState(chapter?.description || '');
    const [mission, setMission] = useState(chapter?.mission || '');
    const [vision, setVision] = useState(chapter?.vision || '');
    const [history, setHistory] = useState(chapter?.history || '');
    const [projects, setProjects] = useState(chapter?.projects || '');
    // --- NEW: State for dynamic forms ---
    const [leaders, setLeaders] = useState(chapter?.leaders?.map((l, i) => ({...l, id: i})) || []);
    const [socials, setSocials] = useState(Object.entries(chapter?.social_media || {}).map(([platform, url], i) => ({id: i, platform, url})));

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleLeaderChange = (index: number, field: 'name' | 'role', value: string) => {
        const newLeaders = [...leaders];
        newLeaders[index][field] = value;
        setLeaders(newLeaders);
    };
    const addLeader = () => setLeaders([...leaders, { id: Date.now(), name: '', role: '' }]);
    const removeLeader = (id: number) => setLeaders(leaders.filter(l => l.id !== id));

    const handleSocialChange = (index: number, field: 'platform' | 'url', value: string) => {
        const newSocials = [...socials];
        newSocials[index][field] = value;
        setSocials(newSocials);
    };
    const addSocial = () => setSocials([...socials, { id: Date.now(), platform: '', url: '' }]);
    const removeSocial = (id: number) => setSocials(socials.filter(s => s.id !== id));

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
            if (logoFile) logo_url = await uploadFile(logoFile, `logos/${Date.now()}_${logoFile.name}`);

            let hero_image_url = chapter?.hero_image_url || '';
            if (heroFile) hero_image_url = await uploadFile(heroFile, `heroes/${Date.now()}_${heroFile.name}`);

            const leadersToSave = leaders.map(({ name, role }) => ({ name, role }));
            const socialMediaToSave = socials.reduce((acc, { platform, url }) => {
                if (platform) acc[platform] = url;
                return acc;
            }, {} as SocialMedia);

            const chapterData = { name, description, mission, vision, history, projects, leaders: leadersToSave, social_media: socialMediaToSave, logo_url, hero_image_url };

            if (chapter) {
                const { data, error } = await supabase.from('chapters').update(chapterData).match({ id: chapter.id }).select();
                if (error) throw error;
                onSave(data[0]);
            } else { // Create
                const { data, error } = await supabase.from('chapters').insert(chapterData).select();
                if (error) throw error;
                onSave(data[0]);
            }
        } catch (error: any) {
            alert(`An error occurred: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full bg-ieee-dark-surface p-2 rounded text-white border border-ieee-dark-border focus:ring-2 focus:ring-neon-blue focus:border-transparent";
    const textareaClass = `${inputClass} h-24`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <form ref={formRef} onSubmit={handleSubmit} className="bg-ieee-dark-card p-4 rounded-lg shadow-2xl space-y-2 w-full max-w-2xl max-h-[70vh] overflow-y-auto">
                <h2 className="text-3xl font-bold text-white mb-6">{chapter ? 'Edit Chapter' : 'Create New Chapter'}</h2>
                
                <div><label htmlFor="name" className="block text-ieee-dark-muted mb-1 text-sm">Chapter Name</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={inputClass} /></div>
                <div><label htmlFor="description" className="block text-ieee-dark-muted mb-1 text-sm">Description</label><textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="mission" className="block text-ieee-dark-muted mb-1 text-sm">Mission</label><textarea id="mission" value={mission} onChange={e => setMission(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="vision" className="block text-ieee-dark-muted mb-1 text-sm">Vision</label><textarea id="vision" value={vision} onChange={e => setVision(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="history" className="block text-ieee-dark-muted mb-1 text-sm">History</label><textarea id="history" value={history} onChange={e => setHistory(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="projects" className="block text-ieee-dark-muted mb-1 text-sm">Projects & Initiatives</label><textarea id="projects" value={projects} onChange={e => setProjects(e.target.value)} className={textareaClass}></textarea></div>

                <div className="space-y-2">
                    <label className="block text-ieee-dark-muted text-sm">Leaders</label>
                    {leaders.map((leader, index) => (
                        <div key={leader.id} className="flex items-center gap-1 p-1 bg-ieee-dark-surface/50 rounded">
                            <input type="text" placeholder="Role" value={leader.role} onChange={(e) => handleLeaderChange(index, 'role', e.target.value)} className={`${inputClass} w-1/3 text-sm`} />
                            <input type="text" placeholder="Full Name" value={leader.name} onChange={(e) => handleLeaderChange(index, 'name', e.target.value)} className={`${inputClass} flex-grow text-sm`} />
                            <button type="button" onClick={() => removeLeader(leader.id)} className="text-red-400 hover:text-red-300"><XCircle size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addLeader} className="flex items-center gap-1 text-neon-blue font-semibold text-xs hover:text-blue-400">
                        <PlusCircle size={14} /> Add Leader
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="block text-ieee-dark-muted text-sm">Social Media</label>
                    {socials.map((social, index) => (
                        <div key={social.id} className="flex items-center gap-1 p-1 bg-ieee-dark-surface/50 rounded">
                            <input type="text" placeholder="Platform (e.g., instagram)" value={social.platform} onChange={(e) => handleSocialChange(index, 'platform', e.target.value)} className={`${inputClass} w-1/3 text-sm`} />
                            <input type="url" placeholder="URL" value={social.url} onChange={(e) => handleSocialChange(index, 'url', e.target.value)} className={`${inputClass} flex-grow text-sm`} />
                            <button type="button" onClick={() => removeSocial(social.id)} className="text-red-400 hover:text-red-300"><XCircle size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addSocial} className="flex items-center gap-1 text-neon-blue font-semibold text-xs hover:text-blue-400">
                        <PlusCircle size={14} /> Add Social Link
                    </button>
                </div>

                <div><label htmlFor="logo" className="block text-ieee-dark-muted mb-2">Logo Image</label><input type="file" id="logo" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/20 file:text-neon-blue hover:file:bg-neon-blue/30" /></div>
                <div><label htmlFor="hero" className="block text-ieee-dark-muted mb-2">Hero Image</label><input type="file"id="hero" onChange={e => setHeroFile(e.target.files ? e.target.files[0] : null)} className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/20 file:text-neon-blue hover:file:bg-neon-blue/30" /></div>

                <div className="flex gap-4 pt-4 border-t border-ieee-dark-border">
                    <button type="button" onClick={onClose} className="btn-secondary-hero flex-1">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary-hero flex-1">{isSubmitting ? 'Saving...' : 'Save Chapter'}</button>
                </div>
            </form>
        </div>
    );
}
