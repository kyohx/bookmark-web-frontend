import React, { useState, useEffect } from 'react';
import type { Bookmark } from '../api/client';
import { X } from 'lucide-react';
import { validateBookmarkForAdd, validateBookmarkForUpdate, parseTags, type ValidationError } from '../utils/validation';

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
    const [errors, setErrors] = useState<ValidationError[]>([]);

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
        setErrors([]);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const getFieldError = (field: string): string | undefined => {
        return errors.find(e => e.field === field)?.message;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const tagList = parseTags(tags);

        // Validate based on whether it's add or update
        const validationResult = initialData
            ? validateBookmarkForUpdate(memo, tagList)
            : validateBookmarkForAdd(url, memo, tagList);

        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            return;
        }

        setErrors([]);
        setLoading(true);
        try {
            await onSubmit(url, memo, tagList);
            // Don't close here - let Dashboard handle closing after confirmation
        } catch (error) {
            console.error(error);
            alert('Failed to save bookmark');
        } finally {
            setLoading(false);
        }
    };

    const errorStyle = {
        color: 'var(--color-error)',
        fontSize: 'var(--font-size-sm)',
        marginTop: '4px'
    };

    const inputErrorStyle = {
        borderColor: 'var(--color-error)',
        boxShadow: '0 0 0 1px var(--color-error)'
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
                    {errors.length > 0 && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--color-error)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            <p style={{ color: 'var(--color-error)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                                入力エラーがあります
                            </p>
                            <ul style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', paddingLeft: 'var(--spacing-md)', margin: 0 }}>
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex flex-col gap-sm">
                        <label htmlFor="bookmark-url" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            URL <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                            id="bookmark-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"

                            disabled={!!initialData}
                            maxLength={400}
                            style={{
                                ...(initialData ? { backgroundColor: 'var(--color-background-alt)', cursor: 'not-allowed' } : {}),
                                ...(getFieldError('url') ? inputErrorStyle : {})
                            }}
                        />
                        {getFieldError('url') && <span style={errorStyle}>{getFieldError('url')}</span>}
                    </div>

                    <div className="flex flex-col gap-sm">
                        <label htmlFor="bookmark-memo" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            Memo <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                            id="bookmark-memo"
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="My favorite site"
                            maxLength={400}
                            style={getFieldError('memo') ? inputErrorStyle : {}}
                        />
                        {getFieldError('memo') && <span style={errorStyle}>{getFieldError('memo')}</span>}
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            {memo.length}/400
                        </span>
                    </div>

                    <div className="flex flex-col gap-sm">
                        <label htmlFor="bookmark-tags" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            Tags (comma separated) <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                            id="bookmark-tags"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="tech, news, blog"
                            style={getFieldError('tags') ? inputErrorStyle : {}}
                        />
                        {getFieldError('tags') && <span style={errorStyle}>{getFieldError('tags')}</span>}
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                            {parseTags(tags).length}/10 tags
                        </span>
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

