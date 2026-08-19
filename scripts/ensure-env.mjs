import { copyFileSync, existsSync } from "node:fs";

if (!existsSync(".env.local") && existsSync(".env.example")) {
  copyFileSync(".env.example", ".env.local");
  console.log("Created .env.local from .env.example");
}
