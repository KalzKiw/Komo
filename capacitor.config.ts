import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cafeteriasolo.komo",
  appName: "KOMO",
  webDir: "client-dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
