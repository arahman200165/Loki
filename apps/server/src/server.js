import app from "./app.js";
import { env } from "./config/env.js";
import { closePool } from "./db/pool.js";
import { ensureAuthSchema } from "./db/initAuthSchema.js";

const port = process.env.PORT || env.port || 3000;

let server = null;

const start = async () => {
  try {
    await ensureAuthSchema();

    server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to initialize auth schema:", error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down...`);
  if (!server) {
    await closePool();
    process.exit(0);
  }

  server.close(async () => {
    try {
      await closePool();
    } finally {
      process.exit(0);
    }
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void start();
