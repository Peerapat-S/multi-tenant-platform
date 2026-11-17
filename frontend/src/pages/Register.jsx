import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { UserIcon, TagIcon, AlertIcon } from '../components/Icons.jsx';

export default function Register() {
  const { tenant, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');

    setBusy(true);
    try {
      await register({ name, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      // 409 = อีเมลนี้ถูกใช้แล้วในแบรนด์นี้
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card form narrow" onSubmit={submit}>
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(229, 9, 20, 0.15)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
          <UserIcon size={26} />
        </div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>สมัครสมาชิก</h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
          <span className="badge">
            <TagIcon size={12} /> แบรนด์: {tenant}
          </span>
        </div>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.45rem' }}>
          บัญชีของคุณจะผูกกับร้านค้านี้โดยเฉพาะ
        </p>
      </div>

      <label>
        ชื่อ - นามสกุล หรือชื่อเล่น
        <input
          placeholder="เช่น สมชาย ใจดี"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </label>

      <label>
        อีเมล
        <input
          type="email"
          placeholder="yourname@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label>
        รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
        <input
          type="password"
          placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
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
        <UserIcon size={15} /> {busy ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิกทันที'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <p className="muted hint">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </form>
  );
}
