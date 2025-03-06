// src/services/socketService.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import ChatMessage from '../models/chatModel'; // Import the ChatMessage model

export const initializeSocket = (server: Server) => {
  const io = new SocketIOServer(server); // Initialize Socket.io with the HTTP server

  // Track active sockets by user ID
  const userSockets: { [userId: string]: string } = {}; // userId -> socketId mapping

  // When a user connects
  io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for the event when a user logs in or is ready to chat
    socket.on('userConnected', (userId: string) => {
      userSockets[userId] = socket.id; // Save the socket ID for the user
      console.log(`${userId} connected with socket ID: ${socket.id}`);
    });

    // Listen for chat messages from users
    socket.on('sendMessage', async (data: { senderId: string, receiverId: string, message: string }) => {
      const { senderId, receiverId, message } = data;

      // Save the chat message to the database
      const chatMessage = new ChatMessage({ senderId, receiverId, message });
      await chatMessage.save();

      // Emit the message to the receiver (private room)
      if (userSockets[receiverId]) {
        io.to(userSockets[receiverId]).emit('newMessage', { senderId, message });
      }

      // Emit the message back to the sender (optional, for immediate chat experience)
      socket.emit('newMessage', { senderId, message });
    });

    // Fetch chat history when a user opens the chat with another user
    socket.on('getChatHistory', async (data: { senderId: string, receiverId: string }) => {
      const { senderId, receiverId } = data;

      // Get the chat history between the two users from the database
      const chatHistory = await ChatMessage.find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }).sort({ timestamp: 1 }); // Sort by timestamp to get the conversation order

      // Emit the chat history back to the users
      socket.emit('chatHistory', chatHistory);
      if (userSockets[receiverId]) {
        io.to(userSockets[receiverId]).emit('chatHistory', chatHistory);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove the socket from the tracking object
      for (const userId in userSockets) {
        if (userSockets[userId] === socket.id) {
          delete userSockets[userId];
          console.log(`${userId} disconnected`);
        }
      }
    });
  });

  return io; // Return the Socket.io instance in case you need to interact with it elsewhere
};
