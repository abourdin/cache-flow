import * as log4js from 'log4js';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function configureLogger(): any {
  const logger = log4js.getLogger();
  logger.level = 'debug';
  log4js.configure({
    appenders: {
      out: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%f{1}]:%] %m'
        }
      }
    },
    categories: {
      default: {
        appenders: ['out'],
        level: 'debug',
        enableCallStack: true
      }
    }
  });
  return logger;
}
