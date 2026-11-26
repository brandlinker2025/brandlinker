import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dashboardHandler from "./api/dashboard";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment variables securely from .env.local
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      const val = v.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[k.trim()] = val;
    }
  }
}

const PORT = 3848;

/**
 * STRICT SECURITY AUDIT:
 * Restrict static file serving to explicitly approved public assets.
 * Strictly block:
 * - .env files and environment secrets
 * - .git and repository internals
 * - Source code (.ts, .tsx, .js, .py, .sh)
 * - Configuration files (.json, .yml, .yaml, .toml)
 * - Private documents (docs/*, scratch/*, integration-foundation/*)
 * - Path traversal attempts (.., null bytes, encoded slashes)
 */
const APPROVED_STATIC_FILES = new Set([
  "index.html",
  "about.html",
  "brands.html",
  "contact.html",
  "dashboard.html",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "favicon.svg",
]);

const APPROVED_STATIC_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".svg",
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
  ".txt",
]);

function isRequestAllowed(relativePath: string): boolean {
  // 1. Block null bytes, directory traversal and path manipulation
  if (relativePath.includes("\0") || relativePath.includes("..") || relativePath.startsWith("/")) {
    return false;
  }

  // 2. Normalize and check path
  const normalized = path.normalize(relativePath).replace(/\\/g, "/");

  // 3. Block sensitive directories and hidden files (.env, .git, docs, src, etc.)
  if (
    normalized.startsWith(".") ||
    normalized.includes("/.") ||
    normalized.startsWith("src/") ||
    normalized.startsWith("docs/") ||
    normalized.startsWith("scratch/") ||
    normalized.startsWith("integration-foundation/") ||
    normalized.startsWith("api/") ||
    normalized.startsWith("node_modules/")
  ) {
    return false;
  }

  // 4. Check against root approved files or asset folder
  if (APPROVED_STATIC_FILES.has(normalized)) {
    return true;
  }

  if (normalized.startsWith("assets/")) {
    const ext = path.extname(normalized).toLowerCase();
    if (APPROVED_STATIC_EXTENSIONS.has(ext)) {
      return true;
    }
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Same-Origin Security Headers (No Wildcard CORS)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Dispatch to Vercel-compatible serverless handler
  if (pathname === "/api/dashboard") {
    return dashboardHandler(req, res);
  }

  // Handle static file requests
  const reqRelPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

  if (!isRequestAllowed(reqRelPath)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden: Access to requested resource is restricted.");
    return;
  }

  const filePath = path.join(__dirname, reqRelPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".webp": "image/webp",
      ".jpg": "image/jpeg",
      ".txt": "text/plain",
    };
    res.writeHead(200, { "Content-Type": mimeMap[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Hardened BrandLinkerBD Server running live at http://localhost:${PORT}/dashboard.html`);
});
