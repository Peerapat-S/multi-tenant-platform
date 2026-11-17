import { useEffect, useState } from 'react';

// แสดงรูปสินค้า ถ้าไม่มีรูปหรือโหลดไม่ขึ้น จะแสดงตัวอักษรแรกพร้อมสไตล์ playful
export default function ProductImage({ product, small = false }) {
  const [failed, setFailed] = useState(false);

  // เปลี่ยน URL แล้วให้ลองโหลดใหม่
  useEffect(() => {
    setFailed(false);
  }, [product.imageUrl]);

  const cls = small ? 'thumb small' : 'thumb';
  const initial = product.name ? product.name.charAt(0).toUpperCase() : 'P';

  if (!product.imageUrl || failed) {
    return (
      <div className={cls} title={product.name}>
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      className={`${cls} img`}
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

