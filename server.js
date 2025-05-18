const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User'); // make sure you created this

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB"))
  .catch(err => console.error(" MongoDB connection error:", err));

// Cart API (optional)
app.post('/api/cart', (req, res) => {
  const cart = req.body.cart;
  console.log('Received Cart:', cart);
  res.json({ message: 'Cart saved to server!' });
});

// Contact Form
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'aiyzaehsan94@gmail.com',
      pass: 'tegrwstkpdcvqgws'
    }
  });

  const mailOptions = {
    from: 'aiyzaehsan94@gmail.com',
    to: 'aiyzaehsan94@gmail.com',
    subject: `Contact Form: ${subject}`,
    text: `You have received a message from ${name} (${email}):\n\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

// Sign Up
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check for existing username or email
    const existingUser = await User.findOne({ $or: [{ name }, { email }] });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'This email is already registered. Please login.' });
      }
      if (existingUser.name === name) {
        return res.status(400).json({ message: 'Username already exists. Please choose another one.' });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });
    await user.save();

    return res.status(201).json({ message: 'Account created successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Credentials do not match.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Credentials do not match.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});
