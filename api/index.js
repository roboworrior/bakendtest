const express = require('express');
const pool = require('../db');
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const cors = require('cors');

const app = express();

const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
require("dotenv").config();


const multer = require('multer');

// Configure multer to use memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});



//const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ;
const SECURE_API_KEY = process.env.SECURE_API_KEY;

const validateRequest = (req, res, next) => {
    //  const origin = req.headers.origin;
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== process.env.SECURE_API_KEY) {
        console.log(`🚫 Invalid API Key: ${apiKey}`);
        return res.status(403).json({ message: 'Access denied: Invalid API key' });
    }

    next();
};

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Replace with your Cloudinary cloud name
    api_key: process.env.CLOUDINARY_API_KEY, // Replace with your Cloudinary API key
    api_secret: process.env.CLOUDINARY_API_SECRET, // Replace with your Cloudinary API secret
});

// Middleware  
app.use(express.json());

app.use(express.urlencoded({ extended: true }));  // <-- VERY IMPORTANT

app.use(cors({
    // origin: ALLOWED_ORIGIN,
    //methods: ['POST','GET'],
    //credentials: true, // if using cookies/session
}));



// Example route to test the database connection  

app.get('/orders', auth, adminOnly, async (req, res) => {


    try {
        const result = await pool.query('SELECT * FROM userinfo');
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});



app.get('/data', validateRequest, async (req, res) => {
    console.log('💥 This is the upddated API');


    try {
        const result = await pool.query('SELECT * FROM data ORDER BY id DESC');
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }

});




app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { id, title, price, catagory, codename, discription } = req.body;

        if (!title || !price || !catagory || !codename || !discription) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let imgUrl = null;

        if (req.file) {
            console.log('Uploading file to Cloudinary...');
            const result = await cloudinary.uploader.upload_stream(
                { folder: 'uploads' }, // Optional: Specify a folder in Cloudinary
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return res.status(500).json({ message: 'Cloudinary upload failed' });
                    }
                    imgUrl = result.secure_url; // Get the URL of the uploaded image
                    console.log('File uploaded to Cloudinary:', imgUrl);

                    // Save the data to your database
                    const query = 'INSERT INTO data(name, img, catagory, price, discr, codename) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';

                    const values = [title, imgUrl, catagory, price, discription, codename];

                    pool.query(query, values, (err, dbResult) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ message: 'Database error', err });
                        }
                        res.status(201).json(dbResult.rows[0]);
                    });
                }
            );
            result.end(req.file.buffer); // Pass the file buffer to Cloudinary
        } else {
            return res.status(400).json({ message: 'No file uploaded' });
        }
    } catch (error) {
        console.error('Error in /upload:', error);
        return res.status(500).json({ message: 'end Error saving data' });
    }
});






app.post('/api/submit', async (req, res) => {
    try {
        const { name, phone_number, email, cartItems } = req.body;

        if (!email || !name || !phone_number || cartItems.length == 0) {
            return res.status(401).json({ message: 'Please fill in all the required fields.' });
        }

        console.log("this is the data", cartItems);

        const result = await pool.query('INSERT INTO userinfo(name,phone_number,cart,email) VALUES ($1, $2 ,$3 ,$4) RETURNING *', [name, phone_number, JSON.stringify(cartItems), email]);

        res.status(201).json(result.rows[0]);
    }

    catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data' });
    }
});

app.post('/api/myorder', auth, async (req, res) => {
    try {
        const email = req.user.email;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const result = await pool.query(
            'SELECT cart FROM userinfo WHERE email = $1',
            [email]
        );

        if (result.rowCount < 1) {
            return res.status(401).json({ message: 'No orders found' });
        }

        return res.status(200).json(result.rows);


    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});





app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ message: 'Please fill in all the required fields.' });
        }

        // Fetch user from database
        const userResult = await pool.query('SELECT * FROM logindata WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Determine role
        const role = (email === process.env.ADMIN_EMAIL) ? "admin" : "user";

        // Create JWT token
        const token = jwt.sign(
            {
                userid: user.userid,
                email: user.email,
                role: role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1m" }
        );

        res.status(200).json({
            message: 'Welcome back',
            username: user.username,
            userid: user.userid,
            email: user.email,
            role: role,
            token: token
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
});


app.post('/api/register', async (req, res) => {

    try {


        const { username, password, email, mobile } = req.body;


        if (!username || !password || !email) {
            return res.status(400).json({ message: 'Missing required fields', error: { detail: " " } });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

        const result = await pool.query('INSERT INTO logindata(username,password,email,mobile) VALUES ($1, $2,$3,$4) RETURNING *', [username, hashedPassword, email, mobile]);

        res.status(201).json(result.rows[0]);
    }

    catch (error) {



        res.status(500).json({ message: 'Error saving data' + error });
    }
});

app.post('/api/webapp',auth, async (req, res) => {

    try {


        const { rows } = req.body;



        if (!rows || rows.length === 0) {
            return res.status(400).json({ message: 'Missing required fields', error: { detail: " " } });
        }




        for (let r of rows) {
            await pool.query(
                "INSERT INTO webapp (name, time, date) VALUES ($1, $2, $3)",
                [r.name, r.time, r.date]
            );
        }

        res.status(201).json({ message: "data saved successfully in database" });
    }

    catch (error) {



        res.status(500).json({ message: 'Error saving data' + error });
    }
});

app.get('/webapp/orders', auth, adminOnly, async (req, res) => {


    try {
        const result = await pool.query('SELECT * FROM webapp');
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
