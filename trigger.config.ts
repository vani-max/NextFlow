import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_komoaxrxxnvayypdgzcd",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledByDefault: false, // Disable retries globally
  },
  dirs: ["src/trigger"],
});
