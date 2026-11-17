import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckIcon, XIcon, AlertIcon, ClockIcon } from './Icons.jsx';

const ToastContext = createContext(null);

const COLORS = {
  success: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', icon: <CheckIcon size={18} /> },
  error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: <AlertIcon size={18} /> },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: <AlertIcon size={18} /> },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: <AlertIcon size={18} /> },
  loading: { bg: '#f8fafc', border: '#e2e8f0', color: '#334155', icon: <ClockIcon size={18} /> },
};

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback(
    ({ message, type = 'info', duration = 3500, title }) => {
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, message, type, title, leaving: false }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          pointerEvents: 'none',
          maxWidth: '380px',
          width: 'calc(100vw - 3rem)',
        }}
      >
        {toasts.map((toast) => {
          const c = COLORS[toast.type] || COLORS.info;
          return (
            <div
              key={toast.id}
              onClick={() => dismiss(toast.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                pointerEvents: 'all',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: toast.leaving ? 'translateX(110%) scale(0.95)' : 'translateX(0) scale(1)',
                opacity: toast.leaving ? 0 : 1,
                animation: toast.leaving ? 'none' : 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                userSelect: 'none',
              }}
            >
              <div style={{ color: c.color, flexShrink: 0, marginTop: '1px' }}>
                {c.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: c.color, marginBottom: '0.15rem' }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: c.color, fontWeight: 400, lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: c.color,
                  opacity: 0.6,
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                title="ปิด"
              >
                <XIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(110%) scale(0.95); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
