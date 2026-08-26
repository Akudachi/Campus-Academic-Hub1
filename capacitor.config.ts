import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for Campus Academic Hub Android App
 * 
 * - In Embedded Mode: loads the local web assets from 'dist' and connects to
 *   the live backend database API (https://ais-dev-pddxzxafw552ox4hvqxawi-392829429613.asia-southeast1.run.app)
 * - In Live Server Mode: you can uncomment server.url to load the remote live web app directly.
 */
const config: CapacitorConfig = {
  appId: 'com.klecet.campushub',
  appName: 'Campus Academic Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'https://ais-dev-pddxzxafw552ox4hvqxawi-392829429613.asia-southeast1.run.app',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  }
};

export default config;
