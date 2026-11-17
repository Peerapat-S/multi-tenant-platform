import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../api.js';
import { useAuth } from '../auth.jsx';

const LIMIT = 10;

const STATUS_CONFIG = {
  pending: { label: 'รอชำระเงิน', icon: '⏳', badgeClass: 'badge status-pending' },
  paid: { label: 'ชำระเงินแล้ว', icon: '💳', badgeClass: 'badge status-paid' },
  shipped: { label: 'จัดส่งแล้ว', icon: '🚚', badgeClass: 'badge status-shipped' },
  cancelled: { label: 'ยกเลิก', icon: '❌', badgeClass: 'badge status-cancelled' },
};

// ปุ่มเปลี่ยนสถานะที่ admin กดได้ (ต้องตรงกับ TRANSITIONS ฝั่ง backend)
const NEXT_ACTIONS = {
  pending: [
    { status: 'paid', label: 'ยืนยันชำระเงิน', icon: '💳' },
    { status: 'cancelled', label: 'ยกเลิก', icon: '❌', danger: true },
  ],
  paid: [
    { status: 'shipped', label: 'จัดส่งแล้ว', icon: '🚚' },
    { status: 'cancelled', label: 'ยกเลิก', icon: '❌', danger: true },
  ],
  shipped: [],
  cancelled: [],
};

const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export default function Orders() {
  const { call, user, tenant } = useAuth();
  const isAdmin = user.role === 'admin';
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await call(`/orders?page=${page}&limit=${LIMIT}`);
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

  async function changeStatus(order, action) {
    if (action.danger && !window.confirm('ยกเลิกคำสั่งซื้อนี้ใช่หรือไม่? (สต็อกจะถูกคืน)')) return;
    setError('');
    try {
      await call(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: action.status } });
      await load();
    } catch (err) {
      setError(err.message);
      await load(); // สถานะอาจถูกเปลี่ยนโดยคนอื่นไปแล้ว
    }
  }

  return (
    <section>
      <div className="bar">
        <div>
          <h1>📦 {isAdmin ? `คำสั่งซื้อทั้งหมด (${tenant})` : 'คำสั่งซื้อของฉัน'}</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            {isAdmin
              ? `ตรวจสอบสถานะ อัปเดตการชำระเงิน และการจัดส่งสินค้าของแบรนด์นี้`
              : `ประวัติการสั่งซื้อและติดตามสถานะพัสดุของคุณ`}
          </p>
        </div>
      </div>

      {error && (
        <div className="notice" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)', marginBottom: '1.25rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}
      {loading && <p className="muted">⏳ กำลังโหลดรายการคำสั่งซื้อ...</p>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3 className="empty-title">ยังไม่มีคำสั่งซื้อในขณะนี้</h3>
          <p className="empty-desc">
            {isAdmin
              ? 'ยังไม่มีลูกค้าสั่งซื้อสินค้าในแบรนด์นี้ เมื่อมีคำสั่งซื้อจะแสดงที่นี่ทันที'
              : 'คุณยังไม่เคยสั่งซื้อสินค้า ช้อปสินค้าสนุกๆ ได้ที่หน้าร้านเลย!'}
          </p>
        </div>
      )}

      {items.map((o) => {
        const statusMeta = STATUS_CONFIG[o.status] || {
          label: o.status,
          icon: '🏷️',
          badgeClass: 'badge',
        };

        return (
          <article key={o.id} className="card order">
            <header className="order-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="order-id">#{o.id.slice(0, 8)}</span>
                  <span className="muted" style={{ fontSize: '0.86rem' }}>
                    📅 {dateFmt.format(new Date(o.createdAt))}
                  </span>
                </div>
                {isAdmin && (
                  <div className="muted" style={{ fontSize: '0.86rem', marginTop: '0.35rem' }}>
                    👤 ลูกค้า: <strong>{o.customer.name}</strong> ({o.customer.email})
                  </div>
                )}
              </div>
              <span className={statusMeta.badgeClass}>
                <span>{statusMeta.icon}</span> {statusMeta.label}
              </span>
            </header>

            <ul className="order-items">
              {o.items.map((it, i) => (
                <li key={`${o.id}-${i}`}>
                  <span>
                    🛍️ {it.name} <strong style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>× {it.quantity}</strong>
                  </span>
                  <strong>{formatPrice(it.lineTotal)}</strong>
                </li>
              ))}
            </ul>

            <footer className="order-foot">
              <div className="order-total">
                ยอดรวม: <span>{formatPrice(o.total)}</span>
              </div>
              {isAdmin && (
                <div className="actions">
                  {NEXT_ACTIONS[o.status]?.map((a) => (
                    <button
                      key={a.status}
                      className={a.danger ? 'btn small danger' : 'btn small'}
                      onClick={() => changeStatus(o, a)}
                    >
                      <span>{a.icon}</span> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </footer>
          </article>
        );
      })}

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

