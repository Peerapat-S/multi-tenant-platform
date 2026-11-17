const view = require('../../src/views/orderView');

const row = {
  id: 'o1',
  status: 'pending',
  total: '200.30',
  customer_name: 'Somchai',
  customer_email: 'somchai@test.com',
  created_at: '2026-11-17T00:00:00Z',
  user_id: 'u1',
  tenant_id: 't1',
  items: [
    { product_id: 'p1', product_name: 'Shirt', unit_price: '100.00', quantity: 2 },
    { product_id: null, product_name: 'Pen', unit_price: '0.10', quantity: 3 },
  ],
};

describe('orderView.order', () => {
  test('แปลง NUMERIC เป็น number, คิด lineTotal และไม่ส่ง tenant_id/user_id ออกไป', () => {
    expect(view.order(row)).toEqual({
      id: 'o1',
      status: 'pending',
      total: 200.3,
      customer: { name: 'Somchai', email: 'somchai@test.com' },
      items: [
        { productId: 'p1', name: 'Shirt', unitPrice: 100, quantity: 2, lineTotal: 200 },
        { productId: null, name: 'Pen', unitPrice: 0.1, quantity: 3, lineTotal: 0.3 },
      ],
      createdAt: '2026-11-17T00:00:00Z',
    });
  });

  test('ไม่มี items -> เป็น array ว่าง', () => {
    expect(view.order({ ...row, items: undefined }).items).toEqual([]);
  });
});

describe('orderView.list', () => {
  test('จัดรูปทุกรายการและคง page/limit', () => {
    const result = view.list({ items: [row], page: 2, limit: 5 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(5);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].total).toBe(200.3);
  });
});
