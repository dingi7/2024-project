/** @type {import('next').NextConfig} */
const nextConfig = {
    // Remove the i18n config as we'll handle it differently in App Router
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
