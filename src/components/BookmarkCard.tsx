import React from 'react';
import type { Bookmark } from '../api/client';
import { ExternalLink, Trash2, Edit2, Tag } from 'lucide-react';

interface BookmarkCardProps {
    bookmark: Bookmark;
    onEdit: (bookmark: Bookmark) => void;
    onDelete: (hashed_id: string) => void;
    canEdit: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onEdit, onDelete, canEdit }) => {
    return (
        <div className="card" style={{ transition: 'transform 0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-start">
                <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 600,
                    marginBottom: 'var(--spacing-xs)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '80%'
                }}>
                    {bookmark.memo}
                </h3>
                {canEdit && (
                    <div className="flex gap-sm">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit(bookmark);
                            }}
                            style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(bookmark.hashed_id);
                            }}
                            style={{ color: 'var(--color-error)', padding: '4px' }}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted"
                style={{
                    fontSize: 'var(--font-size-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: 'var(--spacing-md)',
                    wordBreak: 'break-all'
                }}
            >
                <ExternalLink size={12} />
                {bookmark.url}
            </a>

            <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {bookmark.tags.map((tag, index) => (
                    <span key={index} style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--color-primary)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Tag size={10} />
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};
