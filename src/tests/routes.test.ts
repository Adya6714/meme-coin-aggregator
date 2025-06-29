import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../routes';
import * as agg from '../aggregator';
import * as cache from '../cache';
import { paginateAndSort } from '../pagination';

describe('GET /api/tokens/:query', () => {
  const app = express();
  app.use(express.json());
  setupRoutes(app);

  beforeEach(() => {
    jest.spyOn(cache, 'getCached').mockResolvedValue(null);
    jest.spyOn(cache, 'setCached').mockResolvedValue();
  });

  it('returns live data and sets cache', async () => {
    jest.spyOn(agg, 'fetchTokenData').mockResolvedValue([
      { token_address:'x',token_name:'n',token_ticker:'t',price_usd:1,volume_1h:0,volume_24h:5,volume_7d:0,market_cap:10 }
    ]);

    const res = await request(app).get('/api/tokens/x?sortBy=volume&limit=1');
    expect(res.body.source).toBe('live');
    expect(res.body.data).toHaveLength(1);
    expect(cache.setCached).toHaveBeenCalled();
  });



  it('returns cache data on hit', async () => {
    jest.spyOn(cache, 'getCached').mockResolvedValue([{ token_address:'c',token_name:'c',token_ticker:'c',price_usd:1,volume_1h:0,volume_24h:5,volume_7d:0,market_cap:10 }]);
    const res = await request(app).get('/api/tokens/x');
    expect(res.body.source).toBe('cache');
    expect(res.body.data[0].token_address).toBe('c');
  });
});