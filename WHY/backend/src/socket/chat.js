const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendPush } = require('../services/notifications');

module.exports = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await query(
        'SELECT id, name FROM users WHERE id = $1 AND deleted_at IS NULL',
        [payload.userId]
      );
      if (!rows.length) return next(new Error('User not found'));
      socket.user = rows[0];
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user.id})`);

    // Join personal room for push-style delivery
    socket.join(`user:${socket.user.id}`);

    // Join a match chat room
    socket.on('join_match', async ({ matchId }) => {
      const { rows } = await query(
        'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
        [matchId, socket.user.id]
      );
      if (!rows.length) return socket.emit('error', { message: 'Match not found' });
      socket.join(`match:${matchId}`);
      socket.emit('joined_match', { matchId });
    });

    // Send a message via socket (real-time path)
    socket.on('send_message', async ({ matchId, content, photoUrl }) => {
      if (!content?.trim() && !photoUrl) {
        return socket.emit('error', { message: 'Content or photo required' });
      }

      const { rows: matchRows } = await query(
        'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
        [matchId, socket.user.id]
      );
      if (!matchRows.length) return socket.emit('error', { message: 'Match not found' });

      const match = matchRows[0];
      const { rows } = await query(
        `INSERT INTO messages (match_id, sender_id, content, photo_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [matchId, socket.user.id, content?.trim() || null, photoUrl || null]
      );
      const message = rows[0];

      // Broadcast to everyone in the match room
      io.to(`match:${matchId}`).emit('new_message', { message });

      // Push notification to the other person if they're not in the room
      const otherId = match.user1_id === socket.user.id ? match.user2_id : match.user1_id;
      const roomSockets = await io.in(`match:${matchId}`).allSockets();
      const otherRoom = `user:${otherId}`;
      const otherConnected = [...roomSockets].some(async (sid) => {
        const s = await io.fetchSockets();
        return s.find((x) => x.id === sid && x.rooms.has(`match:${matchId}`) && x.user?.id === otherId);
      });

      if (!otherConnected) {
        await sendPush(
          otherId,
          `New message from ${socket.user.name}`,
          content ? content.substring(0, 80) : '📷 Photo',
          { type: 'message', matchId }
        );
      }
    });

    // Typing indicator
    socket.on('typing', ({ matchId, isTyping }) => {
      socket.to(`match:${matchId}`).emit('user_typing', {
        userId: socket.user.id,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });
};
