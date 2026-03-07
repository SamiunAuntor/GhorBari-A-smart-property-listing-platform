import app from "./src/app.js";
import { connectDatabase } from "./src/config/db.js";
import { initializeSocket } from "./src/config/socket.js";
import { setupSocketEvents } from "./src/events/chatEvents.js";
import { startEmailJobCron } from "./src/jobs/emailJobCron.js";
import { startNidVerificationCron } from "./src/jobs/nidVerificationCron.js";

import http from "http";


// Get port from environment or use default
const PORT = process.env.PORT || 5000;


/**
 * Start the server and initialize all services
 */
async function startServer() {

    try {

        // Connect to MongoDB
        await connectDatabase();

        // Create HTTP server for Socket.io
        const httpServer = http.createServer(app);

        // Initialize Socket.io with HTTP server
        initializeSocket(httpServer);

        // Setup Socket.io event handlers for chat
        setupSocketEvents();

        // Start email job cron if enabled
        if (process.env.ENABLE_EMAIL_JOB_CRON !== "false") {
            startEmailJobCron();
        }

        startNidVerificationCron();

        httpServer.listen(PORT, () => {

            console.log(`🏠 GhorBari server is running at http://localhost:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

        });

    } catch (error) {

        console.error("❌ Server startup failed:", error.message);
        process.exit(1);

    }
}


// Start the server
startServer();
