// src/__tests__/ws.test.ts

import { createServer, Server as HttpServer } from 'http';
import { Server as IOServer }               from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { setupWebSocket }                   from '../websocket';

let httpServer: HttpServer;
let io: IOServer;
let clientSocket: ClientSocket;

beforeAll((done) => {
  // 1) Create a plain HTTP server
  httpServer = createServer();

  // 2) Attach a Socket.IO server to it
  io = new IOServer(httpServer);

  // 3) Wire up your WebSocket handlers
  setupWebSocket(io);

  // 4) Start listening on an ephemeral port
  httpServer.listen(() => {
    const addressInfo = httpServer.address() as { port: number };
    const port = addressInfo.port;

    // 5) Connect a client to that port
    clientSocket = Client(`http://localhost:${port}`);

    // 6) When the client connects, we can start tests
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  // Cleanup everything
  io.close();
  clientSocket.close();
  httpServer.close();
});

it('emits priceUpdate on subscribe', (done) => {
  // 1) Ask for updates
  clientSocket.emit('subscribeToToken', { query: 'doge', period: '24h' });

  // 2) Expect a priceUpdate event
  clientSocket.on('priceUpdate', (msg: { query: string; data: any[] }) => {
    expect(msg.query).toBe('doge');
    expect(Array.isArray(msg.data)).toBe(true);
    done();
  });
});