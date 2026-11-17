import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';
import ProductImage from '../components/ProductImage.jsx';
import BuyBox from '../components/BuyBox.jsx';

const LIMIT = 12;

export default function Storefront() {
  const { tenant, user } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');

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
  }, [tenant, page, reload]);

  const rawItems = data?.items ?? [];

  const items = useMemo(() => {
    if (!search.trim()) return rawItems;
    const q = search.trim().toLowerCase();
    return rawItems.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [rawItems, search]);

  return (
    <section>
      {/* Shopify Cinematic Marketing Track (Hero Banner) */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-tag">
            <span>●</span> Shopify Platform · {tenant.toUpperCase()}
          </div>
          <h1 className="hero-title">
            The platform commerce is built on.
          </h1>
          <p className="hero-subtitle">
            สถาปัตยกรรม Multi-tenant ระดับโลก แยกสินค้า ลูกค้า และคำสั่งซื้อของแบรนด์ <strong style={{ color: 'var(--on-primary)' }}>{tenant}</strong> อย่างเป็นอิสระ พร้อมระบบสต็อกเรียลไทม์
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="#product-grid" className="btn outline-dark">
              สำรวจแคตตาล็อกสินค้า
            </a>
          </div>
        </div>
      </div>

      {/* Control / Search Bar */}
      <div className="bar" id="product-grid">
        <div>
          <h2>สินค้าทั้งหมด</h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
            {data?.total !== undefined ? `มีสินค้าทั้งหมด ${data.total} รายการ` : `กำลังแสดงรายการสินค้า`}
          </p>
        </div>
        <div style={{ maxWidth: '300px', width: '100%' }}>
          <input
            type="search"
            placeholder="ค้นหาสินค้าในหน้านี้..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="notice" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-card skeleton" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎈</div>
          <h3 className="empty-title">
            {search ? 'ไม่พบสินค้าที่ตรงกับการค้นหา' : 'ยังไม่มีสินค้าในร้านค้านี้'}
          </h3>
          <p className="empty-desc">
            {search
              ? `ลองเปลี่ยนคำค้นหา หรือล้างการค้นหาเพื่อดูสินค้าทั้งหมด`
              : `ร้านค้านี้ยังไม่ได้ลงรายการสินค้า หากคุณเป็นแอดมิน สามารถเริ่มเพิ่มสินค้าได้ทันที!`}
          </p>
          {search ? (
            <button className="btn small ghost" onClick={() => setSearch('')}>
              ล้างคำค้นหา
            </button>
          ) : user?.role === 'admin' ? (
            <Link className="btn small" to="/admin">
              + เพิ่มสินค้าแรกของร้าน
            </Link>
          ) : null}
        </div>
      )}

      {/* Products Grid */}
      {!loading && items.length > 0 && (
        <div className="grid">
          {items.map((p) => (
            <article key={p.id} className="card product">
              <ProductImage product={p} />
              <h3>{p.name}</h3>
              {p.description && <p className="muted">{p.description}</p>}
              <div className="meta">
                <span className="price-tag">{formatPrice(p.price)}</span>
                {p.stock === 0 ? (
                  <span className="badge out">สินค้าหมด</span>
                ) : p.stock <= 5 ? (
                  <span className="badge low">⚡ เหลือ {p.stock}</span>
                ) : (
                  <span className="badge">มี {p.stock} ชิ้น</span>
                )}
              </div>
              <BuyBox product={p} onOrdered={() => setReload((n) => n + 1)} />
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pager">
        <button
          className="btn small ghost"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ← ก่อนหน้า
        </button>
        <span className="pager-indicator">หน้า {page}</span>
        <button
          className="btn small ghost"
          disabled={rawItems.length < LIMIT}
          onClick={() => setPage((p) => p + 1)}
        >
          ถัดไป →
        </button>
      </div>
    </section>
  );
}
