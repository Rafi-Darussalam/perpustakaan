import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const healthResponseSchema = z.object({
    status: z.string().openapi({ example: "ok" }),
    timestamp: z.string().datetime().openapi({ example: "2026-01-01T00:00:00.000Z" }),
});

registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["System"],
    summary: "Health check",
    responses: {
        200: {
            description: "Service health status",
            content: {
                "application/json": {
                    schema: healthResponseSchema,
                },
            },
        },
    },
});

// ZURO_DOCS_MODULES_START
// Additional module docs are inserted here by `zuro-cli add <module>`.

const authSignUpSchema = z.object({
    email: z.string().email().openapi({ example: "dev@company.com" }),
    password: z.string().min(8).openapi({ example: "strong-password" }),
    name: z.string().min(1).optional().openapi({ example: "Dev User" }),
});

const authSignInSchema = z.object({
    email: z.string().email().openapi({ example: "dev@company.com" }),
    password: z.string().min(8).openapi({ example: "strong-password" }),
});

const authUserSchema = z.object({
    id: z.string().openapi({ example: "user_123" }),
    email: z.string().email().openapi({ example: "dev@company.com" }),
    name: z.string().nullable().openapi({ example: "Dev User" }),
});

// ZURO_AUTH_DOCS_BETTER_AUTH
registry.registerPath({
    method: "post",
    path: "/api/auth/sign-up/email",
    tags: ["Auth"],
    summary: "Register using email and password",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: authSignUpSchema,
                },
            },
        },
    },
    responses: {
        200: { description: "Registration successful" },
    },
});

registry.registerPath({
    method: "post",
    path: "/api/auth/sign-in/email",
    tags: ["Auth"],
    summary: "Sign in using email and password",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: authSignInSchema,
                },
            },
        },
    },
    responses: {
        200: { description: "Sign in successful" },
        401: { description: "Invalid credentials" },
    },
});

registry.registerPath({
    method: "post",
    path: "/api/auth/sign-out",
    tags: ["Auth"],
    summary: "Sign out current user",
    responses: {
        200: { description: "Sign out successful" },
    },
});

registry.registerPath({
    method: "get",
    path: "/api/users/me",
    tags: ["Auth"],
    summary: "Get current authenticated user",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Current user",
            content: {
                "application/json": {
                    schema: z.object({ user: authUserSchema }),
                },
            },
        },
        401: { description: "Not authenticated" },
    },
});

// ZURO_DOCS_MODULES_END

export function createOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "Zuro API",
            version: "1.0.0",
            description: "API reference generated with Zod + OpenAPI.",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development",
            },
        ],
        tags: [
            { name: "System", description: "System and health endpoints" },
            { name: "Auth", description: "Authentication and session endpoints" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    });
}
