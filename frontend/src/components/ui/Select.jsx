import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const OptionRow = ({ opt, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', cursor: 'pointer' }}
    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    {opt.icon}
    <span style={{ flex: 1, color: 'var(--text-main)' }}>{opt.label}</span>
    {isSelected && <Check size={14} color="var(--accent-cyan)" />}
  </div>
);

// Кольорова крапка — зручний значок для статусів/проєктів
export const Dot = ({ color }) => (
  <span style={{ width: 9, height: 9, borderRadius: '50%', background: color || 'var(--text-dim)', flexShrink: 0 }} />
);

// Випадайка через портал у <body> з fixed-позицією — щоб не ховалась за сусідні панелі (stacking context)
export const DropdownMenu = ({ anchorRef, onClose, children, menuRef }) => {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    place();
    const onDoc = (e) => {
      if (anchorRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [anchorRef, menuRef, onClose]);

  if (!pos) return null;
  return createPortal(
    <div
      ref={menuRef}
      className="glass-panel"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999, maxHeight: 260, overflowY: 'auto', padding: '6px', border: '1px solid var(--border-light)', background: '#1a1c2c', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
    >
      {children}
    </div>,
    document.body
  );
};

// Переносний кастомний дропдаун (заміна нативного <select>).
// options: [{ value, label, icon? }]
export const Select = ({ options = [], value, onChange, placeholder = 'Select...', accent = 'var(--border-light)' }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((o) => String(o.value) === String(value));

  const choose = (v) => { onChange(v); setOpen(false); };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-panel"
        style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: `1px solid ${accent}`, background: 'rgba(0,0,0,0.2)' }}
      >
        {selected?.icon}
        <span style={{ flex: 1, textAlign: 'left', color: selected ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </button>

      {open && (
        <DropdownMenu anchorRef={btnRef} menuRef={menuRef} onClose={() => setOpen(false)}>
          {options.map((o) => (
            <OptionRow key={String(o.value)} opt={o} isSelected={String(o.value) === String(value)} onClick={() => choose(o.value)} />
          ))}
        </DropdownMenu>
      )}
    </>
  );
};
