import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.evfin.fieldapp',
  appName: 'ev.fin Field App',
  webDir: 'out',
  // Load the deployed Vercel app directly — no local bundle needed
  server: {
    url: 'https://ev-fin-los-lms.vercel.app/fso/login',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#042C53',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#042C53',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
