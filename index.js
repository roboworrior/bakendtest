const express = require('express');
const pool = require('./db'); // Adjust the path to your `db.js` file
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

// Route to fetch data
app.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM data');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Route to upload data
// app.post('/api/upload', async (req, res) => {
//     try {
//         const { id, title, price, catagory, codename, discription, img } = req.body;

//         // Validate required fields
//         if (!id || !title || !price || !catagory || !codename || !discription) {
//             return res.status(400).json({ message: 'Missing required fields' });
//         }

//         // Use the provided `img` value or set a default image path
//         const imgPath = img || 'https://example.com/default-image.jpg';

//         // Construct the query
//         const query = 'INSERT INTO data(name, img, catagory, price, discr, codename, id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
//         const values = [title, imgPath, catagory, price, discription, codename, id];

//         // Execute the query
//         const result = await pool.query(query, values);

//         // Respond with the inserted data
//         res.status(201).json(result.rows[0]);
//     } catch (error) {
//         console.error('Error saving data:', error);
//         res.status(500).json({ message: 'Error saving data' });
//     }
// });

// Export the app for Vercel
module.exports = app;