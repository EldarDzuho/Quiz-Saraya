module.exports = {
  apps: [{
    name: 'Saraya-Quiz',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/SarayaQuiz',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
  }]
}
