import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  transpilePackages: ['@ajabadia/ecosystem-widgets', '@ajabadia/styles', '@ajabadia/satellite-sdk', 'next-intl'],
  webpack: (config, { isServer }) => {
    if (config.resolve && !config.resolve.extensionAlias) {
      config.resolve.extensionAlias = {
        '.js': ['.ts', '.tsx', '.js'],
        '.mjs': ['.mts', '.mjs'],
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
