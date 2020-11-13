export interface CacheFlowConfiguration {
  redis?: RedisCacheConfiguration;
  logger?: LoggerInterface;
}

export interface RedisCacheConfiguration {
  host: string;
  port: number;
  db?: number;
}

export interface LoggerInterface {
  trace?(message: any, ...args: any[]): void;

  debug(message: any, ...args: any[]): void;

  info(message: any, ...args: any[]): void;

  warn(message: any, ...args: any[]): void;

  error(message: any, ...args: any[]): void;

  fatal?(message: any, ...args: any[]): void;
}

export class DummyLogger implements LoggerInterface {
  public debug(message: any, ...args: any[]): void {
  }

  public error(message: any, ...args: any[]): void {
  }

  public fatal(message: any, ...args: any[]): void {
  }

  public info(message: any, ...args: any[]): void {
  }

  public trace(message: any, ...args: any[]): void {
  }

  public warn(message: any, ...args: any[]): void {
  }

}
