// src/routes.ts

import { Express, Request, Response, NextFunction } from 'express';
import { getCached, setCached }              from './cache';
import { fetchTokenData, TokenData }         from './aggregator';
import { paginateAndSort }                   from './pagination';

export function setupRoutes(app: Express): void {
  app.get(
    '/api/tokens/:query',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // 1. Read & default query‐string parameters
        const query  = req.params.query;
        const period = (req.query.period  as string) || '24h';                // '1h' | '24h' | '7d'
        const sortBy = (req.query.sortBy  as string) || 'volume';            // 'volume' | 'price' | 'marketCap'
        const limit  = parseInt((req.query.limit  as string) || '20', 10);   // items per page
        const cursor = (req.query.cursor as string) || null;                 // Base64 cursor for pagination

        // 2. Build a cache key that includes the period
        const cacheKey = `tokens:${query}:${period}`;

        // 3. Try to load from Redis cache
        let data = await getCached<TokenData[]>(cacheKey);
        let source: 'cache' | 'live' = 'cache';

        // 4. On cache miss, fetch fresh data and cache it
        if (!data) {
          data = await fetchTokenData(query);
          await setCached(cacheKey, data, 30);
          source = 'live';
        }

        // 5. Delegate filtering, sorting & pagination
        const { page, nextCursor } = paginateAndSort(
          data,
          period as '1h' | '24h' | '7d',
          sortBy as 'volume' | 'price' | 'marketCap',
          limit,
          cursor
        );

        // 6. Send the paginated response
        res.json({
          source,
          data:       page,
          nextCursor
        });
      } catch (err) {
        next(err);
      }
    }
  );
}