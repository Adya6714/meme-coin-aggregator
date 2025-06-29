import { paginateAndSort } from '../pagination';
import { TokenData } from '../aggregator';

describe('paginateAndSort', () => {
  // build an array of 10 TokenData with increasing volume_24h
  const data: TokenData[] = Array.from({length:10}, (_,i) => ({
    token_address: `a${i}`, token_name:'', token_ticker:'', price_usd:0,
    volume_1h:0, volume_24h:i, volume_7d:0, market_cap:0
  }));

  it('returns first 3 sorted by volume_24h', () => {
    const { page, nextCursor } =
      paginateAndSort(data, '24h','volume',3,null);
    expect(page.map(x=>x.volume_24h)).toEqual([9,8,7]);
    expect(nextCursor).not.toBeNull();
  });

  it('returns next page when cursor provided', () => {
    const first = paginateAndSort(data,'24h','volume',3,null);
    const { page } = paginateAndSort(data,'24h','volume',3, first.nextCursor);
    expect(page.map(x=>x.volume_24h)).toEqual([6,5,4]);
  });
});