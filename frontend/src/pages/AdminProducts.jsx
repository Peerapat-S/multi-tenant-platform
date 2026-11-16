import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProductForm from '../components/ProductForm.jsx';

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

  return (
    <section>
      <div className="bar">
        <h1>จัดการสินค้า ({tenant})</h1>
        {!editing && (
          <button className="btn" onClick={() => setEditing('new')}>
            + เพิ่มสินค้า
          </button>
        )}
      </div>

      {editing && (
        <ProductForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">กำลังโหลด...</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ชื่อสินค้า</th>
              <th className="num">ราคา</th>
              <th className="num">สต็อก</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="num">{formatPrice(p.price)}</td>
                <td className="num">{p.stock}</td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => setEditing(p)}>
                    แก้ไข
                  </button>
                  <button className="btn small danger" onClick={() => remove(p)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="4" className="muted">
                  ยังไม่มีสินค้า
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
        <span>หน้า {page}</span>
        <button className="btn small ghost" disabled={items.length < LIMIT} onClick={() => setPage((p) => p + 1)}>
          ถัดไป
        </button>
      </div>
    </section>
  );
}