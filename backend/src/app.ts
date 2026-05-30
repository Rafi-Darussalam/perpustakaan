import express from "express";
import cors from "cors";
import helmet from "helmet";
import rootRouter from "./routes";

import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
const app = express();
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000", "file://"],
    credentials: true,
}));
app.all(/^\/api\/auth(?:\/.*)?$/, toNodeHandler(auth));
app.use(express.json({ limit: '15mb' }));
app.use(express.static("public")); // Serve static files from public folder
app.use("/api", rootRouter);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});


// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
