import { app } from "./app";
import { env } from "./config/env";

const preferredPort = env.PORT;

const server = app.listen(preferredPort, () => {
  console.log(`CafES APP backend listening on port ${preferredPort}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    const fallbackPort = preferredPort + 1;
    console.warn(`Port ${preferredPort} is busy. Retrying on ${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      console.log(`CafES APP backend listening on port ${fallbackPort}`);
    });
    return;
  }

  throw error;
});
