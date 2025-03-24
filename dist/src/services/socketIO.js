"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
// src/services/socketService.ts
const socket_io_1 = require("socket.io");
const chatModel_1 = __importDefault(require("../models/chatModel")); // Import the ChatMessage model
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const initializeSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow frontend
            credentials: true
        }
    }); // Initialize Socket.io with the HTTP server
    console.log("Socket.io initialized");
    // Track active sockets by user ID
    const userSockets = {}; // userId -> socketId mapping
    // When a user connects
    io.on('connection', (socket) => {
        // Listen for the event when a user logs in or is ready to chat
        socket.on('userConnected', (userId) => {
            userSockets[userId] = socket.id; // Save the socket ID for the user
            console.log(`${userId} connected with socket ID: ${socket.id}`);
        });
        // Listen for chat messages from users
        socket.on('sendMessage', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { senderId, receiverId, message } = data;
            const timestamp = new Date();
            // Save the chat message to the database
            const chatMessage = new chatModel_1.default({ senderId, receiverId, message, timestamp });
            yield chatMessage.save();
            console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
            // // Emit the message to the receiver (private room)
            if (userSockets[receiverId]) {
                io.to(userSockets[receiverId]).emit('newMessage', { senderId, message, timestamp });
            }
        }));
        // Fetch chat history when a user opens the chat with another user
        socket.on('getChatHistory', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { senderId, receiverId } = data;
            // Get the chat history between the two users from the database
            const chatHistory = yield chatModel_1.default.find({
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
        }));
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
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=socketIO.js.map