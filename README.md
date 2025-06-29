# Meme Coin Aggregator

A backend service for aggregating real-time meme coin data from decentralized exchanges (DEXs) such as DexScreener and GeckoTerminal. It provides a unified API for token data with real-time updates, caching, deduplication, sorting, and pagination capabilities.

---

## Table of Contents

- [Live Deployment](#live-deployment)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [WebSocket Interface](#websocket-interface)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Testing](#testing)
- [Postman Collection](#postman-collection)
- [Developer Notes](#developer-notes)

---

## Live Deployment

- **Base API URL:** `https://<your-app>.onrender.com/api/tokens`
- **WebSocket URL:** `wss://<your-app>.onrender.com`

Replace `<your-app>` with the actual Render deployment URL.

---

## Features

- Aggregates token data from DexScreener and GeckoTerminal
- Deduplicates tokens based on smart contract addresses
- Provides REST API with filtering, sorting, and pagination
- Offers real-time price updates using WebSocket (Socket.IO)
- Uses Redis for low-latency caching (Upstash Redis)
- Includes unit and integration tests using Jest and Supertest

---

## API Endpoints

### Fetch Token Data

**GET** `/api/tokens/:query`

**Query Parameters:**
- `period`: Time window (`1h`, `24h`, `7d`)
- `sortBy`: `marketCap`, `volume`, `price`
- `limit`: Maximum number of results
- `cursor`: Pagination cursor (for next pages)

**Examples:**
```
/api/tokens/doge
/api/tokens/doge?period=24h
/api/tokens/doge?sortBy=marketCap&limit=10&cursor=nextCursor
```

**Response Format:**
```json
{
  "source": "cache|live",
  "data": [
    {
      "token_address": "0x...",
      "token_name": "Dogecoin",
      "token_ticker": "DOGE",
      "price_usd": 0.08,
      "volume_1h": 100,
      "volume_24h": 1000,
      "volume_7d": 7000,
      "market_cap": 1000000,
      "fdv": 1000000
    }
  ],
  "nextCursor": "base64_encoded_cursor"
}
```

---

## WebSocket Interface

Connect to: `wss://<your-app>.onrender.com`

### Client Events

```javascript
socket.emit("subscribeToToken", {
  query: "doge",
  period: "24h"
});
```

### Server Responses

```javascript
// Regular price updates
socket.on("priceUpdate", (data) => {
  console.log(data);
});

// Price spike alerts
socket.on("priceSpike", (data) => {
  console.log("Price spike detected:", data);
});

// Volume spike alerts
socket.on("volumeSpike", (data) => {
  console.log("Volume spike detected:", data);
});

// Error handling
socket.on("priceError", (data) => {
  console.log("Error:", data);
});
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (Node.js) |
| Framework | Express.js |
| Real-time | Socket.IO |
| Caching | Upstash Redis |
| API Calls | Axios with retry |
| Testing | Jest, Supertest |
| Deployment | Render |

---

## Folder Structure

```
memecoin-aggregator/
├── src/
│   ├── aggregator.ts         # Aggregation logic
│   ├── routes.ts             # API routes
│   ├── websocket.ts          # WebSocket handling
│   ├── cache.ts              # Redis caching
│   ├── pagination.ts         # Pagination utilities
│   ├── utils.ts              # Utility functions
│   └── index.ts              # Server entrypoint
├── tests/
│   ├── aggregator.test.ts
│   ├── routes.test.ts
│   ├── pagination.test.ts
│   ├── ws.test.ts
│   └── tokenRoutes.test.ts
├── public/
│   └── test.html             # WebSocket test client
├── .env.example              # Sample environment file
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the root:

```env
PORT=3000
UPSTASH_REDIS_REST_URL=https://<your-redis>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

If deploying to Render, configure these as environment variables in the Render dashboard.

---

## Installation

```bash
git clone https://github.com/your-username/memecoin-aggregator
cd memecoin-aggregator
npm install
```

### Start the Server

```bash
npm start
```

Server will be available at `http://localhost:3000`.

---

## Testing

Run all tests:

```bash
npm test
```

### Covered Test Cases
- Aggregation logic
- Token routes and filters
- Pagination mechanism
- WebSocket behavior
- Caching fallback and Redis mocks

Tests are written using Jest, Supertest, and mock Axios/Redis clients where needed.

---

## Postman Collection

Import the provided file: `Meme Coin Aggregator.postman_collection.json`

**Contents:**
- Pre-configured routes
- Query combinations
- Pagination, filtering, and sort tests
- Saved example responses

---

## Developer Notes

- Avoid querying DEX APIs more than once per 30 seconds per token (due to caching)
- All failures fallback gracefully to 500 or 404 with minimal user-facing error leaks
- Ensure Redis environment variables are set for production deployments
- Cursor-based pagination uses encoded nextCursor values
- WebSocket connections automatically handle reconnection and cleanup

---

## Author

**Adya Srivastava**  
BITS Pilani | Final-Year Undergraduate (EEE)  
Full Stack, ML, and Systems Developer 