const { Pool } = require('pg');  

// Replace this with your Neon connection string  
const connectionString = process.env.DATABASE_URL;

// Create a new pool  
const pool = new Pool({ 
  connectionString,  
  ssl: {  
    rejectUnauthorized: false  
  }  
});  

module.exports = pool;  