const mysql = require('mysql');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bookings'
});
// const connection = mysql.createConnection({
//     host: 'auth-db921.hstgr.io',
//     user: 'u553527036_ebadmin',
//     password: 'ebAdmin1920',
//     database: 'u553527036_ebAdmin'
// });

pool.on('connection', (connection) => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});


module.exports = pool;
