import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiApp from "./artifacts/api-server/src/app";
import { ensureAdminAccount } from "./artifacts/api-server/src/lib/auth";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize admin user if needed
  try {
    await ensureAdminAccount();
  } catch (err) {
    console.warn("[AI Studio] Admin account init notice:", err);
  }

  // Mount API server (/api/*)
  app.use(apiApp);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const clientDir = path.resolve(process.cwd(), "artifacts/legal-assistance");

  // Development: Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: path.resolve(clientDir, "vite.config.ts"),
      root: clientDir,
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    const distPath = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nyaya Legal Assistance Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
