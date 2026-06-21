import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';

const Avatar = ({ u, size = 24 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: u?.avatar_color || 'var(--accent-cyan)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.45, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0,
  }}>
    {u?.avatar_url
      ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : (u?.name || '?').charAt(0).toUpperCase()}
  </div>
);

const Placeholder = () => (
  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-panel-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <User size={14} color="var(--text-dim)" />
  </div>
);

const Row = ({ u, isSelected, currentUserId, onClick }) => (
  <div
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}
    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    {u ? <Avatar u={u} /> : <Placeholder />}
    <span style={{ flex: 1, color: u ? 'var(--text-main)' : 'var(--text-muted)' }}>
      {u ? `${u.name}${u.id === currentUserId ? ' (Me)' : ''}` : 'Unassigned'}
    </span>
    {isSelected && <Check size={14} color="var(--accent-cyan)" />}
  </div>
);

// Кастомний пікер виконавця з аватарами (заміна нативного <select>)
export const AssigneePicker = ({ users = [], value, onChange, currentUserId }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = users.find((u) => String(u.id) === String(value));

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (id) => { onChange(id); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-panel"
        style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid var(--accent-cyan)', background: 'rgba(0,0,0,0.2)' }}
      >
        {selected ? <Avatar u={selected} /> : <Placeholder />}
        <span style={{ flex: 1, textAlign: 'left', color: selected ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {selected ? `${selected.name}${selected.id === currentUserId ? ' (Me)' : ''}` : 'Unassigned'}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </button>

      {open && (
        <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, maxHeight: 240, overflowY: 'auto', padding: '6px', border: '1px solid var(--border-light)', background: '#1a1c2c', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <Row u={null} isSelected={!value} currentUserId={currentUserId} onClick={() => choose('')} />
          {users.map((u) => (
            <Row key={u.id} u={u} isSelected={String(u.id) === String(value)} currentUserId={currentUserId} onClick={() => choose(u.id)} />
          ))}
        </div>
      )}
    </div>
  );
};
