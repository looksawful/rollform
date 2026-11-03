import type { NextConfig } from 'next';

// On GitHub Pages project sites, set BASE_PATH to "/repository-name" in Actions.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
};
export default nextConfig;
