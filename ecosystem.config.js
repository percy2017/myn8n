module.exports = {
  apps: [
    {
      name: 'n8n',
      script: '/usr/bin/n8n',
      args: 'start',
      env: {
        N8N_PORT: 2004,
        N8N_PROTOCOL: 'http',
        WEBHOOK_URL: 'http://217.216.43.75:2004/',
        N8N_SECURE_COOKIE: false
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/percyalvarez/web/n8n.percyalvarez.lat/public_html/logs/n8n-error.log',
      out_file: '/home/percyalvarez/web/n8n.percyalvarez.lat/public_html/logs/n8n-out.log'
    }
  ]
};
