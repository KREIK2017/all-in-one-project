import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createTicket, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Bug, Sparkles, Headphones, CheckCircle2 } from 'lucide-react';
import { MultiAssigneePicker } from '../components/ui/AssigneePicker';
import { Select, Dot } from '../components/ui/Select';

export const NewTicketPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    subject: '',
    body: '',
    status: 'NEW',
    priority: 'NORMAL',
    ticket_type: 'Task',
    assignee_ids: [],
    is_private: false,
  });

  useEffect(() => {
    getProjects().then(setProjects);
    getUsers().then(setTeam);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!form.subject.trim()) return alert('Subject is required!');
    setSubmitting(true);
    try {
      await createTicket({ ...form, created_by: user.id });
      navigate('/tickets');
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/tickets')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)' }}>
          ← Back to list
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>New Ticket</h1>
      </div>

      <div className="glass-panel" style={{ padding: '32px', boxShadow: 'var(--glass-shadow)' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>Subject *</label>
          <input name="subject" type="text" placeholder="What needs to be done?" className="glass-panel"
            style={{ width: '100%', padding: '14px 20px', outline: 'none', color: 'var(--text-main)', border: '1px solid var(--accent-cyan)', fontSize: '1rem', background: 'rgba(0,0,0,0.2)' }}
            value={form.subject} onChange={handleChange} />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
            Description <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.85rem' }}>(Markdown supported)</span>
          </label>
          <textarea name="body" placeholder="Describe the task or issue in detail..."
            className="glass-panel"
            style={{ width: '100%', minHeight: '180px', padding: '16px 20px', outline: 'none', color: 'var(--text-main)', border: '1px solid var(--border-light)', resize: 'vertical', fontSize: '1rem', background: 'rgba(0,0,0,0.1)' }}
            value={form.body} onChange={handleChange} />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '40px', 
          padding: '24px', 
          background: 'var(--bg-panel-hover)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-light)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700 }}>Project</label>
            <Select
              value={form.project_id}
              onChange={(v) => setForm(prev => ({ ...prev, project_id: v }))}
              placeholder="No Project (General)"
              options={[{ value: '', label: 'No Project (General)' }, ...projects.map(p => ({ value: p.id, label: p.name, icon: <Dot color={p.color} /> }))]}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700 }}>
              <User size={14} /> Assignee
            </label>
            <MultiAssigneePicker
              users={team}
              value={form.assignee_ids}
              onChange={(ids) => setForm(prev => ({ ...prev, assignee_ids: ids }))}
              currentUserId={user.id}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700 }}>Priority</label>
            <Select
              value={form.priority}
              onChange={(v) => setForm(prev => ({ ...prev, priority: v }))}
              options={[
                { value: 'NORMAL', label: 'Normal', icon: <Dot color="var(--text-dim)" /> },
                { value: 'HIGH', label: 'High Priority', icon: <Dot color="#ef4444" /> },
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 700 }}>
              {form.ticket_type === 'Bug' && <Bug size={14} style={{ color: '#ef4444' }} />}
              {form.ticket_type === 'Feature' && <Sparkles size={14} style={{ color: '#f59e0b' }} />}
              {form.ticket_type === 'Support' && <Headphones size={14} style={{ color: '#8e2de2' }} />}
              {form.ticket_type === 'Task' && <CheckCircle2 size={14} style={{ color: 'var(--accent-cyan)' }} />}
              Task Type
            </label>
            <Select
              value={form.ticket_type}
              onChange={(v) => setForm(prev => ({ ...prev, ticket_type: v }))}
              options={[
                { value: 'Task', label: 'Task', icon: <CheckCircle2 size={14} style={{ color: 'var(--accent-cyan)' }} /> },
                { value: 'Bug', label: 'Bug Report', icon: <Bug size={14} style={{ color: '#ef4444' }} /> },
                { value: 'Feature', label: 'Feature Request', icon: <Sparkles size={14} style={{ color: '#f59e0b' }} /> },
                { value: 'Support', label: 'Support Ticket', icon: <Headphones size={14} style={{ color: '#8e2de2' }} /> },
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '30px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600 }}>
            <input name="is_private" type="checkbox" style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }} checked={form.is_private} onChange={handleChange} />
            Private (Only visible to you and assignee)
          </label>
          <button className="btn btn-primary" 
            style={{ 
              padding: '14px 40px', 
              background: 'linear-gradient(135deg, var(--status-new), #00f2fe)', 
              color: '#fff', 
              fontSize: '1rem', 
              fontWeight: 800,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              border: 'none',
              borderRadius: '12px'
            }} 
            onClick={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};
