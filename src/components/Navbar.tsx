import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LogOut, Bookmark } from 'lucide-react';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        api.clearToken();
        navigate('/login');
    };

    return (
        <nav style={{
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="flex items-center gap-sm" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>
                    <Bookmark />
                    <span>Bookmark App</span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </nav>
    );
};
