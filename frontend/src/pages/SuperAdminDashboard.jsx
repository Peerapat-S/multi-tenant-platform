import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/Toast.jsx';
import {
  ShieldIcon,
  StoreIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  UsersIcon,
  BoxIcon,
  CartIcon,
  PauseIcon,
  PlayIcon,
  AlertIcon,
  UserIcon,
} from '../components/Icons.jsx';

// ---- Confirm Dialog ----
function ConfirmDialog({ message, onConfirm, onCancel, danger = false }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#181818',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '420px',
          width: 'calc(100% - 2rem)',
          border: '1px solid #2B2B2B',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: danger ? 'var(--danger)' : 'var(--primary)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: danger ? 'var(--danger-bg)' : 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
            {danger ? <TrashIcon size={24} /> : <AlertIcon size={24} />}
          </div>
        </div>
        <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#FFFFFF' }}>ยืนยันการดำเนินการ</h3>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn ghost" onClick={onCancel} style={{ flex: 1 }}>ยกเลิก</button>
          <button
            className={`btn ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
            style={{
              flex: 1,
              ...(danger ? { background: 'var(--danger)', color: '#FFFFFF', border: 'none' } : {}),
            }}
          >
            {danger ? <><TrashIcon size={14} /> ลบ</> : <><CheckIcon size={14} /> ยืนยัน</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Brand Form Modal ----
function BrandFormModal({ initial, onSave, onClose, busy }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  function slugify(text) {
    return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function handleNameChange(v) {
    setName(v);
    if (autoSlug && !isEdit) setSlug(slugify(v));
  }

  function handleSlugChange(v) {
    setAutoSlug(false);
    setSlug(slugify(v));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { name, description };
    if (!isEdit) {
      payload.slug = slug;
      if (adminEmail) {
        payload.adminEmail = adminEmail;
        payload.adminPassword = adminPassword;
        payload.adminName = adminName || `Admin ${name}`;
      }
    } else {
      payload.isActive = initial.isActive;
    }
    onSave(payload);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#181818',
          borderRadius: '14px',
          padding: '2rem',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #2B2B2B',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: 52, height: 52, borderRadius: '50%', background: 'rgba(229, 9, 20, 0.15)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
            {isEdit ? <EditIcon size={24} /> : <StoreIcon size={24} />}
          </div>
          <h2 style={{ margin: 0, color: '#FFFFFF' }}>{isEdit ? 'แก้ไขข้อมูลแบรนด์' : 'สร้างแบรนด์ใหม่'}</h2>
          {!isEdit && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              กรอกข้อมูลเพื่อสร้างร้านค้าใหม่ในระบบ
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            ชื่อแบรนด์ <span style={{ color: 'var(--danger)' }}>*</span>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="เช่น Nike Thailand, Brand C"
              required
              autoFocus
            />
          </label>

          {!isEdit && (
            <label>
              Slug (URL ของแบรนด์) <span style={{ color: 'var(--danger)' }}>*</span>
              <input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="เช่น nike-thailand, brand-c"
                pattern="[a-z0-9][a-z0-9\-]{0,48}[a-z0-9]"
                required
              />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                ตัวพิมพ์เล็ก, ตัวเลข และ "-" เท่านั้น (ใช้เป็น X-Tenant-ID)
              </span>
            </label>
          )}

          <label>
            คำอธิบายแบรนด์
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายเกี่ยวกับแบรนด์นี้ จะแสดงในหน้าหลักของร้านค้า..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </label>

          {!isEdit && (
            <>
              <div style={{
                borderTop: '1px solid #2B2B2B',
                paddingTop: '1rem',
                marginTop: '0.25rem',
              }}>
                <div style={{
                  fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)',
                  marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <UserIcon size={14} /> Admin ประจำแบรนด์ (ไม่บังคับ)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label>
                    ชื่อ Admin
                    <input value={adminName} onChange={(e) => setAdminName(e.target.value)}
                      placeholder={`Admin ${name || '...'}`} />
                  </label>
                  <label>
                    อีเมล Admin
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@brand.com" />
                  </label>
                  <label>
                    รหัสผ่าน Admin
                    <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="อย่างน้อย 8 ตัวอักษร" />
                  </label>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn ghost" onClick={onClose} style={{ flex: 1 }}>
              ยกเลิก
            </button>
            <button type="submit" className="btn" disabled={busy} style={{ flex: 2 }}>
              {busy ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'สร้างแบรนด์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Users List Modal ----
function UsersModal({ brand, onClose }) {
  const { call } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    call(`/tenants/${brand.id}/users`, { noTenant: true })
      .then((d) => !cancelled && setUsers(d.items || []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [brand.id, call]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#181818',
          borderRadius: '14px',
          padding: '2rem',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #2B2B2B',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #2B2B2B', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UsersIcon size={20} /> ผู้ใช้ใน {brand.name}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ทั้งหมด {users.length} บัญชี</span>
          </div>
          <button className="btn small ghost" onClick={onClose} style={{ padding: '4px 12px' }}>
            ปิด
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, maxHeight: '55vh' }}>
          {loading && <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดรายชื่อผู้ใช้...</p>}
          {error && <div className="notice" style={{ background: 'var(--danger-bg)', color: '#FF5A5F' }}>{error}</div>}
          {!loading && !error && users.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>ยังไม่มีผู้ใช้ในแบรนด์นี้</p>
          )}
          {!loading && !error && users.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 0.5rem',
                borderBottom: '1px solid #262626',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.92rem' }}>{u.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{u.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`user-role-tag ${u.role}`}>
                  {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Customer'}
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {new Date(u.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Main SuperAdmin Dashboard ----
export default function SuperAdminDashboard() {
  const { call } = useAuth();
  const toast = useToast();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewUsersTarget, setViewUsersTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call('/tenants/all', { noTenant: true });
      setBrands(data.items);
    } catch (err) {
      toast.show({ type: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(payload) {
    setBusy(true);
    try {
      const result = await call('/tenants', { method: 'POST', body: payload, noTenant: true });
      toast.show({ type: 'success', title: 'สร้างแบรนด์สำเร็จ', message: `แบรนด์ "${result.tenant.name}" ถูกสร้างเรียบร้อยแล้ว` });
      setShowForm(false);
      window.dispatchEvent(new Event('tenants-updated'));
      await load();
    } catch (err) {
      toast.show({ type: 'error', title: 'สร้างแบรนด์ไม่สำเร็จ', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(payload) {
    setBusy(true);
    try {
      await call(`/tenants/${editTarget.id}`, { method: 'PATCH', body: payload, noTenant: true });
      toast.show({ type: 'success', title: 'แก้ไขสำเร็จ', message: `ข้อมูลแบรนด์ "${editTarget.name}" ถูกอัปเดตแล้ว` });
      setEditTarget(null);
      window.dispatchEvent(new Event('tenants-updated'));
      await load();
    } catch (err) {
      toast.show({ type: 'error', title: 'แก้ไขไม่สำเร็จ', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(brand) {
    setBusy(true);
    try {
      await call(`/tenants/${brand.id}`, {
        method: 'PATCH',
        body: { isActive: !brand.isActive },
        noTenant: true,
      });
      toast.show({
        type: brand.isActive ? 'warning' : 'success',
        title: brand.isActive ? 'ปิดใช้งานแบรนด์' : 'เปิดใช้งานแบรนด์',
        message: `แบรนด์ "${brand.name}" ถูก${brand.isActive ? 'ปิด' : 'เปิด'}ใช้งานแล้ว`,
      });
      window.dispatchEvent(new Event('tenants-updated'));
      await load();
    } catch (err) {
      toast.show({ type: 'error', title: 'เกิดข้อผิดพลาด', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await call(`/tenants/${confirmDelete.id}`, { method: 'DELETE', noTenant: true });
      toast.show({ type: 'success', title: 'ลบแบรนด์สำเร็จ', message: `แบรนด์ "${confirmDelete.name}" ถูกลบออกจากระบบแล้ว` });
      setConfirmDelete(null);
      window.dispatchEvent(new Event('tenants-updated'));
      await load();
    } catch (err) {
      toast.show({ type: 'error', title: 'ลบไม่สำเร็จ', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => b.isActive).length;
  const totalUsers = brands.reduce((s, b) => s + (b.userCount || 0), 0);
  const totalOrders = brands.reduce((s, b) => s + (b.orderCount || 0), 0);

  return (
    <section>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .brand-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .brand-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.6); transform: translateY(-2px); border-color: #404040; }
        .inactive-brand { opacity: 0.5; }
      `}</style>

      {/* Header */}
      <div className="hero-banner" style={{ marginBottom: '2rem' }}>
        <div className="hero-content">
          <div className="hero-tag">Platform Administration</div>
          <h1 className="hero-title">Super Admin Dashboard</h1>
          <p className="hero-subtitle">
            จัดการทุกแบรนด์ในแพลตฟอร์มจากจุดเดียว — เพิ่ม แก้ไข ปิด/เปิด และลบแบรนด์
          </p>
          <button className="btn outline-dark" onClick={() => setShowForm(true)}>
            <PlusIcon size={16} /> สร้างแบรนด์ใหม่
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { icon: <StoreIcon size={20} />, value: totalBrands, label: 'แบรนด์ทั้งหมด' },
          { icon: <CheckIcon size={20} />, value: activeBrands, label: 'แบรนด์ที่เปิดใช้งาน', color: 'success' },
          { icon: <UsersIcon size={20} />, value: totalUsers, label: 'ผู้ใช้งานทั้งหมด' },
          { icon: <CartIcon size={20} />, value: totalOrders, label: 'คำสั่งซื้อทั้งหมด' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={s.color ? { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' } : {}}>
              {s.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? '…' : s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid">
          {[1, 2, 3].map((n) => <div key={n} className="skeleton-card skeleton" />)}
        </div>
      ) : brands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <StoreIcon size={28} />
          </div>
          <h3 className="empty-title">ยังไม่มีแบรนด์ในระบบ</h3>
          <p className="empty-desc">เริ่มต้นสร้างแบรนด์แรกของแพลตฟอร์มได้เลย</p>
          <button className="btn" onClick={() => setShowForm(true)}>
            <PlusIcon size={14} /> สร้างแบรนด์แรก
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))', gap: '1.25rem' }}>
          {brands.map((brand) => (
            <div
              key={brand.id}
              className={`card brand-card ${!brand.isActive ? 'inactive-brand' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.5rem' }}
            >
              {/* Brand Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#FFFFFF' }}>{brand.name}</h3>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '0.72rem', fontWeight: 700,
                      background: brand.isActive ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: brand.isActive ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${brand.isActive ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    }}>
                      {brand.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                  <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#242424', padding: '2px 6px', borderRadius: '4px', marginTop: '0.25rem', display: 'inline-block' }}>
                    {brand.slug}
                  </code>
                </div>
              </div>

              {/* Description */}
              {brand.description ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                  {brand.description}
                </p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', margin: 0 }}>
                  ยังไม่มีคำอธิบายแบรนด์ — คลิกแก้ไขเพื่อเพิ่ม
                </p>
              )}

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #2B2B2B' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <BoxIcon size={16} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{brand.productCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>สินค้า</div>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    flex: 1,
                    cursor: 'pointer',
                    borderRadius: '6px',
                    padding: '3px 0',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'var(--ease)',
                  }}
                  onClick={() => setViewUsersTarget(brand)}
                  title="คลิกเพื่อดูรายชื่อผู้ใช้ทั้งหมดในแบรนด์นี้"
                >
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary)', marginBottom: '0.2rem' }}>
                    <UsersIcon size={16} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{brand.userCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ผู้ใช้ (คลิกดู)</div>
                </div>

                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <CartIcon size={16} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF' }}>{brand.orderCount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ออร์เดอร์</div>
                </div>
              </div>

              {/* Created At */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                สร้างเมื่อ {new Date(brand.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <button className="btn small ghost" onClick={() => setEditTarget(brand)} disabled={busy}>
                  <EditIcon size={13} /> แก้ไข
                </button>
                <button
                  className="btn small ghost"
                  onClick={() => handleToggleActive(brand)}
                  disabled={busy}
                  style={{
                    color: brand.isActive ? 'var(--warning)' : 'var(--success)',
                    borderColor: brand.isActive ? 'var(--warning-border)' : 'var(--success-border)',
                  }}
                >
                  {brand.isActive ? <><PauseIcon size={13} /> ปิดใช้งาน</> : <><PlayIcon size={13} /> เปิดใช้งาน</>}
                </button>
                <button
                  className="btn small danger"
                  onClick={() => setConfirmDelete(brand)}
                  disabled={busy}
                >
                  <TrashIcon size={13} /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <BrandFormModal onSave={handleCreate} onClose={() => setShowForm(false)} busy={busy} />
      )}
      {editTarget && (
        <BrandFormModal initial={editTarget} onSave={handleUpdate} onClose={() => setEditTarget(null)} busy={busy} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={`ลบแบรนด์ "${confirmDelete.name}" จะลบข้อมูลทั้งหมด (สินค้า คำสั่งซื้อ ผู้ใช้) ออกจากระบบอย่างถาวร`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {viewUsersTarget && (
        <UsersModal brand={viewUsersTarget} onClose={() => setViewUsersTarget(null)} />
      )}
    </section>
  );
}
