import React, { useState, useRef } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';
import { DropdownMenu } from './Select';

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
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const selected = users.find((u) => String(u.id) === String(value));

  const choose = (id) => { onChange(id); setOpen(false); };

  return (
    <>
      <button
        ref={btnRef}
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
        <DropdownMenu anchorRef={btnRef} menuRef={menuRef} onClose={() => setOpen(false)}>
          <Row u={null} isSelected={!value} currentUserId={currentUserId} onClick={() => choose('')} />
          {users.map((u) => (
            <Row key={u.id} u={u} isSelected={String(u.id) === String(value)} currentUserId={currentUserId} onClick={() => choose(u.id)} />
          ))}
        </DropdownMenu>
      )}
    </>
  );
};

// Мультиселект виконавців (кілька людей на тікеті). value: масив id, onChange(масив id)
export const MultiAssigneePicker = ({ users = [], value = [], onChange, currentUserId }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const selectedIds = (value || []).map(String);
  const selectedUsers = users.filter((u) => selectedIds.includes(String(u.id)));

  const toggle = (id) => {
    const sid = String(id);
    const next = selectedIds.includes(sid) ? value.filter((v) => String(v) !== sid) : [...value, id];
    onChange(next);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-panel"
        style={{ width: '100%', padding: '8px 12px', minHeight: 44, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid var(--accent-cyan)', background: 'rgba(0,0,0,0.2)' }}
      >
        {selectedUsers.length === 0 ? (
          <Placeholder />
        ) : (
          <div style={{ display: 'flex' }}>
            {selectedUsers.slice(0, 4).map((u, i) => (
              <div key={u.id} style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--bg-panel)', borderRadius: '50%' }}>
                <Avatar u={u} />
              </div>
            ))}
          </div>
        )}
        <span style={{ flex: 1, textAlign: 'left', color: selectedUsers.length ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {selectedUsers.length === 0
            ? 'Unassigned'
            : selectedUsers.length === 1
              ? selectedUsers[0].name
              : `${selectedUsers.length} assignees`}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </button>

      {open && (
        <DropdownMenu anchorRef={btnRef} menuRef={menuRef} onClose={() => setOpen(false)}>
          {users.map((u) => (
            <Row key={u.id} u={u} isSelected={selectedIds.includes(String(u.id))} currentUserId={currentUserId} onClick={() => toggle(u.id)} />
          ))}
        </DropdownMenu>
      )}
    </>
  );
};
