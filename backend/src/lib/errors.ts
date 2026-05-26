export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(message: string, statusCode: number, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code || this.constructor.name.toUpperCase();

        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad request", code = "BAD_REQUEST") {
        super(message, 400, code);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
        super(message, 401, code);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden", code = "FORBIDDEN") {
        super(message, 403, code);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not found", code = "NOT_FOUND") {
        super(message, 404, code);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict", code = "CONFLICT") {
        super(message, 409, code);
    }
}

export class ValidationError extends AppError {
    public readonly errors: Array<{ path: string; message: string }>;

    constructor(
        errors: Array<{ path: string; message: string }>,
        message = "Validation failed"
    ) {
        super(message, 422, "VALIDATION_ERROR");
        this.errors = errors;
    }
}

export class InternalServerError extends AppError {
    constructor(message = "Internal server error", code = "INTERNAL_ERROR") {
        super(message, 500, code);
    }
}
