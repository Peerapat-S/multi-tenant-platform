import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { tenant, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? location.state?.from || '/admin' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function fillDevAdmin() {
    setEmail(`admin@${tenant}.com`);
    setPassword('Admin1234');
    setError('');
  }

  return (
    <form className="card form narrow" onSubmit={submit}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>🔐</div>
        <h1>เข้าสู่ระบบ</h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
          <span className="badge">🏬 แบรนด์: {tenant}</span>
        </div>
      </div>

      <label>
        อีเมล
        <input
          type="email"
          placeholder="yourname@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>

      <label>
        รหัสผ่าน
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && (
        <div className="notice" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)', padding: '0.65rem 0.85rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <button className="btn" disabled={busy} style={{ width: '100%', marginTop: '0.25rem' }}>
        <span>🚀</span> {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <p className="muted hint">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            สมัครสมาชิกใหม่ ✨
          </Link>
        </p>
      </div>

      {import.meta.env.DEV && (
        <div
          onClick={fillDevAdmin}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--primary-lighter)',
            border: '1px dashed var(--primary-border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: '0.82rem',
            transition: 'var(--ease)',
          }}
          title="คลิกเพื่อกรอกข้อมูลผู้ดูแลระบบจำลองทันที"
        >
          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem' }}>
            ⚡ กรอกข้อมูลผู้ดูแล (Dev Auto-fill)
          </div>
          <code style={{ color: 'var(--text-secondary)' }}>admin@{tenant}.com / Admin1234</code>
        </div>
      )}
    </form>
  );
}
