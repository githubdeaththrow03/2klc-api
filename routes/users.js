const express = require('express');
const router = express.Router();
const pool = require('../models/pool');
const multer = require('multer');
const path = require('path');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const adminUsername = 'admin';
const adminPassword = 'admin123';

// Checking unique emails and username
router.get('/check-unique', (req, res) => {
  const { username, email } = req.query;
  const checkUniqueQuery =
    'SELECT COUNT(*) as count_username, (SELECT COUNT(*) FROM tblAccInfo WHERE email = ?) as count_email FROM tblAccInfo WHERE username = ?';

  // database checking
  pool.query(checkUniqueQuery, [email, username], (err, result) => {
    if (err) {
      console.error('Error checking unique username and email:', err);
      res.status(500).json({ error: 'An error occurred while checking unique username and email.' });
    } else {
      const isUniqueUsername = result[0].count_username === 0;
      const isUniqueEmail = result[0].count_email === 0;
      res.json({ isUniqueUsername, isUniqueEmail });
    }
  });
});

// fetch users from the database
router.get('/', (req, res) => {
  const searchQuery = req.query.searchQuery || '';
  const getUsersQuery = `SELECT * FROM tblAccInfo JOIN tblUserInfo ON tblAccInfo.uID = tblUserInfo.uID`;
  const searchValue = `%${searchQuery}%`; 
  const isApproved = false; 

  pool.query(getUsersQuery, [isApproved, searchValue, searchValue], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'An error occurred while fetching users.' });
    } else {
      res.json(users);
    }
  });
});


// admin and member login credentials
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const findUserQuery = `SELECT * FROM tblAccInfo WHERE username = ? AND is_approved = 1 LIMIT 1`;

  // condition for accounts on databases
  pool.query(findUserQuery, [username], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'An error occurred while fetching user.' });
    } else if (username === adminUsername && password === adminPassword) {
      res.json({ message: 'Admin login successful', admin: true }); 
    } else {
      if (user.length === 0) {
        res.status(401).json({ error: 'Your account is not yet approved or the username and password provided are invalid. Please verify and retry.' });
      } else {
        if (user[0].password === password) {
          res.json({ message: 'Login successful', user: user[0] });
        } else {
          res.status(401).json({ error: 'Your account is not yet approved or the username and password provided are invalid. Please verify and retry.' });
        }
      }
    }
  });
});

// file uploads

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueFilename = file.originalname; 
    cb(null, uniqueFilename);
  },
});

// midleware
const upload = multer({ storage });

// getting all the images and videos
router.post('/highlights', upload.fields([{ name: 'playerCard', maxCount: 1 }, { name: 'videoHighlight', maxCount: 1 }]), (req, res) => {
  const { uID, username } = req.body;
  const playerCardURL = req.files['playerCard'][0].filename;
  const videoHighlightURL = req.files['videoHighlight'][0].filename;

  const insertHighlightQuery = 'INSERT INTO tblHighlights (uID, username, playerCard, videoHighlight) VALUES (?, ?, ?, ?)';
  pool.query(insertHighlightQuery, [uID, username, playerCardURL, videoHighlightURL], (err, result) => {
    if (err) {
      console.error('Error inserting highlight:', err);
      res.status(500).json({ error: 'An error occurred while adding the highlight.' });
    } else {
      res.json({ message: 'Highlight added successfully!' });
    }
  });
});


// transfering datas to db
router.get('/highlights', (req, res) => {
  const getHighlightsQuery = 'SELECT * FROM tblHighlights';

  pool.query(getHighlightsQuery, (err, highlights) => {
    if (err) {
      console.error('Error fetching highlights:', err);
      res.status(500).json({ error: 'An error occurred while fetching highlights.' });
    } else {
      res.json(highlights);
    }
  });
});

// fetch users from the database based on username
router.get('/search', (req, res) => {
  const username = req.query.username;
  const searchUserHighlights = `SELECT * FROM tblHighlights WHERE username = '${username}'`;
  
  pool.query(searchUserHighlights, (err, result) => {
      if (err) {
        throw err;
      }
      res.json(result);
      console.log(result);
    });
  });

module.exports = router;



// Function to generate a random token
function generateResetToken() {
  const tokenLength = 40; // Adjust the length of the token as needed
  return crypto.randomBytes(tokenLength).toString('hex');
}


// giving token and adding token column on tblaccinfo
// finding if username and email match on tblaccinfo
router.post('/forgot-password', (req, res) => {
  const { username, email } = req.body;

  const findUserQuery = `SELECT * FROM tblAccInfo WHERE username = ? AND email = ? LIMIT 1`;

  pool.query(findUserQuery, [username, email], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'An error occurred while fetching user.' });
    } else if (user.length === 0) {
      res.json({ success: false }); 
    } else {
      const resetToken = generateResetToken();

      const saveResetTokenQuery = 'UPDATE tblAccInfo SET reset_token = ? WHERE uID = ?';
      pool.query(saveResetTokenQuery, [resetToken, user[0].uID], (err) => {
        if (err) {
          console.error('Error saving reset token:', err);
          res.status(500).json({ error: 'An error occurred while saving reset token.' });
        } else {
          const resetLink = `https://kjp-project-326denoqn-githubdeaththrow03.vercel.app/resetpass=${resetToken}`;
          const emailMessage = `Click on the following link to reset your password: ${resetLink}`;
          sendEmail(user[0].email, 'Password Reset', emailMessage);

          res.json({ success: true });
        }
      });
    }
  });
});

// reseting the password based on the token,
// token has limits
router.post('/reset-password', (req, res) => {
  const { resetToken, password } = req.body;

  const findUserQuery = `SELECT * FROM tblAccInfo WHERE reset_token = ? LIMIT 1`;

  pool.query(findUserQuery, [resetToken], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ error: 'An error occurred while fetching user.' });
    } else if (user.length === 0) {
      res.json({ success: false }); 
    } else {
      const updatePasswordQuery = 'UPDATE tblAccInfo SET password = ?, reset_token = NULL WHERE uID = ?';
      pool.query(updatePasswordQuery, [password, user[0].uID], (err) => {
        if (err) {
          console.error('Error updating password:', err);
          res.status(500).json({ error: 'An error occurred while updating password.' });
        } else {
          res.json({ success: true });
        }
      });
    }
  });
});


