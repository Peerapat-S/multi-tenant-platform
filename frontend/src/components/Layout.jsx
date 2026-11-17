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

  const currentTenantObj = options.find((t) => t.slug === tenant);
  const currentTenantName = currentTenantObj ? currentTenantObj.name : tenant;

  return (
    <>
      <header className="topbar">
        <div className="topbar-main">
          <div className="topbar-left">
            <Link to="/" className="logo">
              <span className="logo-badge">🏬</span>
              <span className="logo-text">Multi-tenant Store</span>
            </Link>

            <label className="brand-switch" title="สลับร้านค้า / แบรนด์">
              <span>🏷️</span>
              <select value={tenant} onChange={(e) => selectTenant(e.target.value)}>
                {options.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="topbar-right">
            <div className="session">
              {user ? (
                <>
                  <div className="user-badge" title={`เข้าสู่ระบบเป็น ${user.email}`}>
                    <span>{user.role === 'admin' ? '👑' : '👤'}</span>
                    <span>{user.name}</span>
                    <span className={`user-role-tag ${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 'Customer'}
                    </span>
                  </div>
                  <button
                    className="btn small ghost"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="ออกจากระบบ"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link className="btn small" to="/login">
                  <span>🔐</span> เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        </div>

        <nav>
          <NavLink to="/" end>
            <span>🛍️</span> ร้านค้า
          </NavLink>
          {user && (
            <NavLink to="/orders">
              <span>📦</span> {user.role === 'admin' ? 'คำสั่งซื้อทั้งหมด' : 'คำสั่งซื้อของฉัน'}
            </NavLink>
          )}
          <NavLink to="/admin">
            <span>⚙️</span> จัดการสินค้า
          </NavLink>
        </nav>
      </header>

      <main className="container">{children}</main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div>
            <span className="app-footer-brand">SHOPIFY MULTI-TENANT</span>
            <span style={{ margin: '0 0.5rem', color: 'var(--shade-60)' }}>·</span>
            <span style={{ fontSize: '13px', color: 'var(--shade-40)' }}>
              Brand: <strong style={{ color: 'var(--on-primary)' }}>{currentTenantName}</strong> ({tenant})
            </span>
          </div>
          <div className="app-footer-links">
            <Link to="/">ร้านค้า (Storefront)</Link>
            <Link to="/orders">คำสั่งซื้อ (Orders)</Link>
            <Link to="/admin">จัดการสินค้า (Admin)</Link>
          </div>
          <p className="app-footer-copy">
            © 2026 Shopify Design Language · Cinematic marketing & cream transactional surfaces.
          </p>
        </div>
      </footer>
    </>
  );
}
