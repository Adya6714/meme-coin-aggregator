import express, { Express } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';                // ← import path
import { Server } from 'socket.io';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import dotenv from 'dotenv';
dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ─── STATIC FILES ───────────────────────────────────────────────
// any request for a file under /public will be served
app.use(express.static(path.join(__dirname, '../public')));

// ─── API ROUTES ─────────────────────────────────────────────────
setupRoutes(app);
setupWebSocket(io);

// optional root route if you still want it
app.get('/', (_req, res) => {
  res.send('Meme Coin Aggregator Backend is running!');
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () =>
    console.log(`Listening on http://localhost:${PORT}`)
  );
}

export default app;