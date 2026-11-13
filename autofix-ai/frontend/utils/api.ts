/**
 * API URL resolver for Autofix-AI.
 * Intelligently switches between local and deployed environments:
 * - Localhost / Private Network: connects to http://localhost:8000 (ensuring offline SQLite bank fallback works without internet)
 * - Cloud Deployment: connects to deployed cloud backend (e.g. Render, Railway, custom domain)
 */
export const getApiUrl = (): string => {
  // 1. Client-side hostname-based intelligent routing
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Local / offline / container network: always route to local FastAPI backend
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.")
    ) {
      return "http://localhost:8000";
    }

    // Render cloud deployment detection
    if (host.includes("onrender.com") || host.includes("render")) {
      return "https://autofix-ai-backend-51vk.onrender.com";
    }
  }

  // 2. Explicit environment variable if configured
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return "http://localhost:8000";
};
