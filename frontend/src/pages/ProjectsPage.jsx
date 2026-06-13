import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, deleteProject } from '../services/api';
import { Ticket, Trash2 } from 'lucide-react';

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = () => {
    getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей проект?')) {
      try {
        await deleteProject(id);
        fetchProjects();
      } catch (err) {
        alert('Помилка при видаленні: ' + err.message);
      }
    }
  };

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Projects</h1>
        <button 
          className="btn btn-primary" 
          style={{ background: 'var(--accent-purple)' }}
          onClick={() => navigate('/projects/new')}
        >
          + New Project
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>Завантаження проектів...</div>}

      {!loading && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client</th>
                <th>Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>No projects yet.</td></tr>
              ) : (
                projects.map(proj => (
                  <tr key={proj.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: proj.color || '#6366f1' }} />
                        {proj.name || 'Unnamed Project'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{proj.client_name || '—'}</td>
                    <td>
                      <span className="badge badge-active">Active</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          className="btn-icon active-cyan"
                          title="View Tickets"
                          onClick={() => navigate(`/tickets?projectId=${proj.id}`)}
                        >
                          <Ticket size={18} />
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Delete"
                          onClick={() => handleDelete(proj.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
