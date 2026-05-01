/// <reference path="./types/express.d.ts" />

import cors from "cors";
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config";
import { errorHandler } from "./middlewares/error.middleware";
import { apiRouter } from "./routes";

export const app = express();

// Serve the Vite React build (client-dist/) — falls back to legacy frontend/
const clientDistDir = path.resolve(process.cwd(), "client-dist");
const legacyFrontendDir = path.resolve(process.cwd(), "frontend");

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", apiRouter);

// React SPA — static assets
app.use("/", express.static(clientDistDir));
// Legacy vanilla app assets (CSS, JS modules, images)
app.use("/legacy", express.static(legacyFrontendDir));

// SPA fallback — any non-API, non-asset route returns index.html
app.get("*splat", (_req, res) => {
  res.sendFile(path.join(clientDistDir, "index.html"));
});

app.use(errorHandler);
