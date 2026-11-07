/**
 * API URL resolver for Autofix-AI.
 * Automatically resolves to the live production Render backend when hosted on onrender.com,
 * while allowing local development on http://localhost:8000.
 */
export const getApiUrl = (): string => {
  if (
    process.env.NEXT_PUBLIC_API_URL &&
    process.env.NEXT_PUBLIC_API_URL !== "http://localhost:8000" &&
    process.env.NEXT_PUBLIC_API_URL !== "http://127.0.0.1:8000"
  ) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Automatic Render cloud detection
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("onrender.com") ||
      window.location.hostname.includes("render"))
  ) {
    return "https://autofix-ai-backend-51vk.onrender.com";
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};
