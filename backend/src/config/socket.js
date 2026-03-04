import { Server } from "socket.io";

let io;
let connectedUsers = new Map(); // userId -> socketId mapping

export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5174"],
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Middleware for authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        const userEmail = socket.handshake.auth.userEmail;

        if (!token || !userEmail) {
            return next(new Error("Authentication failed"));
        }

        socket.userEmail = userEmail;
        socket.token = token;
        next();
    });

    // Connection event
    io.on("connection", (socket) => {
        console.log(`✅ User connected: ${socket.userEmail} (${socket.id})`);
        
        // Store user connection
        connectedUsers.set(socket.userEmail, socket.id);
        
        // Notify all clients of user status
        io.emit("users:online", Array.from(connectedUsers.keys()));

        // Disconnect event
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.userEmail}`);
            connectedUsers.delete(socket.userEmail);
            io.emit("users:online", Array.from(connectedUsers.keys()));
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

export const getConnectedUsers = () => {
    return connectedUsers;
};

export const isUserOnline = (userEmail) => {
    return connectedUsers.has(userEmail);
};
