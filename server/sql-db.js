/**
 * TODO: NEED TO PROMISE-FY EVERYTHING
 * TODO: Remove sqlString variable
 * TODO: Check SQL database column naming conventions
 * TODO: Maybe change parameterized paths to simple get ? params
 */


const express = require('express');
const router = express.Router();

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  // TODO: Change the below to an ssl certificate
  user: 'NodeJS',
  password: 'Augmented59Shirts', // HACK: This should not be hardcoded you doofus
  database: 'dev_sbcs'
});

// Add an event spreadsheet to the database
router.post('/event/upload', function(req, res) {
  // // Get data from Google Drive
  // // req.body.PARAM == sheet name/path
  // let eventData = ['Hi', new Date(2018, 8, 30), 100];
  //
  // // Add any new members & newsletter changes
  // // TODO
  //
  // // Get semester
  // let sqlString = `SELECT * FROM Semester WHERE Value LIKE ${} LIMIT 1`;
  // connection.query(sqlString, function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //
  //   // eventData.splice(2, 0, semesterID);
  // });
  //
  // // Post event into Events table
  // sqlString = 'INSERT INTO Events (Name, Date, SemesterID, Attendance)' +
  //   'VALUES (?, ?, ?, ?)';
  // connection.query(sqlString, eventData, function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //
  //   // TODO:
  // });
  //
  // // Link Members to Events
  // // TODO:


});

// Get overall event info for the most recent semester
router.get('/event', function(req, res) {
  // TODO
});

// Get information about a specific event
router.get('/event/:eventID', function(req, res) {
  // let sqlString = 'SELECT * FROM Events WHERE EventID = ? LIMIT 1';
  // connection.query(sqlString, [req.query.eventID], function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //   else {
  //     // TODO: Get semester name from id
  //     let eventData = {
  //       EventID: results[0].EventID,
  //       Name: results[0].Name,
  //       Date: results[0].Date,
  //       SemesterID: results[0].SemesterID,
  //       Attendance: results[0].Attendance
  //     };
  //
  //     res.send(packageData(eventData));
  //   }
  // });
});

// Get overall membership information
router.get('/member', function(req, res) {
  // TODO
});

// Get information about a specific member
router.get('/member/:memberID', function(req, res) {
  // TODO: Get attendance and active member status

  let sqlString = 'SELECT * FROM Members WHERE MemberID = ? LIMIT 1';
  let eventData;
  promiseQuery(sqlString, req.params.memberID).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 400;
      return Promise.reject(error);
    }

    eventData = {
      MemberID: result[0].MemberID,
      FirstName: result[0].FirstName,
      LastName: result[0].LastName,
      Year: null,
      Email: result[0].Email,
      Newsletter: Boolean(result[0].Newsletter)
    };

    sqlString = 'SELECT * FROM Academic_Year AS YearID WHERE YearID = ? LIMIT 1';
    return promiseQuery(sqlString, result[0].YearID);
  }).then(function(result) {
    console.log(result);
    eventData.Year = result[0].Value;
    res.send(packageData(eventData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get newsletter sign-up information
router.get('/newsletter', function(req, res) {
  console.log('Newsletter request received');

  // Setup database calls
  let promiseArray = [];
  let sqlString = 'SELECT COUNT(Newsletter) as count FROM Members WHERE Newsletter=1';
  promiseArray.push(promiseQuery(sqlString));
  sqlString = 'SELECT COUNT(*) as count FROM Members';
  promiseArray.push(promiseQuery(sqlString));

  // Resolve database calls and return
  Promise.all(promiseArray).then(function(results) {
    let data = {
      'signed-up': results[0][0].count,
      'total-members': results[1][0].count
    };
    res.send(packageData(data));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get an overall recap of a semester
router.get('/semester/:semester', function(req, res) {
  // TODO
});

module.exports = router;

/* Helper Functions */
function promiseQuery(query) {
  return new Promise(function(resolve, reject) {
    connection.query(query, function(error, results) {
      if (error != null)
        reject(error);
      else
        resolve(results);
    });
  });
}

function promiseQuery(query, values) {
  return new Promise(function(resolve, reject) {
    connection.query(query, values, function(error, results) {
      if (error != null)
        reject(error);
      else
        resolve(results);
    });
  });
}

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
