module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/src/main.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'auth-svc',
      script: 'dist/apps/auth-svc/src/main.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'backoffice-svc',
      script: 'dist/apps/backoffice-svc/src/main.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
