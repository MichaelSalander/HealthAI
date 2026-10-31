module.exports = {
  apps: [{
    name: 'healthai-api',
    script: 'server/mock-api.mjs',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: 8787
    },
    autorestart: true,
    max_restarts: 10,
    time: true
  }]
}
