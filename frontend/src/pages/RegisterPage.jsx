import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      // After registration, redirect to handle setup
      navigate('/complete-profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="glass-panel page-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>Create Account</h1>
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginBottom: '32px' }}>Join our team dashboard</p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>Full Name</label>
            <input 
              type="text" 
              required 
              className="glass-panel"
              style={{ width: '100%', padding: '12px 16px', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }}
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>Email</label>
            <input 
              type="email" 
              required 
              className="glass-panel"
              style={{ width: '100%', padding: '12px 16px', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }}
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>Password</label>
            <input 
              type="password" 
              required 
              className="glass-panel"
              style={{ width: '100%', padding: '12px 16px', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }}
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', background: 'var(--accent-purple)', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};
