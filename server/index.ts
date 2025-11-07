import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Readiness flag - gates API routes until initialization completes
let isReady = false;
let initializationError: Error | null = null;

// Health check endpoint - ALWAYS returns 200 for deployment health checks
// This is checked by the deployment platform to verify the server is running
app.head("/", (_req, res) => {
  res.status(200).end();
});

app.get("/", (_req, res, next) => {
  // During initialization, return a simple 200 for health checks
  // but if it's a browser request (accepts HTML), pass through to static serving
  const acceptsHtml = _req.accepts('html');
  
  if (!isReady && !acceptsHtml) {
    // Non-browser request during initialization - return simple 200 for health check
    return res.status(200).json({ status: "initializing" });
  }
  
  // Once ready, or if browser request, pass through to static file serving
  next();
});

// Alternative health check endpoint
app.get("/healthz", (_req, res) => {
  if (isReady) {
    res.status(200).json({ status: "ready" });
  } else if (initializationError) {
    res.status(503).json({ 
      status: "error", 
      message: initializationError.message 
    });
  } else {
    res.status(503).json({ status: "initializing" });
  }
});

// Global readiness middleware - gates API requests during initialization
app.use((req, res, next) => {
  // Skip readiness check for health check endpoints
  if (req.path === "/healthz" || req.path === "/") {
    return next();
  }

  // Block API requests until initialization completes
  if (!isReady && req.path.startsWith("/api")) {
    console.log(`⏸️  Request blocked during initialization: ${req.method} ${req.path}`);
    if (initializationError) {
      return res.status(503).json({ 
        message: "Service unavailable - initialization failed",
        error: initializationError.message 
      });
    }
    return res.status(503).json({ 
      message: "Service initializing - please wait" 
    });
  }

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create HTTP server immediately
const server = createServer(app);

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
const port = parseInt(process.env.PORT || '5000', 10);

// Start listening immediately - BEFORE initialization
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`serving on port ${port}`);
  console.log("✅ Server listening on port", port);
  console.log("🚀 Starting background initialization...");
});

// Initialize in background - don't block server startup
(async () => {
  try {
    // Set up static file serving FIRST - this should never be blocked
    // Static files don't depend on database or routes being ready
    if (app.get("env") === "development") {
      await setupVite(app, server);
      console.log("✅ Vite development server configured");
    } else {
      serveStatic(app);
      console.log("✅ Static file serving configured");
    }

    // Now register routes (includes storage initialization)
    await registerRoutes(app, server);
    console.log("✅ Routes registered successfully");

    // Error handler after routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("❌ Request error:", { status, message, error: err });
      res.status(status).json({ message });
    });

    // Mark as ready
    isReady = true;
    console.log("✅ Server initialization complete - ready to serve requests");
  } catch (error) {
    console.error("💥 Initialization failed:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    initializationError = error instanceof Error ? error : new Error(String(error));
    // Don't exit - keep server running to report unhealthy status
  }
})();
