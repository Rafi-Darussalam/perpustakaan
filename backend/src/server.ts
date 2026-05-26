import app from "./app";
import { env } from "./env";
import { logger } from "./lib/logger";

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
    logger.info("Shutting down server...");
    server.close(() => {
        logger.info("Server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
