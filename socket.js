const socketIo = require('socket.io');

let io;

function init(server) {
  io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
}

module.exports = {
  init,
  getIo
};
