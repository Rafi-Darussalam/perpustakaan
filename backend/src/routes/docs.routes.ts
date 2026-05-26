import { Router } from "express";
import { apiReference } from "@scalar/express-api-reference";
import { createOpenApiDocument } from "../lib/openapi";

const docsRouter = Router();
const scalarDocsCsp = [
    "default-src 'self' https: data: blob:",
    "img-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' https: data:",
    "connect-src 'self' https: http:",
    "worker-src 'self' blob:",
].join("; ");

docsRouter.get("/openapi.json", (_req, res) => {
    res.json(createOpenApiDocument());
});

docsRouter.use((req, res, next) => {
    if (req.path !== "/openapi.json") {
        res.setHeader("Content-Security-Policy", scalarDocsCsp);
    }

    next();
});

docsRouter.use(
    "/",
    apiReference({
        spec: {
            url: "/api/docs/openapi.json",
        },
    })
);

export default docsRouter;
