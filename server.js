const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cookieParser =require("cookie-parser");

dotenv.config();
require('./db/sqlConnection');

const app = express();
app.use(cors({
    origin:"http://localhost:4200",
    credentials:true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
