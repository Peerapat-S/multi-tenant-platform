import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProductForm from '../components/ProductForm.jsx';
import ProductImage from '../components/ProductImage.jsx';

const LIMIT = 10;

export default function AdminProducts() {
  const { call, tenant } = useAuth();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product

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
    if (editing === 'new') {
      await call('/products', { method: 'POST', body: payload });
    } else {
      await call(`/products/${editing.id}`, { method: 'PUT', body: payload });
    }
    setEditing(null);
    await load();
  }

  async function remove(p) {
    if (!window.confirm(`ลบสินค้า "${p.name}" ใช่หรือไม่?`)) return;
    try {
      await call(`/products/${p.id}`, { method: 'DELETE' });
      if (items.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setError(err.message);
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
      <div className="bar">
        <div>
          <h1>⚙️ จัดการสินค้า ({tenant})</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            เพิ่ม ลบ แก้ไข ข้อมูลสินค้าและสต็อกสำหรับแบรนด์นี้โดยเฉพาะ
          </p>
        </div>
        {!editing && (
          <button className="btn" onClick={() => setEditing('new')}>
            <span>✨</span> + เพิ่มสินค้าใหม่
          </button>
        )}
      </div>

      {/* Quick stats grid */}
      {!editing && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">รายการในหน้านี้</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              ✅
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.inStock}</span>
              <span className="stat-label">สต็อกพร้อมขาย</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              ⚡
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.lowStock}</span>
              <span className="stat-label">สินค้าใกล้หมด</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              ❌
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
          <span>⚠️</span> {error}
        </div>
      )}
      {loading && <p className="muted">⏳ กำลังโหลดข้อมูลสินค้า...</p>}

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
                    <span className="badge low">⚡ {p.stock}</span>
                  ) : (
                    <span className="badge">{p.stock}</span>
                  )}
                </td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => setEditing(p)} title="แก้ไข">
                    ✏️ แก้ไข
                  </button>
                  <button className="btn small danger" onClick={() => remove(p)} title="ลบ">
                    🗑️ ลบ
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <div className="muted">ยังไม่มีสินค้าในร้านค้านี้ คลิกปุ่ม "+ เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn small ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ← ก่อนหน้า
        </button>
        <span className="pager-indicator">หน้า {page}</span>
        <button className="btn small ghost" disabled={items.length < LIMIT} onClick={() => setPage((p) => p + 1)}>
          ถัดไป →
        </button>
      </div>
    </section>
  );
}
