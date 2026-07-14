import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

async function backendHealthy() {
  try {
    const res = await fetch("http://localhost:3001/api/health", { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.service === "cafes-app-backend";
  } catch {
    return false;
  }
}

function run(label, args) {
  return spawn(npmCmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
}

const healthy = await backendHealthy();

if (healthy) {
  console.log("[dev:kiosk] Backend ya activo en http://localhost:3001 — solo arrancando frontend.");
  const web = run("web", ["run", "dev:client:kiosk"]);
  web.on("exit", (code) => process.exit(code ?? 0));
} else {
  console.log("[dev:kiosk] Arrancando backend (3001) y frontend (5180)...");
  const api = run("api", ["run", "dev"]);
  const web = run("web", ["run", "dev:client:kiosk"]);

  let apiExited = false;
  api.on("exit", (code) => {
    apiExited = true;
    if (code && code !== 0) {
      console.error("[dev:kiosk] Backend no pudo arrancar. Cierra otros `npm run dev` y reintenta.");
      web.kill();
      process.exit(code);
    }
  });

  web.on("exit", (code) => {
    if (!apiExited) api.kill();
    process.exit(code ?? 0);
  });
}
