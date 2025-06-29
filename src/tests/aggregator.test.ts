import axios from 'axios';
import { fetchTokenData, TokenData } from '../aggregator';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchTokenData', () => {
  it('dedupes and normalizes raw API responses', async () => {
    // Arrange: two sources returning overlapping tokens
    const rawItem = {
      baseToken: { address:'0x1', name:'T1', symbol:'T1' },
      priceUsd: '1.23',
      volume: { h1:10, h24:100, h168:700 },
      marketCap: 999,
      fdv: 0
    };
    mockedAxios.get
      .mockResolvedValueOnce({ data: { pairs: [ rawItem ] } })
      .mockResolvedValueOnce({ data: { data:  [ rawItem ] } });

    // Act
    const result: TokenData[] = await fetchTokenData('any');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      token_address: '0x1',
      token_name:    'T1',
      token_ticker:  'T1',
      price_usd:     1.23,
      volume_1h:     10,
      volume_24h:    100,
      volume_7d:     700,
      market_cap:    999,
    });
  });
});