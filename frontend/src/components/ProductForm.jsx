import { useState } from 'react';
import { EditIcon, PlusIcon, AlertIcon } from './Icons.jsx';

export default function ProductForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [stock, setStock] = useState(initial ? String(initial.stock) : '0');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [previewFailed, setPreviewFailed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('กรุณากรอกชื่อสินค้า');
    if (price === '' || Number(price) < 0) return setError('ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
    if (imageUrl.trim() && !/^https?:\/\//i.test(imageUrl.trim())) {
      return setError('URL รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://');
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description,
        price: Number(price),
        stock: Number(stock || 0),
        imageUrl: imageUrl.trim(), // สตริงว่าง = ไม่มีรูป (backend เก็บเป็น NULL)
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit} style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {initial ? <EditIcon size={20} /> : <PlusIcon size={20} />}
        <h2>{initial ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
      </div>

      <label>
        ชื่อสินค้า
        <input
          placeholder="เช่น เสื้อยืดมินิมอล Cotton 100%"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label>
        รายละเอียดสินค้า
        <textarea
          rows="3"
          placeholder="ใส่รายละเอียด เนื้อผ้า ขนาด หรือจุดเด่นของสินค้า..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="row">
        <label>
          ราคา (บาท)
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <label>
          จำนวนสินค้าในสต็อก
          <input
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </label>
      </div>

      <label>
        URL รูปภาพ (ไม่บังคับ)
        <input
          type="url"
          placeholder="https://images.unsplash.com/photo-..."
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreviewFailed(false);
          }}
        />
      </label>

      {imageUrl.trim() && (
        <div className="thumb-preview" style={{ flexDirection: 'column', gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.82rem' }}>
            {previewFailed ? 'ไม่สามารถโหลดรูปได้ ตรวจสอบ URL อีกครั้ง' : 'ตัวอย่างรูปสินค้า:'}
          </span>
          {!previewFailed && (
            <img src={imageUrl.trim()} alt="ตัวอย่างรูปสินค้า" onError={() => setPreviewFailed(true)} />
          )}
        </div>
      )}

      {error && (
        <div className="notice" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}>
          <AlertIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสินค้า'}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
