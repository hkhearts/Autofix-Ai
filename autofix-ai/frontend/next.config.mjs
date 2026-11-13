/** @type {import('next').NextConfig} */
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "";

const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: configuredApiUrl,
  },
  output: "standalone",
};

export default nextConfig;
