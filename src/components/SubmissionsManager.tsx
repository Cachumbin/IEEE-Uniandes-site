import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Mail, Check, Inbox } from 'lucide-react';

interface Submission {
    id: number;
    created_at: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read';
}

export default function SubmissionsManager() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            const { data, error } = await supabase
                .from('contact_submissions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error("Error fetching submissions:", error);
                alert("Could not fetch submissions. Make sure you are logged in.");
            } else {
                setSubmissions(data);
            }
            setLoading(false);
        };
        fetchSubmissions();
    }, []);

    const updateStatus = async (id: number, newStatus: 'new' | 'read') => {
        const { error } = await supabase.from('contact_submissions').update({ status: newStatus }).match({ id });
        if (error) {
            alert("Failed to update status.");
        } else {
            setSubmissions(submissions.map(s => s.id === id ? { ...s, status: newStatus } : s));
        }
    };

    const deleteSubmission = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this submission permanently?")) {
            const { error } = await supabase.from('contact_submissions').delete().match({ id });
            if (error) {
                alert("Failed to delete submission.");
            } else {
                setSubmissions(submissions.filter(s => s.id !== id));
            }
        }
    };

    if (loading) {
        return <div className="text-center text-white py-10">Loading Submissions...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white font-display mb-8">Contact Form Submissions</h1>
            <div className="bg-ieee-dark-card/80 backdrop-blur-sm rounded-lg shadow-lg">
                <div className="space-y-4 p-4">
                    {submissions.length > 0 ? submissions.map(sub => (
                        <div key={sub.id} className={`p-4 rounded-lg transition-colors ${sub.status === 'new' ? 'bg-neon-blue/10 border border-neon-blue/30' : 'bg-ieee-dark-surface/50'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-bold text-lg text-white">{sub.subject || '(No Subject)'}</h3>
                                        {sub.status === 'new' && <span className="text-xs font-bold bg-neon-blue text-ieee-dark-bg px-2 py-0.5 rounded-full">NEW</span>}
                                    </div>
                                    <p className="text-sm text-ieee-dark-muted">
                                        From: <a href={`mailto:${sub.email}`} className="text-neon-blue hover:underline">{sub.name}</a> 
                                        <span className="ml-2 text-gray-400">({sub.email})</span>
                                    </p>
                                </div>
                                <div className="text-xs text-ieee-dark-muted text-right flex-shrink-0">
                                    {new Date(sub.created_at).toLocaleString()}
                                </div>
                            </div>
                            <p className="mt-4 p-4 bg-ieee-dark-surface rounded text-white whitespace-pre-wrap">{sub.message}</p>
                            <div className="flex justify-end gap-2 mt-2">
                                {sub.status === 'new' ? (
                                    <button onClick={() => updateStatus(sub.id, 'read')} className="flex items-center gap-1 text-sm text-white hover:text-green-400"><Check size={14}/> Mark as Read</button>
                                ) : (
                                    <button onClick={() => updateStatus(sub.id, 'new')} className="flex items-center gap-1 text-sm text-ieee-dark-muted hover:text-white"><Inbox size={14}/> Mark as New</button>
                                )}
                                <button onClick={() => deleteSubmission(sub.id)} className="flex items-center gap-1 text-sm text-ieee-dark-muted hover:text-red-400"><Trash2 size={14}/> Delete</button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-ieee-dark-muted py-8">No submissions yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
