import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { request } from '../api.js';

export default function Layout({ children }) {
  const { tenant, selectTenant, user, logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    request('/tenants')
      .then((d) => !cancelled && setTenants(d.items))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const options = tenants.some((t) => t.slug === tenant)
    ? tenants
    : [{ slug: tenant, name: tenant }, ...tenants];

  return (
    <>
      <header className="topbar">
        <Link to="/" className="logo">
          Multi-tenant Store
        </Link>

        <label className="brand-switch">
          แบรนด์
          <select value={tenant} onChange={(e) => selectTenant(e.target.value)}>
            {options.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <nav>
          <NavLink to="/" end>
            ร้านค้า
          </NavLink>
          <NavLink to="/admin">จัดการสินค้า</NavLink>
        </nav>

        <div className="session">
          {user ? (
            <>
              <span>
                {user.name} ({user.role})
              </span>
              <button
                className="btn small"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link className="btn small" to="/login">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}