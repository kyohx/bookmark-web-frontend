import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Lock, User } from 'lucide-react';
import '../styles/global.css';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.login(username, password);
            navigate('/');
        } catch {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--color-background) 0%, #1e1b4b 100%)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-2xl)' }}>
                    Welcome Back
                </h1>
                <form onSubmit={handleLogin} className="flex flex-col gap-md">
                    <div style={{ position: 'relative' }}>
                        <User size={20} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ paddingLeft: '40px', width: '100%' }}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={20} style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--color-text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingLeft: '40px', width: '100%' }}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};
