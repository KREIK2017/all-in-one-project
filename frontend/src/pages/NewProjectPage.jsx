import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/api';

export const NewProjectPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    client_name: '',
    color: '#8b5cf6',
  });

  const colors = [
    '#8b5cf6', '#00f2fe', '#10b981', '#ef4444', 
    '#eab308', '#ec4899', '#3b82f6', '#f97316'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Project Name is required!');
    setSubmitting(true);
    try {
      await createProject(form);
      navigate('/projects');
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/projects')}>← Back to Projects</button>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Create New Project</h1>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Project Name *</label>
          <input 
            name="name" 
            type="text" 
            placeholder="e.g. Website Redesign" 
            className="glass-panel"
            style={{ width: '100%', padding: '12px 16px', outline: 'none', color: 'var(--text-main)', border: '1px solid var(--border-light)', fontSize: '1rem' }}
            value={form.name} 
            onChange={handleChange} 
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Client Name</label>
          <input 
            name="client_name" 
            type="text" 
            placeholder="e.g. Acme Corp" 
            className="glass-panel"
            style={{ width: '100%', padding: '12px 16px', outline: 'none', color: 'var(--text-main)', border: '1px solid var(--border-light)', fontSize: '1rem' }}
            value={form.client_name} 
            onChange={handleChange} 
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px' }}>Project Color</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {colors.map(c => (
              <button
                key={c}
                type="button"
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: c, 
                  border: form.color === c ? '2px solid white' : 'none',
                  cursor: 'pointer',
                  boxShadow: form.color === c ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
                }}
                onClick={() => setForm(prev => ({ ...prev, color: c }))}
              />
            ))}
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', background: 'var(--accent-purple)', fontSize: '1rem' }} 
          onClick={handleSubmit} 
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  );
};
