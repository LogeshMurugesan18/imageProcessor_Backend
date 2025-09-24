const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  user: process.env.DB_USER,                
  password: process.env.DB_PASSWORD,        
  server: process.env.DB_SERVER,            
  database: process.env.DB_DATABASE,        
  port: parseInt(process.env.DB_PORT, 10) || 1500, 
  options: {
    encrypt: false,                         
    trustServerCertificate: true            
  },
  pool: {
    max: 10,                                
    min: 0,                                 
    idleTimeoutMillis: 30000               
  }
};


const connectToSQL = async () => {
  try {
    await sql.connect(config);
    console.log('Connected to SQL Server successfully');
  } catch (error) {
    console.error('Failed to connect to SQL Server');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
};

connectToSQL();

module.exports = sql;
