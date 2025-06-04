const sql = require('mssql/msnodesqlv8');

const config = {
  server: 'DESKTOP-QON7004',
  database: 'master',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    encrypt: false,
    instanceName: 'EVALUATIONSQL22',
  }
};

sql.connect(config)
  .then(pool => pool.request().query('SELECT 1 AS number'))
  .then(result => {
    console.log(result);
    sql.close();
  })
  .catch(err => {
    console.error('Connection error:', err);
    sql.close();
  });