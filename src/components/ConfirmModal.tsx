import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    confirmButtonClass?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    confirmButtonClass = 'btn-danger'
}) => {
    if (!isOpen) return null;

    return (
        <div
            onClick={(e) => {
                // Only close if clicking the backdrop itself, not the modal content
                if (e.target === e.currentTarget) {
                    onCancel();
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
            <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-text-muted)' }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                    <AlertTriangle size={24} style={{ color: confirmButtonClass === 'btn-danger' ? 'var(--color-error)' : 'var(--color-primary)' }} />
                    <h2 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>
                        {title}
                    </h2>
                </div>

                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-muted)' }}>
                    {message}
                </p>

                <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} className={`btn ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
