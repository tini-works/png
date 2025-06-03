import { Elysia } from 'elysia';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = new Elysia()
  .onError(({ code, error, set }) => {
    console.error('Error:', error);

    // Handle AppError (operational errors)
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          message: error.message,
          code: error.statusCode,
        },
      };
    }

    // Handle validation errors
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 400,
          details: error.message,
        },
      };
    }

    // Handle other errors
    set.status = 500;
    return {
      success: false,
      error: {
        message: 'Internal server error',
        code: 500,
      },
    };
  });

