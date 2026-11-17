import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { LockIcon, ShieldIcon, AlertIcon, TagIcon, UserIcon } from '../components/Icons.jsx';

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
      if (user.role === 'super_admin') {
        navigate('/super-admin', { replace: true });
      } else {
        navigate(user.role === 'admin' ? location.state?.from || '/admin' : '/', { replace: true });
      }
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

  function fillSuperAdmin() {
    setEmail('superadmin@platform.com');
    setPassword('Admin1234');
    setError('');
  }

  return (
    <form className="card form narrow" onSubmit={submit}>
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(229, 9, 20, 0.15)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
          <LockIcon size={26} />
        </div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>เข้าสู่ระบบ</h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
          <span className="badge">
            <TagIcon size={12} /> แบรนด์: {tenant}
          </span>
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
        <div className="notice" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: '#FF5A5F', padding: '0.65rem 0.85rem' }}>
          <AlertIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      <button className="btn" disabled={busy} style={{ width: '100%', marginTop: '0.25rem' }}>
        <LockIcon size={15} /> {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <p className="muted hint">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            สมัครสมาชิกใหม่
          </Link>
        </p>
      </div>

      {import.meta.env.DEV && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            onClick={fillDevAdmin}
            style={{
              padding: '0.65rem 0.85rem',
              background: '#222222',
              border: '1px dashed #3D3D3D',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.82rem',
              transition: 'var(--ease)',
            }}
            title="คลิกเพื่อกรอกข้อมูลผู้ดูแลระบบจำลองทันที"
          >
            <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <UserIcon size={13} /> ผู้ดูแลระบบ (Dev Auto-fill)
            </div>
            <code style={{ color: 'var(--text-secondary)' }}>admin@{tenant}.com / Admin1234</code>
          </div>

          <div
            onClick={fillSuperAdmin}
            style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(70, 211, 105, 0.08)',
              border: '1px dashed rgba(70, 211, 105, 0.35)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.82rem',
              transition: 'var(--ease)',
            }}
            title="คลิกเพื่อกรอกข้อมูล Super Admin"
          >
            <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <ShieldIcon size={13} /> Super Admin Auto-fill
            </div>
            <code style={{ color: '#88E09D' }}>superadmin@platform.com / Admin1234</code>
          </div>
        </div>
      )}
    </form>
  );
}
