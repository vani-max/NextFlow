import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "your_project_id",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  dirs: ["src/trigger"],
});
