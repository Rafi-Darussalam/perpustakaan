import express from "express";
import cors from "cors";
import helmet from "helmet";
import rootRouter from "./routes";

import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
const app = express();
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
}));
app.all(/^\/api\/auth(?:\/.*)?$/, toNodeHandler(auth));
app.use(express.json());
app.use("/api", rootRouter);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});


// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
