/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/remote-meet',
  assetPrefix: '/remote-meet/',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
