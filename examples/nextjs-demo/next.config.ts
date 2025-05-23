import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Automatically find available port if default is taken
  // This is handled by Next.js automatically, but we can configure it
  
  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Enable helpful development features
    reactStrictMode: true,
    
    // Custom server configuration could go here
    // Next.js automatically handles port detection
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    compress: true,
  }),
};

export default nextConfig;
