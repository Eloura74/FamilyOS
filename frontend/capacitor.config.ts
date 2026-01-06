import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.familyos.app",
  appName: "FamilyOS",
  webDir: "dist",
  server: {
    androidScheme: "http",
    cleartext: true,
    allowNavigation: ["*"],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
