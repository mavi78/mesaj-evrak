export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export class AppError extends Error {
  public readonly code: string
  public readonly severity: ErrorSeverity
  public readonly metadata?: Record<string, any>

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = 'MEDIUM',
    metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.severity = severity
    this.metadata = metadata
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    severity: ErrorSeverity = 'CRITICAL',
    metadata?: Record<string, any>
  ) {
    super(message, 'DATABASE_ERROR', severity, metadata)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 'MEDIUM', metadata)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', 'CRITICAL', metadata)
    this.name = 'NetworkError'
  }
}
