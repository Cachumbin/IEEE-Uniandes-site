import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle } from 'lucide-react';

export default function ContactForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        
        const { error } = await supabase.from('contact_submissions').insert({
            name,
            email,
            subject,
            message
        });

        if (error) {
            setStatus('error');
            console.error(error);
        } else {
            setStatus('success');
        }
    };
    
    if (status === 'success') {
        return (
            <div className="text-center p-6 bg-white/10 rounded-2xl">
                <CheckCircle size={48} className="mx-auto text-green-400" />
                <h3 className="text-2xl font-bold text-white mt-4">¡Mensaje Enviado!</h3>
                <p className="text-ieee-dark-muted mt-2">Gracias por contactarnos. Te responderemos lo antes posible.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input type="text" placeholder="Nombre" className="input-glass" value={name} onChange={e => setName(e.target.value)} required />
                <input type="email" placeholder="Correo electrónico" className="input-glass" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <input type="text" placeholder="Asunto" className="input-glass" value={subject} onChange={e => setSubject(e.target.value)} required />
            <textarea placeholder="Tu mensaje..." rows={4} className="input-glass resize-none" value={message} onChange={e => setMessage(e.target.value)} required></textarea>
            <button type="submit" disabled={status === 'submitting'} className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink text-white font-bold text-lg shadow-lg hover:scale-105 transition disabled:opacity-70 disabled:scale-100">
                {status === 'submitting' ? 'Enviando...' : 'Enviar mensaje'}
            </button>
            {status === 'error' && <p className="text-red-400 text-center">Ocurrió un error. Por favor, inténtalo de nuevo.</p>}
        </form>
    );
}
