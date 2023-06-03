interface Logger {
  log: (...params: unknown[]) => void;
}
const DEBUGGING = true;
export const logger: Logger = DEBUGGING ? console : { log: () => {} };
