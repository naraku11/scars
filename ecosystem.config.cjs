// PM2 process manager config — used on Hostinger VPS
// Start: pm2 start ecosystem.config.cjs
// Save:  pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'scars',
      script: 'server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
}
