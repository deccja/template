import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable streaming
    serverActions: {
      // Increase body parser size limit to handle large uploads
      bodySizeLimit: '52mb', // Slightly larger than our 50MB limit
    },
  },
};

export default nextConfig;
