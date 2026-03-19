/**
 * Error Handling Infrastructure
 *
 * Production-grade error classes and utilities for the BIM Agent platform
 */

// ============================================
// Custom Error Classes
// ============================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      ...(this.context && { context: this.context }),
    };
  }
}

export class ValidationError extends AppError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    errors: Array<{ field: string; message: string }> = []
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, { errors });
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, true, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, true);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(
      `Rate limit exceeded. Try again in ${retryAfter} seconds`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true,
      { retryAfter }
    );
    this.retryAfter = retryAfter;
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      true,
      { service, originalError: originalError?.message }
    );
    this.service = service;
  }
}

export class AgentError extends AppError {
  public readonly agentType: string;

  constructor(agentType: string, message: string) {
    super(message, 'AGENT_ERROR', 500, true, { agentType });
    this.agentType = agentType;
  }
}

export class FileProcessingError extends AppError {
  public readonly filename: string;

  constructor(filename: string, message: string) {
    super(message, 'FILE_PROCESSING_ERROR', 422, true, { filename });
    this.filename = filename;
  }
}

// ============================================
// Error Utilities
// ============================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'INTERNAL_ERROR',
      500,
      false,
      { originalError: error.name }
    );
  }

  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    false
  );
}

// ============================================
// Logging Utilities
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private static instance: Logger;
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatEntry(entry: LogEntry): string {
    if (this.isProduction) {
      // JSON format for production (structured logging)
      return JSON.stringify(entry);
    }
    // Human-readable format for development
    const { timestamp, level, message, context, error } = entry;
    let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (context) {
      output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }
    if (error) {
      output += `\n  Error: ${error.name} - ${error.message}`;
      if (error.stack) {
        output += `\n  Stack: ${error.stack}`;
      }
    }
    return output;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: this.isProduction ? undefined : error.stack,
            code: isAppError(error) ? error.code : undefined,
          }
        : undefined,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case 'debug':
        if (!this.isProduction) console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }
}

export const logger = Logger.getInstance();

// ============================================
// API Error Response Helper
// ============================================

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function createErrorResponse(error: unknown): {
  body: ApiErrorResponse;
  status: number;
} {
  const appError = normalizeError(error);

  logger.error(
    `API Error: ${appError.message}`,
    appError,
    appError.context
  );

  return {
    body: {
      success: false,
      error: {
        code: appError.code,
        message: appError.isOperational
          ? appError.message
          : 'An unexpected error occurred',
        details: appError.isOperational ? appError.context : undefined,
      },
    },
    status: appError.statusCode,
  };
}
