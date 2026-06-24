import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const OptionRow = ({ opt, isSelected, highlighted, onClick, onMouseEnter }) => (
  <div
    role="option"
    aria-selected={isSelected}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', cursor: 'pointer', background: highlighted ? 'rgba(255,255,255,0.08)' : 'transparent' }}
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
export const DropdownMenu = ({ anchorRef, onClose, children, menuRef, role }) => {
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
      role={role}
      className="glass-panel"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999, maxHeight: 260, overflowY: 'auto', padding: '6px', border: '1px solid var(--border-light)', background: '#1a1c2c', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
    >
      {children}
    </div>,
    document.body
  );
};

// Спільна клавіатурна навігація для всіх наших дропдаунів (listbox-патерн)
export const useListboxKeyboard = ({ length, open, setOpen, onChoose, getInitialIndex, anchorRef }) => {
  const [hi, setHi] = useState(-1);
  useEffect(() => {
    setHi(open ? (getInitialIndex ? getInitialIndex() : 0) : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHi((h) => (h + 1) % length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHi((h) => (h - 1 + length) % length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (hi >= 0) onChoose(hi);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        anchorRef?.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };
  return { hi, setHi, onKeyDown };
};

// Прокрутити підсвічений рядок у видиму область
export const useScrollHighlighted = (menuRef, hi, open) => {
  useEffect(() => {
    if (open && hi >= 0 && menuRef.current?.children[hi]) {
      menuRef.current.children[hi].scrollIntoView({ block: 'nearest' });
    }
  }, [hi, open, menuRef]);
};

// Переносний кастомний дропдаун (заміна нативного <select>).
// options: [{ value, label, icon? }]
export const Select = ({ options = [], value, onChange, placeholder = 'Select...', accent = 'var(--border-light)' }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
  const selected = options[selectedIndex];

  const choose = (v) => { onChange(v); setOpen(false); btnRef.current?.focus(); };
  const { hi, setHi, onKeyDown } = useListboxKeyboard({
    length: options.length,
    open,
    setOpen,
    anchorRef: btnRef,
    getInitialIndex: () => (selectedIndex >= 0 ? selectedIndex : 0),
    onChoose: (i) => choose(options[i].value),
  });
  useScrollHighlighted(menuRef, hi, open);

  return (
    <>
      <div
        ref={btnRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className="glass-panel"
        style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: `1px solid ${accent}`, background: 'rgba(0,0,0,0.2)' }}
      >
        {selected?.icon}
        <span style={{ flex: 1, textAlign: 'left', color: selected ? 'var(--text-main)' : 'var(--text-muted)' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-muted)" />
      </div>

      {open && (
        <DropdownMenu anchorRef={btnRef} menuRef={menuRef} onClose={() => setOpen(false)} role="listbox">
          {options.map((o, i) => (
            <OptionRow
              key={String(o.value)}
              opt={o}
              isSelected={String(o.value) === String(value)}
              highlighted={i === hi}
              onMouseEnter={() => setHi(i)}
              onClick={() => choose(o.value)}
            />
          ))}
        </DropdownMenu>
      )}
    </>
  );
};
