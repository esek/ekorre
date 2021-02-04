import util from 'util';

enum LogLevel {
  normal,
  info,
  debug,
  error,
  warn,
}

/**
 * En simpel loggare. Bör vidareutvecklas.
 */
class Logger {
  public static getLogger(name: string): Logger {
    return new Logger(name);
  }

  public static getLogLevelFromString(logLevel: string) {
    switch (logLevel.toLowerCase()) {
      case 'normal':
        return LogLevel.normal;
      case 'info':
        return LogLevel.info;
      case 'error':
        return LogLevel.error;
      case 'debug':
        return LogLevel.debug;
      case 'warn':
        return LogLevel.warn;
      default:
        return LogLevel.normal;
    }
  }

  public static pretty(o: unknown): string {
    return util.inspect(o, { colors: true });
  }

  public static logLevel: LogLevel;

  private c: Console;

  private loggerName: string;

  private constructor(name: string) {
    this.c = console;
    this.loggerName = name;
  }

  private l(prefix: string, o: unknown | string) {
    if (typeof o === 'string') this.c.log(`${prefix} ${o}`);
    else this.c.log(`${prefix} ${util.inspect(o, { colors: true })}`);
  }

  private e(prefix: string, o: unknown | string) {
    if (typeof o === 'string') this.c.error(`${prefix} ${o}`);
    else this.c.error(`${prefix} ${util.inspect(o, { colors: true })}`);
  }

  private w(prefix: string, o: unknown | string) {
    if (typeof o === 'string') this.c.warn(`${prefix} ${o}`);
    else this.c.warn(`${prefix} ${util.inspect(o, { colors: true })}`);
  }

  private i(prefix: string, o: unknown | string) {
    if (typeof o === 'string') this.c.info(`${prefix} ${o}`);
    else this.c.info(`${prefix} ${util.inspect(o, { colors: true })}`);
  }

  private d(prefix: string, o: unknown | string) {
    if (typeof o === 'string') this.c.debug(`${prefix} ${o}`);
    else this.c.debug(`${prefix} ${util.inspect(o, { colors: true })}`);
  }

  public log(o: unknown): void {
    switch (Logger.logLevel) {
      case LogLevel.normal:
      case LogLevel.info:
      case LogLevel.debug:
        this.l(`[${this.loggerName}]:`, o);
        break;
      default:
        break;
    }
  }

  public info(o: unknown): void {
    switch (Logger.logLevel) {
      case LogLevel.info:
        this.i(`[${this.loggerName}:info]:`, o);
        break;
      default:
        break;
    }
  }

  public debug(o: unknown): void {
    switch (Logger.logLevel) {
      case LogLevel.debug:
        this.d(`[${this.loggerName}:debug]:`, o);
        break;
      default:
        break;
    }
  }

  public warn(o: unknown): void {
    switch (Logger.logLevel) {
      case LogLevel.normal:
      case LogLevel.info:
      case LogLevel.debug:
      case LogLevel.warn:
        this.w(`[${this.loggerName}:warn]:`, o);
        break;
      default:
        break;
    }
  }

  public error(o: unknown): void {
    switch (Logger.logLevel) {
      case LogLevel.error:
      case LogLevel.normal:
      case LogLevel.info:
      case LogLevel.debug:
        this.e(`[\x1b[31m${this.loggerName}\x1b[0m]:`, o);
        break;
      default:
        break;
    }
  }
}

export { LogLevel, Logger };
