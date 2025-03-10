const express = require('express');  
const pool = require('./db');  
const cors = require('cors');  

const app = express();  

// Middleware  
app.use(express.json());  
app.use(cors());  
// Example route to test the database connection  
app.get('/test', async (req, res) => {  
  try {  
    const result = await pool.query('SELECT * FROM userinfo');  
    res.json(result.rows);  

  } catch (err) {  
    console.error(err);  
    res.status(500).json({ message: 'Database error' });  
  }  
});  


app.post('/api/submit', async (req, res) => {  
    try {  
        const { name, phone_number } = req.body;  
        const result = await pool.query('INSERT INTO userinfo(name,phone_number) VALUES ($1, $2) RETURNING *',[name, phone_number]);  

        res.status(201).json(result.rows[0]);  
    } 
    
    catch (error) {  
        console.error('Error saving data:', error);  
        res.status(500).json({ message: 'Error saving data' });  
    }  
}); 



const PORT = process.env.PORT || 3000;  
app.listen(PORT, () => {  
  console.log(`Server running on port ${PORT}`);  
});  