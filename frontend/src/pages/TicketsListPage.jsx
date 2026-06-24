import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTickets } from '../services/api';
import { Bug, Sparkles, CheckCircle2, Headphones } from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'NEW': return <span className="badge badge-new">NEW</span>;
    case 'IN_PROGRESS': return <span className="badge badge-progress">IN PROGRESS</span>;
    case 'COMPLETED': return <span className="badge badge-completed">COMPLETED</span>;
    default: return <span className="badge badge-closed">{status}</span>;
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'Bug': return <Bug size={16} style={{ color: '#ef4444' }} />;
    case 'Feature': return <Sparkles size={16} style={{ color: '#f59e0b' }} />;
    case 'Support': return <Headphones size={16} style={{ color: '#8e2de2' }} />;
    default: return <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)' }} />;
  }
};

const SortArrow = ({ columnId, sortConfig }) => {
  if (sortConfig.key !== columnId) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
  return <span style={{ color: 'var(--accent-cyan)', marginLeft: '4px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
};

export const TicketsListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

  const queryParams = new URLSearchParams(location.search);
  const projectIdFilter = queryParams.get('projectId');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (projectIdFilter) params.projectId = projectIdFilter;

    getTickets(params)
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectIdFilter]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    if (sortConfig.key === 'project_name') {
      aVal = a.project_name || '—';
      bVal = b.project_name || '—';
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const currentProjectName = tickets.length > 0 && projectIdFilter ? tickets[0].project_name : null;

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>
            {currentProjectName ? `Tickets for ${currentProjectName}` : 'All Tickets'}
          </h1>
          {projectIdFilter && (
            <button 
              onClick={() => navigate('/tickets')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 0, marginTop: '4px', fontSize: '0.9rem' }}
            >
              ← Clear project filter
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
          + New Ticket
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>Loading tickets...</div>}
      {error && <div style={{ color: '#ef4444', textAlign: 'center', padding: '48px' }}>Error: {error}</div>}

      {!loading && !error && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table className="ticket-table">
            <thead>
              <tr>
                <th style={{ width: '60px', cursor: 'pointer' }} onClick={() => handleSort('id')}># <SortArrow columnId="id" sortConfig={sortConfig} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('subject')}>Subject <SortArrow columnId="subject" sortConfig={sortConfig} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('project_name')}>Project <SortArrow columnId="project_name" sortConfig={sortConfig} /></th>
                <th style={{ width: '150px', cursor: 'pointer' }} onClick={() => handleSort('status')}>Status <SortArrow columnId="status" sortConfig={sortConfig} /></th>
                <th style={{ width: '120px', cursor: 'pointer' }} onClick={() => handleSort('priority')}>Priority <SortArrow columnId="priority" sortConfig={sortConfig} /></th>
                <th style={{ width: '150px' }}>Assignee</th>
                <th style={{ width: '180px', cursor: 'pointer' }} onClick={() => handleSort('updated_at')}>Last updated <SortArrow columnId="updated_at" sortConfig={sortConfig} /></th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>No tickets yet. Create the first one!</td></tr>
              ) : (
                sortedTickets.map(ticket => (
                  <tr key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{ticket.id}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {getTypeIcon(ticket.ticket_type)}
                        <span>{ticket.subject || ticket.SUBJECT || 'No Subject'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ticket.project_name || '—'}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td><span className={ticket.priority === 'HIGH' ? 'priority-high' : 'priority-normal'}>{ticket.priority}</span></td>
                    <td>
                      {(ticket.assignees && ticket.assignees.length > 0) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex' }}>
                            {ticket.assignees.slice(0, 4).map((a, i) => (
                              <div key={a.id} title={a.name} style={{ position: 'relative', width: '28px', height: '28px', marginLeft: i ? -10 : 0 }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: a.avatar_color || 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', overflow: 'hidden', border: '2px solid var(--bg-panel)' }}>
                                  {a.avatar_url ? <img src={a.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (a.name || 'U').charAt(0)}
                                </div>
                                <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '10px', height: '10px', borderRadius: '50%', background: a.status === 'online' ? '#10b981' : a.status === 'away' ? '#f59e0b' : a.status === 'dnd' ? '#ef4444' : '#6b7280', border: '2px solid var(--bg-panel)' }}></div>
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>
                            {ticket.assignees.length === 1 ? ticket.assignees[0].name : `${ticket.assignees.length} assignees`}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(ticket.updated_at).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
