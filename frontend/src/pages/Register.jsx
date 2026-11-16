import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

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
      <h1>สมัครสมาชิก</h1>
      <p className="muted">แบรนด์: {tenant} (บัญชีใช้ได้เฉพาะแบรนด์นี้)</p>

      <label>
        ชื่อ
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>
        อีเมล
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>

      {error && <p className="error">{error}</p>}

      <button className="btn" disabled={busy}>
        {busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
      </button>

      <p className="muted hint">
        มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
      </p>
    </form>
  );
}