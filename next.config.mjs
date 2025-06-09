/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'out',
  basePath: '/remote-meet',
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
