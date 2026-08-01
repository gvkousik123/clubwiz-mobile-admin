/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['storage.googleapis.com'],
  },
  // Add redirects from old routes to /bz/ routes for backward compatibility
  async redirects() {
    return [
      // Auth routes
      { source: '/auth/intro', destination: '/bz/auth/intro', permanent: true },
      { source: '/auth/login', destination: '/bz/auth/login', permanent: true },
      { source: '/auth/signup', destination: '/bz/auth/signup', permanent: true },
      { source: '/auth/register', destination: '/bz/auth/register', permanent: true },
      { source: '/auth/mobile', destination: '/bz/auth/mobile', permanent: true },
      { source: '/auth/otp', destination: '/bz/auth/otp', permanent: true },
      { source: '/auth/details', destination: '/bz/auth/details', permanent: true },
      { source: '/auth/forgot-password', destination: '/bz/auth/forgot-password', permanent: true },
      // Business routes
      { source: '/business', destination: '/bz/business', permanent: true },
      { source: '/business/:path*', destination: '/bz/business/:path*', permanent: true },
      // Admin routes
      { source: '/admin', destination: '/bz/admin', permanent: true },
      { source: '/admin/:path*', destination: '/bz/admin/:path*', permanent: true },
      // Superadmin routes
      { source: '/superadmin', destination: '/bz/superadmin', permanent: true },
      { source: '/superadmin/:path*', destination: '/bz/superadmin/:path*', permanent: true },
    ];
  },
}

export default nextConfig
