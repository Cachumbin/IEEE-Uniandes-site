import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Plus, Edit, Trash2, PlusCircle, XCircle, Users, ExternalLink, X, Mail } from 'lucide-react';

// Define the types for our structured JSONB data
interface Leader {
    id?: number; // Use a temporary ID for mapping in React
    name: string;
    role: string;
}

interface SocialMedia {
    [key: string]: string;
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
    member_count: number;
    contact_email: string;
    destacados: string[];
}

export default function ChaptersManager() {
    const [user, setUser] = useState<User | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Chapter | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

    useEffect(() => {
        const fetchChapters = async () => {
            const { data, error } = await supabase.from('chapters').select('*').order('name');
            if (!error) setChapters(data);
            else console.error("Error fetching chapters:", error);
            setLoading(false);
        };
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        fetchChapters();
        checkUser();
    }, []);

    const handleCreate = () => setIsCreating(true);
    const handleEdit = (chapter: Chapter) => setIsEditing(chapter);
    const handleViewDetails = (chapter: Chapter) => setSelectedChapter(chapter);

    const handleDelete = async (chapterId: number) => {
        if (window.confirm('Are you sure you want to delete this chapter?')) {
            const { error } = await supabase.from('chapters').delete().match({ id: chapterId });
            if (error) alert(`Error: ${error.message}`);
            else {
                setChapters(chapters.filter(c => c.id !== chapterId));
                alert('Chapter deleted successfully.');
            }
        }
    };

    const closeModals = () => {
        setIsCreating(false);
        setIsEditing(null);
        setSelectedChapter(null);
    };

    if (loading) return <div className="text-center text-white py-10">Loading Chapters...</div>;

    return (
        <>
            {(isCreating || isEditing) && (
                <ChapterForm
                    chapter={isEditing}
                    onClose={closeModals}
                    onSave={(newChapter) => {
                        if (isCreating) setChapters([...chapters, newChapter].sort((a, b) => a.name.localeCompare(b.name)));
                        else setChapters(chapters.map(c => c.id === newChapter.id ? newChapter : c).sort((a, b) => a.name.localeCompare(b.name)));
                        closeModals();
                    }}
                />
            )}

            {selectedChapter && <ChapterDetail chapter={selectedChapter} onClose={closeModals} />}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-white font-display">Nuestros Capítulos</h1>
                    {user && <button onClick={handleCreate} className="btn-primary-nav flex items-center gap-2"><Plus size={18} /> New Chapter</button>}
                </div>

                <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                    {chapters.map(chapter => (
                        <div key={chapter.id} className="bg-ieee-dark-card/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden group relative transition-transform duration-300 hover:scale-[1.02]">
                            <div className="relative w-full h-56 overflow-hidden bg-ieee-dark-surface cursor-pointer" onClick={() => handleViewDetails(chapter)}>
                               <img src={chapter.hero_image_url || 'https://placehold.co/600x400/0f172a/FFF?text=IEEE'} alt={chapter.name} className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                            </div>
                            <div className="p-6 relative">
                                <img src={chapter.logo_url || 'https://placehold.co/100x100/1e293b/FFF?text=Logo'} alt={`${chapter.name} Logo`} className="w-24 h-24 rounded-full -mt-16 border-4 border-ieee-dark-card shadow-md relative z-10" />
                                <div className="flex justify-between items-start mt-4">
                                    <h2 className="text-3xl font-bold text-white ">{chapter.name}</h2>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-ieee-dark-muted"><Users size={16} /><span className="font-bold text-lg text-white">{chapter.member_count || 0}</span></div>
                                        <span className="text-xs text-ieee-dark-muted">Miembros</span>
                                    </div>
                                </div>
                                <p className="text-ieee-dark-muted mt-2 text-lg">{chapter.description}</p>
                                {chapter.contact_email && <a href={`mailto:${chapter.contact_email}`} className="flex items-center gap-2 mt-4 text-neon-blue hover:underline"><Mail size={16}/>{chapter.contact_email}</a>}
                            </div>
                            {user && (
                                <div className="absolute top-4 right-4 flex gap-2 z-20">
                                    <button onClick={() => handleEdit(chapter)} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-lg flex items-center justify-center"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(chapter.id)} className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition shadow-lg flex items-center justify-center"><Trash2 size={16}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function ChapterForm({ chapter, onClose, onSave }: { chapter: Chapter | null, onClose: () => void, onSave: (c: Chapter) => void }) {
    const [name, setName] = useState(chapter?.name || '');
    const [description, setDescription] = useState(chapter?.description || '');
    const [mission, setMission] = useState(chapter?.mission || '');
    const [vision, setVision] = useState(chapter?.vision || '');
    const [history, setHistory] = useState(chapter?.history || '');
    const [projects, setProjects] = useState(chapter?.projects || '');
    const [memberCount, setMemberCount] = useState(chapter?.member_count || 0);
    const [contactEmail, setContactEmail] = useState(chapter?.contact_email || '');
    const [destacados, setDestacados] = useState(chapter?.destacados || []);

    const [leaders, setLeaders] = useState(chapter?.leaders?.map((l, i) => ({...l, id: Date.now() + i})) || []);
    const [socials, setSocials] = useState(Object.entries(chapter?.social_media || {}).map(([platform, url], i) => ({id: Date.now() + i, platform, url})));

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (formRef.current && !formRef.current.contains(event.target as Node)) onClose();
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleLeaderChange = (id: number, field: 'name' | 'role', value: string) => setLeaders(leaders.map(l => l.id === id ? { ...l, [field]: value } : l));
    const addLeader = () => setLeaders([...leaders, { id: Date.now(), name: '', role: '' }]);
    const removeLeader = (id: number) => setLeaders(leaders.filter(l => l.id !== id));

    const handleSocialChange = (id: number, field: 'platform' | 'url', value: string) => setSocials(socials.map(s => s.id === id ? { ...s, [field]: value } : s));
    const addSocial = () => setSocials([...socials, { id: Date.now(), platform: '', url: '' }]);
    const removeSocial = (id: number) => setSocials(socials.filter(s => s.id !== id));
    
    const handleDestacadoChange = (index: number, value: string) => {
        const newDestacados = [...destacados];
        newDestacados[index] = value;
        setDestacados(newDestacados);
    };
    const addDestacado = () => setDestacados([...destacados, '']);
    const removeDestacado = (index: number) => setDestacados(destacados.filter((_, i) => i !== index));

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
            const destacadosToSave = destacados.filter(d => d.trim() !== '');

            const chapterData = { name, description, mission, vision, history, projects, leaders: leadersToSave, social_media: socialMediaToSave, logo_url, hero_image_url, member_count: memberCount, contact_email: contactEmail, destacados: destacadosToSave };

            if (chapter) {
                const { data, error } = await supabase.from('chapters').update(chapterData).match({ id: chapter.id }).select();
                if (error) throw error;
                onSave(data[0]);
            } else {
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
            <form ref={formRef} onSubmit={handleSubmit} className="bg-ieee-dark-card p-8 rounded-lg shadow-2xl space-y-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-bold text-white mb-6">{chapter ? 'Edit Chapter' : 'Create New Chapter'}</h2>
                
                <div className="flex gap-4">
                    <div className="flex-grow"><label htmlFor="name" className="block text-ieee-dark-muted mb-2">Chapter Name</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={inputClass} /></div>
                    <div><label htmlFor="member_count" className="block text-ieee-dark-muted mb-2">Members</label><input type="number" id="member_count" value={memberCount} onChange={e => setMemberCount(parseInt(e.target.value))} required className={inputClass} /></div>
                </div>
                <div><label htmlFor="contact_email" className="block text-ieee-dark-muted mb-2">Contact Email</label><input type="email" id="contact_email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputClass} /></div>
                <div><label htmlFor="description" className="block text-ieee-dark-muted mb-2">Description</label><textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="mission" className="block text-ieee-dark-muted mb-2">Mission</label><textarea id="mission" value={mission} onChange={e => setMission(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="vision" className="block text-ieee-dark-muted mb-2">Vision</label><textarea id="vision" value={vision} onChange={e => setVision(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="history" className="block text-ieee-dark-muted mb-2">History</label><textarea id="history" value={history} onChange={e => setHistory(e.target.value)} className={textareaClass}></textarea></div>
                <div><label htmlFor="projects" className="block text-ieee-dark-muted mb-2">Projects</label><textarea id="projects" value={projects} onChange={e => setProjects(e.target.value)} className={textareaClass}></textarea></div>

                <div className="space-y-4"><label className="block text-ieee-dark-muted">Destacados (Keywords)</label>{destacados.map((d, i) => (<div key={i} className="flex items-center gap-2"><input type="text" placeholder="e.g., Robótica" value={d} onChange={(e) => handleDestacadoChange(i, e.target.value)} className={`${inputClass} flex-grow`} /><button type="button" onClick={() => removeDestacado(i)} className="text-red-400 hover:text-red-300"><XCircle size={20}/></button></div>))}<button type="button" onClick={addDestacado} className="flex items-center gap-2 text-neon-blue font-semibold text-sm hover:text-blue-400"><PlusCircle size={18} /> Add Keyword</button></div>
                <div className="space-y-4"><label className="block text-ieee-dark-muted">Leaders</label>{leaders.map((l) => (<div key={l.id} className="flex items-center gap-2"><input type="text" placeholder="Role" value={l.role} onChange={(e) => handleLeaderChange(l.id!, 'role', e.target.value)} className={`${inputClass} w-1/3`} /><input type="text" placeholder="Full Name" value={l.name} onChange={(e) => handleLeaderChange(l.id!, 'name', e.target.value)} className={`${inputClass} flex-grow`} /><button type="button" onClick={() => removeLeader(l.id!)} className="text-red-400 hover:text-red-300"><XCircle size={20}/></button></div>))}<button type="button" onClick={addLeader} className="flex items-center gap-2 text-neon-blue font-semibold text-sm hover:text-blue-400"><PlusCircle size={18} /> Add Leader</button></div>
                <div className="space-y-4"><label className="block text-ieee-dark-muted">Social Media</label>{socials.map((s) => (<div key={s.id} className="flex items-center gap-2"><input type="text" placeholder="Platform" value={s.platform} onChange={(e) => handleSocialChange(s.id, 'platform', e.target.value)} className={`${inputClass} w-1/3`} /><input type="url" placeholder="URL" value={s.url} onChange={(e) => handleSocialChange(s.id, 'url', e.target.value)} className={`${inputClass} flex-grow`} /><button type="button" onClick={() => removeSocial(s.id)} className="text-red-400 hover:text-red-300"><XCircle size={20}/></button></div>))}<button type="button" onClick={addSocial} className="flex items-center gap-2 text-neon-blue font-semibold text-sm hover:text-blue-400"><PlusCircle size={18} /> Add Social Link</button></div>

                <div><label htmlFor="logo" className="block text-ieee-dark-muted mb-2">Logo Image</label><input type="file" id="logo" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/20 file:text-neon-blue hover:file:bg-neon-blue/30" /></div>
                <div><label htmlFor="hero" className="block text-ieee-dark-muted mb-2">Hero Image</label><input type="file"id="hero" onChange={e => setHeroFile(e.target.files ? e.target.files[0] : null)} className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/20 file:text-neon-blue hover:file:bg-neon-blue/30" /></div>

                <div className="flex gap-4 pt-4 border-t border-ieee-dark-border"><button type="button" onClick={onClose} className="btn-secondary-hero flex-1">Cancel</button><button type="submit" disabled={isSubmitting} className="btn-primary-hero flex-1">{isSubmitting ? 'Saving...' : 'Save Chapter'}</button></div>
            </form>
        </div>
    );
}

function ChapterDetail({ chapter, onClose }: { chapter: Chapter, onClose: () => void }) {
    const detailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (detailRef.current && !detailRef.current.contains(event.target as Node)) onClose();
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div ref={detailRef} className="bg-ieee-dark-card rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="relative">
                    <img src={chapter.hero_image_url || 'https://placehold.co/800x400/0f172a/FFF?text=IEEE'} alt={chapter.name} className="w-full h-64 object-cover" />
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition"><X size={24} /></button>
                </div>
                <div className="p-8 overflow-y-auto">
                    <div className="flex items-start gap-6">
                        <img src={chapter.logo_url || 'https://placehold.co/150x150/1e293b/FFF?text=Logo'} alt={`${chapter.name} Logo`} className="w-32 h-32 rounded-full border-4 border-ieee-dark-card shadow-md -mt-24" />
                        <div className="flex-grow">
                            <h2 className="text-4xl font-bold text-white font-display">{chapter.name}</h2>
                            <p className="text-lg text-ieee-dark-muted mt-1">{chapter.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-2 text-ieee-dark-muted"><Users size={20} /><span className="font-bold text-2xl text-white">{chapter.member_count || 0}</span></div>
                            <span className="text-sm text-ieee-dark-muted">Miembros</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {chapter.mission && <div><h3 className="font-bold text-xl text-neon-blue mb-2">Misión</h3><p className="text-ieee-dark-text">{chapter.mission}</p></div>}
                            {chapter.vision && <div><h3 className="font-bold text-xl text-neon-blue mb-2">Visión</h3><p className="text-ieee-dark-text">{chapter.vision}</p></div>}
                            {chapter.history && <div><h3 className="font-bold text-xl text-neon-blue mb-2">Historia</h3><p className="text-ieee-dark-text">{chapter.history}</p></div>}
                        </div>
                        <div className="space-y-6">
                            {chapter.projects && <div><h3 className="font-bold text-xl text-neon-blue mb-2">Proyectos</h3><p className="text-ieee-dark-text">{chapter.projects}</p></div>}
                            {chapter.leaders && chapter.leaders.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-xl text-neon-blue mb-2">Junta Directiva</h3>
                                    <ul className="space-y-2 text-ieee-dark-text">{chapter.leaders.map((l, i) => <li key={i} className="flex justify-between p-2 bg-ieee-dark-surface/50 rounded"><span>{l.role}</span><strong className="text-white">{l.name}</strong></li>)}</ul>
                                </div>
                            )}
                            {chapter.social_media && Object.keys(chapter.social_media).length > 0 && (
                                <div>
                                    <h3 className="font-bold text-xl text-neon-blue mb-2">Redes Sociales</h3>
                                    <div className="flex flex-wrap gap-4">{Object.entries(chapter.social_media).map(([p, u]) => (<a href={u} target="_blank" rel="noopener noreferrer" key={p} className="flex items-center gap-2 text-ieee-dark-text hover:text-neon-blue transition bg-ieee-dark-surface/50 px-3 py-2 rounded"><ExternalLink size={16} /> <span className="capitalize">{p}</span></a>))}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
