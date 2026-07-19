/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.11'],
  async redirects() {
    return [
      {
        source: '/onboarding',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
