module.exports = {
  apps: [{
    name: 'lsport',
    cwd: './server',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '400M',
    out_file: '../logs/out.log',
    error_file: '../logs/err.log',
    merge_logs: true,
    time: true
  }]
};
