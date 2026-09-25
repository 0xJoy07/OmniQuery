import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => [
    // Auth routes → Express
    {
      source: '/api/auth/:path*',
      destination: 'http://localhost:5001/api/auth/:path*',
    },
    // RAG query routes → Express (which proxies to Flask)
    {
      source: '/api/query/:path*',
      destination: 'http://localhost:5001/api/query/:path*',
    },
    // Health check → Express
    {
      source: '/api/health',
      destination: 'http://localhost:5001/api/health',
    },
    // Chat storage routes → Express
    {
      source: '/api/chat/:path*',
      destination: 'http://localhost:5001/api/chat/:path*',
    },
  ],
};

export default nextConfig;
