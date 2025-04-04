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

app.get('/data', async (req, res) => {  
  try {  
    const result = await pool.query('SELECT * FROM data');  
    res.json(result.rows);  

  } catch (err) {  
    console.error(err);  
    res.status(500).json({ message: 'Database error' });  
  }  
});  

app.post('/api/upload', async (req, res) => {
    try {
        const { id, title, price, catagory, codename, discription } = req.body;

        if (!id || !title || !price || !catagory || !codename || !discription) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if an image was uploaded
        const imgPath = null;

        let query = 'INSERT INTO data(name, catagory, price, discr, codename, id';
        let values = [title, catagory, price, discription, codename, id];
        let placeholders = '$1, $2, $3, $4, $5, $6';

        if (imgPath) {
            query += ', img';
            values.push(imgPath);
            placeholders += ', $7';
        }

        query += `) VALUES (${placeholders}) RETURNING *`;

        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data' });
    }
});

app.post('/api/submit', async (req, res) => {  
    try {  
        const { name, phone_number ,cartItems } = req.body;  
        console.log("this is the data",cartItems);
        
        const result = await pool.query('INSERT INTO userinfo(name,phone_number,cart) VALUES ($1, $2 ,$3) RETURNING *',[name, phone_number ,JSON.stringify(cartItems)]);  

        res.status(201).json(result.rows[0]);  
    } 
    
    catch (error) {  
        console.error('Error saving data:', error);  
        res.status(500).json({ message: 'Error saving data' });  
    }  
}); 

app.post('/api/login', async (req, res) => {  
    try {  
        const { email,password} = req.body;  
       
        // const result = await pool.query('INSERT INTO logindata(email,password) VALUES ($1, $2) RETURNING *',[email,password]);  

        const user = await pool.query('SELECT * FROM logindata WHERE email = $1', [email]);
        
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        alert("dsfdsf");
        
    } 
    
    catch (error) {  
        console.error('Error saving data:', error);  
        res.status(500).json({ message: 'Error saving data' });  
    }  
}); 

app.post('/api/registor', async (req, res) => {  
    try {  
        const { username,password,email} = req.body;  
       
        const result = await pool.query('INSERT INTO logindata(username,password,email) VALUES ($1, $2,$3) RETURNING *',[username,password,email]);  

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