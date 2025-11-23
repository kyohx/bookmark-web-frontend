import React, { useEffect, useState, useCallback } from 'react';
import { api, type Bookmark, type User, canEdit } from '../api/client';
import { Navbar } from '../components/Navbar';
import { BookmarkCard } from '../components/BookmarkCard';
import { BookmarkModal } from '../components/BookmarkModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [page, setPage] = useState(1);
    const [tagFilter, setTagFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; hashedId: string | null; targetName?: string }>({ isOpen: false, hashedId: null });
    const [confirmSave, setConfirmSave] = useState<{
        isOpen: boolean;
        hashedId?: string;
        url: string;
        memo: string;
        tags: string[];
        title: string;
        message: string;
        confirmText: string;
        targetName?: string;
    } | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const pageSize = 12;

    const fetchBookmarks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getBookmarks(page, pageSize, tagFilter || undefined);
            // If no items returned and we're not on page 1, go back to previous page
            if (data.items.length === 0 && page > 1) {
                setPage(p => p - 1);
            } else {
                setBookmarks(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch bookmarks', error);
        } finally {
            setLoading(false);
        }
    }, [page, tagFilter]);

    useEffect(() => {
        const fetchUserAndBookmarks = async () => {
            try {
                const user = await api.getMe();
                setCurrentUser(user);
            } catch (error) {
                console.error('Failed to fetch user info', error);
            }
            fetchBookmarks();
        };
        fetchUserAndBookmarks();
    }, [fetchBookmarks]);

    const handleAdd = () => {
        setEditingBookmark(null);
        setIsModalOpen(true);
    };

    const handleEdit = async (bookmark: Bookmark) => {
        setLoading(true);
        try {
            const fullBookmark = await api.getBookmark(bookmark.hashed_id);
            setEditingBookmark(fullBookmark);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch bookmark details', error);
            alert('Failed to load bookmark details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (hashed_id: string) => {
        const target = bookmarks.find(b => b.hashed_id === hashed_id);
        const targetName = target ? (target.memo || target.url) : undefined;
        setConfirmDelete({ isOpen: true, hashedId: hashed_id, targetName });
    };

    const confirmDeleteAction = async () => {
        if (confirmDelete.hashedId) {
            try {
                await api.deleteBookmark(confirmDelete.hashedId);
                setConfirmDelete({ isOpen: false, hashedId: null });
                fetchBookmarks();
            } catch (error) {
                console.error('Failed to delete bookmark', error);
                alert('Failed to delete bookmark');
            }
        }
    };

    const cancelDelete = () => {
        setConfirmDelete({ isOpen: false, hashedId: null });
    };

    const handleSave = async (url: string, memo: string, tags: string[]): Promise<void> => {
        // Show confirmation modal instead of saving directly
        const isEditing = !!editingBookmark;
        setConfirmSave({
            isOpen: true,
            hashedId: editingBookmark?.hashed_id,
            url,
            memo,
            tags,
            title: isEditing ? "Save Changes" : "Add Bookmark",
            message: isEditing ? "Do you want to save the changes to this bookmark?" : "Do you want to add this bookmark?",
            confirmText: isEditing ? "Save Changes" : "Add",
            targetName: memo || url
        });
    };

    const confirmSaveAction = async () => {
        if (confirmSave) {
            try {
                if (confirmSave.hashedId) {
                    await api.updateBookmark(confirmSave.hashedId, confirmSave.memo, confirmSave.tags);
                } else {
                    await api.addBookmark(confirmSave.url, confirmSave.memo, confirmSave.tags);
                }
                setConfirmSave(null);
                setIsModalOpen(false);
                fetchBookmarks();
            } catch (error) {
                console.error('Failed to save bookmark', error);
                alert('Failed to save bookmark');
            }
        }
    };

    const cancelSave = () => {
        setConfirmSave(null);
        setIsModalOpen(false);
    };



    return (
        <div style={{ minHeight: '100vh', paddingBottom: 'var(--spacing-xl)' }}>
            <Navbar />

            <main className="container mt-lg">
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div className="flex items-center gap-md" style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                            <Search size={18} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Filter by tag..."
                                value={tagFilter}
                                onChange={(e) => {
                                    setTagFilter(e.target.value);
                                    setPage(1);
                                }}
                                style={{ paddingLeft: '36px', width: '100%' }}
                            />
                        </div>
                    </div>

                    {currentUser && canEdit(currentUser.authority) && (
                        <button onClick={handleAdd} className="btn btn-primary">
                            <Plus size={18} />
                            Add Bookmark
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                        Loading...
                    </div>
                ) : (
                    <>
                        {bookmarks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                                No bookmarks found.
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 'var(--spacing-md)'
                            }}>
                                {bookmarks.map(b => (
                                    <BookmarkCard
                                        key={b.hashed_id}
                                        bookmark={b}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        canEdit={currentUser ? canEdit(currentUser.authority) : false}
                                    />
                                ))}
                            </div>
                        )}

                        {(page > 1 || bookmarks.length === pageSize) && (
                            <div className="flex justify-center items-center gap-md mt-lg">
                                <button
                                    className="btn btn-secondary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft size={16} />
                                    Prev
                                </button>
                                <span style={{ color: 'var(--color-text-muted)' }}>
                                    Page {page}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    disabled={bookmarks.length < pageSize}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <BookmarkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={editingBookmark}
            />

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Delete Bookmark"
                message="Are you sure you want to delete this bookmark? This action cannot be undone."
                onConfirm={confirmDeleteAction}
                onCancel={cancelDelete}
                targetName={confirmDelete.targetName}
            />

            <ConfirmModal
                isOpen={confirmSave?.isOpen ?? false}
                title={confirmSave?.title ?? ""}
                message={confirmSave?.message ?? ""}
                onConfirm={confirmSaveAction}
                onCancel={cancelSave}
                confirmText={confirmSave?.confirmText ?? ""}
                confirmButtonClass="btn-primary"
                targetName={confirmSave?.targetName}
            />
        </div>
    );
};
