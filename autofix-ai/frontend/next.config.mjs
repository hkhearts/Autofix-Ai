/** @type {import('next').NextConfig} */
const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://autofix-ai-backend-51vk.onrender.com"
    : "http://localhost:8000");

const apiUrl = /^https?:\/\//i.test(configuredApiUrl)
  ? configuredApiUrl
  : `https://${configuredApiUrl}${configuredApiUrl.includes(".") ? "" : ".onrender.com"}`;

const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  output: "standalone",
};

export default nextConfig;
