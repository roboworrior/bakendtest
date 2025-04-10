const express = require('express');  
const pool = require('./db');  
const cors = require('cors');  

const bcrypt = require('bcrypt');
const app = express(); 

const multer = require('multer');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// const cloudinary = require('cloudinary').v2;



// cloudinary.config({
//     cloud_name: 'dmggc4lcn',
//     api_key: '754923437147375',
//     api_secret: 'gg0oFpon86daeGYMkSImRdDUVik',
// });

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

app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { id, title, price, catagory, codename, discription } = req.body;

        if (!id || !title || !price || !catagory || !codename || !discription) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let imgUrl = null;

        if (req.file) {
            // Upload the image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
            imgUrl = result.secure_url; // Get the URL of the uploaded image
        }

        // Save the data to your database
        const query = 'INSERT INTO data(name, img, catagory, price, discr, codename, id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const values = [title, imgUrl, catagory, price, discription, codename, id];

        const dbResult = await pool.query(query, values);

        res.status(201).json(dbResult.rows[0]);
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

         // Check if the user exists
         const user = await pool.query('SELECT * FROM logindata WHERE email = $1', [email]);

         if (user.rows.length === 0) {
             return res.status(401).json({ message: 'Invalid email or password' });
         }
 
         // Compare the provided password with the hashed password
         const validPassword = await bcrypt.compare(password, user.rows[0].password);
 
         if (!validPassword) {
             return res.status(401).json({ message: 'Invalid email or password' });
         }
         
         res.status(200).json({ message: 'Login successful', user: user.rows[0] });
   
         
    } 
    
    catch (error) {  
        console.error('Error saving data:', error);  
        res.status(500).json({ message: 'Error saving data' });  
    }  
}); 

app.post('/api/registor', async (req, res) => {  
    try {  
        const { username,password,email} = req.body;  
       
        const hashedPassword = await bcrypt.hash(password,10); // Hash the password

        const result = await pool.query('INSERT INTO logindata(username,password,email) VALUES ($1, $2,$3) RETURNING *',[username,hashedPassword,email]);  

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