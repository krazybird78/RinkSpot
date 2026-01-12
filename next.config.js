/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
        // Disable image optimization for pixel art
        unoptimized: true,
    },
    // Enable PWA in production
    ...(process.env.NODE_ENV === 'production' && {
        experimental: {
            optimizeCss: true,
        },
    }),
};

module.exports = nextConfig;
