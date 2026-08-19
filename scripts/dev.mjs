import { spawn } from "node:child_process";
import { copyFileSync, existsSync, rmSync } from "node:fs";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 3000;
const hostname = "0.0.0.0";

function canConnect(host) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host });
    socket.setTimeout(400);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

async function portBusy() {
  const [v4, v6] = await Promise.all([canConnect("127.0.0.1"), canConnect("::1")]);
  return v4 || v6;
}

if (!existsSync(path.join(root, "node_modules", "next"))) {
  console.error("Missing dependencies. Run npm install in this folder, then npm run dev again.");
  process.exit(1);
}

const envLocal = path.join(root, ".env.local");
const envExample = path.join(root, ".env.example");
if (!existsSync(envLocal) && existsSync(envExample)) {
  copyFileSync(envExample, envLocal);
  console.log("Created .env.local from .env.example");
}

if (!(await portBusy())) {
  rmSync(path.join(root, ".next", "dev", "lock"), { force: true });
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const extra = process.argv.slice(2);
const args = [nextBin, "dev", "--hostname", hostname, "--port", String(port), ...extra];

console.log(`Starting UBBIM CRM on http://127.0.0.1:${port}`);
console.log("Keep this terminal open. Open the URL only after Next.js prints Ready.");

const child = spawn(process.execPath, args, {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: hostname,
    PORT: String(port),
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
