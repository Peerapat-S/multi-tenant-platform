const errorHandler = require('../../src/middlewares/errorHandler');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('errorHandler', () => {
  test('error 4xx ส่งข้อความจริงกลับ', () => {
    const res = mockRes();
    errorHandler(Object.assign(new Error('Bad input'), { status: 400 }), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad input' });
  });

  test('error ไม่มี status -> 500 และไม่เปิดเผยข้อความภายใน', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();

    errorHandler(new Error('password=secret'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    spy.mockRestore();
  });
});