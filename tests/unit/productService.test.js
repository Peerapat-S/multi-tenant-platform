jest.mock('../../src/models/product');
const Product = require('../../src/models/product');
const productService = require('../../src/services/productService');

const tenant = { id: 'tenant-1' };
const ID = 'c2d9b197-bced-4985-bf69-8c9cd84ee2cc';

describe('productService.list', () => {
  beforeEach(() => Product.list.mockResolvedValue([]));

  test('ค่าเริ่มต้น page 1, limit 20', async () => {
    const result = await productService.list(tenant, {});
    expect(result).toMatchObject({ page: 1, limit: 20 });
    expect(Product.list).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ limit: 20, offset: 0 }));
  });

  test('คำนวณ offset จาก page และ limit', async () => {
    await productService.list(tenant, { page: '3', limit: '10' });
    expect(Product.list).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ limit: 10, offset: 20 }));
  });

  test('จำกัด limit สูงสุด 100 และ page ต่ำสุด 1', async () => {
    const result = await productService.list(tenant, { page: '0', limit: '999' });
    expect(result).toMatchObject({ page: 1, limit: 100 });
  });
});

describe('productService.get', () => {
  test('id ที่ไม่ใช่ UUID -> 404 และไม่ query DB', async () => {
    await expect(productService.get(tenant, 'abc')).rejects.toMatchObject({ status: 404 });
    expect(Product.findById).not.toHaveBeenCalled();
  });

  test('ไม่พบสินค้า -> 404', async () => {
    Product.findById.mockResolvedValue(null);
    await expect(productService.get(tenant, ID)).rejects.toMatchObject({ status: 404 });
    expect(Product.findById).toHaveBeenCalledWith('tenant-1', ID);
  });

  test('พบสินค้า -> คืนสินค้า', async () => {
    Product.findById.mockResolvedValue({ id: ID, name: 'Shirt' });
    await expect(productService.get(tenant, ID)).resolves.toMatchObject({ name: 'Shirt' });
  });
});

describe('productService.create', () => {
  test('สร้างสำเร็จ แปลงชนิดข้อมูลและส่ง tenant id ให้ model', async () => {
    Product.create.mockResolvedValue({ id: ID });
    await productService.create(tenant, { name: ' Shirt ', price: '299', stock: 5 });
    expect(Product.create).toHaveBeenCalledWith('tenant-1', { name: 'Shirt', price: 299, stock: 5 });
  });

  test.each([
    ['ไม่มีชื่อ', { price: 1 }],
    ['ชื่อว่าง', { name: '  ', price: 1 }],
    ['ไม่มีราคา', { name: 'x' }],
    ['ราคาติดลบ', { name: 'x', price: -1 }],
    ['ราคาไม่ใช่ตัวเลข', { name: 'x', price: 'abc' }],
    ['stock เป็นทศนิยม', { name: 'x', price: 1, stock: 1.5 }],
    ['stock ติดลบ', { name: 'x', price: 1, stock: -1 }],
  ])('ข้อมูลไม่ถูกต้อง (%s) -> 400', async (_label, body) => {
    await expect(productService.create(tenant, body)).rejects.toMatchObject({ status: 400 });
    expect(Product.create).not.toHaveBeenCalled();
  });
});

describe('productService.update', () => {
  test('ไม่ส่ง field ใดเลย -> 400', async () => {
    await expect(productService.update(tenant, ID, {})).rejects.toMatchObject({ status: 400 });
  });

  test('id ไม่ใช่ UUID -> 404', async () => {
    await expect(productService.update(tenant, 'abc', { price: 1 })).rejects.toMatchObject({ status: 404 });
    expect(Product.update).not.toHaveBeenCalled();
  });

  test('ไม่พบสินค้าในแบรนด์นี้ -> 404', async () => {
    Product.update.mockResolvedValue(null);
    await expect(productService.update(tenant, ID, { price: 1 })).rejects.toMatchObject({ status: 404 });
  });

  test('แก้เฉพาะ field ที่ส่งมา', async () => {
    Product.update.mockResolvedValue({ id: ID, price: 349 });
    await productService.update(tenant, ID, { price: 349 });
    expect(Product.update).toHaveBeenCalledWith('tenant-1', ID, { price: 349 });
  });
});

describe('productService.remove', () => {
  test('ไม่พบสินค้า -> 404', async () => {
    Product.remove.mockResolvedValue(false);
    await expect(productService.remove(tenant, ID)).rejects.toMatchObject({ status: 404 });
  });

  test('ลบสำเร็จ', async () => {
    Product.remove.mockResolvedValue(true);
    await expect(productService.remove(tenant, ID)).resolves.toBeUndefined();
    expect(Product.remove).toHaveBeenCalledWith('tenant-1', ID);
  });
});