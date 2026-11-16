import { useEffect, useState } from 'react';
import { request, formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProductImage from '../components/ProductImage.jsx';

const LIMIT = 12;

export default function Storefront() {
  const { tenant } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    // ดูสินค้าเป็นสาธารณะ ไม่ต้องส่ง token
    request(`/products?page=${page}&limit=${LIMIT}`, { tenant })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tenant, page]);

  const items = data?.items ?? [];

  return (
    <section>
      <h1>สินค้าของแบรนด์ {tenant}</h1>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">กำลังโหลด...</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">ยังไม่มีสินค้าในแบรนด์นี้</p>
      )}

      <div className="grid">
        {items.map((p) => (
          <article key={p.id} className="card product">
            <ProductImage product={p} />
            <h3>{p.name}</h3>
            {p.description && <p className="muted">{p.description}</p>}
            <div className="meta">
              <strong>{formatPrice(p.price)}</strong>
              {p.stock > 0 ? (
                <span className="badge">เหลือ {p.stock}</span>
              ) : (
                <span className="badge out">สินค้าหมด</span>
              )}
            </div>
          </article>
        ))}
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