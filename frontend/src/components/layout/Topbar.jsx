import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Search, Bell, ChevronDown, Settings, LogOut, User, History, Circle, Moon, MinusCircle, EyeOff, Check, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProjects, startTimer, stopTimer, getActiveTimer, updateUserStatus, getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTicketSubject, setActiveTicketSubject] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const intervalRef = useRef(null);
  const userMenuRef = useRef(null);
  const projectPickerRef = useRef(null);
  const notificationsRef = useRef(null);

  const refreshNotifications = useCallback(async () => {
    try {
        const countRes = await getUnreadCount();
        setUnreadCount(countRes.count);
        if (showNotifications) {
            const list = await getNotifications();
            setNotifications(list);
        }
    } catch (err) {
        console.error('Failed to refresh notifications:', err);
    }
  }, [showNotifications]);

  // On mount: load projects and check if timer is already running on server
  useEffect(() => {
    getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });

    if (user && user.id) {
      getActiveTimer(user.id).then(timer => {
        if (timer && timer.active) {
          setIsRunning(true);
          setSeconds(timer.elapsed_seconds);
          if (timer.project_id) setSelectedProject(timer.project_id);
          if (timer.ticket_subject) setActiveTicketSubject(timer.ticket_subject);
        }
      }).catch(err => {
        console.error('Error fetching active timer for user', user.id, err);
      });

      // Notifications initial load
      refreshNotifications();
      
      // Poll notifications every 30s
      const notifInterval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(notifInterval);
    }
  }, [user, refreshNotifications]);

  // Tick every second when running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = async () => {
    if (!selectedProject || !user) return;
    try {
      await startTimer({ user_id: user.id, project_id: selectedProject });
      setIsRunning(true);
      setSeconds(0);
      setActiveTicketSubject(''); // Reset ticket subject if started from Topbar (project only)
    } catch (err) {
      console.error('Timer start failed:', err);
    }
  };

  const handleStop = async () => {
    if (!user) return;
    try {
      const result = await stopTimer({ user_id: user.id });
      setIsRunning(false);
      setSeconds(0);
      alert(`✅ Записано ${Math.floor(result.duration_minutes / 60)}г ${result.duration_minutes % 60}хв для проекту "${projects.find(p => p.id == selectedProject)?.name || 'проект'}"`);
    } catch (err) {
      console.error('Timer stop failed:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (projectPickerRef.current && !projectPickerRef.current.contains(event.target)) {
        setShowProjectPicker(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTimer = () => isRunning ? handleStop() : handleStart();

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeProject = projects.find(p => p.id == selectedProject);

  return (
    <header className="topbar no-print">
      <div className="topbar-left">
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', borderRadius: '8px', padding: '8px 16px', border: '1px solid var(--border-light)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search tickets, projects..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', marginLeft: '8px', width: '250px' }}
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Project Picker + Timer Widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: `1px solid ${isRunning ? 'var(--accent-cyan)' : 'var(--border-light)'}`, transition: 'border-color 0.3s' }}>
          
          {/* Project Selector */}
          <div style={{ position: 'relative' }}>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', color: isRunning ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: '0.85rem', borderRight: '1px solid var(--border-light)', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onClick={() => !isRunning && setShowProjectPicker(p => !p)}
            >
              {activeProject && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeProject.color || 'var(--accent-cyan)', flexShrink: 0 }}></span>
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeProject?.name || (selectedProject ? 'Unnamed Project' : 'Select project')}
                {isRunning && activeTicketSubject && (
                   <span style={{ marginLeft: '8px', opacity: 0.6, fontSize: '0.8rem' }}>• {activeTicketSubject}</span>
                )}
              </span>
              {!isRunning && <ChevronDown size={14} />}
            </button>

            {showProjectPicker && !isRunning && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px', minWidth: '200px', zIndex: 999, boxShadow: 'var(--glass-shadow)', marginTop: '4px', overflow: 'hidden' }}>
                {projects.map(p => (
                  <button key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', color: 'var(--text-main)', textAlign: 'left', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                    onClick={() => { setSelectedProject(p.id); setShowProjectPicker(false); }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#00f2fe', flexShrink: 0 }}></span>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Display */}
          <span style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600, color: isRunning ? 'var(--text-main)' : 'var(--text-muted)', minWidth: '80px', textAlign: 'center' }}>
            {formatTime(seconds)}
          </span>

          {/* Start / Stop Button */}
          <button
            className={`timer-action ${isRunning ? 'stop' : 'start'}`}
            onClick={toggleTimer}
            style={{ margin: '4px', borderRadius: '6px' }}
            title={isRunning ? 'Stop & Save' : 'Start Timer'}
          >
            {isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <button 
                onClick={async () => {
                   if (!showNotifications) {
                       const list = await getNotifications();
                       setNotifications(list);
                   }
                   setShowNotifications(!showNotifications);
                }}
                style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', color: showNotifications ? 'var(--accent-cyan)' : 'inherit', padding: '4px', transition: 'color 0.2s' }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{ 
                        position: 'absolute', 
                        top: -2, 
                        right: -2, 
                        minWidth: '16px', 
                        height: '16px', 
                        padding: '0 4px',
                        background: 'var(--accent-pink)', 
                        borderRadius: '8px', 
                        border: '2px solid var(--bg-panel)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className="glass-panel" style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 12px)', 
                    right: -10, 
                    width: '320px', 
                    maxHeight: '450px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000, 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button 
                                onClick={async () => {
                                    await markAllAsRead();
                                    setUnreadCount(0);
                                    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
                                }}
                                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <Mail size={24} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                <div>No notifications</div>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={async () => {
                                        if (!n.is_read) {
                                            await markAsRead(n.id);
                                            setUnreadCount(prev => Math.max(0, prev - 1));
                                        }
                                        setShowNotifications(false);
                                        navigate(`/tickets/${n.target_id}`);
                                    }}
                                    style={{ 
                                        padding: '12px 16px', 
                                        borderBottom: '1px solid var(--border-light)', 
                                        cursor: 'pointer',
                                        background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.03)',
                                        display: 'flex',
                                        gap: '12px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(255,255,255,0.03)' }
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: n.actor_avatar_color || 'var(--accent-purple)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {n.actor_avatar_url ? (
                                            <img src={n.actor_avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (n.actor_name?.charAt(0) || 'U')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text-main)', lineHeight: '1.3' }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', marginTop: '4px' }}></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
              className="user-profile-btn"
            >
              <div style={{ textAlign: 'right', display: 'none' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{user?.name}</div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: user?.avatar_color || 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', border: '2px solid var(--border-light)', overflow: 'hidden' }}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user?.name?.trim()?.charAt(0) || user?.handle?.charAt(0) || 'U').toUpperCase()
                  )}
                </div>
                {/* Status indicator on avatar */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: -2, 
                  right: -2, 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  background: user?.status === 'online' ? '#10b981' : user?.status === 'away' ? '#f59e0b' : user?.status === 'dnd' ? '#ef4444' : '#6b7280',
                  border: '2px solid var(--bg-panel)',
                  boxShadow: user?.status === 'online' ? '0 0 6px #10b981' : 'none'
                }}></div>
              </div>
              <ChevronDown size={14} style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showUserMenu && (
              <div className="glass-panel" style={{ 
                position: 'absolute', 
                top: 'calc(100% + 12px)', 
                right: 0, 
                width: '220px', 
                padding: '8px', 
                zIndex: 1000, 
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || 'Active User'}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Status Selector Section */}
                  <div style={{ padding: '4px 8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', paddingLeft: '8px', marginBottom: '4px' }}>Presence</div>
                    {[
                      { id: 'online', label: 'Online', icon: <Circle size={12} fill="#10b981" color="#10b981" /> },
                      { id: 'away', label: 'Away', icon: <Moon size={12} fill="#f59e0b" color="#f59e0b" /> },
                      { id: 'dnd', label: 'Do Not Disturb', icon: <MinusCircle size={12} fill="#ef4444" color="#ef4444" /> },
                      { id: 'invisible', label: 'Invisible', icon: <EyeOff size={12} color="var(--text-dim)" /> }
                    ].map(st => (
                      <button 
                        key={st.id}
                        className="nav-item"
                        style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '0.85rem', background: user?.status === st.id ? 'rgba(255,255,255,0.08)' : 'none', width: '100%', border: 'none', cursor: 'pointer', color: user?.status === st.id ? 'var(--text-main)' : 'var(--text-dim)', marginBottom: '2px' }}
                        onClick={async () => {
                          try {
                            const res = await updateUserStatus(st.id);
                            if (res.success) {
                              setUser({ ...user, status: st.id });
                            }
                          } catch (err) {
                            console.error('Failed to update status:', err);
                          }
                        }}
                      >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            {st.icon} {st.label}
                         </div>
                         {user?.status === st.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }}></div>}
                      </button>
                    ))}
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>
                  
                  <button className="nav-item" onClick={() => { navigate('/profile'); setShowUserMenu(false); }} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <User size={16} /> Профіль
                  </button>
                  <button className="nav-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Settings size={16} /> Налаштування
                  </button>
                  <button className="nav-item" onClick={() => { navigate('/activity'); setShowUserMenu(false); }} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <History size={16} /> Активність
                  </button>
                  
                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }}></div>
                  
                  <button className="nav-item" onClick={logout} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                    <LogOut size={16} /> Вийти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
