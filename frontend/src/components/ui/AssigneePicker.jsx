import React, { useState, useRef } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';
import { DropdownMenu, useListboxKeyboard, useScrollHighlighted } from './Select';

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

const Row = ({ u, isSelected, highlighted, currentUserId, onClick, onMouseEnter }) => (
  <div
    role="option"
    aria-selected={isSelected}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: highlighted ? 'rgba(255,255,255,0.08)' : 'transparent' }}
  >
    {u ? <Avatar u={u} /> : <Placeholder />}
    <span style={{ flex: 1, color: u ? 'var(--text-main)' : 'var(--text-muted)' }}>
      {u ? `${u.name}${u.id === currentUserId ? ' (Me)' : ''}` : 'Unassigned'}
    </span>
    {isSelected && <Check size={14} color="var(--accent-cyan)" />}
  </div>
);

const triggerStyle = { width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid var(--accent-cyan)', background: 'rgba(0,0,0,0.2)' };

// Один виконавець
export const AssigneePicker = ({ users = [], value, onChange, currentUserId }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const selected = users.find((u) => String(u.id) === String(value));

  const choose = (v) => { onChange(v); setOpen(false); btnRef.current?.focus(); };
  const { hi, setHi, onKeyDown } = useListboxKeyboard({
    length: users.length + 1, // 0 = Unassigned
    open,
    setOpen,
    anchorRef: btnRef,
    getInitialIndex: () => {
      const idx = users.findIndex((u) => String(u.id) === String(value));
      return idx >= 0 ? idx + 1 : 0;
    },
    onChoose: (i) => choose(i === 0 ? '' : users[i - 1].id),
  });
  useScrollHighlighted(menuRef, hi, open);

  return (
    <>
      <div ref={btnRef} role="combobox" aria-haspopup="listbox" aria-expanded={open} tabIndex={0} onClick={() => setOpen((o) => !o)} onKeyDown={onKeyDown} className="glass-panel" style={triggerStyle}>
        {selected ? <Avatar u={selected} /> : <Placeholder />}
        <span style={{ flex: 1, textAlign: 'left', color: selected ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {selected ? `${selected.name}${selected.id === currentUserId ? ' (Me)' : ''}` : 'Unassigned'}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </div>

      {open && (
        <DropdownMenu anchorRef={btnRef} menuRef={menuRef} onClose={() => setOpen(false)} role="listbox">
          <Row u={null} isSelected={!value} highlighted={hi === 0} currentUserId={currentUserId} onMouseEnter={() => setHi(0)} onClick={() => choose('')} />
          {users.map((u, i) => (
            <Row key={u.id} u={u} isSelected={String(u.id) === String(value)} highlighted={hi === i + 1} currentUserId={currentUserId} onMouseEnter={() => setHi(i + 1)} onClick={() => choose(u.id)} />
          ))}
        </DropdownMenu>
      )}
    </>
  );
};

// Кілька виконавців (мультиселект). value: масив id, onChange(масив id)
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
  const { hi, setHi, onKeyDown } = useListboxKeyboard({
    length: users.length,
    open,
    setOpen,
    anchorRef: btnRef,
    getInitialIndex: () => 0,
    onChoose: (i) => toggle(users[i].id), // мультиселект — не закриваємо
  });
  useScrollHighlighted(menuRef, hi, open);

  return (
    <>
      <div ref={btnRef} role="combobox" aria-haspopup="listbox" aria-expanded={open} tabIndex={0} onClick={() => setOpen((o) => !o)} onKeyDown={onKeyDown} className="glass-panel" style={{ ...triggerStyle, padding: '8px 12px', minHeight: 44 }}>
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
          {selectedUsers.length === 0 ? 'Unassigned' : selectedUsers.length === 1 ? selectedUsers[0].name : `${selectedUsers.length} assignees`}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </div>

      {open && (
        <DropdownMenu anchorRef={btnRef} menuRef={menuRef} onClose={() => setOpen(false)} role="listbox">
          {users.map((u, i) => (
            <Row key={u.id} u={u} isSelected={selectedIds.includes(String(u.id))} highlighted={hi === i} currentUserId={currentUserId} onMouseEnter={() => setHi(i)} onClick={() => toggle(u.id)} />
          ))}
        </DropdownMenu>
      )}
    </>
  );
};
