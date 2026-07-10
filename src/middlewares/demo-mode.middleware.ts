import { NextFunction, Request, Response } from "express";

import { env } from "../config/env";

const blockedPrefixes = [
  "/auth/register",
  "/payments/",
  "/admin/print-test-ticket",
  "/admin/products",
  "/admin/students/",
  "/admin/settings/",
  "/family/links/",
  "/family/link",
  "/family/token",
  "/me",
];

/** Keeps a public portfolio demo read-only while allowing a simulated checkout. */
export function demoModeMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (env.DEMO_MODE !== "true" || req.method === "GET" || req.method === "HEAD") {
    next();
    return;
  }

  if (req.method === "POST" && req.path === "/orders") {
    res.status(201).json({
      id: `demo-${Date.now()}`,
      status: "PENDING",
      simulated: true,
      message: "Pedido simulado: no se ha realizado ningún cobro ni guardado datos.",
    });
    return;
  }

  if (blockedPrefixes.some((prefix) => req.path.startsWith(prefix)) || req.path.startsWith("/orders/")) {
    res.status(403).json({
      message: "Acción desactivada en la demo pública. Los datos son de solo lectura.",
      demo: true,
    });
    return;
  }

  next();
}
