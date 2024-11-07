import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express();
const server = http.createServer(app);
const allowedOrigin = "https://threadsapp-frontend.vercel.app";

// Configure CORS for socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigin, // Only allow requests from the specified frontend
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const userSocketMap = {}; // Maps userId to socketId

// Function to get the recipient's socket ID
export const getRecipientSocketId = (recipientId) => {
    return userSocketMap[recipientId];
};

// Handle socket connections
io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    const userId = socket.handshake.query.userId;

    // Add user to the map if userId is valid
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        // Emit online users list to all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }

    // Handle marking messages as seen
    socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
        try {
            await Message.updateMany(
                { conversationId, seen: false },
                { $set: { seen: true } }
            );
            await Conversation.updateOne(
                { _id: conversationId },
                { $set: { "lastMessage.seen": true } }
            );
            io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
        } catch (error) {
            console.error("Error marking messages as seen:", error);
        }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected");
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { io, server, app };
