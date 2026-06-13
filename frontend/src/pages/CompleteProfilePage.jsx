import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, AlertCircle, Loader2, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkHandle, updateProfile } from '../services/api';

export const CompleteProfilePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // If user already has a handle, redirect away
  useEffect(() => {
    if (user && user.handle) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (handle.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const { available } = await checkHandle(handle);
        setIsAvailable(available);
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [handle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAvailable || handle.length < 3) return;

    setLoading(true);
    setError('');
    try {
      const resp = await updateProfile({ handle });
      if (resp.success) {
        setUser({ ...user, ...resp.user });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update handle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at top right, #1a1c2c, #0a0a0f)',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '48px', 
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          background: 'rgba(0, 242, 254, 0.1)', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 32px',
          color: 'var(--accent-cyan)'
        }}>
          <AtSign size={36} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', color: 'white' }}>
          One last step!
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6 }}>
          Choose a unique Username. This will be used to mention you in comments and identify you in the system.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
              Your Unique Username
            </label>
            <div style={{ position: 'relative' }}>
               <span style={{ 
                 position: 'absolute', 
                 left: '16px', 
                 top: '50%', 
                 transform: 'translateY(-50%)', 
                 color: 'var(--text-muted)',
                 fontWeight: 600
               }}>@</span>
               <input 
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                placeholder="username"
                autoFocus
                style={{ 
                  width: '100%', 
                  padding: '16px 16px 16px 40px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: isAvailable === true ? '1px solid var(--accent-green)' : isAvailable === false ? '1px solid var(--accent-red)' : '1px solid var(--border-light)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}
               />
               <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  {checking && <Loader2 size={20} className="spinner" style={{ color: 'var(--text-muted)' }} />}
                  {!checking && isAvailable === true && <Check size={20} style={{ color: 'var(--accent-green)' }} />}
                  {!checking && isAvailable === false && <X size={20} style={{ color: 'var(--accent-red)' }} />}
               </div>
            </div>
            
            <div style={{ marginTop: '12px', minHeight: '20px' }}>
              {!checking && isAvailable === false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                  <AlertCircle size={14} /> This ID is already taken
                </div>
              )}
              {handle.length > 0 && handle.length < 3 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID must be at least 3 characters</div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!isAvailable || loading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '1rem', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? <Loader2 size={20} className="spinner" /> : 'Get Started'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '20px', color: 'var(--accent-red)', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
