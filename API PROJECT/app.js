require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');

const app = express();
const router = express.Router();

// Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.json()); // Accept JSON

// Image/file upload (if needed)
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'images'); },
    filename: (req, file, cb) => { cb(null, `${Date.now()}-${file.originalname}`); }
});
const fileFilter = (req, file, cb) => {
    if (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) cb(null, true);
    else cb(null, false);
};
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// -- Mount API routes here --
const routesShop = require('./routes/shop');

app.use('/api/shop', routesShop);
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(500).json({ error: 'Internal server error', message: error.message });
});

mongoose.connect(MONGODB_URI)
    .then(() => app.listen(process.env.PORT || 3000))
    .then(() => {
        console.log('Connected to MongoDB');
        console.log('Server is running on port 3000');
    })
    .catch(err => console.log(err));


