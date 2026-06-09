/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
                protocol: "https",
                hostname: "pdfdex.com",
            },
            {
                protocol: "http",
                hostname: "localhost",
            },
            {
                protocol: "http",
                hostname: "127.0.0.1",
            },
            {
                protocol: "http",
                hostname: "152.53.114.69",
            },
        ],
    },
    // Turbopack is the default in Next.js 16. Adding an empty config silences
    // the warning about having a `webpack` config but no `turbopack` config.
    turbopack: {},
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
};

export default nextConfig;