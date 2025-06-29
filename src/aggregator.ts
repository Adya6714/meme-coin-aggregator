// src/aggregator.ts

import axios, { AxiosResponse } from 'axios';
import { requestWithRetry } from './utils';

/**
 * This is the minimal set of fields your front end needs.
 */
export interface TokenData {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_usd: number;
  volume_24h: number;
  volume_1h:     number;      
  volume_7d:     number;   
  market_cap: number;
}

/**
 * Fetch token data from two DEX APIs, merge & dedupe,
 * then normalize into our TokenData interface.
 *
 * @param query token address or name substring
 * @returns Promise resolving to an array of TokenData
 */
export async function fetchTokenData(
  query: string
): Promise<TokenData[]> {
  const urls = [
    `https://api.dexscreener.com/latest/dex/search?q=${query}`,
    `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${query}`
  ];

  // 1. Fetch both APIs in parallel, retrying on rate-limit or network errors


  const results = await Promise.allSettled(
    urls.map((url) => requestWithRetry(url))
  );

  // 2. Extract the raw lists from each successful response
  const allRaw: any[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const resp = r.value as AxiosResponse;
      // DexScreener returns an object with `.pairs`, GeckoTerminal with `.data`
      const list = Array.isArray(resp.data.data)
        ? resp.data.data
        : Array.isArray(resp.data.pairs)
          ? resp.data.pairs
          : [];
      allRaw.push(...list);
    }
  }

  // 3. Deduplicate by the baseToken address (the token you queried)
  const dedupedByAddress: Record<string, any> = {};
  for (const item of allRaw) {
    const addr = item.baseToken?.address;
    if (addr) {
      // always overwrite with the latest item for simplicity
      dedupedByAddress[addr] = item;
    }
  }

  // 4. Normalize into our TokenData shape, including 1h and 7d
  const simplified: TokenData[] = Object.values(dedupedByAddress).map((item) => ({
    token_address: item.baseToken.address,
    token_name:    item.baseToken.name,
    token_ticker:  item.baseToken.symbol,
    price_usd:     Number(item.priceUsd || 0),
    volume_1h:     Number(item.volume?.h1   || 0),
    volume_24h:    Number(item.volume?.h24  || 0),
    volume_7d:     Number(item.volume?.h168 || 0),  // some APIs may not provide h168
    market_cap:    Number(item.marketCap || item.fdv || 0)
  }));

  return simplified;
}