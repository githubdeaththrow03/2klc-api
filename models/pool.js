const mysql = require('mysql');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Jahsehdwayneonfroy4!',
  database: '2KLC_DATABASE',
});

console.log('Pool created successfully.');

module.exports = pool;
