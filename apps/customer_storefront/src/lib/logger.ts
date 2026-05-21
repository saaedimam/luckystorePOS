// Logger for standardizing observability in Customer Storefront

type LogLevel = 'info' | 'warn' | 'error' | 'critical';

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const payload = { timestamp, level, message, data };

    // Next.js specific environment check
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case 'info':
          // eslint-disable-next-line no-console
          console.info(`[INFO] ${timestamp} - ${message}`, data || '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(`[WARN] ${timestamp} - ${message}`, data || '');
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(`[ERROR] ${timestamp} - ${message}`, data || '');
          break;
        case 'critical':
          // eslint-disable-next-line no-console
          console.error(`[CRITICAL] ${timestamp} - ${message}`, data || '');
          break;
      }
    } else {
      // In production, we might want to send this to a service (e.g., Sentry)
      if (level === 'error' || level === 'critical') {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(payload));
      }
    }
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data);
  }

  critical(message: string, data?: unknown) {
    this.log('critical', message, data);
  }
}

export const logger = new Logger();
