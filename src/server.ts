import { app } from "./app";
import { env } from "./config/env";

const HOST = env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

const startServer = (port: number): void => {
  const server = app.listen(port, HOST, () => {
    console.log(`CafES APP backend listening on http://${HOST}:${port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} is busy. Attempting port ${port + 1}...`);
      server.close();
      startServer(port + 1);
      return;
    }

    console.error(`Server error on port ${port}:`, error);
    process.exit(1);
  });
};

startServer(env.PORT);
