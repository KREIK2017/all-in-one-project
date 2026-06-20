import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, Trash2, Mail, Calendar, UserCheck, ShieldAlert, Circle, Moon, MinusCircle, EyeOff } from 'lucide-react';
import { getUsers, updateUserRole, deleteUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const { statuses } = usePresence();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change user role to ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert('Error changing role: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('CAUTION: This will permanently DELETE the user account. Proceed?')) return;
    try {
      await deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading && users.length === 0) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '96px' }}>Loading user list...</div>;

  return (
    <div className="page-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ padding: '12px', background: 'rgba(0, 242, 254, 0.1)', borderRadius: '15px' }}>
          <UsersIcon size={32} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>All registered members of your workspace</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '24px', border: '1px solid #ef4444' }}>
          Error: {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="ticket-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined Date</th>
              {currentUser?.role === 'admin' && <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ paddingLeft: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: u.avatar_color || 'var(--accent-cyan)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#fff',
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.05)'
                      }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="U" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (u.name || 'U').charAt(0)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%',
                        background: (statuses[u.id] || u.status) === 'online' ? '#10b981' : (statuses[u.id] || u.status) === 'away' ? '#f59e0b' : (statuses[u.id] || u.status) === 'dnd' ? '#ef4444' : '#6b7280',
                        border: '2px solid var(--bg-panel)'
                      }}></div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name} {u.id === currentUser?.id && <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginLeft: '4px' }}>(You)</span>}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(statuses[u.id] || u.status) === 'online' ? 'Online' : (statuses[u.id] || u.status) === 'away' ? 'Away' : (statuses[u.id] || u.status) === 'dnd' ? 'Do not disturb' : 'Offline'}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} /> {u.email}
                  </div>
                </td>
                <td>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: u.role === 'admin' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.05)',
                    color: u.role === 'admin' ? 'var(--accent-cyan)' : 'var(--text-dim)',
                    border: u.role === 'admin' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {u.role === 'admin' ? <ShieldAlert size={12} /> : <UserCheck size={12} />}
                    {u.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} /> {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </td>
                {currentUser?.role === 'admin' && (
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {u.id !== currentUser.id && (
                        <>
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="btn btn-secondary"
                            title="Change Role"
                            style={{ padding: '6px', borderRadius: '8px' }}
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn btn-secondary"
                            title="Delete User"
                            style={{ padding: '6px', borderRadius: '8px', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
