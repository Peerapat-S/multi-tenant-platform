import { useState } from 'react';

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
    <form className="card form" onSubmit={submit}>
      <h2>{initial ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>

      <label>
        ชื่อสินค้า
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        รายละเอียด
        <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="row">
        <label>
          ราคา (บาท)
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label>
          จำนวนในสต็อก
          <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
        </label>
      </div>

      <label>
        URL รูปภาพ (ไม่ใส่ก็ได้)
        <input
          type="url"
          placeholder="https://example.com/shirt.jpg"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setPreviewFailed(false);
          }}
        />
      </label>
      {imageUrl.trim() && (
        <div className="thumb-preview">
          {previewFailed ? (
            <span className="muted">โหลดรูปไม่ได้ ตรวจสอบ URL อีกครั้ง</span>
          ) : (
            <img src={imageUrl.trim()} alt="ตัวอย่างรูปสินค้า" onError={() => setPreviewFailed(true)} />
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}