import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected as', socket.id);
  socket.emit('subscribeToToken', { query: 'doge', period: '1h' });
});

socket.on('priceUpdate', (payload) => {
  console.log('priceUpdate:', payload);
});

socket.on('priceError', (err) => {
  console.error('Error event:', err);
});