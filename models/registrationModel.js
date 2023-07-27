const pool = require('../models/pool');


// error if username is not unique  
exports.isUsernameTaken = (username) => {
  const findUserQuery = 'SELECT COUNT(*) as count FROM tblAccInfo WHERE username = ?';
  return new Promise((resolve, reject) => {
    pool.query(findUserQuery, [username], (err, result) => {
      if (err) {
        console.error('Error checking username:', err);
        reject(err);
      } else {
        const count = result[0].count;
        resolve(count > 0);
      }
    });
  });
};


// separates the datas needed in tblaccinfo and tbluserinfo
exports.registerUser = (registrationData) => {
  const {
    username,
    email,
    password,
    full_name,
    birthdate, 
    address, 
    member_of_other_communities, 
    hear_from_us,
    what_can_you_do, 
    dream_community,
  } = registrationData;
  
  
  const accInfoQuery =
    'INSERT INTO tblAccInfo (username, email, password) VALUES (?, ?, ?)';
  const accInfoValues = [username, email, password];

  return new Promise((resolve, reject) => {
    pool.query(accInfoQuery, accInfoValues, (err, accInfoResult) => {
      if (err) {
        console.error('Error inserting account data:', err);
        reject(err);
      } else {
        console.log('Account registration successful');
        const uID = accInfoResult.insertId;

        const userInfoQuery =
          'INSERT INTO tblUserInfo (uID, full_name, birthdate, address, member_of_other_communities, hear_from_us, what_can_you_do, dream_community) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const userInfoValues = [
          uID,
          full_name,
          new Date(birthdate),
          address,
          member_of_other_communities,
          hear_from_us,
          what_can_you_do,
          dream_community,
        ];

        pool.query(userInfoQuery, userInfoValues, (err, userInfoResult) => {
          if (err) {
            console.error('Error inserting user information:', err);
            reject(err);
          } else {
            console.log('User information registration successful');
            resolve(userInfoResult);
          }
        });
      }
    });
  });
};
