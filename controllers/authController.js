const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sql = require('../db/sqlConnection');
const userModel = require('../models/userModel');
const { sendVerificationEmail } = require('../utils/email');
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { log } = require('console');
dotenv.config();


exports.sendVerificationLink = async (req, res) => {
  const { firstName, lastName, email } = req.body;

  try {
    const token = crypto.randomBytes(32).toString('hex');
    console.log(token);
    
    const existingUser = await userModel.getUserByEmail(sql, email);
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    await userModel.createUserWithToken(sql, { firstName, lastName, email, token });
    await sendVerificationEmail(email, token);

    res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
};


exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const result = await sql.query`
      SELECT Id, VerificationEmailSentOn 
      FROM Users 
      WHERE VerificationToken = ${token} AND IsVerified = 0
    `;

    if (result.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid or already verified token' });
    }

    const user = result.recordset[0];
    const sentOn = new Date(user.VerificationEmailSentOn);
    const expiryTime = new Date(sentOn.getTime() + 1 * 60 * 1000); 

    if (new Date() > expiryTime) {
      return res.status(400).json({ error: 'Verification link expired' });
    }

    await sql.query`
      UPDATE Users 
      SET IsVerified = 1, VerificationToken = NULL 
      WHERE Id = ${user.Id}
    `;

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
};





exports.completeSignup = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await userModel.getUserByToken(sql, token);
    if (!user) return res.status(400).json({ error: 'Invalid token' });
    
const sentOn = new Date(user.VerificationEmailSentOn);
const expiryTime = new Date(sentOn.getTime() + 1 * 60 * 1000);
if (new Date() > expiryTime) {
  return res.status(400).json({ error: 'Verification link expired' });
}
    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.updateUserWithPassword(sql, token, hashedPassword);

    res.status(200).json({ message: 'Signup completed' });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

  
    const result = await userModel.getUserByEmail(sql, email);
    const user = result.recordset ? result.recordset[0] : result;

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("User from DB:", user); 
    // console.log('JWT Secret:', process.env.JWT_SECRET);

    const isMatch = await bcrypt.compare(password, user.Password || user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = jwt.sign(
      { id: user.Id || user.UserId, email: user.Email || user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 60 * 60 * 1000
    });

    res.status(200).json({ message: "Login successful!" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });
  return res.status(200).json({ message: "Logged out successfully" });
};


exports.checkAuth = (req, res) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.json({ isAuthenticated: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ isAuthenticated: true, user: decoded });
  } catch (err) {
    return res.json({ isAuthenticated: false });
  }
};






