/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable server-side features for Tauri compatibility
  experimental: {
    // Ensure client-side rendering for Tauri
  },
};

module.exports = nextConfig;




