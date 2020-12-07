import * as log4js from 'log4js';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

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
const loggerInstance = log4js.getLogger();
loggerInstance.level = 'debug';
export const logger = loggerInstance;
