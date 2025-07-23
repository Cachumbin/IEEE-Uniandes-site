import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import Masonry from 'react-masonry-css';
import { UploadCloud, Trash2, X, Loader2 } from 'lucide-react';

interface GalleryImage {
    name: string;
    publicURL: string;
}

const IMAGE_BATCH_SIZE = 12;

export default function GalleryManager() {
    const [user, setUser] = useState<User | null>(null);
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showUploader, setShowUploader] = useState(false);
    
    const observer = useRef<IntersectionObserver | null>(null);
    const lastImageElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreImages();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const loadMoreImages = async () => {
        setLoading(true);
        const { data, error } = await supabase.storage.from('gallery').list('', {
            limit: IMAGE_BATCH_SIZE,
            offset: images.length,
            sortBy: { column: 'created_at', order: 'desc' }
        });

        if (error) {
            console.error("Error fetching images:", error);
        } else if (data) {
            const newImages = data.map(file => ({
                name: file.name,
                publicURL: supabase.storage.from('gallery').getPublicUrl(file.name).data.publicUrl
            }));
            setImages(prevImages => [...prevImages, ...newImages]);
            setHasMore(data.length === IMAGE_BATCH_SIZE);
        }
        setLoading(false);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        checkUser();
        loadMoreImages();
    }, []);

    const handleDelete = async (imageName: string) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            const { error } = await supabase.storage.from('gallery').remove([imageName]);
            if (error) {
                alert(`Error deleting image: ${error.message}`);
            } else {
                setImages(images.filter(img => img.name !== imageName));
                alert('Image deleted successfully.');
            }
        }
    };

    const handleUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        
        const uploadPromises = Array.from(files).map(file => {
            const fileName = `${Date.now()}_${file.name}`;
            return supabase.storage.from('gallery').upload(fileName, file);
        });

        const results = await Promise.all(uploadPromises);
        
        const newUploadedImages: GalleryImage[] = [];
        results.forEach(result => {
            if (result.data) {
                newUploadedImages.push({
                    name: result.data.path,
                    publicURL: supabase.storage.from('gallery').getPublicUrl(result.data.path).data.publicUrl
                });
            }
            if (result.error) {
                console.error('Upload error:', result.error);
                alert(`Failed to upload a file: ${result.error.message}`);
            }
        });

        setImages(prevImages => [...newUploadedImages, ...prevImages]);
        setUploading(false);
        setShowUploader(false);
    };

    const breakpointColumnsObj = {
        default: 4,
        1100: 3,
        700: 2,
        500: 1
    };

    return (
        <>
            {showUploader && (
                <UploaderModal onUpload={handleUpload} onClose={() => setShowUploader(false)} uploading={uploading} />
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-white font-display">Galería</h1>
                    {user && (
                        <button onClick={() => setShowUploader(true)} className="btn-primary-nav flex items-center gap-2">
                            <UploadCloud size={18} /> Upload Photos
                        </button>
                    )}
                </div>

                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-auto -ml-4"
                    columnClassName="pl-4 bg-clip-padding"
                >
                    {images.map((image, index) => (
                        <div 
                            ref={images.length === index + 1 ? lastImageElementRef : null}
                            key={image.name} 
                            className="group relative mb-4 overflow-hidden rounded-lg shadow-lg"
                        >
                            <img src={image.publicURL} alt="Gallery image" className="w-full h-auto block transition-transform duration-300 group-hover:scale-105" />
                            {user && (
                                <button 
                                    onClick={() => handleDelete(image.name)}
                                    className="absolute top-2 right-2 bg-red-600/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </Masonry>
                {loading && (
                    <div className="text-center py-10 flex justify-center items-center gap-2 text-white">
                        <Loader2 className="animate-spin" /> Loading more images...
                    </div>
                )}
                 {!loading && !hasMore && images.length > 0 && (
                    <p className="text-center py-10 text-ieee-dark-muted">You've reached the end.</p>
                )}
            </div>
        </>
    );
}

function UploaderModal({ onUpload, onClose, uploading }: { onUpload: (files: FileList) => void, onClose: () => void, uploading: boolean }) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [files, setFiles] = useState<FileList | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div ref={modalRef} className="bg-ieee-dark-card p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Upload Photos</h2>
                    <button onClick={onClose} className="text-ieee-dark-muted hover:text-white"><X /></button>
                </div>
                <div className="border-2 border-dashed border-ieee-dark-border rounded-lg p-10 text-center">
                    <UploadCloud size={48} className="mx-auto text-ieee-dark-muted mb-4" />
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => setFiles(e.target.files)}
                        className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/20 file:text-neon-blue hover:file:bg-neon-blue/30 cursor-pointer"
                    />
                    <p className="text-xs text-ieee-dark-muted mt-2">Select one or more images to upload.</p>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="btn-secondary-hero">Cancel</button>
                    <button onClick={() => files && onUpload(files)} disabled={!files || uploading} className="btn-primary-hero">
                        {uploading ? <><Loader2 className="animate-spin mr-2" /> Uploading...</> : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}
