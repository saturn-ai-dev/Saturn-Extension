export const Browser = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  CHROMIUM: 'chromium',
  CHROMEHEADLESSSHELL: 'chrome-headless-shell',
};

export const ChromeReleaseChannel = {
  STABLE: 'stable',
  BETA: 'beta',
  DEV: 'dev',
  CANARY: 'canary',
};

export const WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX = /.*/;
export const CDP_WEBSOCKET_ENDPOINT_REGEX = /.*/;

export const detectBrowserPlatform = () => undefined;
export const resolveDefaultUserDataDir = () => '';
export const computeExecutablePath = () => '';
export const getInstalledBrowsers = async () => [];
export const resolveBuildId = async () => '';
export const uninstall = async () => {};
export const createProfile = async () => {};
export const launch = async () => {
  throw new Error('Puppeteer browser launch is not supported in this build.');
};

export class TimeoutError extends Error {}
