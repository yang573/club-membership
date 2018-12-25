/* NEED TO PROMISE-FY EVERYTHING */

const express = require('express');
const router = express.Router();

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  // TODO: Change the below to an ssl certificate
  user: 'NodeJS',
  password: 'USER_SET', // HACK: This should not be hardcoded you doofus
  database: 'dev_sbcs'
});

// Add an event spreadsheet to the databse
router.post('/event/upload', function(req, res) {
  // Get data from Google Drive
  // req.body.PARAM == sheet name/path
  let eventData = ['Hi', new Date(2018, 8, 30), 100];

  // Add any new members & newsletter changes
  // TODO

  // Get semester
  let sqlString = `SELECT 1 FROM Semester WHERE Value LIKE ${}`;
  connection.query(sqlString, function(error, results, fields) {
    if (error)
      res.send(parseError(error));

    // eventData.splice(2, 0, semesterID);
  });

  // Post event into Events table
  sqlString = 'INSERT INTO Events (Name, Date, SemesterID, Attendance)' +
    'VALUES (?, ?, ?, ?)';
  connection.query(sqlString, eventData, function(error, results, fields) {
    if (error)
      res.send(parseError(error));

    // TODO:
  });

  // Link Members to Events
  // TODO:


});

// Get overall event info for the most recent semester
router.get('/event', function(req, res) {
  // TODO
});

// Get information about a specific event
router.get('/event/:eventID', function(req, res) {
  let sqlString = 'SELECT 1 FROM Events WHERE EventID = ?';
  connection.query(sqlString, [req.query.eventID], function(error, results, fields) {
    if (error)
      res.send(parseError(error));
    else {
      // TODO: Get semester name from id
      let eventData = {
        EventID: results[0].EventID,
        Name: results[0].Name,
        Date: results[0].Date,
        SemesterID: results[0].SemesterID,
        Attendance: results[0].Attendance
      };

      res.send(packageData(eventData));
    }
  });
});

// Get overall membership information
router.get('/member', function(req, res) {
  // TODO
});

// Get information about a specific member
router.get('/member/:memberID', function(req, res) {
  //req.query.memberID
  let sqlString = 'SELECT 1 FROM Members WHERE MemberID = ?';
  connection.query(sqlString, [req.query.memberID], function(error, results, fields) {
    if (error)
      res.send(parseError(error));
    else {
      // TODO: Get semester name from id
      // TODO: Get attendance and active member status
      // Probably need to turn this into promises
      let eventData = {
        MemberID: results[0].EventID,
        FirstName: results[0].FirstName,
        LastName: results[0].LastName,
        YearID: results[0].YearID,
        Email: results[0].Email,
        Newsletter: results[0].Newsletter
      };

      //res.send(packageData(eventData));
    }
  });
});

// Get newsletter sign-up information
router.get('/newsletter', function(req, res) {
  let sqlString = 'SELECT COUNT(Newsletter) FROM Members WHERE Newsletter=1';
  connection.query(sqlString, function(error, results, fields) {
    if (error)
      res.send(parseError(error));
    // TODO: Return total sign-ups, total not signed up, and total members
  });
});

// Get an overall recap of a semester
router.get('/semester/:semester', function(req, res) {
  // TODO
});

module.exports = router;

function packageData(data) {
  return JSON.stringfy({ status: 200, data: data });
}

function parseError(error) {
  return JSON.stringfy({ status: error.code, message: error.message });
}
