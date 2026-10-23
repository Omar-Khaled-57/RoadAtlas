/** Intentional, client-safe API failures. Anything else is treated as a server fault. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): ApiError =>
  new ApiError(400, message, details);

export const unauthorized = (message = 'Authentication required.'): ApiError =>
  new ApiError(401, message);

export const forbidden = (message = 'Not allowed.'): ApiError => new ApiError(403, message);

export const notFound = (message = 'Not found.'): ApiError => new ApiError(404, message);

export const conflict = (message: string): ApiError => new ApiError(409, message);

export const unavailable = (message: string): ApiError => new ApiError(503, message);
