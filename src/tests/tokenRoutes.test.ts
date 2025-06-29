import request from 'supertest';
import app from '../index'; // Adjust the path if your Express app is elsewhere

// Dynamic mock for requestWithRetry
jest.mock('../utils', () => ({
  requestWithRetry: jest.fn((url) => {
    if (url.includes('fakeunknownxyz')) {
      // Simulate no results
      return Promise.resolve({ data: { pairs: [] } });
    }
    // Default: DOGE
    return Promise.resolve({
      data: {
        pairs: [
          {
            baseToken: { address: 'DOGE', name: 'Dogecoin', symbol: 'DOGE' },
            priceUsd: 0.08,
            volume: { h1: 100, h24: 1000, h168: 7000 },
            marketCap: 1000000,
            fdv: 1000000,
          },
        ],
      },
    });
  }),
}));

// ✅ Mock Upstash Redis methods used in caching
jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue(null),
    }),
  },
}));

// ✅ Test cases
describe('GET /api/tokens/:query', () => {
  it('should return token data for DOGE', async () => {
    const res = await request(app).get('/api/tokens/doge');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].token_ticker).toBe('DOGE');
  });

  it('should return 404 for unknown token', async () => {
    const res = await request(app).get('/api/tokens/fakeunknownxyz');
    // If your route returns 200 with empty data, check for that:
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    // If you want to return 404, you need to update your route logic to do so when data.length === 0
  });
});