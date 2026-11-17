jest.mock('../../src/models/order');
jest.mock('../../src/models/product');
jest.mock('../../src/utils/withTransaction');

const Order = require('../../src/models/order');
const Product = require('../../src/models/product');
const withTransaction = require('../../src/utils/withTransaction');
const orderService = require('../../src/services/orderService');

const tenant = { id: 'tenant-1' };
const customer = { id: 'user-1', role: 'customer' };
const admin = { id: 'admin-1', role: 'admin' };
const client = { tag: 'transaction-client' };

// P1 < P2 เมื่อเรียงเป็นสตริง (ใช้เช็กลำดับตอนคืนสต็อก)
const P1 = '0b6f1c0a-27a4-4d52-9a67-5d2a3b7d9e11';
const P2 = 'c2d9b197-bced-4985-bf69-8c9cd84ee2cc';
const ORDER_ID = '5f1d3c2e-8a7b-4c9d-9e0f-1a2b3c4d5e6f';

const shirt = { id: P1, name: 'Shirt', price: '100.00', stock: 10 };
const pen = { id: P2, name: 'Pen', price: '0.10', stock: 10 };

beforeEach(() => {
  withTransaction.mockImplementation((fn) => fn(client));
  Order.create.mockResolvedValue({ id: ORDER_ID });
  Order.findById.mockResolvedValue({ id: ORDER_ID, status: 'pending' });
});

describe('orderService.create: ตรวจข้อมูลที่ส่งมา', () => {
  const tooMany = Array.from({ length: 51 }, () => ({ productId: P1, quantity: 1 }));

  test.each([
    ['ไม่ส่ง items', undefined],
    ['items ว่าง', []],
    ['items ไม่ใช่ array', 'abc'],
    ['มีบรรทัดที่เป็น null', [null]],
    ['productId ไม่ใช่ UUID', [{ productId: 'abc', quantity: 1 }]],
    ['ไม่มี productId', [{ quantity: 1 }]],
    ['quantity เป็น 0', [{ productId: P1, quantity: 0 }]],
    ['quantity ติดลบ', [{ productId: P1, quantity: -2 }]],
    ['quantity เป็นทศนิยม', [{ productId: P1, quantity: 1.5 }]],
    ['quantity เป็นสตริง', [{ productId: P1, quantity: '2' }]],
    ['มีบรรทัดเกิน 50', tooMany],
  ])('%s -> 400 และไม่เปิด transaction', async (_label, items) => {
    await expect(orderService.create(tenant, customer, { items })).rejects.toMatchObject({ status: 400 });
    expect(withTransaction).not.toHaveBeenCalled();
  });

  test('ไม่ส่ง body เลย -> 400', async () => {
    await expect(orderService.create(tenant, customer)).rejects.toMatchObject({ status: 400 });
  });
});

describe('orderService.create: สั่งซื้อ', () => {
  test('สำเร็จ: ล็อกสินค้า, คิดยอดเป็นสตางค์, เก็บ snapshot, ตัดสต็อก, คืนออเดอร์ที่อ่านใน transaction เดียวกัน', async () => {
    Product.lockByIds.mockResolvedValue([shirt, pen]);

    const result = await orderService.create(tenant, customer, {
      items: [
        { productId: P1, quantity: 2 },
        { productId: P2, quantity: 3 },
      ],
    });

    expect(Product.lockByIds).toHaveBeenCalledWith(client, 'tenant-1', [P1, P2]);
    // 100*2 + 0.10*3 = 200.30 (ถ้าคูณทศนิยมตรง ๆ อาจได้ 200.29999...)
    expect(Order.create).toHaveBeenCalledWith(client, 'tenant-1', 'user-1', 200.3);
    expect(Order.addItems).toHaveBeenCalledWith(client, 'tenant-1', ORDER_ID, [
      { product_id: P1, product_name: 'Shirt', unit_price: '100.00', quantity: 2 },
      { product_id: P2, product_name: 'Pen', unit_price: '0.10', quantity: 3 },
    ]);
    expect(Product.adjustStock).toHaveBeenCalledTimes(2);
    expect(Product.adjustStock).toHaveBeenCalledWith(client, 'tenant-1', P1, -2);
    expect(Product.adjustStock).toHaveBeenCalledWith(client, 'tenant-1', P2, -3);
    expect(Order.findById).toHaveBeenCalledWith('tenant-1', ORDER_ID, { db: client });
    expect(result).toEqual({ id: ORDER_ID, status: 'pending' });
  });

  test('รวมบรรทัดของสินค้าเดียวกัน (รวม productId ตัวพิมพ์ใหญ่) เป็นบรรทัดเดียว', async () => {
    Product.lockByIds.mockResolvedValue([shirt]);

    await orderService.create(tenant, customer, {
      items: [
        { productId: P1, quantity: 1 },
        { productId: P1.toUpperCase(), quantity: 2 },
      ],
    });

    expect(Product.lockByIds).toHaveBeenCalledWith(client, 'tenant-1', [P1]);
    expect(Product.adjustStock).toHaveBeenCalledTimes(1);
    expect(Product.adjustStock).toHaveBeenCalledWith(client, 'tenant-1', P1, -3);
  });

  test('สั่งได้พอดีกับสต็อกที่เหลือ', async () => {
    Product.lockByIds.mockResolvedValue([{ ...shirt, stock: 3 }]);
    await orderService.create(tenant, customer, { items: [{ productId: P1, quantity: 3 }] });
    expect(Product.adjustStock).toHaveBeenCalledWith(client, 'tenant-1', P1, -3);
  });

  test('ไม่พบสินค้า (หรือเป็นของแบรนด์อื่น) -> 404 และไม่สร้างออเดอร์', async () => {
    Product.lockByIds.mockResolvedValue([]);

    await expect(
      orderService.create(tenant, customer, { items: [{ productId: P1, quantity: 1 }] })
    ).rejects.toMatchObject({ status: 404 });
    expect(Order.create).not.toHaveBeenCalled();
    expect(Product.adjustStock).not.toHaveBeenCalled();
  });

  test('มีบรรทัดหนึ่งไม่พบสินค้า -> 404 ทั้งออเดอร์ (ไม่ตัดสต็อกบรรทัดที่เหลือ)', async () => {
    Product.lockByIds.mockResolvedValue([shirt]);

    await expect(
      orderService.create(tenant, customer, {
        items: [
          { productId: P1, quantity: 1 },
          { productId: P2, quantity: 1 },
        ],
      })
    ).rejects.toMatchObject({ status: 404 });
    expect(Order.create).not.toHaveBeenCalled();
    expect(Product.adjustStock).not.toHaveBeenCalled();
  });

  test('สต็อกไม่พอ -> 409 ระบุชื่อสินค้า และไม่สร้างออเดอร์/ไม่ตัดสต็อก', async () => {
    Product.lockByIds.mockResolvedValue([{ ...shirt, stock: 1 }]);

    await expect(
      orderService.create(tenant, customer, { items: [{ productId: P1, quantity: 2 }] })
    ).rejects.toMatchObject({ status: 409, message: expect.stringContaining('Shirt') });
    expect(Order.create).not.toHaveBeenCalled();
    expect(Product.adjustStock).not.toHaveBeenCalled();
  });

  test('error ที่เกิดใน transaction ถูกโยนต่อ (withTransaction เป็นตัว rollback)', async () => {
    Product.lockByIds.mockResolvedValue([shirt]);
    Order.addItems.mockRejectedValueOnce(new Error('db down'));

    await expect(
      orderService.create(tenant, customer, { items: [{ productId: P1, quantity: 1 }] })
    ).rejects.toThrow('db down');
    expect(Product.adjustStock).not.toHaveBeenCalled();
  });
});

describe('orderService.list', () => {
  test('customer -> กรองเฉพาะของตัวเอง', async () => {
    Order.list.mockResolvedValue([]);
    const result = await orderService.list(tenant, customer, {});
    expect(Order.list).toHaveBeenCalledWith('tenant-1', { userId: 'user-1', page: 1, limit: 20, offset: 0 });
    expect(result).toEqual({ items: [], page: 1, limit: 20 });
  });

  test('admin -> ไม่กรองตาม user (เห็นทั้งแบรนด์)', async () => {
    Order.list.mockResolvedValue([]);
    await orderService.list(tenant, admin, {});
    expect(Order.list).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: null }));
  });

  test('แบ่งหน้า: page=3&limit=5 -> offset 10 และปรับ limit ที่เกิน 100', async () => {
    Order.list.mockResolvedValue([]);
    await orderService.list(tenant, admin, { page: '3', limit: '5' });
    expect(Order.list).toHaveBeenCalledWith('tenant-1', { userId: null, page: 3, limit: 5, offset: 10 });

    await orderService.list(tenant, admin, { limit: '9999' });
    expect(Order.list).toHaveBeenLastCalledWith('tenant-1', expect.objectContaining({ limit: 100 }));
  });
});

describe('orderService.get', () => {
  test('id ไม่ใช่ UUID -> 404 โดยไม่ query', async () => {
    await expect(orderService.get(tenant, customer, 'abc')).rejects.toMatchObject({ status: 404 });
    expect(Order.findById).not.toHaveBeenCalled();
  });

  test('customer: query พร้อมกรอง userId ของตัวเอง', async () => {
    await orderService.get(tenant, customer, ORDER_ID);
    expect(Order.findById).toHaveBeenCalledWith('tenant-1', ORDER_ID, { userId: 'user-1' });
  });

  test('admin: ไม่กรอง userId', async () => {
    await orderService.get(tenant, admin, ORDER_ID);
    expect(Order.findById).toHaveBeenCalledWith('tenant-1', ORDER_ID, { userId: null });
  });

  test('ไม่พบ (หรือเป็นออเดอร์ของคนอื่น) -> 404', async () => {
    Order.findById.mockResolvedValue(null);
    await expect(orderService.get(tenant, customer, ORDER_ID)).rejects.toMatchObject({ status: 404 });
  });
});

describe('orderService.updateStatus', () => {
  const locked = (status) => Order.lockById.mockResolvedValue({ id: ORDER_ID, status });

  test.each([
    ['ว่าง', ''],
    ['ไม่รู้จัก', 'refunded'],
    ['ไม่ใช่สตริง', 123],
    ['undefined', undefined],
    ['ชื่อ property ของ Object', 'toString'],
  ])('สถานะ %s -> 400 โดยไม่เปิด transaction', async (_label, status) => {
    await expect(orderService.updateStatus(tenant, ORDER_ID, status)).rejects.toMatchObject({ status: 400 });
    expect(withTransaction).not.toHaveBeenCalled();
  });

  test('id ไม่ใช่ UUID -> 404', async () => {
    await expect(orderService.updateStatus(tenant, 'abc', 'paid')).rejects.toMatchObject({ status: 404 });
    expect(withTransaction).not.toHaveBeenCalled();
  });

  test('ไม่พบออเดอร์ -> 404', async () => {
    Order.lockById.mockResolvedValue(null);
    await expect(orderService.updateStatus(tenant, ORDER_ID, 'paid')).rejects.toMatchObject({ status: 404 });
    expect(Order.setStatus).not.toHaveBeenCalled();
  });

  test.each([
    ['pending', 'shipped'],
    ['pending', 'pending'],
    ['paid', 'pending'],
    ['shipped', 'paid'],
    ['shipped', 'cancelled'],
    ['cancelled', 'pending'],
    ['cancelled', 'cancelled'],
  ])('เปลี่ยน %s -> %s ไม่ได้ -> 409', async (from, to) => {
    locked(from);
    await expect(orderService.updateStatus(tenant, ORDER_ID, to)).rejects.toMatchObject({ status: 409 });
    expect(Order.setStatus).not.toHaveBeenCalled();
    expect(Product.adjustStock).not.toHaveBeenCalled();
  });

  test.each([
    ['pending', 'paid'],
    ['paid', 'shipped'],
  ])('เปลี่ยน %s -> %s ได้ โดยไม่แตะสต็อก', async (from, to) => {
    locked(from);
    await orderService.updateStatus(tenant, ORDER_ID, to);
    expect(Order.lockById).toHaveBeenCalledWith(client, 'tenant-1', ORDER_ID);
    expect(Order.setStatus).toHaveBeenCalledWith(client, 'tenant-1', ORDER_ID, to);
    expect(Product.adjustStock).not.toHaveBeenCalled();
    expect(Order.findById).toHaveBeenCalledWith('tenant-1', ORDER_ID, { db: client });
  });

  test.each(['pending', 'paid'])('ยกเลิกจาก %s -> คืนสต็อกเรียงตาม product id และข้ามสินค้าที่ถูกลบ', async (from) => {
    locked(from);
    Order.findItems.mockResolvedValue([
      { product_id: P2, quantity: 3 },
      { product_id: null, quantity: 5 }, // สินค้าถูกลบไปแล้ว
      { product_id: P1, quantity: 2 },
    ]);

    await orderService.updateStatus(tenant, ORDER_ID, 'cancelled');

    expect(Order.findItems).toHaveBeenCalledWith(client, 'tenant-1', [ORDER_ID]);
    expect(Product.adjustStock.mock.calls).toEqual([
      [client, 'tenant-1', P1, 2],
      [client, 'tenant-1', P2, 3],
    ]);
    expect(Order.setStatus).toHaveBeenCalledWith(client, 'tenant-1', ORDER_ID, 'cancelled');
  });

  test('shipped และ cancelled เป็นสถานะสุดท้าย (เปลี่ยนต่อไม่ได้)', () => {
    expect(orderService.TRANSITIONS.shipped).toEqual([]);
    expect(orderService.TRANSITIONS.cancelled).toEqual([]);
  });
});
