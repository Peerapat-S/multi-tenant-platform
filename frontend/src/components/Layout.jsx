import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useToast } from './Toast.jsx';
import { request } from '../api.js';
import {
  StoreIcon,
  TagIcon,
  UserIcon,
  ShieldIcon,
  BoxIcon,
  SettingsIcon,
  LockIcon,
  LogOutIcon,
} from './Icons.jsx';

export default function Layout({ children }) {
  const { tenant, selectTenant, user, logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const fetchTenants = useCallback(() => {
    request('/tenants')
      .then((d) => {
        if (d?.items) {
          setTenants(d.items);
          // หาก tenant ปัจจุบันถูกลบไปแล้วหรือไม่เปิดใช้งาน ให้สลับไปแบรนด์แรกที่ใช้งานได้อัตโนมัติ
          if (d.items.length > 0 && !d.items.some((t) => t.slug === tenant)) {
            selectTenant(d.items[0].slug);
          }
        }
      })
      .catch(() => {});
  }, [tenant, selectTenant]);

  useEffect(() => {
    fetchTenants();
    window.addEventListener('tenants-updated', fetchTenants);
    return () => {
      window.removeEventListener('tenants-updated', fetchTenants);
    };
  }, [fetchTenants, location.pathname]);

  // แสดงเฉพาะแบรนด์ที่มีอยู่จริงในฐานข้อมูลเท่านั้น
  const options = tenants.length > 0 ? tenants : [{ slug: tenant, name: tenant }];

  const currentTenantObj = options.find((t) => t.slug === tenant);
  const currentTenantName = currentTenantObj ? currentTenantObj.name : tenant;

  function handleLogout() {
    const name = user?.name || 'ผู้ใช้';
    logout();
    navigate('/');
    toast.show({ type: 'info', title: 'ออกจากระบบแล้ว', message: `${name} ออกจากระบบเรียบร้อย` });
  }

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      <header className="topbar">
        <div className="topbar-main">
          <div className="topbar-left">
            <Link to="/" className="logo">
              <span className="logo-badge">
                <StoreIcon size={18} />
              </span>
              <span className="logo-text">Multi-tenant Store</span>
            </Link>

            {/* Super Admin mode badge หรือ brand selector */}
            {isSuperAdmin ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                fontSize: '0.82rem', fontWeight: 600,
                background: '#faf5ff', border: '1px solid #e9d5ff',
                padding: '0.3rem 0.75rem', borderRadius: '6px', color: '#7e22ce',
              }}>
                <ShieldIcon size={15} /> Super Admin Mode
              </span>
            ) : (
              <label className="brand-switch" title="สลับร้านค้า / แบรนด์">
                <TagIcon size={14} />
                <select value={tenant} onChange={(e) => selectTenant(e.target.value)}>
                  {options.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="topbar-right">
            <div className="session">
              {user ? (
                <>
                  <div className="user-badge" title={`เข้าสู่ระบบเป็น ${user.email}`}>
                    {isSuperAdmin ? (
                      <ShieldIcon size={16} />
                    ) : (
                      <UserIcon size={16} />
                    )}
                    <span>{user.name}</span>
                    <span className={`user-role-tag ${user.role}`}>
                      {isSuperAdmin ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Customer'}
                    </span>
                  </div>
                  <button
                    className="btn small ghost"
                    onClick={handleLogout}
                    title="ออกจากระบบ"
                  >
                    <LogOutIcon size={14} /> ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link className="btn small" to="/login">
                  <LockIcon size={14} /> เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </div>
        </div>

        <nav>
          {!isSuperAdmin && (
            <NavLink to="/" end>
              <StoreIcon size={16} /> ร้านค้า
            </NavLink>
          )}
          {user && !isSuperAdmin && (
            <NavLink to="/orders">
              <BoxIcon size={16} /> {user.role === 'admin' ? 'คำสั่งซื้อทั้งหมด' : 'คำสั่งซื้อของฉัน'}
            </NavLink>
          )}
          {user && (user.role === 'admin' || user.role === 'super_admin') && !isSuperAdmin && (
            <NavLink to="/admin">
              <SettingsIcon size={16} /> จัดการสินค้า
            </NavLink>
          )}
          {isSuperAdmin && (
            <NavLink to="/super-admin">
              <ShieldIcon size={16} /> จัดการแบรนด์ทั้งหมด
            </NavLink>
          )}
        </nav>
      </header>

      <main className="container">{children}</main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div>
            <span className="app-footer-brand">MULTI-TENANT PLATFORM</span>
            <span style={{ margin: '0 0.5rem', color: 'var(--slate-600)' }}>·</span>
            <span style={{ fontSize: '13px', color: 'var(--slate-400)' }}>
              {isSuperAdmin ? (
                <>Mode: <strong style={{ color: '#c084fc' }}>Super Admin</strong></>
              ) : (
                <>Brand: <strong style={{ color: '#ffffff' }}>{currentTenantName}</strong> ({tenant})</>
              )}
            </span>
          </div>
          <div className="app-footer-links">
            {!isSuperAdmin && (
              <>
                <Link to="/">ร้านค้า (Storefront)</Link>
                <Link to="/orders">คำสั่งซื้อ (Orders)</Link>
                <Link to="/admin">จัดการสินค้า (Admin)</Link>
              </>
            )}
            {isSuperAdmin && <Link to="/super-admin">จัดการแบรนด์</Link>}
          </div>
          <p className="app-footer-copy">
            Enterprise Multi-tenant Platform. Isolated Row-level Tenant Architecture.
          </p>
        </div>
      </footer>
    </>
  );
}
