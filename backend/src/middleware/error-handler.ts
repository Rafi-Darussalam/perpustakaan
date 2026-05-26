import type { Request, RequestHandler, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../lib/errors";
import { logger } from "../lib/logger";
import { env } from "../env";

export interface ErrorDetail {
    path: string;
    message: string;
}

export interface ApiErrorResponse {
    status: "error";
    code: string;
    message: string;
    requestId?: string;
    errors?: ErrorDetail[];
    stack?: string;
}

const REDACTED_TEXT = "[REDACTED]";
const MAX_LOG_DEPTH = 4;
const SENSITIVE_KEYS = new Set([
    "password",
    "pass",
    "pwd",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "cookie",
    "set-cookie",
    "api_key",
    "apikey",
    "client_secret",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeForLog(value: unknown, depth = 0): unknown {
    if (depth >= MAX_LOG_DEPTH) {
        return "[MaxDepth]";
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeForLog(item, depth + 1));
    }

    if (!isPlainObject(value)) {
        return value;
    }

    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
        const normalizedKey = key.toLowerCase();
        if (SENSITIVE_KEYS.has(normalizedKey)) {
            output[key] = REDACTED_TEXT;
            continue;
        }

        output[key] = sanitizeForLog(raw, depth + 1);
    }

    return output;
}

function getRequestId(req: Request) {
    const header = req.headers["x-request-id"];
    if (typeof header === "string" && header.trim()) {
        return header;
    }

    if (Array.isArray(header) && header.length > 0 && header[0].trim()) {
        return header[0];
    }

    const requestWithId = req as Request & { id?: string };
    return requestWithId.id;
}

function withRequestId(response: ApiErrorResponse, requestId?: string) {
    if (requestId) {
        response.requestId = requestId;
    }
    return response;
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = getRequestId(req);
    const safeBody = sanitizeForLog(req.body);
    const isOperationalError = err instanceof AppError ? err.isOperational : false;
    const level: "warn" | "error" =
        err instanceof ZodError || isOperationalError ? "warn" : "error";

    logger[level]({
        err,
        requestId,
        method: req.method,
        url: req.url,
        body: safeBody,
    });

    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ZodError) {
        const response: ApiErrorResponse = withRequestId({
            status: "error",
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        }, requestId);

        return res.status(422).json(response);
    }

    if (err instanceof AppError) {
        const response: ApiErrorResponse = withRequestId({
            status: "error",
            code: err.code,
            message: err.message,
        }, requestId);

        if (err instanceof ValidationError) {
            response.errors = err.errors;
        }

        if (env.NODE_ENV === "development") {
            response.stack = err.stack;
        }

        return res.status(err.statusCode).json(response);
    }

    const response: ApiErrorResponse = withRequestId({
        status: "error",
        code: "INTERNAL_ERROR",
        message:
            env.NODE_ENV === "production"
                ? "Something went wrong"
                : err.message || "Unknown error",
    }, requestId);

    if (env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    return res.status(500).json(response);
};

export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => unknown | Promise<unknown>): RequestHandler =>
        (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };

export const notFoundHandler = (req: Request, res: Response) => {
    const requestId = getRequestId(req);
    const response: ApiErrorResponse = withRequestId({
        status: "error",
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.url} not found`,
    }, requestId);

    res.status(404).json(response);
};
