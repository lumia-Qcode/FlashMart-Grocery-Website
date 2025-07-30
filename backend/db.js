
//CREATE CONNECTION WITH THE DATABASE

const sql = require('mssql');
const config = {
    server:'DESKTOP-NIHAAL\\SQLEXPRESS',
    database:'FlashMart',
    user: 'sa',
    password: '123456',
  options:
  {
    encrypt:false,
    enableArithAbort:true,
    trustServerCertificate: true

  },

  port:`1433`

  };
  

  
// Create connection pool

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to database');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed: ', err);
    throw err;
  });

module.exports = {
  sql, poolPromise
};