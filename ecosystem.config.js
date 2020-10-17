module.exports = {
  apps: [
    {
      name: 'TipBot-test',
      script: './app.js',
      cwd: '/root/TipBot-master-test',
      instance_id_env: '0',
      watch: true,
      ignore_watch : ['node_modules', 'Logs', 'Downloads', '.git'],
      error_file:
        '/root/TipBot-master-test/Logs/tipbot-err.log',
      out_file: '/root/TipBot-master-test/Logs/tipbot-out.log',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
