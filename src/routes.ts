// src/routes.ts

import { Express, Request, Response, NextFunction } from 'express';
import { getCached, setCached } from './cache';
import { fetchTokenData, TokenData } from './aggregator';

// Only these keys are valid for numeric sorting
type SortKey = 'volume_24h' | 'price_usd' | 'market_cap';

export function setupRoutes(app: Express): void {
  app.get(
    '/api/tokens/:query',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const query  = req.params.query;

        // 1. Read & default query‐string parameters
        const period = (req.query.period  as string) || '24h';
        const sortBy = (req.query.sortBy  as string) || 'volume';
        const limit  = parseInt((req.query.limit as string) || '20', 10);
        const cursor = (req.query.cursor as string) || null;

        // 2. Use period in cache key
        const cacheKey = `tokens:${query}:${period}`;

        // 3. Try cache
        let data = await getCached<TokenData[]>(cacheKey);
        let source: 'cache' | 'live' = 'cache';

        if (!data) {
          // 4. Cache miss → fetch fresh
          data = await fetchTokenData(query);  // returns TokenData[]
          await setCached(cacheKey, data, 30);
          source = 'live';
        }
        // 4a. Filter by the requested period (drop tokens with zero volume in that window)
            if (period === '1h') {
            data = data.filter(item => item.volume_1h > 0);
            } else if (period === '7d') {
            data = data.filter(item => item.volume_7d > 0);
            } else {
            // default / "24h"
            data = data.filter(item => item.volume_24h > 0);
            }

          // 5. Choose which volume field to sort by based on period
          let sortField: keyof TokenData;
          if (sortBy === 'price') {
            sortField = 'price_usd';
          } else if (sortBy === 'marketCap') {
            sortField = 'market_cap';
          } else {
            // sortBy='volume'
            if (period === '1h') {
              sortField = 'volume_1h';
            } else if (period === '7d') {
              sortField = 'volume_7d';
            } else {
              // default to 24h
              sortField = 'volume_24h';
            }
          }
          data.sort((a, b) => b[sortField] - a[sortField]);

        // 6. Paginate
        const startIndex = cursor
          ? parseInt(Buffer.from(cursor, 'base64').toString(), 10)
          : 0;
        const page = data.slice(startIndex, startIndex + limit);
        const nextCursor =
          startIndex + page.length < data.length
            ? Buffer.from(String(startIndex + page.length)).toString('base64')
            : null;

        // 7. Respond
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