const express = require('express');
const router = express.Router();
const pool = require('../models/pool');
const sendEmail = require('../utils/email');

// handling approval for users
router.post('/approve', (req, res) => {
  const { userID, email, username } = req.body;

  // check if userid exists
  if (!userID) {
    return res.status(400).json({ error: 'Invalid userID' });
  }

  // transfering datas on tblmemberinfo
  const transferQuery = `
    INSERT INTO tblmemberinfo (uID, username, full_name, birthdate, address, member_of_other_communities, hear_from_us, what_can_you_do, dream_community) 
    SELECT acc.uID, acc.username, info.full_name, info.birthdate, info.address, info.member_of_other_communities, info.hear_from_us, info.what_can_you_do, info.dream_community 
    FROM tblAccInfo AS acc
    JOIN tblUserInfo AS info ON acc.uID = info.uID
    WHERE acc.uID = ?`;


  // transfer process and updating tblaccinfo  
  pool.query(transferQuery, [userID], (err, transferResult) => {
    if (err) {
      console.error('Error transferring user data:', err);
      res.status(500).json({ error: 'An error occurred while transferring user data.' });
    } else {
      console.log('User data transferred to tblmemberinfo');

      // setting the boolean values to TRUE
      const updateQuery = 'UPDATE tblAccInfo SET is_approved = ? WHERE uID = ?';
      pool.query(updateQuery, [true, userID], (err, result) => {
        if (err) {
          console.error('Error updating user approval status:', err);
          res.status(500).json({ error: 'An error occurred while updating user approval status.' });
        } else {
          console.log('User approval status updated');

          // email automation
          const subject = 'Account Approved';
          const message = `Hello ${username}, \n\nWe are happy to announce that your account has been approved. You can now use your registered username and password to log in to our community website.\n\nWelcome to the 2KLC community!\n\nBest regards,\n2KLC Community Team`;


          // nodemailer function, sending email. 
          sendEmail(email, subject, message)
            .then(() => {
              res.json({ message: 'User approved and email sent successfully!' });
            })
            .catch((error) => {
              console.error('Error sending approval email:', error);
              res.status(500).json({ error: 'An error occurred while sending approval email.' });
            });
        }
      });
    }
  });
});

//Search username for Approval
router.get('/search', (req, res) => {
  const username = req.query.username;
    const sql = `SELECT * FROM tblAccInfo JOIN tblUserInfo ON tblAccInfo.uID = tblUserInfo.uID WHERE username = '${username}' AND is_approved = false`;
  
    // searching for username
    pool.query(sql, (err, result) => {
      if (err) {
        throw err;
      }
      res.json(result);
      console.log(result);
    });
  });

module.exports = router;
