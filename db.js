const { Pool } = require('pg');  

// Replace this with your Neon connection string  
const connectionString = 'postgresql://neondb_owner:npg_35vQNnJsZjcR@ep-cool-heart-a8dg10ct-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';

// Create a new pool  
const pool = new Pool({  
  connectionString,  
  ssl: {  
    rejectUnauthorized: false  
  }  
});  

module.exports = pool;  