import { app } from "./app";
import { env } from "./config/env";

const startServer = (port: number): void => {
  const server = app.listen(port, () => {
    console.log(`CafES APP backend listening on port ${port}`);
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
