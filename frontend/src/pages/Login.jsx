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

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>เข้าสู่ระบบ</h1>
      <p className="muted">แบรนด์: {tenant}</p>

      <label>
        อีเมล
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </label>
      <label>
        รหัสผ่าน
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>

      {error && <p className="error">{error}</p>}

      <button className="btn" disabled={busy}>
        {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>

      <p className="muted hint">
        ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
      </p>

      {import.meta.env.DEV && (
        <p className="muted hint">
          (dev) admin: admin@{tenant}.com / Admin1234
        </p>
      )}
    </form>
  );
}