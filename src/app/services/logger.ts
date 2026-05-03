/**
 * ============================================================================
 * CENTRALIZED LOGGING SERVICE
 * ============================================================================
 *
 * Purpose:
 * - Single point of control for all application logging
 * - Environment-based log suppression
 * - Structured logging support
 * - No sensitive data exposure in production
 *
 * Usage:
 * - logger.debug() - Development only, suppressed in production
 * - logger.log() - Info-level logs, development only
 * - logger.warn() - Warnings, shown in all environments
 * - logger.error() - Errors, shown in all environments
 *
 * Rule: Do NOT use console.log directly - always use this logger
 *
 * ============================================================================
 */

type LogLevel = 'debug' | 'log' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  }

  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    if (context) {
      console.log(`[DEBUG] ${message}`, this.sanitizeContext(context));
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  log(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    if (context) {
      console.log(`[INFO] ${message}`, this.sanitizeContext(context));
    } else {
      console.log(`[INFO] ${message}`);
    }
  }

  /**
   * Warning-level logging (all environments)
   * Use for non-critical issues that should be investigated
   */
  warn(message: string, context?: LogContext): void {
    if (context) {
      console.warn(`[WARN] ${message}`, this.sanitizeContext(context));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Error-level logging (all environments)
   * Use for errors that need immediate attention
   */
  error(message: string, error?: Error | LogContext): void {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      });
    } else if (error) {
      console.error(`[ERROR] ${message}`, this.sanitizeContext(error));
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Sanitize context to remove sensitive data
   * Redacts: names, IDs, personal information
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = [
      'employeeName',
      'name',
      'phoneNumber',
      'phone',
      'email',
      'address',
      'password',
      'token',
      'apiKey',
      'secret',
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();

      // Redact sensitive keys
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Group logging for related messages (development only)
   */
  group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(label);
  }

  /**
   * End grouped logging (development only)
   */
  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogContext };
