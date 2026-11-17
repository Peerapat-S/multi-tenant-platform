import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/Toast.jsx';
import ProductForm from '../components/ProductForm.jsx';
import ProductImage from '../components/ProductImage.jsx';
import {
  SettingsIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BoxIcon,
  CheckIcon,
  AlertIcon,
  XIcon,
} from '../components/Icons.jsx';

const LIMIT = 10;

// Confirm Dialog (Cinema Dark Theme)
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#181818', borderRadius: '12px', padding: '2rem',
          maxWidth: '420px', width: 'calc(100% - 2rem)',
          border: '1px solid #2E2E2E',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--danger)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--danger-bg)', display: 'grid', placeItems: 'center' }}>
            <TrashIcon size={24} />
          </div>
        </div>
        <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#FFFFFF' }}>ยืนยันการลบสินค้า</h3>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn ghost" onClick={onCancel} style={{ flex: 1 }}>ยกเลิก</button>
          <button className="btn" style={{ background: 'var(--danger)', color: '#FFFFFF', flex: 1 }} onClick={onConfirm}>
            <TrashIcon size={14} /> ลบสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { call, tenant } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await call(`/products?page=${page}&limit=${LIMIT}`);
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [call, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(payload) {
    const isNew = editing === 'new';
    try {
      if (isNew) {
        await call('/products', { method: 'POST', body: payload });
        toast.show({ type: 'success', title: 'เพิ่มสินค้าสำเร็จ', message: `"${payload.name}" ถูกเพิ่มในร้านค้าแล้ว` });
      } else {
        await call(`/products/${editing.id}`, { method: 'PUT', body: payload });
        toast.show({ type: 'success', title: 'แก้ไขสินค้าสำเร็จ', message: `"${payload.name}" ถูกอัปเดตแล้ว` });
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast.show({ type: 'error', title: isNew ? 'เพิ่มสินค้าไม่สำเร็จ' : 'แก้ไขสินค้าไม่สำเร็จ', message: err.message });
    }
  }

  async function remove(p) {
    setConfirmDelete(p);
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    try {
      await call(`/products/${confirmDelete.id}`, { method: 'DELETE' });
      toast.show({ type: 'success', title: 'ลบสินค้าสำเร็จ', message: `"${confirmDelete.name}" ถูกลบออกแล้ว` });
      setConfirmDelete(null);
      if (items.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      toast.show({ type: 'error', title: 'ลบไม่สำเร็จ', message: err.message });
      setConfirmDelete(null);
    }
  }

  // Quick stats summary
  const stats = useMemo(() => {
    const total = items.length;
    const inStock = items.filter((p) => p.stock > 5).length;
    const lowStock = items.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = items.filter((p) => p.stock === 0).length;
    return { total, inStock, lowStock, outOfStock };
  }, [items]);

  return (
    <section>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
      <div className="bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <SettingsIcon size={22} />
            <h1>จัดการสินค้า ({tenant})</h1>
          </div>
          <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
            เพิ่ม ลบ แก้ไข ข้อมูลสินค้าและสต็อกสำหรับแบรนด์นี้โดยเฉพาะ
          </p>
        </div>
        {!editing && (
          <button className="btn" onClick={() => setEditing('new')}>
            <PlusIcon size={16} /> เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

      {/* Quick stats grid */}
      {!editing && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <BoxIcon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">รายการในหน้านี้</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }}>
              <CheckIcon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.inStock}</span>
              <span className="stat-label">สต็อกพร้อมขาย</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning-border)' }}>
              <AlertIcon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.lowStock}</span>
              <span className="stat-label">สินค้าใกล้หมด</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
              <XIcon size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.outOfStock}</span>
              <span className="stat-label">สินค้าหมด</span>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <ProductForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {error && (
        <div className="notice" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)', marginBottom: '1.25rem' }}>
          <AlertIcon size={18} />
          <span>{error}</span>
        </div>
      )}
      {loading && <p className="muted">กำลังโหลดข้อมูลสินค้า...</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>รูป</th>
              <th>ชื่อสินค้า</th>
              <th className="num">ราคา</th>
              <th className="num">สต็อก</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <ProductImage product={p} small />
                </td>
                <td>
                  <strong>{p.name}</strong>
                  {p.description && (
                    <div className="muted" style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>
                      {p.description}
                    </div>
                  )}
                </td>
                <td className="num">{formatPrice(p.price)}</td>
                <td className="num">
                  {p.stock === 0 ? (
                    <span className="badge out">หมด</span>
                  ) : p.stock <= 5 ? (
                    <span className="badge low">คงเหลือ {p.stock}</span>
                  ) : (
                    <span className="badge">มี {p.stock}</span>
                  )}
                </td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => setEditing(p)} title="แก้ไข">
                    <EditIcon size={13} /> แก้ไข
                  </button>
                  <button className="btn small danger" onClick={() => remove(p)} title="ลบ">
                    <TrashIcon size={13} /> ลบ
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                    <BoxIcon size={36} />
                  </div>
                  <div className="muted">ยังไม่มีสินค้าในร้านค้านี้ คลิกปุ่ม "+ เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn small ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ก่อนหน้า
        </button>
        <span className="pager-indicator">หน้า {page}</span>
        <button className="btn small ghost" disabled={items.length < LIMIT} onClick={() => setPage((p) => p + 1)}>
          ถัดไป
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`ลบสินค้า "${confirmDelete.name}" ออกจากร้านค้า ใช่หรือไม่? ข้อมูลสต็อกและรายการจะถูกลบอย่างถาวร`}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </section>
  );
}
