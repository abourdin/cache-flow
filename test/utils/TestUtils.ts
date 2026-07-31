import * as log4js from 'log4js';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Runs an action with console.error stubbed out, and returns the arguments of every call it made.
 *
 * @param {Function} action the action to run
 * @return {any[][]} one entry per console.error call, holding the arguments it received
 */
export function captureConsoleError(action: () => void): any[][] {
  const calls: any[][] = [];
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    calls.push(args);
  };
  try {
    action();
  }
  finally {
    console.error = originalConsoleError;
  }
  return calls;
}

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
