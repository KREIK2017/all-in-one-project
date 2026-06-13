import React, { useState, useEffect } from 'react';
import { History, MessageSquare, Briefcase, RefreshCcw, Clock, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserActivityLog } from '../services/api';

export const ActivityPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getUserActivityLog(user.id)
        .then(data => {
          setActivities(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'comment': return <MessageSquare size={16} style={{ color: 'var(--accent-purple)' }} />;
      case 'status_change': return <RefreshCcw size={16} style={{ color: 'var(--accent-cyan)' }} />;
      case 'reassign': return <UserPlus size={16} style={{ color: 'var(--accent-yellow)' }} />;
      case 'time_log': return <Clock size={16} style={{ color: 'var(--accent-blue)' }} />;
      default: return <History size={16} />;
    }
  };

  const getActivityText = (act) => {
    switch(act.type) {
      case 'comment': return `Додав коментар до "${act.ticket_subject}"`;
      case 'status_change': return `Змінив статус тікета "${act.ticket_subject}" на ${act.new_value}`;
      case 'reassign': return `Призначив тікет на ${act.new_value}`;
      case 'time_log': return `Залогіровав ${act.content} до тікета "${act.ticket_subject}"`;
      default: return act.content || 'Невідома дія';
    }
  };

  return (
    <div className="page-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
          <History size={32} style={{ color: 'var(--accent-purple)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Активність користувача</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Переглядайте історію ваших дій на платформі</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Завантаження активності...</div>
        ) : activities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)' }}>
             Активності поки немає. Почніть роботу з тікетами!
          </div>
        ) : activities.map((act, i) => (
          <div key={i} className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border-light)', transition: 'background 0.2s', cursor: 'pointer' }}>
             <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getActivityIcon(act.type)}
             </div>
             
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>{getActivityText(act)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={12} /> {act.project_name || 'Project'}
                   </div>
                   <span>•</span>
                   <div>{new Date(act.created_at).toLocaleString()}</div>
                </div>
             </div>
             
             <ArrowRight size={14} style={{ color: 'var(--text-dim)', opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
};
