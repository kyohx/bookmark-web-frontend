import React, { useState, useEffect } from 'react';
import type { Bookmark } from '../api/client';
import { X } from 'lucide-react';

interface BookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string, memo: string, tags: string[]) => Promise<void>;
    initialData?: Bookmark | null;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [url, setUrl] = useState('');
    const [memo, setMemo] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setUrl(initialData.url);
            setMemo(initialData.memo || '');
            setTags(initialData.tags?.slice().sort().join(', ') || '');
        } else {
            setUrl('');
            setMemo('');
            setTags('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
            await onSubmit(url, memo, tagList);
            // Don't close here - let Dashboard handle closing after confirmation
        } catch (error) {
            console.error(error);
            alert('Failed to save bookmark');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={(e) => {
                // Only close if clicking the backdrop itself, not the modal content
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 100,
                backdropFilter: 'blur(4px)'
            }}
        >
            <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                <button
                    type="button"
                    onClick={onClose}
                    style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-text-muted)' }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>
                    {initialData ? 'Edit Bookmark' : 'Add Bookmark'}
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                    <div className="flex flex-col gap-sm">
                        <label htmlFor="bookmark-url" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>URL</label>
                        <input
                            id="bookmark-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            disabled={!!initialData}
                            style={initialData ? { backgroundColor: 'var(--color-background-alt)', cursor: 'not-allowed' } : {}}
                        />
                    </div>

                    <div className="flex flex-col gap-sm">
                        <label htmlFor="bookmark-memo" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Memo</label>
                        <input
                            id="bookmark-memo"
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="My favorite site"
                        />
                    </div>

                    <div className="flex flex-col gap-sm">
                        <label htmlFor="bookmark-tags" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Tags (comma separated)</label>
                        <input
                            id="bookmark-tags"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="tech, news, blog"
                        />
                    </div>

                    <div className="flex gap-md mt-md" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
