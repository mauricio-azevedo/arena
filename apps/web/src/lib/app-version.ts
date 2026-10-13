import { version } from '../../package.json';

// Single source for the version shown in-app (profile footer): the package
// version itself, so the footer can't drift from the release.
export const APP_VERSION = version;
