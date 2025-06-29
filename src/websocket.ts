// src/websocket.ts

import { Server, Socket } from 'socket.io';
import { fetchTokenData, TokenData } from './aggregator';


// Define the allowed periods
type Period = '1h' | '24h' | '7d';

const socketIntervals = new Map<string, NodeJS.Timeout>();
const prevDataMap = new Map<string, TokenData[]>();
const PRICE_SPIKE_THRESHOLD = 0.005;
const VOLUME_SPIKE_FACTOR  = 2;

export function setupWebSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log('[WS] client connected:', socket.id);

    // Listen for { query, period } instead of just a string
    socket.on(
      'subscribeToToken',
      (opts: { query: string; period: Period }) => {
        const { query, period } = opts;
        console.log(`[WS] ${socket.id} subscribeToToken →`, query, period);

        // Clear any previous polling interval
        const prev = socketIntervals.get(socket.id);
        if (prev) clearInterval(prev);

        // Initialize previous data to empty
        prevDataMap.set(socket.id, []);

        // Immediately fetch & emit
        fetchAndEmit(socket, query, period);

        // Then every 30 seconds
        const interval = setInterval(() => {
          fetchAndEmit(socket, query, period);
        }, 30_000);
        socketIntervals.set(socket.id, interval);
      }
    );

    socket.on('disconnect', () => {
      console.log('[WS] client disconnected:', socket.id);
      const iv = socketIntervals.get(socket.id);
      if (iv) {
        clearInterval(iv);
        socketIntervals.delete(socket.id);
      }
    });
  });
}

/**
 * Fetches token data, filters by period, and emits.
 */
async function fetchAndEmit(
  socket: Socket,
  query: string,
  period: Period
): Promise<void> {
  try {
    const tokens = await fetchTokenData(query);
    // 1. Filter by period (as before)
    let filtered = tokens.filter((t) =>
      period === '1h' ? t.volume_1h > 0
      : period === '7d'  ? t.volume_7d > 0
      : /* 24h */         t.volume_24h > 0
    );

    // 2. Retrieve previous snapshot (empty array if first time)
    const prev = prevDataMap.get(socket.id) || [];

    // 3. Spike detection
    for (const item of filtered) {
      const old = prev.find((p) => p.token_address === item.token_address);
      if (!old) continue;

      // 3a. Price spike?
      const priceChange = Math.abs(item.price_usd - old.price_usd) / old.price_usd;
      if (priceChange >= PRICE_SPIKE_THRESHOLD) {
        socket.emit('priceSpike', {
          token_address: item.token_address,
          old_price:     old.price_usd,
          new_price:     item.price_usd,
          change:        priceChange
        });
      }

      // 3b. Volume spike?
      // pick the right volume field for the period
      const oldVol =
        period === '1h' ? old.volume_1h
      : period === '7d' ? old.volume_7d
      :                   old.volume_24h;
      const newVol =
        period === '1h' ? item.volume_1h
      : period === '7d' ? item.volume_7d
      :                   item.volume_24h;
      if (oldVol > 0 && newVol / oldVol >= VOLUME_SPIKE_FACTOR) {
        socket.emit('volumeSpike', {
          token_address: item.token_address,
          old_volume:    oldVol,
          new_volume:    newVol,
          factor:        newVol / oldVol
        });
      }
    }

    // 4. Regular update
    socket.emit('priceUpdate', {
      query,
      period,
      timestamp: Date.now(),
      data: filtered
    });

    // 5. Save this snapshot for next comparison
    prevDataMap.set(socket.id, filtered);
  } catch (err) {
    socket.emit('priceError', { query, period, message: 'Fetch failed' });
  }
}