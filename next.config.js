/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
    domains: [
      'lh3.googleusercontent.com',  // Google Auth profile images
      'firebasestorage.googleapis.com',  // Firebase Storage images
      'storage.googleapis.com',
      'datingapp5.appspot.com',
      'datingapp5.firebasestorage.app'
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle the undici module
    config.module.rules.push({
      test: /\.js$/,
      include: [
        /node_modules\/undici/,
        /node_modules\/@firebase\/storage/,
        /node_modules\/firebase/
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    });
    return config;
  }
};

module.exports = nextConfig 