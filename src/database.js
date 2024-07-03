const mysql = require('mysql');
const connection = mysql.createConnection({
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


connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});

module.exports = connection;
