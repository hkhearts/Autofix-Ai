/** @type {import('next').NextConfig} */
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
