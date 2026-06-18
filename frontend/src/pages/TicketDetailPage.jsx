import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight, User, FileText, AtSign, Bug, Sparkles, CheckCircle2, Headphones } from 'lucide-react';
import { getTicket, addComment, updateTicket, deleteTicket, startTimer, addManualTime, getProjects, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [pendingPriority, setPendingPriority] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [manualHours, setManualHours] = useState(0);
  const [manualMins, setManualMins] = useState(0);
  const [isAdding, setIsAdding] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingAssignee, setPendingAssignee] = useState('');
  const [pendingProject, setPendingProject] = useState('');
  const [pendingType, setPendingType] = useState('');

  // Mention State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef(null);

  const fetchTicket = useCallback(() => {
    getTicket(id)
      .then(data => {
        setTicket(data);
        setActivity(data.activity || []);
        setPendingStatus(data.status);
        setPendingPriority(data.priority);
        setEditSubject(data.subject || data.SUBJECT || '');
        setEditBody(data.body || '');
        setPendingAssignee(data.assignee_id || '');
        setPendingProject(data.project_id || '');
        setPendingType(data.ticket_type || 'Task');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { 
    fetchTicket(); 
    getProjects().then(setProjects);
    getUsers().then(setUsers);
  }, [fetchTicket]);

  const handlePostUpdate = async () => {
    const hasComment = newComment.trim() !== '';
    const hasStatusChange = pendingStatus !== ticket.status;
    const hasPriorityChange = pendingPriority !== ticket.priority;
    const hasAssigneeChange = pendingAssignee !== (ticket.assignee_id || '');
    const hasProjectChange = pendingProject !== ticket.project_id;
    const hasTypeChange = pendingType !== ticket.ticket_type;
    const hasSubjectChange = isEditing && editSubject !== (ticket.subject || ticket.SUBJECT);
    const hasBodyChange = isEditing && editBody !== ticket.body;

    if (!hasComment && !hasStatusChange && !hasPriorityChange && !hasAssigneeChange && !hasProjectChange && !hasTypeChange && !hasSubjectChange && !hasBodyChange) return;

    setSubmitting(true);
    try {
      if (hasStatusChange || hasPriorityChange || hasAssigneeChange || hasProjectChange || hasTypeChange || hasSubjectChange || hasBodyChange) {
        await updateTicket(id, { 
          status: pendingStatus, 
          priority: pendingPriority,
          assignee_id: pendingAssignee,
          project_id: pendingProject,
          ticket_type: pendingType,
          subject: hasSubjectChange ? editSubject : undefined,
          body: hasBodyChange ? editBody : undefined,
          user_id: user.id 
        });
      }

      if (hasComment) {
        await addComment(id, { user_id: user.id, content: newComment });
      }

      setNewComment('');
      setIsEditing(false);
      fetchTicket();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Видалити цей тікет? Його коментарі, активність та залогований час буде видалено без можливості відновлення.')) return;
    try {
      await deleteTicket(id);
      navigate('/tickets');
    } catch (err) {
      alert('Помилка при видаленні: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStatusChange = (e) => setPendingStatus(e.target.value);
  const handlePriorityChange = (e) => setPendingPriority(e.target.value);

  const handleStartTimer = async () => {
    try {
      await startTimer({ 
        user_id: user.id, 
        project_id: ticket.project_id, 
        ticket_id: ticket.id 
      });
      window.location.reload();
    } catch (err) {
      alert('Failed to start timer: ' + err.message);
    }
  };

  const handleManualTimeSubmit = async () => {
    let totalMinutes = (parseInt(manualHours || 0) * 60) + parseInt(manualMins || 0);
    if (totalMinutes === 0) return alert('Please enter time!');
    if (!isAdding) totalMinutes = -totalMinutes;
    
    setSubmitting(true);
    try {
      await addManualTime({
        user_id: user.id,
        project_id: ticket.project_id,
        ticket_id: ticket.id,
        duration_minutes: totalMinutes,
        description: isAdding ? 'Manual addition' : 'Manual reduction'
      });
      setShowTimeModal(false);
      setManualHours(0);
      setManualMins(0);
      fetchTicket();
    } catch (err) {
      alert('Error adding time: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mention logic
  const filteredUsers = users.filter(u => 
    u.handle && (
      u.handle.toLowerCase().includes(mentionQuery.toLowerCase()) || 
      u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    )
  ).slice(0, 5);

  const handleCommentChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setNewComment(val);
    setCursorPos(pos);

    // Check for @ mention
    const textBeforeCursor = val.slice(0, pos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    // Check if @ is preceded by start of line or space
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ' || textBeforeCursor[lastAtIdx - 1] === '\n')) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      // Only show if there's no space in the query (to allow typing "@name here" without list staying)
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (targetUser) => {
    const textBeforeAt = newComment.slice(0, cursorPos).lastIndexOf('@');
    const textAfterCursor = newComment.slice(cursorPos);
    const newText = newComment.slice(0, textBeforeAt) + `@${targetUser.handle} ` + textAfterCursor;
    setNewComment(newText);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current.focus();
      const newPos = textBeforeAt + targetUser.handle.length + 2; // +1 for @, +1 for space
      textareaRef.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const renderCommentContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const handle = part.slice(1);
        const checkUser = users.find(u => u.handle === handle);
        return (
          <span key={i} 
            onClick={() => checkUser && navigate(`/profile/${checkUser.id}`)}
            style={{ 
              color: 'var(--accent-cyan)', 
              fontWeight: 700, 
              background: 'rgba(0, 242, 254, 0.1)', 
              padding: '2px 6px', 
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onMouseOver={(e) => e.target.style.background = 'rgba(0, 242, 254, 0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(0, 242, 254, 0.1)'}
            title={checkUser ? `View profile of ${checkUser.name}` : 'Unknown user'}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '96px' }}>Loading ticket...</div>;
  if (!ticket) return <div style={{ color: '#ef4444', textAlign: 'center', padding: '96px' }}>Ticket not found.</div>;

  const totalMinutes = activity.filter(a => (a.type === 'time_log' || a.TYPE === 'time_log')).reduce((acc, a) => {
    const text = a.content || a.CONTENT || '';
    const isRemoval = text.includes('removed');
    const minMatch = text.match(/(-?\d+)\s*min/);
    if (minMatch) {
      const val = parseInt(minMatch[1]);
      return acc + (isRemoval ? -Math.abs(val) : val);
    }
    const hMatch = text.match(/(-?\d+)\s*h/);
    const mMatch = text.match(/(-?\d+)\s*m/);
    let mins = 0;
    if (hMatch) mins += parseInt(hMatch[1]) * 60;
    if (mMatch) mins += parseInt(mMatch[1]);
    if (mins !== 0) return acc + (isRemoval ? -Math.abs(mins) : mins);
    return acc;
  }, 0);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bug': return <Bug size={24} style={{ color: '#ef4444' }} />;
      case 'Feature': return <Sparkles size={24} style={{ color: '#f59e0b' }} />;
      case 'Support': return <Headphones size={24} style={{ color: '#8e2de2' }} />;
      default: return <CheckCircle2 size={24} style={{ color: 'var(--accent-cyan)' }} />;
    }
  };

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/tickets')}>← Back to list</button>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>Ticket #{ticket.id}</h1>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 2 }} className="glass-panel">
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{ticket.id}</span>
              </div>
              {isEditing ? (
                <input 
                  className="glass-panel" 
                  style={{ width: '100%', fontSize: '1.8rem', fontWeight: 600, padding: '8px', outline: 'none', color: 'var(--text-main)', border: '1px solid var(--border-light)', marginBottom: '12px' }} 
                  value={editSubject} 
                  onChange={e => setEditSubject(e.target.value)}
                  placeholder="Ticket Subject"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  {getTypeIcon(ticket.ticket_type)}
                  <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>{ticket.subject || ticket.SUBJECT || 'No Subject'}</h2>
                </div>
              )}
              <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <div><span style={{ color: 'var(--text-dark)' }}>Project:</span> {ticket.project_name || '—'}</div>
                {totalMinutes > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Has taken {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', height: 'fit-content' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                onClick={() => {
                  if (isEditing) {
                    setEditSubject(ticket.subject || ticket.SUBJECT || '');
                    setEditBody(ticket.body || '');
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Ticket'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.85rem', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}
                onClick={handleDeleteTicket}
                title="Delete Ticket"
              >
                Delete
              </button>
            </div>
          </div>

          <div style={{ padding: '32px 24px', minHeight: '400px' }}>
            <div style={{ marginBottom: '32px' }}>
              {isEditing ? (
                <textarea 
                  className="glass-panel" 
                  style={{ width: '100%', minHeight: '120px', padding: '16px', fontSize: '1rem', color: 'var(--text-main)', outline: 'none', border: '1px solid var(--border-light)', resize: 'vertical' }} 
                  value={editBody} 
                  onChange={e => setEditBody(e.target.value)}
                  placeholder="Ticket Description"
                />
              ) : (
                <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                  {ticket.body || 'No description provided.'}
                </p>
              )}
            </div>
            <div className="activity-feed">
              {activity.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No activity yet. Post the first comment!</div>
              )}
              {activity.map((item, index) => (
                <div key={index} className="feed-item">
                  <div className="feed-icon" style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: item.author_avatar_color || 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#fff',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {item.author_avatar_url ? (
                      <img src={item.author_avatar_url} alt="author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (item.author_name || 'U').charAt(0).toUpperCase()}
                  </div>

                  {item.type === 'comment' && (
                    <div className="feed-content">
                      <div className="feed-header">
                        <span className="feed-author">{item.author_name || item.AUTHOR_NAME}</span> commented on <span className="feed-time">{new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                      </div>
                      <div className="feed-text" style={{ whiteSpace: 'pre-wrap' }}>
                        {renderCommentContent(item.content || item.CONTENT)}
                      </div>
                    </div>
                  )}

                  {(item.type === 'status_change' || item.TYPE === 'status_change') && (
                    <div style={{ paddingTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 600 }}>{item.author_name || item.AUTHOR_NAME}</span> changed status
                      {(item.old_value || item.OLD_VALUE) && <> from <span className={`badge badge-${(item.old_value || item.OLD_VALUE || '').toLowerCase().replace('_', '-')}`}>{item.old_value || item.OLD_VALUE}</span></>}
                      {(item.new_value || item.NEW_VALUE) && <> → <span className={`badge badge-${(item.new_value || item.NEW_VALUE || '').toLowerCase().replace('_', '-')}`}>{item.new_value || item.NEW_VALUE}</span></>}
                      <span style={{ color: 'var(--text-muted)' }}> on {new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {(item.type === 'priority_change' || item.TYPE === 'priority_change') && (
                    <div style={{ paddingTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 600 }}>{item.author_name || item.AUTHOR_NAME}</span> updated priority to <strong style={{ color: (item.new_value || item.NEW_VALUE) === 'HIGH' ? '#ef4444' : 'var(--text-main)' }}>{item.new_value || item.NEW_VALUE}</strong>
                      <span style={{ color: 'var(--text-muted)' }}> on {new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {(item.type === 'reassign' || item.TYPE === 'reassign') && (
                    <div style={{ paddingTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 600 }}>{item.author_name || item.AUTHOR_NAME}</span> reassigned ticket to <span style={{ fontWeight: 600 }}>{users.find(u => u.id === parseInt(item.new_value || item.NEW_VALUE))?.name || 'someone'}</span>
                      <span style={{ color: 'var(--text-muted)' }}> on {new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {(item.type === 'subject_change' || item.TYPE === 'subject_change') && (
                    <div style={{ paddingTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 600 }}>{item.author_name || item.AUTHOR_NAME}</span> renamed ticket
                      <span style={{ color: 'var(--text-muted)' }}> on {new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {(item.type === 'type_change' || item.TYPE === 'type_change') && (
                    <div style={{ paddingTop: '6px', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontWeight: 600 }}>{item.author_name || item.AUTHOR_NAME}</span> changed Task Type to 
                       <span style={{ 
                         display: 'inline-flex', 
                         alignItems: 'center', 
                         gap: '6px', 
                         background: 'rgba(255,255,255,0.05)', 
                         padding: '2px 8px', 
                         borderRadius: '6px',
                         fontWeight: 700,
                         color: (item.new_value || item.NEW_VALUE) === 'Bug' ? '#ef4444' : (item.new_value || item.NEW_VALUE) === 'Feature' ? '#f59e0b' : 'var(--accent-cyan)'
                       }}>
                         {(item.new_value || item.NEW_VALUE) === 'Bug' && <Bug size={14} />}
                         {(item.new_value || item.NEW_VALUE) === 'Feature' && <Sparkles size={14} />}
                         {(item.new_value || item.NEW_VALUE) === 'Task' && <CheckCircle2 size={14} />}
                         {(item.new_value || item.NEW_VALUE) === 'Support' && <Headphones size={14} />}
                         {item.new_value || item.NEW_VALUE}
                       </span>
                       <span style={{ color: 'var(--text-muted)' }}> on {new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {(item.type === 'time_log' || item.TYPE === 'time_log') && (
                    <div style={{ paddingTop: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 600 }}>{item.author_name || item.AUTHOR_NAME}</span> <strong style={{ color: 'var(--accent-purple)' }}>{item.content || item.CONTENT}</strong>
                      <span style={{ color: 'var(--text-muted)' }}> · {new Date(item.created_at || item.CREATED_AT).toLocaleString('en-US')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', position: 'relative' }}>
              {showMentions && filteredUsers.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 'calc(100% + 10px)', 
                  left: 0, 
                  width: '300px', 
                  background: '#1a1c2c', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
                  zIndex: 50,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AtSign size={14} /> MENTION USERS
                  </div>
                  {filteredUsers.map((u, idx) => (
                    <div 
                      key={u.id}
                      onClick={() => insertMention(u)}
                      onMouseEnter={() => setMentionIndex(idx)}
                      style={{ 
                        padding: '12px 16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        cursor: 'pointer', 
                        background: mentionIndex === idx ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                        borderLeft: mentionIndex === idx ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.avatar_color || 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                        {u.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: mentionIndex === idx ? 'var(--accent-cyan)' : 'var(--text-main)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.handle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                placeholder="Post a response... Use @ to tag colleagues"
                className="glass-panel"
                style={{ width: '100%', minHeight: '120px', padding: '16px', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none', resize: 'vertical', fontSize: '0.95rem' }}
                value={newComment}
                onKeyDown={handleKeyDown}
                onChange={handleCommentChange}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '10px 24px', opacity: (newComment.trim() || pendingStatus !== ticket.status || pendingPriority !== ticket.priority || pendingAssignee !== (ticket.assignee_id || '') || pendingProject !== ticket.project_id || (isEditing && (editSubject !== (ticket.subject || ticket.SUBJECT) || editBody !== ticket.body))) ? 1 : 0.6 }} 
                  onClick={handlePostUpdate} 
                  disabled={submitting || (!newComment.trim() && pendingStatus === ticket.status && pendingPriority === ticket.priority && pendingAssignee === (ticket.assignee_id || '') && pendingProject === ticket.project_id && (!isEditing || (editSubject === (ticket.subject || ticket.SUBJECT) && editBody === ticket.body)))}
                >
                  {submitting ? 'Updating...' : 'Post Update'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Properties</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Status</label>
                <select className="glass-panel" style={{ width: '100%', padding: '10px', outline: 'none', color: 'var(--text-main)', appearance: 'none' }} value={pendingStatus} onChange={handleStatusChange}>
                  <option value="NEW">New</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Priority</label>
                <select className="glass-panel" style={{ width: '100%', padding: '10px', outline: 'none', color: 'var(--text-main)', appearance: 'none' }} value={pendingPriority} onChange={handlePriorityChange}>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Assignee</label>
                <select className="glass-panel" style={{ width: '100%', padding: '10px', outline: 'none', color: 'var(--text-main)', appearance: 'none' }} value={pendingAssignee} onChange={(e) => setPendingAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
                  {pendingType === 'Bug' && <Bug size={14} style={{ color: '#ef4444' }} />}
                  {pendingType === 'Feature' && <Sparkles size={14} style={{ color: '#f59e0b' }} />}
                  {pendingType === 'Support' && <Headphones size={14} style={{ color: '#8e2de2' }} />}
                  {pendingType === 'Task' && <CheckCircle2 size={14} style={{ color: 'var(--accent-cyan)' }} />}
                  Task Type
                </label>
                <select className="glass-panel" style={{ width: '100%', padding: '10px', outline: 'none', color: 'var(--text-main)', appearance: 'none' }} value={pendingType} onChange={(e) => setPendingType(e.target.value)}>
                   <option value="Task">Task</option>
                   <option value="Bug">Bug</option>
                   <option value="Feature">Feature</option>
                   <option value="Support">Support</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Project</label>
                <select className="glass-panel" style={{ width: '100%', padding: '10px', outline: 'none', color: 'var(--text-main)', appearance: 'none' }} value={pendingProject} onChange={(e) => setPendingProject(e.target.value)}>
                  <option value="">No Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Time Tracking</h3>
              <span style={{ background: 'var(--accent-purple)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStartTimer}>
                Start Timer
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, borderColor: 'rgba(142, 45, 226, 0.4)', color: 'var(--accent-purple)' }} onClick={() => setShowTimeModal(true)}>
                Add Time
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTimeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowTimeModal(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', animation: 'modal-pop 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center', background: 'linear-gradient(90deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Manual Time Entry</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
              <button 
                onClick={() => setIsAdding(true)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: isAdding ? 'rgba(0, 242, 254, 0.1)' : 'transparent', color: isAdding ? '#00f2fe' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
              >
                Add
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: !isAdding ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: !isAdding ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
              >
                Subtract
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>Hours</label>
                <input 
                  type="number" min="0" placeholder="0" className="glass-panel" 
                  style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }}
                  value={manualHours} onChange={e => setManualHours(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>Minutes</label>
                <input 
                  type="number" min="0" max="59" placeholder="0" className="glass-panel" 
                  style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }}
                  value={manualMins} onChange={e => setManualMins(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTimeModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, background: isAdding ? 'var(--accent-cyan)' : '#ef4444' }} onClick={handleManualTimeSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
