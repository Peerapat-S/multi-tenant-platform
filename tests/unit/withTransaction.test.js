jest.mock('../../src/config/db', () => ({ connect: jest.fn() }));

const pool = require('../../src/config/db');
const withTransaction = require('../../src/utils/withTransaction');

let client;

beforeEach(() => {
  client = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
  pool.connect.mockResolvedValue(client);
});

describe('withTransaction', () => {
  test('สำเร็จ: BEGIN -> fn -> COMMIT, คืนค่าของ fn และคืน connection', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    await expect(withTransaction(fn)).resolves.toBe('result');

    expect(fn).toHaveBeenCalledWith(client);
    expect(client.query.mock.calls.map((c) => c[0])).toEqual(['BEGIN', 'COMMIT']);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  test('fn โยน error: ROLLBACK (ไม่ COMMIT), โยน error เดิมต่อ และคืน connection', async () => {
    const boom = new Error('boom');

    await expect(withTransaction(async () => { throw boom; })).rejects.toBe(boom);

    expect(client.query.mock.calls.map((c) => c[0])).toEqual(['BEGIN', 'ROLLBACK']);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  test('ROLLBACK ล้มเหลวเอง: ยังโยน error ตัวต้นเหตุ และยังคืน connection', async () => {
    client.query.mockImplementation(async (sql) => {
      if (sql === 'ROLLBACK') throw new Error('rollback failed');
      return {};
    });
    const boom = new Error('boom');

    await expect(withTransaction(async () => { throw boom; })).rejects.toBe(boom);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  test('COMMIT ล้มเหลว: ROLLBACK แล้วโยน error และคืน connection', async () => {
    client.query.mockImplementation(async (sql) => {
      if (sql === 'COMMIT') throw new Error('commit failed');
      return {};
    });

    await expect(withTransaction(async () => 'x')).rejects.toThrow('commit failed');
    expect(client.query.mock.calls.map((c) => c[0])).toEqual(['BEGIN', 'COMMIT', 'ROLLBACK']);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
