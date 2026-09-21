import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  turbopack: { root: process.cwd() },
  devIndicators: false,
};
export default config;
