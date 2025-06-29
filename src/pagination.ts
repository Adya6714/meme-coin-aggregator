// src/pagination.ts

import { TokenData } from './aggregator';

export interface Page<T> {
  page: T[];
  nextCursor: string | null;
}

/**
 * Filters, sorts, and paginates an array of TokenData.
 *
 * @param data    - the raw TokenData[]
 * @param period  - '1h' | '24h' | '7d', which volume window to use
 * @param sortBy  - 'volume' | 'price' | 'marketCap'
 * @param limit   - how many items per page
 * @param cursor  - Base64-encoded index of where to start, or null
 */
export function paginateAndSort(
  data: TokenData[],
  period: '1h' | '24h' | '7d',
  sortBy: 'volume' | 'price' | 'marketCap',
  limit: number,
  cursor: string | null
): Page<TokenData> {
  // 1. Filter out tokens with zero volume in the requested period
  let filtered = data.filter(item => {
    if (period === '1h')  return item.volume_1h  > 0;
    if (period === '7d')  return item.volume_7d  > 0;
    /* 24h */             return item.volume_24h > 0;
  });

  // 2. Pick the correct field to sort by
  let sortField: keyof TokenData;
  if (sortBy === 'price') {
    sortField = 'price_usd';
  } else if (sortBy === 'marketCap') {
    sortField = 'market_cap';
  } else {
    // sortBy === 'volume'
    if (period === '1h')   sortField = 'volume_1h';
    else if (period === '7d') sortField = 'volume_7d';
    else                     sortField = 'volume_24h';
  }

  // 3. Sort descending
  filtered.sort((a, b) => b[sortField] - a[sortField]);

  // 4. Decode cursor to get starting index
  const startIndex = cursor
    ? parseInt(Buffer.from(cursor, 'base64').toString(), 10)
    : 0;

  // 5. Slice out the page
  const page = filtered.slice(startIndex, startIndex + limit);

  // 6. Compute nextCursor if there are more items
  const nextCursor =
    startIndex + page.length < filtered.length
      ? Buffer.from(String(startIndex + page.length)).toString('base64')
      : null;

  return { page, nextCursor };
}