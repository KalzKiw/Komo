import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

const demoDefaults = {
  DEMO_MODE: "true",
  VITE_DEMO_MODE: "true",
  VITE_API_BASE_URL: "",
  SUPABASE_URL: "https://placeholder.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "local-demo-service-role-key",
  SUPABASE_ANON_KEY: "local-demo-anon-key",
  PRINT_WORKER_ENABLED: "false",
};

const forceDemoKeys = new Set(["DEMO_MODE", "VITE_DEMO_MODE"]);

function parseEnv(content) {
  const entries = new Map();
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    entries.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  return entries;
}

function serializeEnv(entries) {
  return `${[...entries.entries()].map(([key, value]) => `${key}=${value}`).join("\n")}\n`;
}

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("[dev:kiosk] Missing .env.example. Cannot bootstrap local environment.");
    process.exit(1);
  }

  copyFileSync(examplePath, envPath);
  console.log("[dev:kiosk] Created .env from .env.example");
}

const entries = parseEnv(readFileSync(envPath, "utf8"));
let changed = false;

for (const [key, value] of Object.entries(demoDefaults)) {
  const current = entries.get(key);
  if (
    forceDemoKeys.has(key) ||
    !current ||
    current.includes("your-") ||
    current.includes("placeholder")
  ) {
    entries.set(key, value);
    changed = true;
  }
}

if (changed) {
  writeFileSync(envPath, serializeEnv(entries));
  console.log("[dev:kiosk] Applied local demo defaults to .env");
}

// Optional vars left blank in .env.example break zod parsing on the backend.
for (const optionalKey of ["PRINT_WORKER_IGNORE_BEFORE", "STRIPE_SECRET_KEY", "VITE_STRIPE_PUBLISHABLE_KEY"]) {
  if (entries.get(optionalKey) === "") {
    entries.delete(optionalKey);
    writeFileSync(envPath, serializeEnv(entries));
  }
}

console.log("[dev:kiosk] Environment ready.");
console.log("[dev:kiosk] Komo kiosko: http://localhost:5180/kiosk");
console.log("[dev:kiosk] Demo login: student1@cafes.app / demo");
console.log("[dev:kiosk] Nota: el puerto 5173 puede estar ocupado por otro proyecto (ClarivHub).");
