import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useToast } from './Toast.jsx';
import { CartIcon, LockIcon } from './Icons.jsx';

// ปุ่มสั่งซื้อในการ์ดสินค้า: ต้อง login เป็นลูกค้า (customer) ถึงจะสั่งได้
export default function BuyBox({ product, onOrdered }) {
  const { user, call } = useAuth();
  const toast = useToast();
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (product.stock <= 0) return null;
  if (!user) {
    return (
      <div className="buybox">
        <Link className="buybox-login-link" to="/login">
          <LockIcon size={14} /> เข้าสู่ระบบเพื่อสั่งซื้อ
        </Link>
      </div>
    );
  }
  if (user.role !== 'customer') return null; // admin สั่งซื้อไม่ได้

  const currentQty = parseInt(qty, 10) || 1;

  function stepDown() {
    if (currentQty > 1) {
      setQty(String(currentQty - 1));
      setError('');
    }
  }

  function stepUp() {
    if (currentQty < product.stock) {
      setQty(String(currentQty + 1));
      setError('');
    }
  }

  async function order() {
    setError('');
    const quantity = Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1) return setError('จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป');
    if (quantity > product.stock) return setError(`มีสินค้าเหลือเพียง ${product.stock} ชิ้น`);

    setBusy(true);
    try {
      await call('/orders', {
        method: 'POST',
        body: { items: [{ productId: product.id, quantity }] },
      });
      toast.show({
        type: 'success',
        title: 'สั่งซื้อสำเร็จ',
        message: `${product.name} จำนวน ${quantity} ชิ้น ถูกบันทึกแล้ว`,
      });
      setQty('1');
      onOrdered?.(); // ให้หน้าร้านโหลดสต็อกใหม่
    } catch (err) {
      toast.show({ type: 'error', title: 'สั่งซื้อไม่สำเร็จ', message: err.message });
      onOrdered?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="buybox">
      <div className="buy-row">
        <div className="stepper" title="เลือกจำนวน">
          <button
            type="button"
            className="stepper-btn"
            onClick={stepDown}
            disabled={busy || currentQty <= 1}
            aria-label="ลดจำนวน"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={product.stock}
            step="1"
            value={qty}
            aria-label="จำนวนสินค้า"
            onChange={(e) => {
              setQty(e.target.value);
              setError('');
            }}
          />
          <button
            type="button"
            className="stepper-btn"
            onClick={stepUp}
            disabled={busy || currentQty >= product.stock}
            aria-label="เพิ่มจำนวน"
          >
            +
          </button>
        </div>

        <button className="btn small" disabled={busy} onClick={order}>
          <CartIcon size={14} /> {busy ? 'กำลังสั่ง...' : 'สั่งซื้อ'}
        </button>
      </div>

      {error && <p className="error hint">{error}</p>}
    </div>
  );
}
