const express = require('express');
const pool = require('../db'); // Adjust the path to your `db.js` file
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { id, title, price, catagory, codename, discription } = req.body;

        if (!id || !title || !price || !catagory || !codename || !discription) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

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

// Export the app for Vercel
module.exports = app;